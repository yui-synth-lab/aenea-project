import { SomniaConsciousness } from '../../../src/aenea/somnia/consciousness';
import { SomaticLayer } from '../../../src/aenea/somnia/core/somatic-layer';
import { AffectiveCore } from '../../../src/aenea/somnia/core/affective-core';
import { SomniaStateMachine } from '../../../src/aenea/somnia/state/state-machine';
import { ExternalStimulus, SomniaState } from '../../../src/types/somnia-types';

describe('SOMNIA Affective System Core', () => {
  describe('SomaticLayer', () => {
    it('should initialize with base values', () => {
      const layer = new SomaticLayer();
      const state = layer.getState();
      expect(state.lambda).toBe(0);
      expect(state.phi).toBe(100);
      expect(state.mu.serotonin).toBeGreaterThan(0);
    });

    it('should update vitality (lambda) properly', () => {
      const layer = new SomaticLayer();
      layer.processStimulus({
        type: 'internal',
        valence: -0.5,
        arousal: 0.8,
        significance: 0.5,
        context: 'test'
      });
      const state = layer.getState();
      expect(state.lambda).toBeLessThan(0); 
      expect(state.phi).toBeLessThan(100); 
    });
  });

  describe('AffectiveCore', () => {
    it('should accumulate dissonance (xi)', () => {
      const affective = new AffectiveCore();
      
      // Neutral initial
      expect(affective.getState().xi).toBe(0);

      // Apply dissonance manually
      affective.accumulateDissonance(0.5);

      expect(affective.getState().xi).toBeGreaterThan(0);
    });
  });

  describe('SomniaStateMachine', () => {
    it('should transition to dream mode when xi is high', () => {
      const sm = new SomniaStateMachine();

      const somniaState: SomniaState = {
        mode: 'awake',
        somatic: {
          lambda: 0.1,
          phi: 80,
          mu: { serotonin: 0.2, dopamine: 0.2, cortisol: 0.8, oxytocin: 0.2 }
        },
        affective: {
          theta: 0.5,
          psi: 0.5,
          xi: 1.5 // high dissonance — should trigger dream
        },
        cognitive: {
          empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' },
          dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 },
          temporalDilation: 1.0
        },
        timestamp: Date.now(),
        lastTransition: Date.now(),
        transitionCount: 0
      };

      // Advance past MIN_DWELL_TICKS hysteresis (3 ticks required)
      sm.checkTransition(somniaState);
      sm.checkTransition(somniaState);
      const transitionTo = sm.checkTransition(somniaState);
      expect(transitionTo).toBe('dream');
    });
  });

  describe('SomniaConsciousness Integration', () => {
    it('should return a valid initial state', () => {
      const somnia = new SomniaConsciousness();
      const state = somnia.getState();
      expect(state.mode).toBe('awake');
      expect(state.somatic.lambda).toBe(0);
    });

    it('should tick and update states', async () => {
      const somnia = new SomniaConsciousness();
      const stimulus: ExternalStimulus = {
        type: 'sensory',
        valence: 0.8,
        arousal: 0.6,
        significance: 0.5,
        context: 'positive event'
      };

      const state = await somnia.tick(stimulus);
      expect(state.somatic.phi).toBeLessThan(100); // 100 - arousal * 5
    });
  });

  describe('Qualia (Slow Track)', () => {
    it('cognitive.qualia should be undefined before setQualia is called', () => {
      const somnia = new SomniaConsciousness();
      expect(somnia.getState().cognitive.qualia).toBeUndefined();
    });

    it('setQualia should persist in cognitive.qualia', () => {
      const somnia = new SomniaConsciousness();
      somnia.setQualia('軽度の疲労感');
      expect(somnia.getState().cognitive.qualia).toBe('軽度の疲労感');
    });

    it('setQualia should overwrite a previous qualia value', () => {
      const somnia = new SomniaConsciousness();
      somnia.setQualia('焦燥感');
      somnia.setQualia('穏やかな充足感');
      expect(somnia.getState().cognitive.qualia).toBe('穏やかな充足感');
    });

    it('setQualia should emit somniaStateChanged event', () => {
      const { EventEmitter } = require('events');
      const emitter = new EventEmitter();
      const somnia = new SomniaConsciousness({}, emitter);

      const handler = jest.fn();
      emitter.on('somniaStateChanged', handler);

      somnia.setQualia('倦怠感');
      expect(handler).toHaveBeenCalledTimes(1);

      const emittedState = handler.mock.calls[0][0];
      expect(emittedState.cognitive.qualia).toBe('倦怠感');
    });

    it('qualia should survive a tick() call', async () => {
      const somnia = new SomniaConsciousness();
      somnia.setQualia('静寂な集中');
      await somnia.tick();
      // qualia is only set by Slow Track LLM, tick does not clear it
      expect(somnia.getState().cognitive.qualia).toBe('静寂な集中');
    });
  });

  describe('forceDream / wakeUp', () => {
    it('forceDream should set mode to dream and recover φ to 100', () => {
      const somnia = new SomniaConsciousness();
      // Drain some energy first
      somnia.setState({ somatic: { phi: 30 } as any });
      somnia.forceDream();
      const state = somnia.getState();
      expect(state.mode).toBe('dream');
      expect(state.somatic.phi).toBe(100);
    });

    it('wakeUp should set mode back to awake', () => {
      const somnia = new SomniaConsciousness();
      somnia.forceDream();
      somnia.wakeUp();
      expect(somnia.getState().mode).toBe('awake');
    });
  });

  describe('State machine – φ-based exhaustion sleep', () => {
    it('should trigger dream transition when φ falls below threshold', () => {
      const sm = new SomniaStateMachine();

      const exhaustedState: SomniaState = {
        mode: 'awake',
        somatic: {
          lambda: 0.1,
          phi: 10, // below phiDreamThreshold (20)
          mu: { serotonin: 0.2, dopamine: 0.2, cortisol: 0.5, oxytocin: 0.2 }
        },
        affective: { theta: 0.5, psi: 0.5, xi: 0 }, // xi is low — no dissonance sleep
        cognitive: {
          empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' },
          dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 },
          temporalDilation: 1.0
        },
        timestamp: Date.now(),
        lastTransition: Date.now(),
        transitionCount: 0
      };

      // Advance past MIN_DWELL_TICKS (3)
      sm.checkTransition(exhaustedState);
      sm.checkTransition(exhaustedState);
      const transitionTo = sm.checkTransition(exhaustedState);
      expect(transitionTo).toBe('dream');
    });

    it('should NOT trigger φ-based dream when φ is above threshold', () => {
      const sm = new SomniaStateMachine();

      const energeticState: SomniaState = {
        mode: 'awake',
        somatic: {
          lambda: 0.1,
          phi: 80,
          mu: { serotonin: 0.2, dopamine: 0.2, cortisol: 0.2, oxytocin: 0.2 }
        },
        affective: { theta: 0.5, psi: 0.5, xi: 0 },
        cognitive: {
          empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' },
          dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 },
          temporalDilation: 1.0
        },
        timestamp: Date.now(),
        lastTransition: Date.now(),
        transitionCount: 0
      };

      sm.checkTransition(energeticState);
      sm.checkTransition(energeticState);
      const transitionTo = sm.checkTransition(energeticState);
      expect(transitionTo).toBeNull();
    });
  });
});
