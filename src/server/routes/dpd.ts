import { Router } from 'express';

const router = Router();

// Global consciousness backend instance will be set by server
let consciousnessBackend: any = null;

export function initializeDPDRoutes(backend: any) {
  consciousnessBackend = backend;
}

// GET /api/consciousness/dpd/weights
router.get('/weights', (_req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const weights = consciousnessBackend.getDPDWeights();
    res.json({
      ...weights,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to get DPD weights:', error);
    res.status(500).json({
      error: 'Failed to retrieve DPD weights',
      message: (error as Error).message
    });
  }
});

// GET /api/consciousness/dpd (main route)
router.get('/', (_req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const weights = consciousnessBackend.getDPDWeights();
    res.json({
      ...weights,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to get DPD data:', error);
    res.status(500).json({
      error: 'Failed to retrieve DPD data',
      message: (error as Error).message
    });
  }
});

// Legacy route
router.get('/scores', (_req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const weights = consciousnessBackend.getDPDWeights();
    res.json({
      ...weights,
      weightedTotal: (weights.empathy + weights.coherence + weights.dissonance) / 3,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to get DPD scores:', error);
    res.status(500).json({
      error: 'Failed to retrieve DPD scores',
      message: (error as Error).message
    });
  }
});

// GET /api/consciousness/dpd/evolution - DPD Weight Evolution History
// Query params: limit (max items), strategy (all|recent|sampled)
router.get('/evolution', (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const strategy = (req.query.strategy as string) || 'sampled'; // all | recent | sampled

    const evolution = consciousnessBackend.getDPDEvolution(limit, strategy);
    res.json({
      currentWeights: evolution.currentWeights,
      history: evolution.history,
      totalCount: evolution.totalCount,
      samplingStrategy: strategy,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to get DPD evolution:', error);
    res.status(500).json({
      error: 'Failed to retrieve DPD evolution',
      message: (error as Error).message
    });
  }
});

export default router;




