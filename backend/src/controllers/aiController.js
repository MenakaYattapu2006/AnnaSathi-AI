import {
  calculateUrgencyScore,
  findMatchingNGOs,
  askAI,
  callDemandPredictionService,
  getActiveProvider,
  setActiveProvider,
  getProviderStatus,
} from '../services/aiService.js';
import { query } from '../config/db.js';

/**
 * AI Controller for AnnaSathi AI Platform
 */

// GET /api/v1/ai/provider
export const getAIProviderStatus = async (req, res, next) => {
  try {
    const status = getProviderStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/ai/provider
export const updateAIProvider = async (req, res, next) => {
  try {
    const { provider } = req.body;
    if (!provider) {
      return res.status(400).json({ success: false, error: 'provider is required' });
    }

    const updated = setActiveProvider(provider);
    res.status(200).json({
      success: true,
      message: `Active AI provider switched to ${updated}`,
      data: getProviderStatus(),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/urgency/predict
export const predictUrgency = async (req, res, next) => {
  try {
    const { foodCategory, category, preparationTime, expiryTime, storageCondition, hasRefrigeration, quantity, unit } = req.body;

    const actualCategory = foodCategory || category;
    if (!actualCategory || !expiryTime) {
      return res.status(400).json({
        success: false,
        error: 'foodCategory and expiryTime are required fields',
      });
    }

    const urgencyResult = calculateUrgencyScore({
      category: actualCategory,
      foodCategory: actualCategory,
      preparationTime,
      expiryTime,
      storageCondition,
      hasRefrigeration,
      quantity,
      unit,
    });

    res.status(200).json({
      success: true,
      data: urgencyResult,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/ai/match/:donationId
export const matchNGOsForDonation = async (req, res, next) => {
  try {
    const { donationId } = req.params;

    const donationRes = await query(`SELECT * FROM donations WHERE id = $1`, [donationId]);
    if (donationRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    const matches = await findMatchingNGOs(donationRes.rows[0]);

    res.status(200).json({
      success: true,
      data: {
        donationId,
        matchCount: matches.length,
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/demand/predict
export const predictDemand = async (req, res, next) => {
  try {
    const { city, zone, date, pastTrends, category } = req.body;

    const prediction = await callDemandPredictionService({
      city: city || 'Mumbai',
      zone: zone || 'Central',
      date: date || new Date().toISOString().split('T')[0],
      pastTrends: pastTrends || [],
      category: category || 'cooked_meals',
    });

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/chat
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, sessionId, conversationId, roleContext, provider } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'message string is required' });
    }

    const userId = req.user?.id || null;
    const userRole = req.user?.role || roleContext || 'visitor';

    const userContext = {
      id: userId,
      name: req.user?.name || null,
      role: userRole,
      organizationName: req.user?.organization_name || null,
    };

    let activeConvId = conversationId || sessionId || null;
    let history = [];

    // 1. Retrieve history if conversation ID provided
    if (activeConvId) {
      try {
        const msgRes = await query(
          `SELECT sender, content FROM chatbot_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 10`,
          [activeConvId]
        );
        history = msgRes.rows.map((r) => ({ sender: r.sender, content: r.content }));
      } catch (hErr) {
        // Conversation might not exist in DB yet
      }
    }

    // 2. Create conversation in DB if user is authenticated and conversation doesn't exist
    if (!activeConvId && userId) {
      try {
        const convRes = await query(
          `INSERT INTO chatbot_conversations (user_id, title) VALUES ($1, $2) RETURNING id`,
          [userId, message.substring(0, 40) + '...']
        );
        activeConvId = convRes.rows[0].id;
      } catch (cErr) {
        console.warn('Could not persist new chatbot conversation:', cErr.message);
      }
    }

    // 3. Generate response via AI engine
    const aiResponse = await askAI(message, history, userRole, userContext, provider);

    // 4. Persist messages in DB if conversation exists
    if (activeConvId) {
      try {
        await query(
          `INSERT INTO chatbot_messages (conversation_id, sender, content, provider, metadata)
           VALUES ($1, 'user', $2, $3, $4), ($1, 'assistant', $5, $6, $7)`,
          [
            activeConvId,
            message,
            aiResponse.provider,
            JSON.stringify({ role: userRole }),
            aiResponse.text,
            aiResponse.provider,
            JSON.stringify({ fallbackUsed: aiResponse.fallbackUsed || false }),
          ]
        );
      } catch (pErr) {
        console.warn('Could not persist chatbot messages:', pErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        conversationId: activeConvId,
        sessionId: activeConvId,
        reply: aiResponse.text,
        provider: aiResponse.provider,
        fallbackUsed: Boolean(aiResponse.fallbackUsed),
        diagnostic: aiResponse.diagnostic || undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
