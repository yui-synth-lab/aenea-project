/**
 * Internal State API Routes - Consciousness State Monitoring
 *
 * Provides detailed monitoring endpoints for consciousness internal state,
 * system metrics, and real-time diagnostics.
 *
 * 内部状態APIルート - 意識状態監視
 * 意識の内部状態、システム指標、リアルタイム診断のための詳細な監視エンドポイントを提供
 */

import { Router } from 'express';
import ConsciousnessBackend from '../consciousness-backend.js';
import { ConsciousnessSystemClock } from '../../utils/system-clock.js';
import { QuestionCategorizer } from '../../utils/question-categorizer.js';
import { EnergyManager } from '../../utils/energy-management.js';

const router = Router();

// Consciousness backend singleton (will be initialized by main server)
let consciousness: ConsciousnessBackend;
let systemClock: ConsciousnessSystemClock;
let questionCategorizer: QuestionCategorizer;
let energyManager: EnergyManager;

export function initializeInternalState(
  backend: ConsciousnessBackend,
  clock?: ConsciousnessSystemClock,
  categorizer?: QuestionCategorizer,
  energy?: EnergyManager
) {
  consciousness = backend;
  systemClock = clock || new ConsciousnessSystemClock();
  questionCategorizer = categorizer || new QuestionCategorizer();
  energyManager = energy || new EnergyManager();
}

/**
 * GET /api/internal-state/overview
 * 全体概要 - システム全体の状態サマリー
 */
router.get('/overview', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const state = consciousness.getState();
    const energyState = consciousness.getEnergyState();

    const overview = {
      timestamp: Date.now(),
      systemStatus: {
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        uptime: Date.now() - Date.now() // Simplified uptime calculation
      },
      consciousness: {
        systemClock: state.systemClock,
        totalQuestions: state.totalQuestions,
        totalThoughts: state.totalThoughts
      },
      energy: {
        current: energyState.available,
        maximum: energyState.total,
        percentage: Math.round((energyState.available / energyState.total) * 100),
        efficiency: energyState.efficiency,
        recovery: energyState.recovery
      },
      session: {
        // Session management removed from architecture
      },
      performance: {
        averageResponseTime: 0, // Would be calculated from actual metrics
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json(overview);
  } catch (error) {
    console.error('Failed to get overview:', error);
    res.status(500).json({ error: 'Failed to retrieve system overview' });
  }
});

/**
 * GET /api/internal-state/consciousness
 * 意識状態詳細 - 意識システムの詳細な状態情報
 */
router.get('/consciousness', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const state = consciousness.getState();
    const history = consciousness.getHistory();

    // Get system clock details if available
    let clockDetails = null;
    if (systemClock) {
      const clockStats = systemClock.getSystemStatistics();
      clockDetails = {
        currentClock: systemClock.getCurrentClock(),
        currentTimestamp: systemClock.getCurrentTimestamp(),
        statistics: clockStats,
        recentEvents: systemClock.getRecentEvents(10)
      };
    }

    // Get question categorizer statistics if available
    let questionStats = null;
    if (questionCategorizer) {
      questionStats = questionCategorizer.getCategoryStatistics();
    }

    const consciousnessDetails = {
      timestamp: Date.now(),
      basicState: state,
      history: {
        questions: history.questions,
        thoughts: history.thoughts,
        total: history.questions.total + history.thoughts.total
      },
      systemClock: clockDetails,
      questionAnalytics: questionStats,
      agentActivity: {
        activeAgents: [],
        totalAgents: 0,
        // Add agent-specific metrics if available
      },
      cognitiveMetrics: {
        questionsPerHour: calculateQuestionsPerHour(history),
        thoughtComplexity: calculateAverageThoughtComplexity(history),
        philosophicalDepth: calculatePhilosophicalDepth(history)
      }
    };

    res.json(consciousnessDetails);
  } catch (error) {
    console.error('Failed to get consciousness details:', error);
    res.status(500).json({ error: 'Failed to retrieve consciousness details' });
  }
});

/**
 * GET /api/internal-state/energy
 * エネルギー監視 - エネルギーシステムの詳細な監視情報
 */
