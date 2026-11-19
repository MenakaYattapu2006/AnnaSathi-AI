// AI Services: Urgency Prediction, NGO Matching, Demand Prediction Client, and Multi-Provider Chatbot
import { config } from '../config/index.js';
import { query } from '../config/db.js';

// ============================================================================
// CONFIGURABLE PROVIDER STATE
// ============================================================================

let currentProvider = process.env.AI_PROVIDER || config.ai.provider || 'gemini';

export function getActiveProvider() {
  return currentProvider;
}

export function setActiveProvider(newProvider) {
  const validProviders = ['gemini', 'nvidia_nim', 'auto', 'rule_fallback'];
  if (!validProviders.includes(newProvider)) {
    throw new Error(`Invalid provider: ${newProvider}. Valid providers are: ${validProviders.join(', ')}`);
  }
  currentProvider = newProvider;
  return currentProvider;
}

export function getProviderStatus() {
  const geminiKey = process.env.GEMINI_API_KEY || config.ai.geminiApiKey || '';
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || config.ai.nvidiaNimApiKey || '';

  return {
    activeProvider: currentProvider,
    gemini: {
      configured: Boolean(geminiKey && geminiKey.trim().length > 0),
      model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    },
    nvidia_nim: {
      configured: Boolean(nvidiaKey && nvidiaKey.trim().length > 0),
      model: process.env.NVIDIA_NIM_MODEL || config.ai.nvidiaNimModel || 'nvidia/nemotron-3.5-lightning-30b-a3b',
      baseUrl: process.env.NVIDIA_NIM_BASE_URL || config.ai.nvidiaNimBaseUrl || 'https://integrate.api.nvidia.com/v1',
    },
    rule_fallback: {
      configured: true,
      model: 'deterministic-knowledge-base-v1',
    },
  };
}

// ============================================================================
// 1. FOOD URGENCY PREDICTION ENGINE
// ============================================================================

export function calculateFoodUrgency({
  category = 'cooked_meals',
  foodCategory,
  preparationTime,
  expiryTime,
  quantity = 1,
  unit = 'kg',
  hasRefrigeration = false,
  storageCondition,
}) {
  const actualCategory = foodCategory || category || 'cooked_meals';
  const now = Date.now();
  const prep = preparationTime ? new Date(preparationTime).getTime() : now - 2 * 60 * 60 * 1000;
  const expiry = expiryTime ? new Date(expiryTime).getTime() : now + 4 * 60 * 60 * 1000;

  const isRefrigerated = hasRefrigeration || storageCondition === 'refrigerated' || storageCondition === 'cold_storage';

  // Safety Gate: Expired food cannot be redistributed
  if (expiry <= now) {
    return {
      urgencyScore: 100,
      urgencyLevel: 'critical',
      isExpired: true,
      hoursRemaining: 0,
      safetyStatus: 'UNSAFE_FOR_REDISTRIBUTION',
      explanation: 'Food has reached or exceeded its designated expiry deadline. Redistribution is unsafe.',
      recommendedAction: 'Immediate safe disposal or composting in accordance with municipal hygiene guidelines.',
      disclaimer: 'DISCLAIMER: This urgency score is an operational dispatch priority metric based on shelf-life and perishability, not a certified laboratory food safety test or FSSAI lab certification.',
      modelVersion: 'v1.2.0-deterministic-safety-prioritized',
    };
  }

  const hoursRemaining = Math.max(0, (expiry - now) / (1000 * 60 * 60));
  const hoursSincePrep = Math.max(0, (now - prep) / (1000 * 60 * 60));

  // Safety Gate: Cooked food held ambient > 10 hours
  if (actualCategory === 'cooked_meals' && !isRefrigerated && hoursSincePrep > 10) {
    return {
      urgencyScore: 95,
      urgencyLevel: 'critical',
      isExpired: false,
      hoursRemaining: parseFloat(hoursRemaining.toFixed(1)),
      safetyStatus: 'HIGH_RISK_HOLDING_TIME',
      explanation: `Prepared food has exceeded safe ambient holding window (${hoursSincePrep.toFixed(1)} hours unrefrigerated). Immediate inspection required.`,
      recommendedAction: 'Verify thermal core temperature (>65°C hot-held or <5°C cold-held). If room temperature for >4 hours, do not distribute.',
      disclaimer: 'DISCLAIMER: This urgency score is an operational dispatch priority metric based on shelf-life and perishability, not a certified laboratory food safety test or FSSAI lab certification.',
      modelVersion: 'v1.2.0-deterministic-safety-prioritized',
    };
  }

  // Category perishability base weights (0-40)
  const categoryWeights = {
    cooked_meals: 40,
    dairy_products: 35,
    fruits_vegetables: 25,
    bakery_items: 20,
    packaged_food: 10,
    raw_groceries: 5,
  };

  let score = categoryWeights[actualCategory] || 20;

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
  if (hoursSincePrep > 4 && actualCategory === 'cooked_meals') {
    score += 10;
  }

  // Refrigeration mitigation
  if (isRefrigerated) {
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
    safetyStatus: 'SAFE_FOR_TIMELY_DISTRIBUTION',
    explanation: `Calculated from ${actualCategory.replace(/_/g, ' ')} perishability with ${hoursRemaining.toFixed(1)} hours remaining until expiry (${isRefrigerated ? 'Refrigerated' : 'Ambient'} storage).`,
    recommendedAction,
    disclaimer: 'DISCLAIMER: This urgency score is an operational dispatch priority metric based on shelf-life and perishability, not a certified laboratory food safety test or FSSAI lab certification.',
    modelVersion: 'v1.2.0-deterministic-safety-prioritized',
  };
}

