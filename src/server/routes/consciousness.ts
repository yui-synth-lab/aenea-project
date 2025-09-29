import { Router } from 'express';
import ConsciousnessBackend from '../consciousness-backend.js';

const router = Router();

// Consciousness backend singleton (will be initialized by main server)
let consciousness: ConsciousnessBackend;

export function initializeConsciousness(backend: ConsciousnessBackend) {
  consciousness = backend;
}

// POST /api/consciousness/init
router.post('/init', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness backend not available' });
  }

  try {
    // Consciousness is already initialized in the constructor
    res.json({ success: true, message: 'Consciousness initialized successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/consciousness/start
router.post('/start', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    consciousness.start();
    res.json({ success: true, message: 'Consciousness started' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});


// GET /api/consciousness/state
router.get('/state', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  const state = consciousness.getState();
  res.json(state);
});

// GET /api/consciousness/statistics
router.get('/statistics', async (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const growthMetrics = await consciousness.getGrowthMetrics();
    const state = consciousness.getState();

    res.json({
      totalQuestions: growthMetrics.questionsGenerated,
      totalThoughts: growthMetrics.thoughtCyclesCompleted,
      averageConfidence: Math.round(growthMetrics.averageConfidenceLevel * 100),
      systemClock: state.systemClock,
      energy: state.energy,
      energyLevel: Math.round(state.energy)
    });
  } catch (error) {
    console.error('Error getting consciousness statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// GET /api/consciousness/history
router.get('/history', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  const history = consciousness.getHistory();
  res.json(history);
});

// POST /api/consciousness/trigger
router.post('/trigger', async (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const { question } = req.body || {};

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Process manual trigger
    const result = await consciousness.manualTrigger(question.trim());

    res.json({
      success: true,
      triggerId: result?.id || `trigger_${Date.now()}`,
      question: question.trim(),
      processed: !!result
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ success: false, error: 'Failed to process trigger' });
  }
});

// POST /api/consciousness/pause
router.post('/pause', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  consciousness.pause();
  res.json({ paused: true, timestamp: Date.now() });
});

// POST /api/consciousness/resume
router.post('/resume', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  consciousness.resume();
  res.json({ paused: false, timestamp: Date.now() });
});

// POST /api/consciousness/stop
router.post('/stop', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    consciousness.stop();
    res.json({ success: true, stopped: true, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/consciousness/recharge-energy
router.post('/recharge-energy', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const { amount } = req.body || {};
    const result = consciousness.rechargeEnergy(amount);

    if (result) {
      const energyState = consciousness.getEnergyState();
      res.json({
        success: true,
        message: 'エネルギー充電完了',
        energyState
      });
    } else {
      res.json({
        success: false,
        message: 'エネルギーは既に満タンです'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/consciousness/deep-rest
router.post('/deep-rest', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const result = consciousness.performDeepRest();

    if (result) {
      const energyState = consciousness.getEnergyState();
      res.json({
        success: true,
        message: '深い休息によってエネルギーと効率が回復しました',
        energyState
      });
    } else {
      res.json({
        success: false,
        message: '深い休息は実行できませんでした'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/consciousness/debug/database
router.get('/debug/database', async (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const sessionManager = consciousness.getSessionManager();

    // Get raw database values using async methods
    const [statistics, questions, thoughtCycles, unresolvedIdeas, significantThoughts] = await Promise.all([
      sessionManager.getStatistics(),
      sessionManager.getQuestions(10),
      sessionManager.getThoughtCycles(5),
      Promise.resolve(sessionManager.getUnresolvedIdeas(10)),
      Promise.resolve(sessionManager.getSignificantThoughts(10))
    ]);

    const dbData = {
      currentSessionId: sessionManager.getCurrentSessionId(),
      dpdEvolution: sessionManager.getDPDEvolution(),
      unresolvedIdeas,
      significantThoughts,
      sessionStatistics: statistics,
      questions,
      thoughtCycles
    };

    res.json({
      timestamp: Date.now(),
      database: dbData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;