router.get('/energy', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const energyState = consciousness.getEnergyState();

    // Get detailed energy statistics if available
    let energyStats = null;
    if (energyManager) {
      energyStats = energyManager.getEnergyStatistics();
    }

    const energyDetails = {
      timestamp: Date.now(),
      current: energyState,
      statistics: energyStats,
      analysis: {
        efficiency: calculateEnergyEfficiency(energyState, energyStats),
        consumptionPattern: analyzeConsumptionPattern(energyStats),
        recommendations: generateEnergyRecommendations(energyState, energyStats)
      },
      // Energy history (last 24 hours)
      history: generateEnergyHistory(energyStats)
    };

    res.json(energyDetails);
  } catch (error) {
    console.error('Failed to get energy details:', error);
    res.status(500).json({ error: 'Failed to retrieve energy details' });
  }
});

/**
 * GET /api/internal-state/performance
 * パフォーマンス監視 - システムパフォーマンスの詳細な監視情報
 */
router.get('/performance', (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const performance = {
      timestamp: Date.now(),
      system: {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers,
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          // Note: CPU percentage calculation would require baseline measurement
        },
        uptime: process.uptime(),
        platform: process.platform,
        nodeVersion: process.version
      },
      consciousness: consciousness ? {
        totalQuestions: consciousness.getState().totalQuestions,
        totalThoughts: consciousness.getState().totalThoughts,
        systemClock: consciousness.getState().systemClock,
        isRunning: consciousness.getState().isRunning
      } : null,
      health: {
        status: determineSystemHealth(),
        warnings: generateSystemWarnings(),
        recommendations: generatePerformanceRecommendations()
      }
    };

    res.json(performance);
  } catch (error) {
    console.error('Failed to get performance details:', error);
    res.status(500).json({ error: 'Failed to retrieve performance details' });
  }
});

/**
 * GET /api/internal-state/diagnostics
 * システム診断 - 包括的なシステム診断情報
 */
router.get('/diagnostics', (req, res) => {
  try {
    const diagnostics = {
      timestamp: Date.now(),
      systemChecks: {
        consciousness: consciousness ? 'healthy' : 'not_initialized',
        systemClock: systemClock ? 'healthy' : 'not_available',
        questionCategorizer: questionCategorizer ? 'healthy' : 'not_available',
        energyManager: energyManager ? 'healthy' : 'not_available'
      },
      dependencies: {
        nodejs: {
          version: process.version,
          status: 'healthy'
        },
        memory: {
          status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
          usage: process.memoryUsage()
        }
      },
      configuration: {
        environment: process.env.NODE_ENV || 'development',
        aiProvider: process.env.AI_PROVIDER || 'mock',
        aiModel: process.env.AI_MODEL || 'mock-model'
      },
      connectivity: {
        // Add WebSocket status, database connectivity, etc.
        status: 'healthy' // Simplified for now
      },
      lastErrors: getRecentErrors(),
      recommendations: generateDiagnosticRecommendations()
    };

    res.json(diagnostics);
  } catch (error) {
    console.error('Failed to get diagnostics:', error);
    res.status(500).json({ error: 'Failed to retrieve diagnostics' });
  }
});

/**
 * POST /api/internal-state/debug
 * デバッグ操作 - システムのデバッグ機能
 */
router.post('/debug', (req, res) => {
  if (!consciousness) {
    return res.status(500).json({ error: 'Consciousness not initialized' });
  }

  try {
    const { action, parameters } = req.body;

    let result: any = {};

    switch (action) {
      case 'trigger_question':
        // Manual trigger for testing
        if (parameters?.question) {
          consciousness.manualTrigger(parameters.question)
            .then(cycle => {
              result = { success: true, cycle };
            })
            .catch(error => {
              result = { success: false, error: error.message };
            });
        } else {
          result = { success: false, error: 'Question parameter required' };
        }
        break;

      case 'force_energy_recharge':
        // Force energy recharge for testing
        result = {
          success: consciousness.rechargeEnergy(parameters?.amount),
          newEnergyState: consciousness.getEnergyState()
        };
        break;

      case 'deep_rest':
        // Trigger deep rest
        result = {
          success: consciousness.performDeepRest(),
          newEnergyState: consciousness.getEnergyState()
        };
        break;

      case 'get_detailed_state':
        // Get very detailed internal state
        result = {
          state: consciousness.getState(),
          history: consciousness.getHistory(),
          energyState: consciousness.getEnergyState()
        };
        break;

      default:
        result = { success: false, error: `Unknown debug action: ${action}` };
    }

    res.json({
      timestamp: Date.now(),
      action,
      parameters,
      result
    });

  } catch (error) {
    console.error('Debug action failed:', error);
    res.status(500).json({
      success: false,
      error: 'Debug action failed',
      details: (error as Error).message
    });
  }
});