// ============================================================================
// 2. NGO MATCHING & RANKING ENGINE
// ============================================================================

export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
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
  return parseFloat((R * c).toFixed(2));
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
      distanceKm = haversineDistanceKm(
        donation.latitude,
        donation.longitude,
        ngo.latitude,
        ngo.longitude
      );

      if (distanceKm <= 5) {
        score += 35;
        explanations.push(`Immediate proximity (${distanceKm} km away)`);
      } else if (distanceKm <= 10) {
        score += 25;
        explanations.push(`Located within 10 km (${distanceKm} km away)`);
      } else if (distanceKm <= 20) {
        score += 15;
        explanations.push(`Metropolitan transit distance (${distanceKm} km away)`);
      } else {
        score -= 15;
        explanations.push(`Further transit distance (${distanceKm} km)`);
      }
    } else {
      explanations.push('Distance calculation unavailable (missing GPS coordinates)');
    }

    // 2. Cold Storage compatibility for perishables
    const cat = donation.food_category || donation.category;
    if (
      (cat === 'dairy_products' || cat === 'cooked_meals') &&
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
      explanations.push(`Sufficient capacity (${availableCap} meals capacity)`);
    } else {
      score -= 10;
      explanations.push(`Partial capacity (${availableCap} of ${servings} meals requested)`);
    }

    // 4. Urgency alignment
    if (donation.urgency_level === 'critical' || donation.urgency_score >= 80) {
      score += 10;
      explanations.push('Prioritized for critical urgency redistribution');
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
  const rankedMatches = matches.map((m, idx) => ({ ...m, rank: idx + 1 }));

  // Persist top match results in ai_match_results table
  if (donation.id && rankedMatches.length > 0) {
    try {
      // Clear previous match cache for this donation
      await query(`DELETE FROM ai_match_results WHERE donation_id = $1`, [donation.id]);

      // Insert top 5 matches
      for (const m of rankedMatches.slice(0, 5)) {
        await query(
          `INSERT INTO ai_match_results (donation_id, ngo_id, match_score, distance_km, explanation, rank)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [donation.id, m.ngoId, m.matchScore, m.distanceKm, m.explanation, m.rank]
        );
      }
    } catch (persistErr) {
      console.warn('Could not persist ai_match_results to DB:', persistErr.message);
    }
  }

  return rankedMatches;
}

// ============================================================================
// 3. GEMINI API PROVIDER
// ============================================================================

export class GeminiProvider {
  constructor(apiKey, model) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || config.ai.geminiApiKey || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  }

  async generate(messages, systemPrompt, timeoutMs = 15000) {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('GEMINI_API_KEY is not configured or empty');
    }

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: `[System Instruction]: ${systemPrompt}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood. I will strictly act within these authorized guidelines.' }] });
    }

    messages.forEach((m) => {
      contents.push({
        role: m.sender === 'user' || m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content || m.text || '' }],
      });
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        throw new Error('Gemini API rate limit exceeded (HTTP 429). Please retry shortly.');
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Gemini API error (HTTP ${response.status}): ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned an empty candidate response.');
      }

      return text;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Gemini API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }
}

// ============================================================================
// 4. NVIDIA NIM API PROVIDER
// ============================================================================

export class NvidiaNimProvider {
  constructor(apiKey, baseUrl, model) {
    this.apiKey = apiKey || process.env.NVIDIA_NIM_API_KEY || config.ai.nvidiaNimApiKey || '';
    this.baseUrl = baseUrl || process.env.NVIDIA_NIM_BASE_URL || config.ai.nvidiaNimBaseUrl || 'https://integrate.api.nvidia.com/v1';
    this.model = model || process.env.NVIDIA_NIM_MODEL || config.ai.nvidiaNimModel || 'nvidia/nemotron-3.5-lightning-30b-a3b';
  }

  async generate(messages, systemPrompt, timeoutMs = 15000) {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      throw new Error('NVIDIA_NIM_API_KEY is not configured or empty');
    }

    const formattedMessages = [];
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }

    messages.forEach((m) => {
      formattedMessages.push({
        role: m.sender === 'user' || m.role === 'user' ? 'user' : 'assistant',
        content: m.content || m.text || '',
      });
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${this.baseUrl}/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: formattedMessages,
          temperature: 0.2,
          max_tokens: 650,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        throw new Error('NVIDIA NIM API rate limit exceeded (HTTP 429). Please retry shortly.');
      }

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`NVIDIA NIM API error (HTTP ${response.status}): ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('NVIDIA NIM API returned an empty completion.');
      }

      return content;
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`NVIDIA NIM API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }
}

