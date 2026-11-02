jest.mock('../../src/platform/logger', () => ({
  log: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

import { calculateFallbackDPDScores } from '../../src/server/services/fallback-dpd';

const weights = { empathy: 0.4, coherence: 0.3, dissonance: 0.3 } as any;

function cycleWith(...contents: string[]): any {
  return {
    trigger: { question: 'q' },
    thoughts: contents.map(content => ({ content }))
  };
}

describe('calculateFallbackDPDScores', () => {
  test('no content yields neutral 0.5 scores in critical mode', () => {
    const scores = calculateFallbackDPDScores(cycleWith(), weights);
    expect(scores).toMatchObject({ empathy: 0.5, coherence: 0.5, dissonance: 0.5, weightedTotal: 0.5 });
    expect(scores.context.energyMode).toBe('critical');
    expect(scores.context.thoughtCount).toBe(0);
  });

  test('a single empty thought is treated as no content', () => {
    expect(calculateFallbackDPDScores(cycleWith(''), weights).empathy).toBe(0.5);
  });

  test('characterization: several empty thoughts join to whitespace and are scored, not defaulted', () => {
    expect(calculateFallbackDPDScores(cycleWith('', ''), weights).empathy).not.toBe(0.5);
  });

  test('every score stays within the clamp 0.1–0.9', () => {
    const extreme = '共感'.repeat(500) + '論理'.repeat(500) + '矛盾'.repeat(500);
    const neutral = 'x'.repeat(5000);
    for (const s of [calculateFallbackDPDScores(cycleWith(extreme), weights),
                     calculateFallbackDPDScores(cycleWith(neutral), weights)]) {
      for (const v of [s.empathy, s.coherence, s.dissonance, s.weightedTotal]) {
        expect(v).toBeGreaterThanOrEqual(0.1);
        expect(v).toBeLessThanOrEqual(0.9);
      }
    }
  });

  test('keyword-rich text scores its own dimension above the others', () => {
    const empathic = calculateFallbackDPDScores(cycleWith('共感と思いやりと優しさで他者の感情を理解する'), weights);
    expect(empathic.empathy).toBeGreaterThan(empathic.coherence);
    expect(empathic.empathy).toBeGreaterThan(empathic.dissonance);

    const logical = calculateFallbackDPDScores(cycleWith('論理的な体系と一貫した構造で因果を整理する'), weights);
    expect(logical.coherence).toBeGreaterThan(logical.empathy);

    const conflicted = calculateFallbackDPDScores(cycleWith('矛盾と葛藤、なぜという疑問と不安'), weights);
    expect(conflicted.dissonance).toBeGreaterThan(conflicted.empathy);
  });

  test('weightedTotal reflects the supplied weights', () => {
    const cycle = cycleWith('共感と思いやりと優しさ');
    const heavyEmpathy = calculateFallbackDPDScores(cycle, { empathy: 1, coherence: 0, dissonance: 0 } as any);
    const zero = calculateFallbackDPDScores(cycle, { empathy: 0, coherence: 0, dissonance: 0 } as any);
    expect(heavyEmpathy.weightedTotal).toBeGreaterThan(zero.weightedTotal);
    expect(zero.weightedTotal).toBe(0.1); // clamped floor
  });

  test('records trigger and thought count in context', () => {
    const s = calculateFallbackDPDScores(cycleWith('心', '愛'), weights);
    expect(s.context).toMatchObject({ trigger: 'q', thoughtCount: 2, energyMode: 'critical' });
  });
});
