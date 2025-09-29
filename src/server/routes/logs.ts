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

// GET /api/logs/sessions - List all sessions
router.get('/sessions', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const sessions = consciousness.getSessionManager().listSessions();
    res.json({
      sessions,
      currentSession: consciousness.getCurrentSessionId()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// GET /api/logs/sessions/:sessionId - Get specific session data
router.get('/sessions/:sessionId', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const { sessionId } = req.params;
    const sessionData = consciousness.getSessionManager().loadSession(sessionId);

    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(sessionData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session data' });
  }
});

export default router;