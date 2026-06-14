/**
 * SleepService tests
 *
 * Focused on the two behavior changes restored from the retired SleepManager
 * (Phase 5c follow-up), both confirmed with the maintainer:
 *   1. processEmotionalTensions persists each parsed resolution as a
 *      'tension_resolution' consciousness insight at 0.7 confidence.
 *   2. performSleepConsolidation runs an age-based failsafe pruning step that
 *      deletes every significant thought older than 48h, regardless of
 *      confidence, as a final safety net.
 */

import { SleepService } from '../../src/server/services/sleep-service';

// Silence logger output (json-parser pulls in the same module).
jest.mock('../../src/platform/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

/** A system agent whose execute() resolves to the given content. */
function createSystemAgent(content: string) {
  return { execute: jest.fn().mockResolvedValue({ success: true, content }) };
}

/** Build a SleepService over a minimal mocked ConsciousnessInternals ctx. */
function createService(ctx: any): { service: SleepService; ctx: any } {
  return { service: new SleepService(ctx as any), ctx };
}

describe('SleepService.processEmotionalTensions (resolution persistence)', () => {
  it('persists each parsed resolution as a tension_resolution insight at 0.7', async () => {
    const saveConsciousnessInsight = jest.fn();
    const resolutions = [
      '矛盾は分裂ではなく、多声的真実の表現である',
      '倫理的緊張は成長の源泉であり、統合を目指すべきである',
      '不協和は調和への対話的プロセスを促す触媒である'
    ];
    const { service, ctx } = createService({
      databaseManager: {
        getHighDissonanceCycles: jest.fn().mockReturnValue([
          { dissonance: 0.8, synthesis_data: 'tension A' }
        ]),
        saveConsciousnessInsight
      },
      agents: new Map([['system', createSystemAgent(JSON.stringify(resolutions))]])
    });

    const result = await (service as any).processEmotionalTensions();

    expect(result).toEqual({ count: 3 });
    expect(saveConsciousnessInsight).toHaveBeenCalledTimes(3);
    for (const synthesis of resolutions) {
      expect(saveConsciousnessInsight).toHaveBeenCalledWith(
        'tension_resolution',
        synthesis,
        0.7,
        []
      );
    }
    // ctx unused beyond construction; referenced to satisfy lint.
    expect(ctx.agents.get('system').execute).toHaveBeenCalled();
  });

  it('persists nothing when there are no high-dissonance tensions', async () => {
    const saveConsciousnessInsight = jest.fn();
    const { service } = createService({
      databaseManager: {
        getHighDissonanceCycles: jest.fn().mockReturnValue([]),
        saveConsciousnessInsight
      },
      agents: new Map()
    });

    const result = await (service as any).processEmotionalTensions();

    expect(result).toEqual({ count: 0 });
    expect(saveConsciousnessInsight).not.toHaveBeenCalled();
  });

  it('persists nothing when the LLM response cannot be parsed as a list', async () => {
    const saveConsciousnessInsight = jest.fn();
    const { service } = createService({
      databaseManager: {
        getHighDissonanceCycles: jest.fn().mockReturnValue([
          { dissonance: 0.9, synthesis_data: 'tension B' }
        ]),
        saveConsciousnessInsight
      },
      agents: new Map([['system', createSystemAgent('これは前置きのエッセイで、リストではありません。')]])
    });

    const result = await (service as any).processEmotionalTensions();

    expect(result).toEqual({ count: 0 });
    expect(saveConsciousnessInsight).not.toHaveBeenCalled();
  });
});

describe('SleepService.pruneOldThoughts (48h failsafe)', () => {
  it('deletes every thought older than 48h regardless of confidence', async () => {
    const getOldSignificantThoughts = jest
      .fn()
      .mockReturnValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const deleteSignificantThoughts = jest.fn();
    const { service } = createService({
      databaseManager: { getOldSignificantThoughts, deleteSignificantThoughts }
    });

    const result = await (service as any).pruneOldThoughts();

    expect(result).toEqual({ deleted: 3 });
    // minConfidence 0.0 -> sweeps everything older than the cutoff.
    expect(getOldSignificantThoughts).toHaveBeenCalledWith(48, 0.0, 1000, 'hours');
    expect(deleteSignificantThoughts).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  it('deletes nothing when no thoughts exceed 48h', async () => {
    const deleteSignificantThoughts = jest.fn();
    const { service } = createService({
      databaseManager: {
        getOldSignificantThoughts: jest.fn().mockReturnValue([]),
        deleteSignificantThoughts
      }
    });

    const result = await (service as any).pruneOldThoughts();

    expect(result).toEqual({ deleted: 0 });
    expect(deleteSignificantThoughts).not.toHaveBeenCalled();
  });
});

describe('SleepService.performSleepConsolidation (failsafe wiring)', () => {
  it('runs the failsafe pruning step and records the count in stats + log', async () => {
    const deleteSignificantThoughts = jest.fn();
    const saveSleepLog = jest.fn();

    // Branch on the age argument: only the 48h failsafe call returns thoughts.
    // The 6h consolidation and 24h synaptic-pruning calls return [] so those
    // phases no-op, isolating the failsafe behavior.
    const getOldSignificantThoughts = jest.fn((ageValue: number) =>
      ageValue === 48 ? [{ id: 'old1' }, { id: 'old2' }] : []
    );

    const { service } = createService({
      emit: jest.fn(),
      systemClock: 1,
      databaseManager: {
        getRecentSignificantThoughts: jest.fn().mockReturnValue([]),
        getOldSignificantThoughts,
        getTopCoreBeliefs: jest.fn().mockReturnValue([]),
        getHighDissonanceCycles: jest.fn().mockReturnValue([]),
        deleteSignificantThoughts,
        saveConsciousnessInsight: jest.fn(),
        saveSleepLog
      },
      memoryConsolidator: {
        mergeSimilarBeliefs: jest.fn().mockResolvedValue({ merged: 0, kept: 0 })
      },
      energyManager: {
        getEnergyState: jest.fn().mockReturnValue({ available: 50 }),
        resetEnergy: jest.fn(),
        getEnergyLevel: jest.fn().mockReturnValue('high')
      },
      agents: new Map()
    });

    await service.performSleepConsolidation('test-trigger');

    expect(getOldSignificantThoughts).toHaveBeenCalledWith(48, 0.0, 1000, 'hours');
    expect(deleteSignificantThoughts).toHaveBeenCalledWith(['old1', 'old2']);

    expect(saveSleepLog).toHaveBeenCalledTimes(1);
    const sleepLogArg = saveSleepLog.mock.calls[0][0];
    // AI pruning pruned 0; the failsafe adds 2 via `+=`.
    expect(sleepLogArg.stats.thoughtsPruned).toBe(2);
    expect(sleepLogArg.phases).toContain('Age-pruned 2 thoughts older than 48h');
  });
});
