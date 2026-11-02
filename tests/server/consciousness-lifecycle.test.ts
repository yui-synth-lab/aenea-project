/**
 * ConsciousnessLifecycle tests
 *
 * Invariants:
 *   - Run-state transitions are guarded (no double start, no pause/resume/stop
 *     from the wrong state) and each emits its event.
 *   - A thought cycle never starts below the energy floor (3.3 + 5.0 reserve):
 *     it enters dormancy once, and leaves it exactly when energy is restored.
 *   - isProcessingCycle is always released, whatever path the cycle takes.
 *   - A dead instance never thinks; it hands over to the death handler.
 *   - Manual sleep never auto-restarts; automatic sleep is refused while
 *     running unless energy or φ is critical.
 */

import { ConsciousnessLifecycle } from '../../src/server/services/consciousness-lifecycle';

function createCtx(overrides: Record<string, any> = {}) {
  const events: Array<{ name: string; payload: any }> = [];
  const ctx: any = {
    isRunning: false,
    isPaused: false,
    isProcessingCycle: false,
    systemClock: 1,
    previousDpdScores: null,
    emit: jest.fn((name: string, payload?: any) => {
      events.push({ name, payload });
      return true;
    }),
    saveConsciousnessState: jest.fn(),
    spawnFreshMortality: jest.fn(),
    databaseManager: {
      ensureConnection: jest.fn(),
      cleanup: jest.fn(),
      updateMortalityState: jest.fn(),
      saveSomniaSaipEvent: jest.fn()
    },
    energyManager: {
      getEnergyState: jest.fn().mockReturnValue({ available: 80, capacity: 100 }),
      consumeEnergy: jest.fn().mockResolvedValue(undefined),
      deepRest: jest.fn()
    },
    somnia: {
      getState: jest.fn().mockReturnValue({ somatic: { phi: 80 } }),
      forceDream: jest.fn(),
      wakeUp: jest.fn(),
      tick: jest.fn(),
      setState: jest.fn(),
      applyAffectiveBias: jest.fn()
    },
    lifespanManager: {
      isAlive: jest.fn().mockReturnValue(true),
      getInstanceId: jest.fn().mockReturnValue('inst'),
      tick: jest.fn(),
      getCurrentPhase: jest.fn().mockReturnValue('youth'),
      getVitality: jest.fn().mockReturnValue(1),
      getCurrentCycle: jest.fn().mockReturnValue(1),
      getLifespanMax: jest.fn().mockReturnValue(100)
    },
    deathHandler: { handleDeath: jest.fn().mockResolvedValue(undefined) },
    ...overrides
  };
  return { ctx, events, names: () => events.map(e => e.name) };
}

function createLifecycle(ctxOverrides: Record<string, any> = {}) {
  const harness = createCtx(ctxOverrides);
  const deps = {
    getState: jest.fn().mockReturnValue({ systemClock: 1 }),
    thoughtPipeline: {
      generateInternalTrigger: jest.fn().mockResolvedValue(null),
      generateSOMNIAQualia: jest.fn().mockResolvedValue(undefined),
      executeAdaptiveThoughtCycle: jest.fn().mockResolvedValue(undefined)
    },
    sleepService: { performSleepConsolidation: jest.fn().mockResolvedValue(undefined) }
  };
  const lifecycle = new ConsciousnessLifecycle(harness.ctx, deps as any);
  return { lifecycle, deps, ...harness };
}

