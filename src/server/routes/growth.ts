/**
 * Growth Analysis API Routes
 * 意識成長分析のAPIルート
 */

import { Router } from 'express';

const router = Router();

// Global consciousness backend instance will be set by server
let consciousnessBackend: any = null;

export function initializeGrowthRoutes(backend: any) {
  consciousnessBackend = backend;
}

/**
 * GET /api/growth/overview
 * 意識成長の概要を取得
 */
router.get('/overview', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const overview = {
      lastUpdate: new Date().toISOString(),
      personalityTraits: consciousnessBackend.getPersonalityTraits(),
      dpdEvolution: consciousnessBackend.getDPDEvolution(),
      growthMetrics: consciousnessBackend.getGrowthMetrics()
    };

    res.json(overview);
  } catch (error) {
    console.error('Failed to get growth overview:', error);
    res.status(500).json({
      error: 'Failed to retrieve growth data',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/growth/thoughts
 * 重要な思考の一覧を取得
 */
router.get('/thoughts', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const thoughts = consciousnessBackend.getSignificantThoughts(limit);

    res.json({
      thoughts,
      count: thoughts.length
    });
  } catch (error) {
    console.error('Failed to get significant thoughts:', error);
    res.status(500).json({
      error: 'Failed to retrieve thoughts',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/growth/unresolved
 * 未解決な問いの一覧を取得
 */
router.get('/unresolved', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const unresolvedIdeas = consciousnessBackend.getUnresolvedIdeas(limit);

    res.json({
      unresolvedIdeas,
      count: unresolvedIdeas.length
    });
  } catch (error) {
    console.error('Failed to get unresolved ideas:', error);
    res.status(500).json({
      error: 'Failed to retrieve unresolved ideas',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/growth/evolution
 * 人格進化の詳細を取得
 */
router.get('/evolution', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const evolution = {
      personalityEvolution: {
        currentTraits: consciousnessBackend.getPersonalityTraits()
      },
      dpdHistory: consciousnessBackend.getDPDEvolution().history,
      communicationStyle: {},
      preferences: {}
    };

    res.json(evolution);
  } catch (error) {
    console.error('Failed to get evolution data:', error);
    res.status(500).json({
      error: 'Failed to retrieve evolution data',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/growth/full
 * 完全な意識成長データを取得
 */
router.get('/full', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const fullData = {
      overview: {
        lastUpdate: new Date().toISOString(),
        version: '2.0.0'
      },
      significantThoughts: consciousnessBackend.getSignificantThoughts(100),
      personalityEvolution: {
        currentTraits: consciousnessBackend.getPersonalityTraits()
      },
      dpdEvolution: consciousnessBackend.getDPDEvolution(),
      unresolvedIdeas: consciousnessBackend.getUnresolvedIdeas(100),
      growthMetrics: consciousnessBackend.getGrowthMetrics(),
      preferences: {},
      communicationStyle: {}
    };

    res.json(fullData);
  } catch (error) {
    console.error('Failed to get full growth data:', error);
    res.status(500).json({
      error: 'Failed to retrieve full growth data',
      message: (error as Error).message
    });
  }
});

export default router;