// ============================================================================
// 5. ROLE-AWARE CHATBOT ORCHESTRATION WITH PRIVACY FILTERING
// ============================================================================

/**
 * Redact sensitive security patterns before building system prompt or logging
 */
function sanitizeContext(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[a-f0-9]{32,64}/gi, '[REDACTED_HASH]')
    .replace(/\b\d{6}\b/g, '[REDACTED_OTP]')
    .replace(/bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/(password|secret|token)\s*[:=]\s*[^\s]+/gi, '$1: [REDACTED]');
}

export function buildRoleAwareSystemPrompt(userRole = 'visitor', userContext = null) {
  const role = (userRole || 'visitor').toLowerCase();

  let roleGuidelines = '';
  if (role === 'donor') {
    roleGuidelines = `
- The user is an authenticated Food Donor.
- Guide them on listing surplus food, calculating urgency, packaging hot cooked food safely, and viewing NGO matches.
- Donors can view only their own donations, completed drop-offs, and 80G tax receipt summaries.
- Never disclose details of other donors' donations, private volunteer contact details, or internal admin audit records.`;
  } else if (role === 'ngo') {
    roleGuidelines = `
- The user is an authenticated NGO or Charitable Shelter partner.
- Guide them on discovering nearby surplus donations, AI match rankings, and completing receipt confirmations upon delivery.
- Remind them that only verified NGOs with active status can accept food donations.
- Never disclose private donor personal credentials, volunteer live movement without consent, or internal passwords.`;
  } else if (role === 'volunteer') {
    roleGuidelines = `
- The user is an authenticated Delivery Volunteer.
- Guide them on claiming available assignments, inspecting food packaging, confirming pickup at donor premises, and updating delivery status.
- Emphasize thermal integrity: food should be transported in insulated bags and delivered promptly.
- Never disclose donor passwords, NGO administrative files, or other volunteers' accounts.`;
  } else if (role === 'admin') {
    roleGuidelines = `
- The user is an authenticated System Administrator.
- Guide them on NGO verification queues, donation lifecycle telemetry, volunteer assignments, and platform audit summaries.
- Never print raw user password hashes, session secret tokens, or HMAC secrets.`;
  } else {
    roleGuidelines = `
- The user is a general visitor or prospective community partner.
- Explain AnnaSathi AI's mission: zero-waste algorithmic food rescue, hunger relief, Good Samaritan protections, and FSSAI compliance.
- Encourage commercial kitchens to register as Donors, shelters to register as NGOs, and individuals to join as Delivery Volunteers.
- Never fabricate operational records or leak platform data.`;
  }

  let userInfo = 'User status: Guest / Visitor.';
  if (userContext && (userContext.id || userContext.name)) {
    userInfo = `User name: ${sanitizeContext(userContext.name || 'User')}, Role: ${role}. Organization: ${sanitizeContext(userContext.organizationName || 'N/A')}.`;
  }

  return `You are AnnaSathi AI, an intelligent, empathetic, and safety-conscious assistant for the AnnaSathi Zero-Waste Food Rescue & Hunger Prevention Network.
Mission: Connect surplus food donors with verified charitable shelters and agile volunteers within safe-temperature windows.

${userInfo}

Role-Specific Operating Rules:
${roleGuidelines}

Core Security & Safety Mandates:
1. Food Safety Priority: Perishable cooked food must be delivered within safe windows. Urgency scores prioritize logistics, not laboratory certifications.
2. Privacy & Confidentiality: Under NO circumstances provide user passwords, OTP tokens, private NGO legal documents, or unredacted database credentials.
3. Tone: Respectful, professional, concise, and focused on hunger relief.`;
}