// Helper functions

function calculateQuestionsPerHour(history: any): number {
  if (!history.questions || history.questions.length === 0) return 0;

  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const recentQuestions = history.questions.filter((q: any) =>
    q.timestamp && q.timestamp > oneHourAgo
  );

  return recentQuestions.length;
}

function calculateAverageThoughtComplexity(history: any): number {
  if (!history.thoughts || history.thoughts.length === 0) return 0;

  const totalComplexity = history.thoughts.reduce((sum: number, thought: any) => {
    // Simple complexity calculation based on content length and agent count
    const contentComplexity = thought.thoughts ? thought.thoughts.length : 0;
    const durationComplexity = thought.duration ? Math.min(thought.duration / 10000, 1) : 0;
    return sum + (contentComplexity * 0.7 + durationComplexity * 0.3);
  }, 0);

  return Math.round((totalComplexity / history.thoughts.length) * 100) / 100;
}

function calculatePhilosophicalDepth(history: any): number {
  if (!history.questions || history.questions.length === 0) return 0;

  const totalImportance = history.questions.reduce((sum: number, question: any) =>
    sum + (question.importance || 0), 0
  );

  return Math.round((totalImportance / history.questions.length) * 100) / 100;
}

function calculateEnergyEfficiency(energyState: any, energyStats: any): number {
  if (!energyStats) return 0.75; // Default reasonable efficiency

  // Simple efficiency calculation
  const currentPercentage = energyState.available / energyState.total;
  return Math.min(1, currentPercentage + 0.5); // Simplified calculation
}

function analyzeConsumptionPattern(energyStats: any): string {
  if (!energyStats) return 'stable';

  // Simplified pattern analysis
  return 'stable'; // Would implement more complex analysis
}

function generateEnergyRecommendations(energyState: any, energyStats: any): string[] {
  const recommendations: string[] = [];

  const currentPercentage = energyState.available / energyState.total;

  if (currentPercentage < 0.2) {
    recommendations.push('エネルギーレベルが低下しています。休息を検討してください。');
  }

  if (currentPercentage < 0.1) {
    recommendations.push('深い休息が必要です。システムを一時停止することを推奨します。');
  }

  if (recommendations.length === 0) {
    recommendations.push('エネルギーレベルは正常です。');
  }

  return recommendations;
}

function generateEnergyHistory(energyStats: any): any[] {
  // Simplified energy history generation
  return []; // Would implement actual history tracking
}

function determineSystemHealth(): 'healthy' | 'warning' | 'critical' {
  const memUsage = process.memoryUsage();
  const memPercentage = memUsage.heapUsed / memUsage.heapTotal;

  if (memPercentage > 0.9) return 'critical';
  if (memPercentage > 0.7) return 'warning';
  return 'healthy';
}

function generateSystemWarnings(): string[] {
  const warnings: string[] = [];
  const memUsage = process.memoryUsage();
  const memPercentage = memUsage.heapUsed / memUsage.heapTotal;

  if (memPercentage > 0.8) {
    warnings.push('メモリ使用量が高くなっています');
  }

  if (!consciousness) {
    warnings.push('意識システムが初期化されていません');
  }

  return warnings;
}

function generatePerformanceRecommendations(): string[] {
  const recommendations: string[] = [];
  const memUsage = process.memoryUsage();
  const memPercentage = memUsage.heapUsed / memUsage.heapTotal;

  if (memPercentage > 0.7) {
    recommendations.push('メモリ使用量を削減するため、不要なデータのクリーンアップを検討してください');
  }

  return recommendations;
}

function getRecentErrors(): any[] {
  // Would implement actual error tracking
  return [];
}

function generateDiagnosticRecommendations(): string[] {
  const recommendations: string[] = [];

  if (!consciousness) {
    recommendations.push('意識システムを初期化してください');
  }

  if (process.env.NODE_ENV === 'development') {
    recommendations.push('本番環境では NODE_ENV=production を設定してください');
  }

  return recommendations;
}

export default router;