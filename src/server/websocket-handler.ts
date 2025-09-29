import { Server as SocketIOServer } from 'socket.io';
import ConsciousnessBackend from './consciousness-backend.js';

export function setupWebSocketHandlers(io: SocketIOServer, consciousness: ConsciousnessBackend) {
  // Set up real-time events
  consciousness.addEventListener('triggerGenerated', (trigger: any) => {
    io.emit('triggerGenerated', trigger);
  });

  consciousness.addEventListener('thoughtCycleStarted', (data: any) => {
    io.emit('thoughtCycleStarted', data);
  });

  consciousness.addEventListener('stageChanged', (data: any) => {
    io.emit('stageChanged', data);
  });

  consciousness.addEventListener('agentThought', (data: any) => {
    io.emit('agentThought', data);
  });

  consciousness.addEventListener('thoughtCycleCompleted', (cycle: any) => {
    io.emit('thoughtCycleCompleted', cycle);
  });

  consciousness.addEventListener('thoughtCycleFailed', (data: any) => {
    io.emit('thoughtCycleFailed', data);
  });

  consciousness.addEventListener('clockAdvanced', (clock: any) => {
    io.emit('clockAdvanced', clock);
  });

  consciousness.addEventListener('consciousnessPaused', (clock: any) => {
    io.emit('consciousnessPaused', clock);
  });

  consciousness.addEventListener('consciousnessResumed', (clock: any) => {
    io.emit('consciousnessResumed', clock);
  });

  consciousness.addEventListener('dpdUpdated', (data: any) => {
    io.emit('dpdUpdated', data);
  });

  consciousness.addEventListener('statisticsUpdated', (data: any) => {
    io.emit('statisticsUpdated', data);
  });

  consciousness.addEventListener('energyChanged', (data: any) => {
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