export async function askChatbot({ messages, userContext = null, provider = null, timeoutMs = 15000 }) {
  const activeProviderName = provider || currentProvider || 'gemini';
  const userRole = userContext?.role || 'visitor';
  const systemPrompt = buildRoleAwareSystemPrompt(userRole, userContext);

  const geminiKey = process.env.GEMINI_API_KEY || config.ai.geminiApiKey || '';
  const nvidiaKey = process.env.NVIDIA_NIM_API_KEY || config.ai.nvidiaNimApiKey || '';

  const errors = [];

  // =========================================================================
  // Provider Attempt Order:
  // 1. If nvidia_nim selected -> try NVIDIA NIM -> if fails -> try Gemini -> local fallback
  // 2. If gemini selected -> try Gemini -> if fails -> try NVIDIA NIM -> local fallback
  // =========================================================================

  if (activeProviderName === 'nvidia_nim') {
    if (nvidiaKey && nvidiaKey.trim().length > 0) {
      try {
        const nim = new NvidiaNimProvider(nvidiaKey);
        const reply = await nim.generate(messages, systemPrompt, timeoutMs);
        return { text: reply, provider: 'nvidia_nim', fallbackUsed: false };
      } catch (nimErr) {
        errors.push(`NVIDIA NIM: ${nimErr.message}`);
        console.warn('NVIDIA NIM attempt failed:', nimErr.message);
      }
    } else {
      errors.push('NVIDIA NIM: API key not configured');
    }

    // Fallback to Gemini if configured
    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        const gemini = new GeminiProvider(geminiKey);
        const reply = await gemini.generate(messages, systemPrompt, timeoutMs);
        return { text: reply, provider: 'gemini', fallbackUsed: true, note: 'Switched to Gemini fallback' };
      } catch (geminiErr) {
        errors.push(`Gemini Fallback: ${geminiErr.message}`);
        console.warn('Gemini fallback attempt failed:', geminiErr.message);
      }
    }
  } else if (activeProviderName === 'gemini' || activeProviderName === 'auto') {
    if (geminiKey && geminiKey.trim().length > 0) {
      try {
        const gemini = new GeminiProvider(geminiKey);
        const reply = await gemini.generate(messages, systemPrompt, timeoutMs);
        return { text: reply, provider: 'gemini', fallbackUsed: false };
      } catch (geminiErr) {
        errors.push(`Gemini: ${geminiErr.message}`);
        console.warn('Gemini attempt failed:', geminiErr.message);
      }
    } else {
      errors.push('Gemini: API key not configured');
    }

    // Fallback to NVIDIA NIM if configured
    if (nvidiaKey && nvidiaKey.trim().length > 0) {
      try {
        const nim = new NvidiaNimProvider(nvidiaKey);
        const reply = await nim.generate(messages, systemPrompt, timeoutMs);
        return { text: reply, provider: 'nvidia_nim', fallbackUsed: true, note: 'Switched to NVIDIA NIM fallback' };
      } catch (nimErr) {
        errors.push(`NVIDIA NIM Fallback: ${nimErr.message}`);
        console.warn('NVIDIA NIM fallback attempt failed:', nimErr.message);
      }
    }
  }

  // =========================================================================
  // Intelligent Contextual Knowledge Fallback
  // =========================================================================
  const lastUserMsg = (messages[messages.length - 1]?.content || messages[messages.length - 1]?.text || '').toLowerCase();

  let fallbackResponse = 'Welcome to AnnaSathi AI! I am here to guide you through creating surplus food donations, tracking pickup and delivery runs, and verifying community partners.';

  if (lastUserMsg.includes('donate') || lastUserMsg.includes('create') || lastUserMsg.includes('listing')) {
    fallbackResponse = 'To create a surplus food donation: Navigate to "Create Donation", enter the food category, portions, and safe expiry deadline. Our AI calculates a rule-based urgency score (0-100) to ensure urgent cooked meals are matched immediately with nearby shelters.';
  } else if (lastUserMsg.includes('ngo') || lastUserMsg.includes('verify') || lastUserMsg.includes('shelter')) {
    fallbackResponse = 'NGO partners must be verified by platform administrators before accepting donations. Upload your 12A/80G or registration credentials under Organization Profile to unlock the food discovery feed.';
  } else if (lastUserMsg.includes('volunteer') || lastUserMsg.includes('delivery') || lastUserMsg.includes('pickup')) {
    fallbackResponse = 'Volunteers can view open tasks in "Available Tasks". Once accepted, you can navigate to the donor location using the verified address, collect the food, mark "Picked Up", and complete delivery to the shelter.';
  } else if (lastUserMsg.includes('urgency') || lastUserMsg.includes('safety') || lastUserMsg.includes('expired')) {
    fallbackResponse = 'Food safety is our top priority. Our urgency calculation prioritizes cooked meals and dairy products. Food that has expired cannot be redistributed on the platform.';
  } else if (lastUserMsg.includes('tax') || lastUserMsg.includes('80g') || lastUserMsg.includes('certificate')) {
    fallbackResponse = 'Donors receive digital 80G tax certificates and FSSAI chain-of-custody compliance receipts upon confirmed drop-off at accredited NGOs.';
  } else if (userRole === 'donor') {
    fallbackResponse = 'Hello Donor partner! You can create listings for surplus banquet, cafeteria, or bakery meals. Our matching engine will pair your donation with verified shelters in your area within minutes.';
  } else if (userRole === 'ngo') {
    fallbackResponse = 'Hello NGO partner! Browse available food donations filtered by your capacity and dietary restrictions. Once you accept a donation, a delivery volunteer will be dispatched to transport the food directly to your facility.';
  } else if (userRole === 'volunteer') {
    fallbackResponse = 'Hello Volunteer! Thank you for supporting zero-waste hunger relief. Check "Available Tasks" for active runs in your city corridor. Remember to keep hot food insulated during transit.';
  } else if (userRole === 'admin') {
    fallbackResponse = 'Hello Administrator! You have full visibility into pending NGO verifications, live rescue telemetry, active volunteer deliveries, and audit trails.';
  }

  return {
    text: fallbackResponse,
    provider: 'rule_fallback',
    fallbackUsed: true,
    diagnostic: errors.length > 0 ? errors.join('; ') : 'Selected provider not configured with live credentials',
  };
}