describe('ConsciousnessLifecycle run state', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  describe('start', () => {
    it('rejects a second start', async () => {
      const { lifecycle, ctx } = createLifecycle({ isRunning: true });
      await expect(lifecycle.start()).rejects.toThrow('already running');
      expect(ctx.databaseManager.ensureConnection).not.toHaveBeenCalled();
    });

    it('opens the connection, marks running and unpaused, and announces it', async () => {
      const { lifecycle, ctx, names } = createLifecycle({ isPaused: true });
      await lifecycle.start();
      ctx.isRunning = false; // let the background loop wind down

      expect(ctx.databaseManager.ensureConnection).toHaveBeenCalled();
      expect(ctx.isPaused).toBe(false);
      expect(names()).toContain('consciousnessStarted');
    });

    it('spawns a fresh lifespan when the previous instance died', async () => {
      const { lifecycle, ctx } = createLifecycle();
      ctx.lifespanManager.isAlive.mockReturnValue(false);
      await lifecycle.start();
      ctx.isRunning = false;

      expect(ctx.spawnFreshMortality).toHaveBeenCalledTimes(1);
    });

    it('keeps a living lifespan', async () => {
      const { lifecycle, ctx } = createLifecycle();
      await lifecycle.start();
      ctx.isRunning = false;

      expect(ctx.spawnFreshMortality).not.toHaveBeenCalled();
    });
  });

  describe('pause / resume', () => {
    it('refuses to pause when not running', async () => {
      const { lifecycle } = createLifecycle();
      await expect(lifecycle.pause()).rejects.toThrow('not running');
    });

    it('pauses, saves state and announces it', async () => {
      const { lifecycle, ctx, names } = createLifecycle({ isRunning: true });
      await lifecycle.pause();

      expect(ctx.isPaused).toBe(true);
      expect(ctx.saveConsciousnessState).toHaveBeenCalledTimes(1);
      expect(names()).toContain('consciousnessPaused');
    });

    it.each([
      ['not running', { isRunning: false, isPaused: true }],
      ['running but not paused', { isRunning: true, isPaused: false }]
    ])('refuses to resume when %s', async (_name, state) => {
      const { lifecycle } = createLifecycle(state);
      await expect(lifecycle.resume()).rejects.toThrow('not paused');
    });

    it('resumes a paused run', async () => {
      const { lifecycle, ctx, names } = createLifecycle({ isRunning: true, isPaused: true });
      await lifecycle.resume();

      expect(ctx.isPaused).toBe(false);
      expect(names()).toContain('consciousnessResumed');
    });
  });

  describe('stop', () => {
    it('refuses to stop when not running', async () => {
      const { lifecycle } = createLifecycle();
      await expect(lifecycle.stop()).rejects.toThrow('not running');
    });

    it('clears run flags, saves, closes the database, and announces it', async () => {
      const { lifecycle, ctx, names } = createLifecycle({ isRunning: true, isPaused: true });
      await lifecycle.stop();

      expect(ctx.isRunning).toBe(false);
      expect(ctx.isPaused).toBe(false);
      expect(ctx.saveConsciousnessState).toHaveBeenCalledTimes(1);
      expect(ctx.databaseManager.cleanup).toHaveBeenCalledTimes(1);
      expect(names()).toContain('consciousnessStopped');
    });

    it('still announces the stop when closing the database fails', async () => {
      const { lifecycle, ctx, names } = createLifecycle({ isRunning: true });
      ctx.databaseManager.cleanup.mockImplementation(() => {
        throw new Error('locked');
      });

      await expect(lifecycle.stop()).resolves.toBeUndefined();
      expect(names()).toContain('consciousnessStopped');
    });
  });
});

