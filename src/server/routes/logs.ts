import { Router } from 'express';
import { logger } from '../logger.js';
import ConsciousnessBackend from '../consciousness-backend.js';

const router = Router();

// Consciousness backend will be injected
let consciousness: ConsciousnessBackend;

export function initializeLogs(backend: ConsciousnessBackend) {
  consciousness = backend;
}

// GET /api/logs - Get recent logs
router.get('/', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const logs = logger.getRecentLogs(hours);

    res.json({
      logs,
      count: logs.length,
      timeRange: `${hours} hours`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// GET /api/logs/consciousness - Get consciousness-specific logs
router.get('/consciousness', (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const logs = logger.getConsciousnessLogs(hours);

    res.json({
      logs,
      count: logs.length,
      timeRange: `${hours} hours`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve consciousness logs' });
  }
});

// GET /api/logs/consciousness - Get consciousness data (replaces sessions)
router.get('/consciousness', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const data = {
      state: consciousness.getState(),
      statistics: consciousness.getStatistics(),
      history: consciousness.getHistory()
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve consciousness data' });
  }
});

export default router;