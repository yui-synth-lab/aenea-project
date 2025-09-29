/**
 * Aenea Server (TypeScript) - Clean Architecture
 *
 * Express server with proper route separation and consciousness system integration
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import ConsciousnessBackend from './consciousness-backend.js';
import consciousnessRoutes, { initializeConsciousness } from './routes/consciousness.js';
import dpdRoutes from './routes/dpd.js';
import integrationRoutes from './routes/integration.js';
import logsRoutes, { initializeLogs } from './routes/logs.js';
import growthRoutes, { initializeGrowthRoutes } from './routes/growth.js';
import { setupWebSocketHandlers } from './websocket-handler.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

// Initialize consciousness backend
const consciousness = new ConsciousnessBackend();

// Initialize consciousness for routes
initializeConsciousness(consciousness);
initializeLogs(consciousness);
initializeGrowthRoutes(consciousness);

// Middleware
app.use(express.json());

// Serve static files (for UI)
app.use(express.static(path.join(__dirname, '../ui')));

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// SSE endpoint for real-time consciousness events
app.get('/api/consciousness/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Listen to consciousness events
  const onAgentThought = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'agentThought', ...data })}\n\n`);
  };

  const onTriggerGenerated = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'triggerGenerated', ...data })}\n\n`);
  };

  const onThoughtCycleCompleted = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'thoughtCycleComplete', ...data })}\n\n`);
  };

  const onEnergyRecharged = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'energyRecharged', energyState: data })}\n\n`);
  };

  const onDeepRestPerformed = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'deepRestPerformed', energyState: data })}\n\n`);
  };

  const onEnergyUpdated = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'energyUpdated', energyState: data })}\n\n`);
  };

  const onStageCompleted = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'stageCompleted', ...data })}\n\n`);
  };

  const onStageChanged = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'stageChanged', ...data })}\n\n`);
  };

  const onConsciousnessStarted = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'consciousnessStarted', systemClock: data })}\n\n`);
  };

  const onConsciousnessStopped = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'consciousnessStopped', systemClock: data })}\n\n`);
  };

  const onConsciousnessPaused = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'consciousnessPaused', systemClock: data })}\n\n`);
  };

  const onConsciousnessResumed = (data: any) => {
    res.write(`data: ${JSON.stringify({ type: 'consciousnessResumed', systemClock: data })}\n\n`);
  };

  // Subscribe to consciousness events
  consciousness.addEventListener('agentThought', onAgentThought);
  consciousness.addEventListener('triggerGenerated', onTriggerGenerated);
  consciousness.addEventListener('thoughtCycleCompleted', onThoughtCycleCompleted);
  consciousness.addEventListener('energyRecharged', onEnergyRecharged);
  consciousness.addEventListener('deepRestPerformed', onDeepRestPerformed);
  consciousness.addEventListener('energyUpdated', onEnergyUpdated);
  consciousness.addEventListener('stageCompleted', onStageCompleted);
  consciousness.addEventListener('stageChanged', onStageChanged);
  consciousness.addEventListener('consciousnessStarted', onConsciousnessStarted);
  consciousness.addEventListener('consciousnessStopped', onConsciousnessStopped);
  consciousness.addEventListener('consciousnessPaused', onConsciousnessPaused);
  consciousness.addEventListener('consciousnessResumed', onConsciousnessResumed);

  // Handle client disconnect
  req.on('close', () => {
    consciousness.removeEventListener('agentThought', onAgentThought);
    consciousness.removeEventListener('triggerGenerated', onTriggerGenerated);
    consciousness.removeEventListener('thoughtCycleCompleted', onThoughtCycleCompleted);
    consciousness.removeEventListener('energyRecharged', onEnergyRecharged);
    consciousness.removeEventListener('deepRestPerformed', onDeepRestPerformed);
    consciousness.removeEventListener('energyUpdated', onEnergyUpdated);
    consciousness.removeEventListener('stageCompleted', onStageCompleted);
    consciousness.removeEventListener('stageChanged', onStageChanged);
    consciousness.removeEventListener('consciousnessStarted', onConsciousnessStarted);
    consciousness.removeEventListener('consciousnessStopped', onConsciousnessStopped);
    consciousness.removeEventListener('consciousnessPaused', onConsciousnessPaused);
    consciousness.removeEventListener('consciousnessResumed', onConsciousnessResumed);
    res.end();
  });
});

// Mount API routes
app.use('/api/consciousness', consciousnessRoutes);
app.use('/api/consciousness/dpd', dpdRoutes);
app.use('/api/integration', integrationRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/growth', growthRoutes);

// ============================================================================
// WebSocket Integration
// ============================================================================

setupWebSocketHandlers(io, consciousness);

// ============================================================================
// Server Configuration
// ============================================================================

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ============================================================================
// Serve Frontend
// ============================================================================

// Serve main UI page (fallback to index.html for SPA routing, but not for API routes)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

server.listen(PORT, () => {
  console.log('🌟 Aenea Server (Clean Architecture)');
  console.log('==========================================');
  console.log(`🖥️  Server: http://localhost:${PORT}`);
  console.log(`🧠 Consciousness: Active`);
  console.log(`🔌 WebSocket: Ready`);
  console.log(`🎯 UI: http://localhost:${PORT}`);
  console.log('🏗️  Architecture: Route Separation Enabled');
  console.log('==========================================');
});