describe('ConsciousnessLifecycle.processThoughtCycle', () => {
  function setEnergy(ctx: any, available: number) {
    ctx.energyManager.getEnergyState.mockReturnValue({ available, capacity: 100 });
  }

  it('hands a dead instance to the death handler without thinking or marking a cycle', async () => {
    const { lifecycle, deps, ctx, names } = createLifecycle();
    ctx.lifespanManager.isAlive.mockReturnValue(false);

    await lifecycle.processThoughtCycle();

    expect(ctx.deathHandler.handleDeath).toHaveBeenCalledTimes(1);
    expect(deps.thoughtPipeline.generateInternalTrigger).not.toHaveBeenCalled();
    expect(names()).not.toContain('cycleProcessingChanged');
  });

  describe('energy floor (3.3 cycle cost + 5.0 reserve = 8.3)', () => {
    it('enters dormancy below the floor and does not start a cycle', async () => {
      const { lifecycle, deps, ctx, events } = createLifecycle();
      setEnergy(ctx, 8.2);

      await lifecycle.processThoughtCycle();

      expect(deps.thoughtPipeline.generateInternalTrigger).not.toHaveBeenCalled();
      const dormant = events.find(e => e.name === 'consciousnessDormant');
      expect(dormant?.payload).toMatchObject({ reason: 'insufficient_energy', currentEnergy: 8.2 });
      expect(dormant?.payload.requiredEnergy).toBeCloseTo(8.3);
    });

    it('proceeds at exactly the floor', async () => {
      const { lifecycle, deps, ctx, names } = createLifecycle();
      setEnergy(ctx, 8.3);

      await lifecycle.processThoughtCycle();

      expect(deps.thoughtPipeline.generateInternalTrigger).toHaveBeenCalledTimes(1);
      expect(names()).not.toContain('consciousnessDormant');
    });

    it('announces dormancy once while energy stays low', async () => {
      const { lifecycle, ctx, names } = createLifecycle();
      setEnergy(ctx, 1);

      await lifecycle.processThoughtCycle();
      await lifecycle.processThoughtCycle();

      expect(names().filter(n => n === 'consciousnessDormant')).toHaveLength(1);
    });

    it('wakes exactly once when energy is restored', async () => {
      const { lifecycle, ctx, names } = createLifecycle();
      setEnergy(ctx, 1);
      await lifecycle.processThoughtCycle();

      setEnergy(ctx, 50);
      await lifecycle.processThoughtCycle();
      await lifecycle.processThoughtCycle();

      expect(names().filter(n => n === 'consciousnessAwakened')).toHaveLength(1);
    });

    it('does not announce an awakening it never went to sleep for', async () => {
      const { lifecycle, names } = createLifecycle();
      await lifecycle.processThoughtCycle();
      expect(names()).not.toContain('consciousnessAwakened');
    });
  });

  describe('processing flag', () => {
    it('is raised for the cycle and released afterwards, with matching events', async () => {
      const { lifecycle, ctx, events } = createLifecycle();
      await lifecycle.processThoughtCycle();

      expect(ctx.isProcessingCycle).toBe(false);
      const changes = events.filter(e => e.name === 'cycleProcessingChanged').map(e => e.payload);
      expect(changes).toEqual([{ isProcessingCycle: true }, { isProcessingCycle: false }]);
    });

    it('is released even when the pipeline throws', async () => {
      const { lifecycle, deps, ctx } = createLifecycle();
      deps.thoughtPipeline.generateInternalTrigger.mockRejectedValue(new Error('ai down'));

      await expect(lifecycle.processThoughtCycle()).rejects.toThrow('ai down');
      expect(ctx.isProcessingCycle).toBe(false);
    });

    it('does not tick the lifespan when no trigger was produced', async () => {
      const { lifecycle, ctx } = createLifecycle();
      await lifecycle.processThoughtCycle();
      expect(ctx.lifespanManager.tick).not.toHaveBeenCalled();
    });
  });
});

