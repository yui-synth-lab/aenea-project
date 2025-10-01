import { Server as SocketIOServer } from 'socket.io';
import ConsciousnessBackend from './consciousness-backend.js';

export function setupWebSocketHandlers(io: SocketIOServer, consciousness: ConsciousnessBackend) {
  // Set up real-time events
  consciousness.on('triggerGenerated', (trigger: any) => {
    io.emit('triggerGenerated', trigger);
  });

  consciousness.on('thoughtCycleStarted', (data: any) => {
    io.emit('thoughtCycleStarted', data);
  });

  consciousness.on('stageChanged', (data: any) => {
    io.emit('stageChanged', data);
  });

  consciousness.on('agentThought', (data: any) => {
    io.emit('agentThought', data);
  });

  consciousness.on('thoughtCycleCompleted', (cycle: any) => {
    // Limit data size to prevent JSON.stringify errors
    const limitedCycle = {
      id: cycle.id,
      timestamp: cycle.timestamp,
      trigger: cycle.trigger,
      status: cycle.status,
      totalEnergy: cycle.totalEnergy,
      totalStages: cycle.totalStages,
      // Limit thoughts array to essential info
      thoughts: cycle.thoughts?.slice(0, 3).map((t: any) => ({
        id: t.id,
        agentId: t.agentId,
        content: t.content?.slice(0, 200), // Limit content length
        confidence: t.confidence
      })) || [],
      // Limit other arrays
      synthesis: cycle.synthesis ? {
        integratedThought: cycle.synthesis.integratedThought?.slice(0, 300),
        keyInsights: cycle.synthesis.keyInsights?.slice(0, 3)
      } : null
    };
    try {
      io.emit('thoughtCycleCompleted', limitedCycle);
    } catch (error) {
      console.error('Error in event listener for thoughtCycleCompleted:', error);
      // Send minimal data as fallback
      io.emit('thoughtCycleCompleted', {
        id: cycle.id,
        timestamp: cycle.timestamp,
        status: cycle.status
      });
    }
  });

  consciousness.on('thoughtCycleFailed', (data: any) => {
    io.emit('thoughtCycleFailed', data);
  });

  consciousness.on('clockAdvanced', (clock: any) => {
    io.emit('clockAdvanced', clock);
  });

  consciousness.on('consciousnessPaused', (clock: any) => {
    io.emit('consciousnessPaused', clock);
  });

  consciousness.on('consciousnessResumed', (clock: any) => {
    io.emit('consciousnessResumed', clock);
  });

  consciousness.on('dpdUpdated', (data: any) => {
    // Limit DPD data to prevent JSON.stringify errors
    const limitedData = {
      weights: data.weights,
      scores: data.scores,
      timestamp: data.timestamp,
      // Remove large data arrays that might cause issues
      context: data.context ? String(data.context).slice(0, 100) : null
    };
    try {
      io.emit('dpdUpdated', limitedData);
    } catch (error) {
      console.error('Error in event listener for dpdUpdated:', error);
      // Send minimal data as fallback
      io.emit('dpdUpdated', {
        weights: data.weights,
        scores: data.scores,
        timestamp: data.timestamp
      });
    }
  });

  consciousness.on('statisticsUpdated', (data: any) => {
    io.emit('statisticsUpdated', data);
  });

  consciousness.on('energyChanged', (data: any) => {
    io.emit('energyChanged', data);
  });

  // WebSocket connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Send current state to new client
    const state = consciousness.getState();
    socket.emit('consciousnessState', state);

    // Send welcome message
    socket.emit('hello', {
      message: 'Connected to Aenea Consciousness System',
      timestamp: Date.now(),
      state: state
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    // Handle client requests
    socket.on('getState', () => {
      socket.emit('consciousnessState', consciousness.getState());
    });

    socket.on('getHistory', () => {
      socket.emit('consciousnessHistory', consciousness.getHistory());
    });

    socket.on('manualTrigger', async (data) => {
      try {
        const result = await consciousness.manualTrigger(data.question);
        socket.emit('manualTriggerResult', { success: true, result });
      } catch (error) {
        socket.emit('manualTriggerResult', { success: false, error: (error as Error).message });
      }
    });
  });
}