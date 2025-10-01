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

  try {
    consciousness.pause();
    res.json({ success: true, paused: true, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/consciousness/resume
router.post('/resume', (_req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    consciousness.resume();
    res.json({ success: true, paused: false, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
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
    // Get data directly from consciousness backend
    const [unresolvedIdeas, significantThoughts] = await Promise.all([
      Promise.resolve(consciousness.getUnresolvedIdeas(10)),
      Promise.resolve(consciousness.getSignificantThoughts(10))
    ]);

    const dbData = {
      dpdEvolution: consciousness.getDPDEvolution(),
      unresolvedIdeas,
      significantThoughts,
      statistics: consciousness.getStatistics()
    };

    res.json({
      timestamp: Date.now(),
      database: dbData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/consciousness/recharge - Manual energy recharge
router.post('/recharge', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const { amount } = req.body || {};
    const energyAmount = amount ? parseFloat(amount) : undefined;

    const success = consciousness.rechargeEnergy(energyAmount);
    const newState = consciousness.getEnergyState();

    res.json({
      success,
      energy: newState.available,
      maxEnergy: newState.total,
      percentage: Math.round((newState.available / newState.total) * 100),
      message: success ? 'Energy recharged successfully' : 'Energy recharge not needed or failed'
    });
  } catch (error) {
    console.error('Energy recharge error:', error);
    res.status(500).json({ success: false, error: 'Failed to recharge energy' });
  }
});

// POST /api/consciousness/deep-rest - Deep rest energy restoration
router.post('/deep-rest', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const success = consciousness.performDeepRest();
    const newState = consciousness.getEnergyState();

    res.json({
      success,
      energy: newState.available,
      maxEnergy: newState.total,
      percentage: Math.round((newState.available / newState.total) * 100),
      message: success ? 'Deep rest completed - energy and efficiency restored' : 'Deep rest not needed or failed'
    });
  } catch (error) {
    console.error('Deep rest error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform deep rest' });
  }
});

// GET /api/consciousness/energy - Get current energy state
router.get('/energy', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const energyState = consciousness.getEnergyState();

    res.json({
      available: energyState.available,
      total: energyState.total,
      reserved: energyState.reserved,
      efficiency: energyState.efficiency,
      percentage: Math.round((energyState.available / energyState.total) * 100),
      level: energyState.available <= 15 ? 'critical' :
             energyState.available <= 40 ? 'low' :
             energyState.available <= 70 ? 'moderate' : 'high',
      lastUpdate: energyState.lastUpdate
    });
  } catch (error) {
    console.error('Energy state error:', error);
    res.status(500).json({ error: 'Failed to get energy state' });
  }
});

// GET /api/consciousness/events - Server-Sent Events (SSE) stream
router.get('/events', (req, res) => {
  console.log('📡 SSE client connected');

  if (!consciousness) {
    console.error('❌ Consciousness not initialized for SSE');
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

  // Send initial connection message
  console.log('✅ SSE headers set, sending initial connected event');
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Helper function to send SSE events
  const sendEvent = (eventType: string, data: any) => {
    try {
      const eventData = {
        type: eventType,
        timestamp: Date.now(),
        ...data
      };

      // Try to stringify and check size
      const jsonStr = JSON.stringify(eventData);

      // If JSON string is too large (> 500KB), truncate data
      if (jsonStr.length > 500000) {
        console.warn(`⚠️ SSE event ${eventType} too large (${jsonStr.length} bytes), truncating...`);

        // Create a truncated version with only essential fields
        const truncatedData = {
          type: eventType,
          timestamp: eventData.timestamp,
          stage: eventData.stage,
          name: eventData.name,
          status: eventData.status,
          // Note about truncation
          _truncated: true,
          _originalSize: jsonStr.length
        };

        res.write(`data: ${JSON.stringify(truncatedData)}\n\n`);
      } else {
        console.log(`📤 SSE event: ${eventType} (${jsonStr.length} bytes)`);
        res.write(`data: ${jsonStr}\n\n`);
      }
    } catch (error) {
      console.error(`❌ Error sending SSE event ${eventType}:`, error);

      // Send minimal error event
      try {
        res.write(`data: ${JSON.stringify({
          type: eventType,
          timestamp: Date.now(),
          error: 'Failed to serialize event data',
          _fallback: true
        })}\n\n`);
      } catch (fallbackError) {
        console.error(`❌ Failed to send fallback event:`, fallbackError);
      }
    }
  };

  // Register event listeners for all consciousness events
  const triggerGeneratedListener = (data: any) => sendEvent('triggerGenerated', data);
  const thoughtCycleStartedListener = (data: any) => sendEvent('thoughtCycleStarted', data);
  const stageChangedListener = (data: any) => sendEvent('stageChanged', data);
  const stageCompletedListener = (data: any) => sendEvent('stageCompleted', data);
  const agentThoughtListener = (data: any) => sendEvent('agentThought', data);
  const thoughtCycleCompletedListener = (data: any) => {
    // Send thoughtCycleComplete event with full statistics
    const eventData = {
      ...data,
      systemStats: {
        systemClock: data.systemClock,
        totalQuestions: data.totalQuestions,
        totalThoughts: data.totalThoughts,
        averageConfidence: data.averageConfidence
      },
      dpdScores: data.dpdScores,
      dpdWeights: data.dpdWeights
    };
    sendEvent('thoughtCycleComplete', eventData);
  };
  const thoughtCycleFailedListener = (data: any) => sendEvent('thoughtCycleFailed', data);
  const clockAdvancedListener = (data: any) => sendEvent('clockAdvanced', data);
  const consciousnessPausedListener = (data: any) => sendEvent('consciousnessPaused', data);
  const consciousnessResumedListener = (data: any) => sendEvent('consciousnessResumed', data);
  const consciousnessStartedListener = (data: any) => sendEvent('consciousnessStarted', data);
  const consciousnessStoppedListener = (data: any) => sendEvent('consciousnessStopped', data);
  const dpdUpdatedListener = (data: any) => sendEvent('dpdUpdated', data);
  const statisticsUpdatedListener = (data: any) => sendEvent('statisticsUpdated', data);
  const energyChangedListener = (data: any) => sendEvent('energyChanged', data);
  const energyRechargedListener = (data: any) => sendEvent('energyRecharged', data);
  const deepRestPerformedListener = (data: any) => sendEvent('deepRestPerformed', data);
  const consciousnessDormantListener = (data: any) => sendEvent('consciousnessDormant', data);
  const consciousnessAwakenedListener = (data: any) => sendEvent('consciousnessAwakened', data);
  const energyUpdatedListener = (data: any) => sendEvent('energyUpdated', data);

  console.log('🔗 Registering SSE event listeners...');
  consciousness.on('triggerGenerated', triggerGeneratedListener);
  consciousness.on('thoughtCycleStarted', thoughtCycleStartedListener);
  consciousness.on('stageChanged', stageChangedListener);
  consciousness.on('stageCompleted', stageCompletedListener);
  consciousness.on('agentThought', agentThoughtListener);
  consciousness.on('thoughtCycleCompleted', thoughtCycleCompletedListener);
  consciousness.on('thoughtCycleFailed', thoughtCycleFailedListener);
  consciousness.on('clockAdvanced', clockAdvancedListener);
  consciousness.on('consciousnessPaused', consciousnessPausedListener);
  consciousness.on('consciousnessResumed', consciousnessResumedListener);
  consciousness.on('consciousnessStarted', consciousnessStartedListener);
  consciousness.on('consciousnessStopped', consciousnessStoppedListener);
  consciousness.on('dpdUpdated', dpdUpdatedListener);
  consciousness.on('statisticsUpdated', statisticsUpdatedListener);
  consciousness.on('energyChanged', energyChangedListener);
  consciousness.on('energyRecharged', energyRechargedListener);
  consciousness.on('deepRestPerformed', deepRestPerformedListener);
  consciousness.on('consciousnessDormant', consciousnessDormantListener);
  consciousness.on('consciousnessAwakened', consciousnessAwakenedListener);
  consciousness.on('energyUpdated', energyUpdatedListener);
  console.log('✅ SSE event listeners registered (20 events)');

  // Clean up on client disconnect
  req.on('close', () => {
    consciousness.removeListener('triggerGenerated', triggerGeneratedListener);
    consciousness.removeListener('thoughtCycleStarted', thoughtCycleStartedListener);
    consciousness.removeListener('stageChanged', stageChangedListener);
    consciousness.removeListener('stageCompleted', stageCompletedListener);
    consciousness.removeListener('agentThought', agentThoughtListener);
    consciousness.removeListener('thoughtCycleCompleted', thoughtCycleCompletedListener);
    consciousness.removeListener('thoughtCycleFailed', thoughtCycleFailedListener);
    consciousness.removeListener('clockAdvanced', clockAdvancedListener);
    consciousness.removeListener('consciousnessPaused', consciousnessPausedListener);
    consciousness.removeListener('consciousnessResumed', consciousnessResumedListener);
    consciousness.removeListener('consciousnessStarted', consciousnessStartedListener);
    consciousness.removeListener('consciousnessStopped', consciousnessStoppedListener);
    consciousness.removeListener('dpdUpdated', dpdUpdatedListener);
    consciousness.removeListener('statisticsUpdated', statisticsUpdatedListener);
    consciousness.removeListener('energyChanged', energyChangedListener);
    consciousness.removeListener('energyRecharged', energyRechargedListener);
    consciousness.removeListener('deepRestPerformed', deepRestPerformedListener);
    consciousness.removeListener('consciousnessDormant', consciousnessDormantListener);
    consciousness.removeListener('consciousnessAwakened', consciousnessAwakenedListener);
    consciousness.removeListener('energyUpdated', energyUpdatedListener);
    console.log('SSE client disconnected');
  });
});

export default router;