/**
 * Mortality Simulation Integration Tests
 */

import { DatabaseManager } from '../../src/server/database-manager';
// @ts-ignore
import { default as ConsciousnessBackend } from '../../src/server/consciousness-backend';
import { LifespanManager } from '../../src/aenea/mortality/lifespan-manager';
import { AgingEngine } from '../../src/aenea/mortality/aging-engine';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../src/server/ai-executor', () => {
  return {
    createAIExecutor: jest.fn().mockImplementation((id, config) => ({
      execute: jest.fn().mockImplementation(async (prompt: string, systemPrompt?: string) => {
        if (prompt.includes('activity停止') || prompt.includes('死を迎えます')) {
          return {
            success: true,
            content: '問いは、まだ閉じていない。これが私の最後の言葉です。',
            duration: 50
          };
        }
        return {
          success: true,
          content: 'この世界の本質についての思考。',
          duration: 50
        };
      })
    })),
    AIExecutor: class {}
  };
});

describe('Mortality & Death Integration', () => {
  let databaseManager: DatabaseManager;
  let testDbPath: string;
  let backend: any;

  beforeEach(async () => {
    testDbPath = path.join(process.cwd(), 'test-data', `test_mortality_${Date.now()}.db`);

    const testDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Set environment variable to force B mode by default
    process.env.AENEA_MORTALITY_MODE = 'B';

    // Instantiate DatabaseManager and wait for initialization
    databaseManager = new DatabaseManager(testDbPath);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Construct ConsciousnessBackend
    // We instantiate it, but intercept database creation
    backend = new ConsciousnessBackend();
    // Inject the test database manager
    (backend as any).databaseManager = databaseManager;
    
    // Override agents with mocked AI executors
    const mockExecutor = {
      execute: jest.fn().mockImplementation(async (prompt: string, systemPrompt?: string) => {
        if (prompt.includes('activity停止') || prompt.includes('死を迎えます')) {
          return {
            success: true,
            content: '問いは、まだ閉じていない。これが私の最後の言葉です。',
            duration: 50
          };
        }
        return {
          success: true,
          content: 'この世界の本質についての思考。',
          duration: 50
        };
      })
    };

    // Override the agent map
    const agents = (backend as any).agents;
    agents.set('theoria', mockExecutor);
    agents.set('pathia', mockExecutor);
    agents.set('kinesis', mockExecutor);
    agents.set('system', mockExecutor);
    agents.set('aenea', mockExecutor);
    agents.set('somnia', mockExecutor);

    // Override stages to use test database
    (backend as any).individualThoughtStage.databaseManager = databaseManager;
    (backend as any).individualThoughtStage.coreBeliefs.databaseManager = databaseManager;

    // Reset components to bind to test DB and Mocked agents
    (backend as any).restoreFromDatabase();
  });

  afterEach(() => {
    if (backend && (backend as any).isRunning) {
      (backend as any).isRunning = false;
    }
    if (databaseManager) {
      databaseManager.cleanup();
    }
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (e) {}
    }
  });

  describe('Database Operations', () => {
    test('should save, update and read mortality state in DB', () => {
      const state = {
        instanceId: 'test_db_instance',
        lifespanMax: 5000,
        currentCycle: 10,
        vitality: 0.95,
        phase: 'youth' as any,
        mode: 'B' as any,
        createdAt: Date.now(),
        diedAt: null
      };

      databaseManager.saveMortalityState(state);
      const record = databaseManager.getLatestMortalityState();
      
      expect(record).toBeTruthy();
      expect(record.instance_id).toBe('test_db_instance');
      expect(record.lifespan_max).toBe(5000);
      expect(record.current_cycle).toBe(10);
      expect(record.vitality).toBeCloseTo(0.95, 3);
      expect(record.phase).toBe('youth');
      expect(record.died_at).toBeNull();

      // Update state
      databaseManager.updateMortalityState('test_db_instance', {
        currentCycle: 12,
        vitality: 0.92,
        phase: 'youth'
      });

      const updated = databaseManager.getLatestMortalityState();
      expect(updated.current_cycle).toBe(12);
      expect(updated.vitality).toBeCloseTo(0.92, 3);
    });

    test('should save and load last words', () => {
      const lastWords = {
        instanceId: 'test_db_instance',
        cycle: 5000,
        content: '最後の言葉。',
        agent: 'aenea',
        createdAt: Date.now()
      };

      databaseManager.saveLastWords(lastWords);
      const list = databaseManager.getLastWords('test_db_instance');
      expect(list.length).toBe(1);
      expect(list[0].content).toBe('最後の言葉。');
      expect(list[0].agent).toBe('aenea');

      const allList = databaseManager.getLastWords();
      expect(allList.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cycle Progression and Death Simulation', () => {
    test('should progress aging stages, apply DPD biases, and execute death sequence', async () => {
      // 1. Manually initialize a short lifespan manager
      const lifespan = new LifespanManager({
        instanceId: 'short_life_instance',
        lifespanMax: 3,
        currentCycle: 0,
        mode: 'A', // Force Mode A
        createdAt: Date.now()
      });

      (backend as any).lifespanManager = lifespan;
      // Recreate injector and handler with mocked agents
      (backend as any).mortalityInjector = new (backend as any).mortalityInjector.constructor(lifespan);
      (backend as any).deathHandler = new (backend as any).deathHandler.constructor(lifespan, databaseManager, (backend as any).agents);

      // Save initial state to test DB
      databaseManager.saveMortalityState(lifespan.getState());

      // Mock start so the loop doesn't run asynchronously
      (backend as any).isRunning = true;

      // Cycle 1: Tick to 1
      await (backend as any).processThoughtCycle();
      expect(lifespan.getCurrentCycle()).toBe(1);
      expect(lifespan.getCurrentPhase()).toBe('youth'); // 1/3 = 33%
      expect(lifespan.isAlive()).toBe(true);

      // Cycle 2: Tick to 2
      await (backend as any).processThoughtCycle();
      expect(lifespan.getCurrentCycle()).toBe(2);
      expect(lifespan.getCurrentPhase()).toBe('maturity'); // 2/3 = 66%
      expect(lifespan.isAlive()).toBe(true);

      // Verify that after ticking, the DB has current cycle = 2
      let dbRecord = databaseManager.getLatestMortalityState();
      expect(dbRecord.current_cycle).toBe(2);
      expect(dbRecord.died_at).toBeNull();

      // Cycle 3: Tick to 3 -> Mortality phase & Death sequence execution
      await (backend as any).processThoughtCycle();

      // The loop should now have run the death handler and stopped!
      expect((backend as any).isRunning).toBe(false);
      expect(lifespan.getCurrentCycle()).toBe(3);
      expect(lifespan.getVitality()).toBe(0);
      expect(lifespan.isAlive()).toBe(false);

      // Verify DB records
      dbRecord = databaseManager.getLatestMortalityState();
      expect(dbRecord.current_cycle).toBe(3);
      expect(dbRecord.died_at).toBeGreaterThan(0); // timestamp of death

      const lastWordsList = databaseManager.getLastWords('short_life_instance');
      expect(lastWordsList.length).toBe(1);
      expect(lastWordsList[0].content).toContain('これが私の最後の言葉です');

      // Verify that starting the backend again initializes a fresh instance
      await (backend as any).start();
      expect((backend as any).isRunning).toBe(true);
      
      const newLifespan = (backend as any).lifespanManager;
      expect(newLifespan.getInstanceId()).not.toBe('short_life_instance');
      expect(newLifespan.getLifespanMax()).toBeGreaterThanOrEqual(10000);
      expect(newLifespan.getCurrentCycle()).toBe(0);
      expect(newLifespan.isAlive()).toBe(true);
    });
  });
});
