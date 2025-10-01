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
 * GET /api/growth/metrics
 * 基本的な成長指標を取得
 */
router.get('/metrics', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const growthMetrics = await consciousnessBackend.getGrowthMetrics();
    res.json(growthMetrics);
  } catch (error) {
    console.error('Failed to get growth metrics:', error);
    res.status(500).json({
      error: 'Failed to retrieve growth metrics',
      message: (error as Error).message
    });
  }
});

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
      growthMetrics: await consciousnessBackend.getGrowthMetrics()
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
    console.log(`📊 Growth API: Getting significant thoughts with limit ${limit}`);

    const thoughts = consciousnessBackend.getSignificantThoughts(limit);
    console.log(`📊 Growth API: Retrieved ${thoughts.length} significant thoughts`);

    if (thoughts.length > 0) {
      console.log(`📊 First thought sample:`, thoughts[0]);
    }

    res.json({
      thoughts,
      count: thoughts.length
    });
  } catch (error) {
    console.error('❌ Failed to get significant thoughts:', error);
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
    console.log(`📊 Growth API: Getting unresolved ideas with limit ${limit}`);

    const unresolvedIdeas = await consciousnessBackend.getUnresolvedIdeasAsync(limit);
    console.log(`📊 Growth API: Retrieved ${unresolvedIdeas.length} unresolved ideas`);

    if (unresolvedIdeas.length > 0) {
      console.log(`📊 First idea sample:`, unresolvedIdeas[0]);
    }

    res.json({
      unresolvedIdeas,
      count: unresolvedIdeas.length
    });
  } catch (error) {
    console.error('❌ Failed to get unresolved ideas:', error);
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
        version: '2.1.0' // Memory evolution update
      },
      significantThoughts: consciousnessBackend.getSignificantThoughts(100),
      personalityEvolution: {
        currentTraits: consciousnessBackend.getPersonalityTraits()
      },
      dpdEvolution: consciousnessBackend.getDPDEvolution(),
      unresolvedIdeas: await consciousnessBackend.getUnresolvedIdeasAsync(100),
      growthMetrics: await consciousnessBackend.getGrowthMetrics(),
      beliefEvolution: consciousnessBackend.getBeliefEvolutionMetrics(),
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

/**
 * POST /api/growth/consolidate
 * 手動でメモリー統合を実行
 */
router.post('/consolidate', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    console.log('🧠 Manual memory consolidation requested');
    const result = await consciousnessBackend.consolidateMemory();

    res.json(result);
  } catch (error) {
    console.error('❌ Failed to consolidate memory:', error);
    res.status(500).json({
      error: 'Failed to consolidate memory',
      message: (error as Error).message
    });
  }
});

/**
 * GET /api/growth/beliefs
 * 核心的信念の一覧を取得
 */
router.get('/beliefs', async (req, res) => {
  try {
    if (!consciousnessBackend) {
      return res.status(503).json({ error: 'Consciousness backend not initialized' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const beliefs = consciousnessBackend.getBeliefEvolutionMetrics();

    res.json(beliefs);
  } catch (error) {
    console.error('❌ Failed to get beliefs:', error);
    res.status(500).json({
      error: 'Failed to retrieve beliefs',
      message: (error as Error).message
    });
  }
});

export default router;