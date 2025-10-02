/**
 * Yui Dialogue Routes - Internal dialogue with Yui Protocol's 5 agents
 * Yui対話ルート - Yui Protocolの5人のエージェントとの内部対話
 *
 * This realizes the novel's vision where Aenea engages in internal dialogue
 * with the five voices: 慧露 (Eiro), 碧統 (Hekito), 観至 (Kanshi), 陽雅 (Yoga), 結心 (Yui)
 */

import { Router } from 'express';
import ConsciousnessBackend from '../consciousness-backend.js';

const router = Router();

// Consciousness backend singleton (will be initialized by main server)
let consciousnessBackend: ConsciousnessBackend | null = null;

export function initializeYuiDialogueRoute(backend: ConsciousnessBackend) {
  consciousnessBackend = backend;
}

// GET /api/yui/agents - Get all Yui Protocol agents
router.get('/agents', (_req, res) => {
  if (!consciousnessBackend) {
    return res.status(503).json({ error: 'Consciousness backend not initialized' });
  }

  try {
    const agents = consciousnessBackend.getYuiAgents();
    res.json({
      agents,
      count: agents.length,
      description: 'Yui Protocol の 5 人のエージェント: 慧露・碧統・観至・陽雅・結心'
    });
  } catch (error) {
    console.error('Failed to get Yui agents:', error);
    res.status(500).json({
      error: 'Failed to get Yui agents',
      message: (error as Error).message
    });
  }
});

// POST /api/yui/dialogue - Start internal dialogue with all 5 agents
router.post('/dialogue', async (req, res) => {
  if (!consciousnessBackend) {
    return res.status(503).json({ error: 'Consciousness backend not initialized' });
  }

  try {
    const { question, category } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const questionCategory = category || 'metacognitive';

    // Start internal dialogue with 5 agents
    const session = await consciousnessBackend.startYuiAgentsDialogue(
      question.trim(),
      questionCategory
    );

    res.json({
      success: true,
      session: {
        id: session.id,
        question: session.question,
        category: session.category,
        timestamp: session.timestamp,
        status: session.status,
        responses: session.responses.map(r => ({
          agentId: r.agentId,
          agentName: r.agentName,
          content: r.content,
          timestamp: r.timestamp,
          confidence: r.confidence
        }))
      },
      message: '5人のエージェントとの内部対話が完了しました'
    });
  } catch (error) {
    console.error('Failed to start Yui dialogue:', error);
    res.status(500).json({
      error: 'Failed to start internal dialogue',
      message: (error as Error).message
    });
  }
});

// GET /api/yui/dialogues - Get recent internal dialogues
router.get('/dialogues', (req, res) => {
  if (!consciousnessBackend) {
    return res.status(503).json({ error: 'Consciousness backend not initialized' });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const dialogues = consciousnessBackend.getRecentYuiDialogues(limit);

    res.json({
      dialogues,
      count: dialogues.length
    });
  } catch (error) {
    console.error('Failed to get recent dialogues:', error);
    res.status(500).json({
      error: 'Failed to get recent dialogues',
      message: (error as Error).message
    });
  }
});

// GET /api/yui/dialogues/:sessionId - Get specific dialogue session
router.get('/dialogues/:sessionId', (req, res) => {
  if (!consciousnessBackend) {
    return res.status(503).json({ error: 'Consciousness backend not initialized' });
  }

  try {
    const { sessionId } = req.params;
    const session = consciousnessBackend.getYuiDialogueSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Dialogue session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Failed to get dialogue session:', error);
    res.status(500).json({
      error: 'Failed to get dialogue session',
      message: (error as Error).message
    });
  }
});

export default router;
