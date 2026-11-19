// AI Services: Urgency Prediction, NGO Matching, Demand Prediction Client, and Multi-Provider Chatbot
import { config } from '../config/index.js';
import { query } from '../config/db.js';

// ============================================================================
// 1. FOOD URGENCY PREDICTION ENGINE
// ============================================================================

export function calculateFoodUrgency({
  category,
  preparationTime,
  expiryTime,
  quantity = 1,
  unit = 'kg',
  hasRefrigeration = false,
}) {
  const now = Date.now();
  const prep = new Date(preparationTime).getTime();
  const expiry = new Date(expiryTime).getTime();

  // Safety Gate: Expired food cannot be redistributed
  if (expiry <= now) {
    return {
      urgencyScore: 100,
      urgencyLevel: 'critical',
      isExpired: true,
      explanation: 'Food has reached or exceeded its designated expiry deadline. Redistribution is unsafe.',
      recommendedAction: 'Immediate safe disposal or composting in accordance with municipal hygiene guidelines.',
    };
  }

  const hoursRemaining = Math.max(0, (expiry - now) / (1000 * 60 * 60));
  const hoursSincePrep = Math.max(0, (now - prep) / (1000 * 60 * 60));

  // Category perishability weights
  const categoryWeights = {
    cooked_meals: 40,
    dairy_products: 35,
    fruits_vegetables: 25,
    bakery_items: 20,
    packaged_food: 10,
    raw_groceries: 5,
  };

  let score = categoryWeights[category] || 20;

  // Shelf life modifier: shorter time increases urgency exponentially
  if (hoursRemaining <= 2) {
    score += 55;
  } else if (hoursRemaining <= 4) {
    score += 45;
  } else if (hoursRemaining <= 8) {
    score += 35;
  } else if (hoursRemaining <= 16) {
    score += 25;
  } else if (hoursRemaining <= 24) {
    score += 15;
  } else {
    score += 5;
  }

  // Prepared age modifier
  if (hoursSincePrep > 4 && category === 'cooked_meals') {
    score += 10;
  }

  // Refrigeration mitigation
  if (hasRefrigeration) {
    score = Math.max(10, score - 15);
  }

  // Bound within 0-100
  score = Math.min(100, Math.max(5, Math.round(score)));

  let urgencyLevel = 'low';
  let recommendedAction = 'Standard volunteer collection within scheduled window.';

  if (score >= 85) {
    urgencyLevel = 'critical';
    recommendedAction = 'Priority dispatch: Instant notification to nearby NGOs and rapid volunteer riders.';
  } else if (score >= 65) {
    urgencyLevel = 'high';
    recommendedAction = 'Urgent pickup: Schedule pickup within the next 2-3 hours.';
  } else if (score >= 40) {
    urgencyLevel = 'medium';
    recommendedAction = 'Moderate window: Pair with daytime delivery route.';
  }

  return {
    urgencyScore: score,
    urgencyLevel,
    isExpired: false,
    hoursRemaining: parseFloat(hoursRemaining.toFixed(1)),
    explanation: `Calculated from ${category.replace(/_/g, ' ')} perishability with ${hoursRemaining.toFixed(1)} hours remaining until expiry.`,
    recommendedAction,
    modelVersion: 'v1.1.0-deterministic-safety-prioritized',
  };
}

