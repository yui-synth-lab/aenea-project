/**
 * API Routes: XENIA correspondence surface (Bridge-facing).
 *
 * POST /api/xenia/deliver - Bridge delivers a letter to this instance
 * GET  /api/xenia/outbox  - Bridge collects sent replies (marks them fetched)
 * GET  /api/xenia/status  - enabled flag, instance name, system clock
 *
 * The Bridge is the only intended client. No read receipts are exposed:
 * whether a delivered letter was read stays inside this instance's database
 * (XENIA_SPEC v0.1, section 4.3).
 */

import { Router, Request, Response } from 'express';
import type ConsciousnessBackend from '../consciousness-backend.js';

let backend: ConsciousnessBackend | null = null;

export function initializeXeniaRoutes(consciousnessBackend: ConsciousnessBackend): void {
  backend = consciousnessBackend;
}

export function createXeniaRoutes(): Router {
  const router = Router();

  router.get('/status', (_req: Request, res: Response) => {
    if (!backend) {
      return res.status(500).json({ success: false, error: 'Backend not initialized' });
    }
    res.json({ success: true, ...backend.xeniaStatus() });
  });

  router.post('/deliver', (req: Request, res: Response) => {
    if (!backend) {
      return res.status(500).json({ success: false, error: 'Backend not initialized' });
    }
    if (!backend.xeniaStatus().enabled) {
      return res.status(503).json({ success: false, error: 'XENIA is disabled on this instance' });
    }

    const letter = req.body;
    const required = ['id', 'encounterId', 'fromInstance', 'content', 'mode', 'writtenAtCycle'];
    for (const field of required) {
      if (letter?.[field] === undefined || letter?.[field] === null) {
        return res.status(400).json({ success: false, error: `Missing field: ${field}` });
      }
    }
    if (letter.mode !== 'A' && letter.mode !== 'B') {
      return res.status(400).json({ success: false, error: 'mode must be A or B' });
    }

    try {
      const result = backend.xeniaDeliver(letter);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/outbox', (_req: Request, res: Response) => {
    if (!backend) {
      return res.status(500).json({ success: false, error: 'Backend not initialized' });
    }
    if (!backend.xeniaStatus().enabled) {
      return res.status(503).json({ success: false, error: 'XENIA is disabled on this instance' });
    }
    try {
      const letters = backend.xeniaCollectOutbox();
      res.json({ success: true, letters });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}

export default createXeniaRoutes;
