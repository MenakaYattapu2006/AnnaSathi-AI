import { calculateUrgencyScore, findMatchingNGOs, askAI, callDemandPredictionService } from '../services/aiService.js';
import { query } from '../config/db.js';

/**
 * AI Controller for AnnaSathi AI Platform
 */

// POST /api/v1/ai/urgency/predict
export const predictUrgency = async (req, res, next) => {
  try {
    const { foodCategory, preparationTime, expiryTime, storageCondition, quantity } = req.body;

    if (!foodCategory || !expiryTime) {
      return res.status(400).json({
        success: false,
        error: 'foodCategory and expiryTime are required fields'
      });
    }

    const urgencyResult = calculateUrgencyScore({
      foodCategory,
      preparationTime,
      expiryTime,
      storageCondition,
      quantity
    });

    res.status(200).json({
      success: true,
      data: urgencyResult
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
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/demand/predict
export const predictDemand = async (req, res, next) => {
  try {
    const { city, zone, date, pastTrends } = req.body;

    const prediction = await callDemandPredictionService({
      city: city || 'Mumbai',
      zone: zone || 'Central',
      date: date || new Date().toISOString().split('T')[0],
      pastTrends: pastTrends || []
    });

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/ai/chat
export const chatWithAI = async (req, res, next) => {
  try {
    const { message, sessionId, roleContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'message string is required' });
    }

    const userId = req.user?.id || null;
    const userRole = req.user?.role || roleContext || 'visitor';

    // Retrieve previous messages if sessionId exists
    let history = [];
    let currentSessionId = sessionId;

    if (currentSessionId) {
      const msgRes = await query(
        `SELECT role, content FROM chatbot_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 10`,
        [currentSessionId]
      );
      history = msgRes.rows.map(r => ({ role: r.role, content: r.content }));
    } else {
      // Create session
      const newSession = await query(
        `INSERT INTO chatbot_sessions (user_id, title) VALUES ($1, $2) RETURNING id`,
        [userId, message.substring(0, 40) + '...']
      );
      currentSessionId = newSession.rows[0].id;
    }

    // Call AI Chat engine (Gemini / NVIDIA NIM / Fallback)
    const assistantReply = await askAI(message, history, userRole);

    // Persist messages in DB
    await query(
      `INSERT INTO chatbot_messages (session_id, role, content) VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
      [currentSessionId, message, assistantReply]
    );

    res.status(200).json({
      success: true,
      data: {
        sessionId: currentSessionId,
        reply: assistantReply
      }
    });
  } catch (error) {
    next(error);
  }
};