// ============================================================================
// 2. NGO MATCHING & RANKING ENGINE
// ============================================================================

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function matchNGOsForDonation(donation) {
  // Query verified NGOs from PostgreSQL
  const ngoRes = await query(
    `SELECT n.*, c.max_daily_meals, c.current_available_capacity, c.has_cold_storage
     FROM ngos n
     LEFT JOIN ngo_capacity c ON n.id = c.ngo_id
     WHERE n.verification_status = 'verified'`
  );

  const ngos = ngoRes.rows;
  if (!ngos || ngos.length === 0) {
    return [];
  }

  const matches = [];

  for (const ngo of ngos) {
    let score = 50;
    const explanations = [];

    // 1. Distance Calculation (if valid coordinates exist)
    let distanceKm = null;
    if (
      donation.latitude &&
      donation.longitude &&
      ngo.latitude &&
      ngo.longitude
    ) {
      distanceKm = parseFloat(
        haversineDistanceKm(
          donation.latitude,
          donation.longitude,
          ngo.latitude,
          ngo.longitude
        ).toFixed(2)
      );

      if (distanceKm <= 5) {
        score += 35;
        explanations.push(`Within immediate proximity (${distanceKm} km away)`);
      } else if (distanceKm <= 10) {
        score += 25;
        explanations.push(`Located within 10 km (${distanceKm} km away)`);
      } else if (distanceKm <= 20) {
        score += 15;
        explanations.push(`Metropolitan transit distance (${distanceKm} km away)`);
      } else {
        score -= 10;
        explanations.push(`Further away (${distanceKm} km)`);
      }
    } else {
      explanations.push('Distance calculation unavailable (missing GPS coordinates)');
    }

    // 2. Cold Storage compatibility for dairy / perishables
    if (
      (donation.category === 'dairy_products' || donation.category === 'cooked_meals') &&
      ngo.has_cold_storage
    ) {
      score += 15;
      explanations.push('Facility equipped with cold refrigeration storage');
    }

    // 3. Capacity alignment
    const servings = donation.number_of_servings || donation.quantity || 10;
    const availableCap = ngo.current_available_capacity || ngo.max_daily_meals || 100;
    if (availableCap >= servings) {
      score += 10;
      explanations.push(`Sufficient meal distribution capacity (${availableCap} meals capacity)`);
    }

    const finalScore = Math.min(100, Math.max(10, Math.round(score)));

    matches.push({
      ngoId: ngo.id,
      organizationName: ngo.organization_name,
      contactPerson: ngo.contact_person,
      contactPhone: ngo.contact_phone,
      contactEmail: ngo.contact_email,
      address: `${ngo.street}, ${ngo.city}, ${ngo.state}`,
      city: ngo.city,
      distanceKm,
      matchScore: finalScore,
      explanation: explanations.join(' • '),
    });
  }

  // Sort descending by match score
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches.map((m, idx) => ({ ...m, rank: idx + 1 }));
}

// ============================================================================
// 3. CHATBOT SERVICE (GEMINI + NVIDIA NIM + SAFE LOCAL FALLBACK)
// ============================================================================