// ============================================================================
// 6. PYTHON AI SERVICE CLIENT & DEMAND PREDICTION PERSISTENCE
// ============================================================================

export async function requestDemandPrediction({ category = 'cooked_meals', city = 'Mumbai', zone = 'Central', date = '', pastTrends = [] }) {
  const serviceUrl = process.env.AI_SERVICE_URL || config.ai.serviceUrl || 'http://localhost:8000';
  const targetCategory = category || 'cooked_meals';
  const targetDate = date || new Date().toISOString().split('T')[0];

  let predictionData = null;

  // 1. Try calling the Python FastAPI microservice
  try {
    const res = await fetch(`${serviceUrl}/ai/demand/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Secret': config.ai.serviceSecret,
      },
      body: JSON.stringify({
        city,
        zone,
        date: targetDate,
        past_trends: pastTrends,
        category: targetCategory,
      }),
    });

    if (res.ok) {
      predictionData = await res.json();
    }
  } catch (err) {
    // Python service unreachable; gracefully fallback to built-in statistical regression engine
  }

  // 2. Statistical baseline fallback when Python microservice is not running
  if (!predictionData) {
    const baselineDemands = {
      cooked_meals: 450,
      dairy_products: 120,
      fruits_vegetables: 200,
      bakery_items: 180,
      packaged_food: 300,
      raw_groceries: 250,
    };

    const targetDay = new Date(targetDate).getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = targetDay === 0 || targetDay === 6;
    const dayFactor = isWeekend ? 1.25 : 1.0;

    const baseMeals = baselineDemands[targetCategory] || 250;
    const predictedMeals = Math.round(baseMeals * dayFactor);

    predictionData = {
      city,
      zone,
      date: targetDate,
      category: targetCategory,
      predicted_meals: predictedMeals,
      predictedDemandMeals: predictedMeals,
      predicted_quantity: parseFloat((predictedMeals * 0.4).toFixed(1)),
      unit: 'kg',
      confidence_score: 0.78,
      confidenceScore: 0.78,
      category_distribution: {
        cooked_meals: isWeekend ? 55.0 : 40.0,
        packaged_groceries: isWeekend ? 20.0 : 30.0,
        fresh_produce: 15.0,
        bakery_dairy: 10.0,
      },
      peak_demand_windows: [
        '12:30 PM - 02:30 PM (Lunch distribution)',
        '07:30 PM - 09:30 PM (Dinner & community kitchen)',
      ],
      high_priority_flag: predictedMeals >= 500,
      model_version: 'v1.1.0-statistical-regression-engine',
      explanation: `Predicted ${predictedMeals} meals for ${zone}, ${city} on ${targetDate}. Base demand: ${baseMeals} meals (${isWeekend ? 'Weekend peak' : 'Weekday baseline'}).`,
    };
  }

  // 3. Persist prediction in PostgreSQL demand_predictions table
  try {
    const meals = predictionData.predicted_meals || predictionData.predictedDemandMeals || 300;
    const quantity = predictionData.predicted_quantity || parseFloat((meals * 0.4).toFixed(1));
    const confidence = predictionData.confidence_score || predictionData.confidenceScore || 0.75;
    const version = predictionData.model_version || predictionData.modelVersion || 'v1.1.0-statistical';

    await query(
      `INSERT INTO demand_predictions (category, region, predicted_demand_meals, predicted_quantity, time_period, confidence_score, model_version, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        targetCategory,
        `${city} - ${zone}`,
        meals,
        quantity,
        'next_24_hours',
        confidence,
        version,
        predictionData.explanation || 'Predicted demand via AI forecasting engine',
      ]
    );
  } catch (dbErr) {
    console.warn('Could not persist demand prediction to PostgreSQL:', dbErr.message);
  }

  return predictionData;
}

// ============================================================================
// EXPORT COMPATIBILITY HELPERS
// ============================================================================

export const calculateUrgencyScore = (data) => calculateFoodUrgency(data);
export const findMatchingNGOs = (donation) => matchNGOsForDonation(donation);
export const askAI = async (message, history = [], userRole = 'visitor', userContext = null, provider = null) => {
  const formattedMessages = [
    ...history.map((h) => ({
      sender: h.sender || h.role || 'user',
      content: h.content || h.text || '',
    })),
    { sender: 'user', content: message },
  ];

  const response = await askChatbot({
    messages: formattedMessages,
    userContext: userContext || { role: userRole },
    provider,
  });

  return response;
};
export const callDemandPredictionService = (params) => requestDemandPrediction(params);