describe('ConsciousnessLifecycle sleep', () => {
  it('runs a manual sleep end to end and does not auto-restart', async () => {
    const { lifecycle, deps, ctx, names } = createLifecycle();
    await lifecycle.enterSleepMode(true);

    expect(deps.sleepService.performSleepConsolidation).toHaveBeenCalledWith('manual');
    expect(ctx.energyManager.deepRest).toHaveBeenCalled();
    expect(ctx.somnia.forceDream).toHaveBeenCalled();
    expect(ctx.somnia.wakeUp).toHaveBeenCalled();
    expect(ctx.saveConsciousnessState).toHaveBeenCalled();
    expect(names()).toEqual(expect.arrayContaining(['sleepStarted', 'sleepCompleted']));
    expect(ctx.isRunning).toBe(false);
  });

  it('records the sleep time and releases the sleeping flag', async () => {
    const { lifecycle } = createLifecycle();
    expect(lifecycle.getSleepStatus()).toMatchObject({ isSleeping: false, lastSleepTime: 0, hoursSinceLastSleep: 0 });

    await lifecycle.enterSleepMode(true);

    const status = lifecycle.getSleepStatus();
    expect(status.isSleeping).toBe(false);
    expect(status.lastSleepTime).toBeGreaterThan(0);
  });

  it('refuses a second sleep while one is in progress', async () => {
    const { lifecycle, deps } = createLifecycle();
    let release!: () => void;
    deps.sleepService.performSleepConsolidation.mockReturnValue(new Promise<void>(r => { release = r; }));

    const first = lifecycle.enterSleepMode(true);
    await lifecycle.enterSleepMode(true);
    expect(deps.sleepService.performSleepConsolidation).toHaveBeenCalledTimes(1);
    expect(lifecycle.getSleepStatus().isSleeping).toBe(true);

    release();
    await first;
  });

  it('reports the sleep reason from the energy/φ state', async () => {
    const energyCritical = createLifecycle();
    energyCritical.ctx.energyManager.getEnergyState.mockReturnValue({ available: 10, capacity: 100 });
    await energyCritical.lifecycle.enterSleepMode(false);
    expect(energyCritical.deps.sleepService.performSleepConsolidation).toHaveBeenCalledWith('energy_critical');

    const phiCritical = createLifecycle();
    phiCritical.ctx.somnia.getState.mockReturnValue({ somatic: { phi: 5 } });
    await phiCritical.lifecycle.enterSleepMode(false);
    expect(phiCritical.deps.sleepService.performSleepConsolidation).toHaveBeenCalledWith('phi_critical');

    const scheduled = createLifecycle();
    await scheduled.lifecycle.enterSleepMode(false);
    expect(scheduled.deps.sleepService.performSleepConsolidation).toHaveBeenCalledWith('scheduled');
  });

  it('refuses automatic sleep while running unless energy or φ is critical', async () => {
    const { lifecycle, deps, names } = createLifecycle({ isRunning: true });
    await lifecycle.enterSleepMode(false);

    expect(deps.sleepService.performSleepConsolidation).not.toHaveBeenCalled();
    expect(names()).not.toContain('sleepStarted');
  });

  it('stops a running instance for a critical automatic sleep, then restarts it', async () => {
    const { lifecycle, deps, ctx } = createLifecycle({ isRunning: true });
    ctx.energyManager.getEnergyState.mockReturnValue({ available: 10, capacity: 100 });

    await lifecycle.enterSleepMode(false);

    expect(ctx.databaseManager.cleanup).toHaveBeenCalled(); // stop() ran
    expect(deps.sleepService.performSleepConsolidation).toHaveBeenCalledWith('energy_critical');
    expect(ctx.isRunning).toBe(true);
    expect(ctx.isPaused).toBe(false);
  });

  it('does not run a manual sleep through the auto-stop path', async () => {
    const { lifecycle, ctx } = createLifecycle({ isRunning: true });
    ctx.energyManager.getEnergyState.mockReturnValue({ available: 10, capacity: 100 });

    await lifecycle.enterSleepMode(true);

    expect(ctx.databaseManager.cleanup).not.toHaveBeenCalled();
    expect(ctx.isRunning).toBe(true);
  });

  it('reports a failure, releases the sleeping flag, and does not restart', async () => {
    const { lifecycle, deps, ctx, events } = createLifecycle();
    deps.sleepService.performSleepConsolidation.mockRejectedValue(new Error('db locked'));

    await expect(lifecycle.enterSleepMode(false)).resolves.toBeUndefined();

    expect(events.find(e => e.name === 'sleepError')?.payload).toEqual({ error: 'db locked' });
    expect(events.map(e => e.name)).not.toContain('sleepCompleted');
    expect(lifecycle.getSleepStatus().isSleeping).toBe(false);
    expect(ctx.isRunning).toBe(false);
  });

  it('opens the database connection before consolidating', async () => {
    const { lifecycle, ctx } = createLifecycle();
    await lifecycle.enterSleepMode(true);
    expect(ctx.databaseManager.ensureConnection).toHaveBeenCalled();
  });
});
