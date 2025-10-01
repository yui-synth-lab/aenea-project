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
import dpdRoutes, { initializeDPDRoutes } from './routes/dpd.js';
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
initializeDPDRoutes(consciousness);

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

// SSE endpoint is now handled by consciousness router at /api/consciousness/events

// Mount API routes - order matters!
// More specific routes must come before general ones
app.use('/api/consciousness/dpd', dpdRoutes);
app.use('/api/consciousness', consciousnessRoutes);
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