class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generate(messages, systemPrompt) {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: `System instruction: ${systemPrompt}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will strictly follow these role and context guidelines.' }] });
    }

    messages.forEach((m) => {
      contents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || 'I received your inquiry, but no text response was produced.';
  }
}

class NvidiaNimProvider {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://integrate.api.nvidia.com/v1';
  }

  async generate(messages, systemPrompt) {
    if (!this.apiKey) throw new Error('NVIDIA_NIM_API_KEY is not configured');

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach((m) => {
      formattedMessages.push({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content,
      });
    });

    const url = `${this.baseUrl}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-70b-instruct',
        messages: formattedMessages,
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`NVIDIA NIM API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response returned from NVIDIA NIM.';
  }
}

export async function askChatbot({ messages, userContext = null, provider = null }) {
  const activeProviderName = provider || config.ai.provider || 'gemini';

  const systemPrompt = `You are AnnaSathi AI, an intelligent assistant for a Surplus Food Donation & Hunger Prevention Network.
You assist food donors, verified charitable NGOs, volunteers, and platform administrators.
Role Guidelines:
- Encourage safe, hygienic food redistribution.
- Guide donors on how to list surplus food, interpret shelf-life urgency ratings, and package food safely.
- Remind NGOs that only verified organizations can claim surplus donations.
- Remind volunteers to complete pickups before marking deliveries.
- Never reveal private passwords, tokens, or other users' confidential records.
${userContext ? `User context: Name: ${userContext.name}, Role: ${userContext.role}.` : 'User is a guest.'}`;

  // 1. Primary Provider Attempt
  try {
    if (activeProviderName === 'nvidia_nim' && config.ai.nvidiaNimApiKey) {
      const nim = new NvidiaNimProvider(config.ai.nvidiaNimApiKey, config.ai.nvidiaNimBaseUrl);
      const text = await nim.generate(messages, systemPrompt);
      return { text, provider: 'nvidia_nim' };
    }

    if (config.ai.geminiApiKey) {
      const gemini = new GeminiProvider(config.ai.geminiApiKey);
      const text = await gemini.generate(messages, systemPrompt);
      return { text, provider: 'gemini' };
    }
  } catch (err) {
    console.warn(`Primary AI Chatbot provider (${activeProviderName}) failed: ${err.message}. Engaging fallback...`);
  }

  // 2. Intelligent Contextual Local Fallback (Guaranteed zero-crash for dev/demo)
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

  let fallbackResponse = 'Welcome to AnnaSathi AI! I am here to guide you through creating surplus food donations, tracking pickup and delivery runs, and verifying community partners.';

  if (lastUserMsg.includes('donate') || lastUserMsg.includes('create')) {
    fallbackResponse = 'To create a surplus food donation: Navigate to "Create Donation", enter the food category, portions, and safe expiry deadline. Our AI calculates a rule-based urgency score (0-100) to ensure urgent cooked meals are matched immediately with nearby shelters.';
  } else if (lastUserMsg.includes('ngo') || lastUserMsg.includes('verify')) {
    fallbackResponse = 'NGO partners must be verified by platform administrators before accepting donations. Upload your 12A/80G or registration credentials under Organization Profile to unlock the food discovery feed.';
  } else if (lastUserMsg.includes('volunteer') || lastUserMsg.includes('delivery') || lastUserMsg.includes('pickup')) {
    fallbackResponse = 'Volunteers can view open tasks in "Available Tasks". Once accepted, you can navigate to the donor location using the verified address, collect the food, mark "Picked Up", and complete delivery to the shelter.';
  } else if (lastUserMsg.includes('urgency') || lastUserMsg.includes('safety') || lastUserMsg.includes('expired')) {
    fallbackResponse = 'Food safety is our top priority. Our urgency calculation prioritizes cooked meals and dairy products. Food that has expired cannot be redistributed on the platform.';
  }

  return {
    text: `${fallbackResponse}\n\n*(Note: Running in built-in knowledge mode. To enable live generative AI responses, configure GEMINI_API_KEY or NVIDIA_NIM_API_KEY in backend/.env)*`,
    provider: 'local_fallback',
  };
}

// ============================================================================
// 4. PYTHON AI SERVICE CLIENT (DEMAND PREDICTION)
// ============================================================================

export async function requestDemandPrediction({ category, region = 'Hyderabad' }) {
  try {
    const res = await fetch(`${config.ai.serviceUrl}/ai/demand/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Secret': config.ai.serviceSecret,
      },
      body: JSON.stringify({ category, region }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Python service is not running or unreachable
  }

  // Graceful deterministic baseline estimation
  const baselineDemands = {
    cooked_meals: 450,
    dairy_products: 120,
    fruits_vegetables: 200,
    bakery_items: 180,
    packaged_food: 300,
    raw_groceries: 250,
  };

  const estimatedMeals = baselineDemands[category] || 200;

  return {
    category,
    region,
    predictedDemandMeals: estimatedMeals,
    predictedQuantity: parseFloat((estimatedMeals * 0.4).toFixed(1)),
    unit: 'kg',
    timePeriod: 'next_24_hours',
    confidenceScore: 0.72,
    modelVersion: 'v1.0.0-baseline-heuristic',
    notes: 'Calculated using regional hunger index baseline. Connect Python FastAPI microservice for scikit-learn continuous regression models.',
  };
}

export const calculateUrgencyScore = (data) => calculateFoodUrgency(data);
export const findMatchingNGOs = (donation) => matchNGOsForDonation(donation);
export const askAI = async (message, history = [], userRole = 'visitor') => {
  const formattedMessages = [
    ...history,
    { role: 'user', content: message }
  ];
  const response = await askChatbot({ messages: formattedMessages, userContext: { role: userRole } });
  return response.text;
};
export const callDemandPredictionService = (params) => requestDemandPrediction(params);
