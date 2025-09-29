import { Router } from 'express';

const router = Router();

// GET /api/consciousness/dpd (mock for now)
router.get('/', (_req, res) => {
  res.json({
    empathy: 0.65 + Math.random() * 0.1,
    coherence: 0.72 + Math.random() * 0.1,
    dissonance: 0.58 + Math.random() * 0.1,
    timestamp: Date.now()
  });
});

// Legacy route
router.get('/scores', (_req, res) => {
  res.json({
    empathy: 0.65 + Math.random() * 0.1,
    coherence: 0.72 + Math.random() * 0.1,
    dissonance: 0.58 + Math.random() * 0.1,
    weightedTotal: 0.6 + Math.random() * 0.1,
    timestamp: Date.now()
  });
});

export default router;




