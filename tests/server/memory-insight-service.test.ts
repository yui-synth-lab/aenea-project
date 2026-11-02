jest.mock('../../src/platform/logger', () => ({
  log: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

import { MemoryInsightService } from '../../src/server/services/memory-insight-service';

function createService(overrides: Record<string, any> = {}) {
  const db = {
    getSignificantThoughts: jest.fn().mockReturnValue([]),
    getDPDWeightsHistory: jest.fn().mockReturnValue([]),
    getCoreBeliefs: jest.fn().mockReturnValue([]),
    saveMemoryPattern: jest.fn(),
    saveConsciousnessInsight: jest.fn(),
    cleanupUnresolvedIdeas: jest.fn().mockReturnValue({ deleted: 0, kept: 0, strategy: 's' }),
    saveSomniaState: jest.fn(),
    ...overrides.db
  };
  const events: Array<{ name: string; payload: any }> = [];
  const somnia = {
    getState: jest.fn().mockReturnValue({
      somatic: { lambda: 1, phi: 1 }, affective: { theta: 1, xi: 1 }
    }),
    setQualia: jest.fn(),
    ...overrides.somnia
  };
  const ctx: any = {
    systemClock: 10,
    lastConsolidationTime: 0,
    dpdWeights: { empathy: 0.4, coherence: 0.3, dissonance: 0.3 },
    databaseManager: db,
    memoryConsolidator: {
      consolidate: jest.fn().mockResolvedValue({
        beliefs_created: 1, beliefs_updated: 2, thoughts_processed: 3, duration_ms: 4
      })
    },
    somnia,
    agents: new Map(),
    emit: (name: string, payload: any) => { events.push({ name, payload }); return true; },
    ...overrides.ctx
  };
  return { service: new MemoryInsightService(ctx), ctx, db, somnia, events };
}

describe('MemoryInsightService.performPeriodicConsolidation', () => {
  test('does nothing before 5 cycles have elapsed', async () => {
    const { service, ctx, events } = createService({ ctx: { systemClock: 4, lastConsolidationTime: 0 } });
    await service.performPeriodicConsolidation();
    expect(ctx.memoryConsolidator.consolidate).not.toHaveBeenCalled();
    expect(events).toHaveLength(0);
  });

  test('consolidates at exactly 5 cycles, advances the clock marker and emits', async () => {
    const { service, ctx, db, events } = createService({ ctx: { systemClock: 5, lastConsolidationTime: 0 } });
    await service.performPeriodicConsolidation();
    expect(ctx.memoryConsolidator.consolidate).toHaveBeenCalledWith(0.85);
    expect(ctx.lastConsolidationTime).toBe(5);
    expect(db.cleanupUnresolvedIdeas).not.toHaveBeenCalled(); // only at >= 10
    expect(events).toEqual([{
      name: 'memoryConsolidated',
      payload: expect.objectContaining({ beliefsCreated: 1, beliefsUpdated: 2, thoughtsProcessed: 3, duration: 4 })
    }]);
  });

  test('also cleans up unresolved ideas at 10 cycles', async () => {
    const { service, db } = createService({ ctx: { systemClock: 10, lastConsolidationTime: 0 } });
    await service.performPeriodicConsolidation();
    expect(db.cleanupUnresolvedIdeas).toHaveBeenCalledWith(1000);
  });

  test('a consolidation failure is swallowed and leaves the marker untouched', async () => {
    const { service, ctx, events } = createService({ ctx: { systemClock: 5, lastConsolidationTime: 0 } });
    ctx.memoryConsolidator.consolidate.mockRejectedValue(new Error('boom'));
    await expect(service.performPeriodicConsolidation()).resolves.toBeUndefined();
    expect(ctx.lastConsolidationTime).toBe(0);
    expect(events).toHaveLength(0);
  });
});

describe('MemoryInsightService.generateMemoryPatterns', () => {
  test('saves nothing for an empty history', () => {
    const { service, db } = createService();
    service.generateMemoryPatterns();
    expect(db.saveMemoryPattern).not.toHaveBeenCalled();
  });

  test('records dominant agent and category with their share as significance', () => {
    const { service, db } = createService({
      db: {
        getSignificantThoughts: jest.fn().mockReturnValue([
          { agent_id: 'theoria', category: 'ethical' },
          { agent_id: 'theoria', category: 'ethical' },
          { agent_id: 'pathia', category: 'logical' },
          { agent_id: 'theoria', category: null }
        ])
      }
    });
    service.generateMemoryPatterns();
    expect(db.saveMemoryPattern).toHaveBeenCalledWith(
      'agent_affinity', { agent: 'theoria', count: 3, percentage: 0.75 }, 0.75);
    expect(db.saveMemoryPattern).toHaveBeenCalledWith(
      'category_focus', { category: 'ethical', count: 2, percentage: 0.5 }, 0.5);
  });

  test('DPD evolution needs at least 2 history rows and uses the largest absolute change', () => {
    const one = createService({ db: { getDPDWeightsHistory: jest.fn().mockReturnValue([{ empathy: 1, coherence: 1, dissonance: 1 }]) } });
    one.service.generateMemoryPatterns();
    expect(one.db.saveMemoryPattern).not.toHaveBeenCalled();

    const two = createService({
      db: {
        getDPDWeightsHistory: jest.fn().mockReturnValue([
          { empathy: 0.5, coherence: 0.3, dissonance: 0.2 },  // latest
          { empathy: 0.3, coherence: 0.4, dissonance: 0.3 }   // oldest
        ])
      }
    });
    two.service.generateMemoryPatterns();
    const call = two.db.saveMemoryPattern.mock.calls.find((c: any[]) => c[0] === 'dpd_evolution')!;
    expect(call[1].cycles).toBe(2);
    expect(call[1].trend.empathy).toBeCloseTo(0.2);
    expect(call[2]).toBeCloseTo(0.2);
  });

  test('database errors are swallowed', () => {
    const { service } = createService({ db: { getSignificantThoughts: jest.fn(() => { throw new Error('db'); }) } });
    expect(() => service.generateMemoryPatterns()).not.toThrow();
  });
});

describe('MemoryInsightService.generateConsciousnessInsights', () => {
  test('with no beliefs only the (zero) alignment insight is stored', () => {
    const { service, db } = createService();
    service.generateConsciousnessInsights();
    expect(db.saveConsciousnessInsight).toHaveBeenCalledTimes(1);
    expect(db.saveConsciousnessInsight).toHaveBeenCalledWith('dpd_belief_alignment', expect.stringContaining('0.0%'), 0);
  });

  test('stores dominant belief, distribution and alignment', () => {
    const beliefs = [
      { id: 'b1', belief_content: '問い', strength: 0.9, reinforcement_count: 3, confidence: 0.8, category: 'ethical' },
      { id: 'b2', belief_content: '論', strength: 0.5, reinforcement_count: 1, confidence: 0.6, category: 'epistemological' }
    ];
    const { service, db } = createService({ db: { getCoreBeliefs: jest.fn().mockReturnValue(beliefs) } });
    service.generateConsciousnessInsights();
    const types = db.saveConsciousnessInsight.mock.calls.map((c: any[]) => c[0]);
    expect(types).toEqual(['dominant_belief', 'belief_distribution', 'dpd_belief_alignment']);
    expect(db.saveConsciousnessInsight.mock.calls[0][3]).toEqual(['b1']);
    // (1*0.4 + 1*0.3) / 2 = 0.35
    expect(db.saveConsciousnessInsight.mock.calls[2][2]).toBeCloseTo(0.35);
  });
});

describe('MemoryInsightService.generateSOMNIAQualia', () => {
  test('is a no-op without a somnia agent', async () => {
    const { service, somnia } = createService();
    await service.generateSOMNIAQualia();
    expect(somnia.setQualia).not.toHaveBeenCalled();
  });

  test('strips wrapping quotes, sets qualia and force-persists state', async () => {
    const { service, ctx, somnia, db } = createService();
    ctx.agents.set('somnia', { execute: jest.fn().mockResolvedValue({ success: true, content: ' "静かな波" ' }) });
    await service.generateSOMNIAQualia();
    expect(somnia.setQualia).toHaveBeenCalledWith('静かな波');
    expect(db.saveSomniaState).toHaveBeenCalledTimes(1);
  });

  test.each([
    [{ success: false, error: 'x' }],
    [{ success: true, content: '' }],
  ])('a failed or empty response leaves qualia untouched (%j)', async (result) => {
    const { service, ctx, somnia, db } = createService();
    ctx.agents.set('somnia', { execute: jest.fn().mockResolvedValue(result) });
    await service.generateSOMNIAQualia();
    expect(somnia.setQualia).not.toHaveBeenCalled();
    expect(db.saveSomniaState).not.toHaveBeenCalled();
  });
});
