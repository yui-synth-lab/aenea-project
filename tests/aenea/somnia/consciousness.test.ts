import { SomniaConsciousness } from '../../../src/aenea/somnia/consciousness.js';
import { estimateValenceFromQualia } from '../../../src/aenea/somnia/core/qualia-mapper.js';

const defaultMu = { serotonin: 0.5, dopamine: 0.5, cortisol: 0.3, oxytocin: 0.4 };

describe('xi accumulation', () => {
  it('should accumulate xi when lambda drops below 0.1', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({ somatic: { lambda: -0.2, phi: 80, mu: defaultMu } });

    for (let i = 0; i < 10; i++) await somnia.tick();

    expect(somnia.getState().affective.xi).toBeGreaterThan(0);
  });

  it('should accumulate xi when cortisol exceeds serotonin', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({
      somatic: {
        lambda: 0.2,
        phi: 80,
        mu: { serotonin: 0.2, dopamine: 0.5, cortisol: 0.6, oxytocin: 0.4 }
      }
    });

    for (let i = 0; i < 10; i++) await somnia.tick();

    expect(somnia.getState().affective.xi).toBeGreaterThan(0);
  });

  it('should accumulate xi when energy phi is below 30', async () => {
    const somnia = new SomniaConsciousness();
    // phi: 25 — below the xi trigger threshold (30) but above the dream transition
    // threshold (20), so we stay in awake mode and can observe xi accumulation.
    somnia.setState({ somatic: { lambda: 0.15, phi: 25, mu: defaultMu } });

    for (let i = 0; i < 10; i++) await somnia.tick();

    expect(somnia.getState().affective.xi).toBeGreaterThan(0);
  });

  it('should not exceed XI_MAX = 2.0', async () => {
    const somnia = new SomniaConsciousness();
    // Worst-case somatic: max stress on all triggers
    somnia.setState({
      somatic: {
        lambda: -1.0,
        phi: 0,
        mu: { serotonin: 0.0, dopamine: 0.5, cortisol: 1.0, oxytocin: 0.4 }
      }
    });

    for (let i = 0; i < 200; i++) await somnia.tick();

    expect(somnia.getState().affective.xi).toBeLessThanOrEqual(2.0);
  });

  it('should accumulate xi very slowly under healthy conditions', async () => {
    const somnia = new SomniaConsciousness();
    // Healthy initial state: all three triggers inactive.
    // Natural lambda decay (10%/tick) will eventually cross the 0.1 threshold
    // (~tick 16 for lambda=0.5), so a tiny accumulation is expected. But it must
    // be far smaller than the accumulation seen under stress (which reaches > 0.1
    // in the same number of ticks).
    somnia.setState({ somatic: { lambda: 0.5, phi: 90, mu: defaultMu } });

    for (let i = 0; i < 20; i++) await somnia.tick();

    expect(somnia.getState().affective.xi).toBeLessThan(0.02);
  });

  it('should transition awake→dream when xi exceeds threshold', async () => {
    const somnia = new SomniaConsciousness();
    // Force xi close to threshold then push it over
    somnia.setState({
      somatic: { lambda: -1.0, phi: 80, mu: defaultMu },
      affective: { theta: 0.5, psi: 0.7, xi: 0.95 }
    });

    let transitioned = false;
    for (let i = 0; i < 30; i++) {
      await somnia.tick();
      if (somnia.getState().mode === 'dream') {
        transitioned = true;
        break;
      }
    }

    expect(transitioned).toBe(true);
  });

  it('forceDream should reset xi to 0', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({ affective: { theta: 0.5, psi: 0.7, xi: 1.5 } });
    somnia.forceDream();

    expect(somnia.getState().affective.xi).toBe(0);
  });
});

describe('qualia feedback → lambda coupling', () => {
  it('negative qualia should pull lambda downward over time', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({ somatic: { lambda: 0.15, phi: 80, mu: defaultMu } });
    somnia.setQualia('疲労、焦燥、息苦しさ、停滞');
    const initialLambda = somnia.getState().somatic.lambda;

    for (let i = 0; i < 20; i++) await somnia.tick();

    expect(somnia.getState().somatic.lambda).toBeLessThan(initialLambda);
  });

  it('positive qualia should pull lambda upward over time', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({ somatic: { lambda: -0.1, phi: 80, mu: defaultMu } });
    somnia.setQualia('軽やか、充実、明晰、爽快');
    const initialLambda = somnia.getState().somatic.lambda;

    for (let i = 0; i < 20; i++) await somnia.tick();

    expect(somnia.getState().somatic.lambda).toBeGreaterThan(initialLambda);
  });

  it('neutral qualia should not change lambda', async () => {
    const somnia = new SomniaConsciousness();
    somnia.setState({ somatic: { lambda: 0.0, phi: 80, mu: defaultMu } });
    somnia.setQualia('思考中');
    const initialLambda = somnia.getState().somatic.lambda;

    for (let i = 0; i < 5; i++) await somnia.tick();

    // No keywords → no pull. Only natural decay applies.
    expect(somnia.getState().somatic.lambda).toBeCloseTo(initialLambda, 3);
  });
});

describe('estimateValenceFromQualia', () => {
  it('returns negative for all-negative keywords', () => {
    expect(estimateValenceFromQualia('疲労、焦燥、息苦しさ')).toBeLessThan(0);
  });

  it('returns positive for all-positive keywords', () => {
    expect(estimateValenceFromQualia('軽やか、充実、明晰')).toBeGreaterThan(0);
  });

  it('returns 0 for empty / no-keyword text', () => {
    expect(estimateValenceFromQualia('処理中')).toBe(0);
    expect(estimateValenceFromQualia('')).toBe(0);
  });

  it('mixed keywords cancel out when equal', () => {
    // 1 negative, 1 positive → (1-1)/(1+1) = 0
    expect(estimateValenceFromQualia('疲労、軽やか')).toBe(0);
  });

  it('result is always in [-1, 1]', () => {
    const val = estimateValenceFromQualia('疲労、焦燥、息苦しさ、停滞、不安、空虚、重苦しい、倦怠');
    expect(val).toBeGreaterThanOrEqual(-1);
    expect(val).toBeLessThanOrEqual(1);
  });
});
