/**
 * Prompt Template Tests
 * Tests for SOMNIA qualia prompts and conditional qualia rendering in S1/S7.
 */

import {
  createSOMNIAQualiaPrompt,
  SOMNIA_QUALIA_SYSTEM_PROMPT,
  createS1EnhancedPrompt,
  createS7DynamicSystemPrompt
} from '../../../src/aenea/templates/prompts';

// ---------------------------------------------------------------------------
// SOMNIA Slow Track prompts
// ---------------------------------------------------------------------------

describe('createSOMNIAQualiaPrompt', () => {
  const baseParams = { lambda: 0.3, phi: 75, theta: 0.5, xi: 0.2 };

  it('should include all four parameter values', () => {
    const prompt = createSOMNIAQualiaPrompt(baseParams);
    expect(prompt).toContain('0.30');   // lambda formatted to 2dp
    expect(prompt).toContain('75');     // phi as integer
    expect(prompt).toContain('0.50');   // theta formatted to 2dp
    expect(prompt).toContain('0.20');   // xi formatted to 2dp
  });

  it('should reference each parameter label', () => {
    const prompt = createSOMNIAQualiaPrompt(baseParams);
    expect(prompt).toContain('Valence');
    expect(prompt).toContain('Energy');
    expect(prompt).toContain('Temporal Anchoring');
    expect(prompt).toContain('Dissonance');
  });

  it('should round phi to nearest integer', () => {
    const prompt = createSOMNIAQualiaPrompt({ lambda: 0, phi: 66.7, theta: 0, xi: 0 });
    expect(prompt).toContain('67');
  });

  it('should handle edge values (negative lambda, zero xi)', () => {
    const prompt = createSOMNIAQualiaPrompt({ lambda: -1.0, phi: 0, theta: 0, xi: 0 });
    expect(prompt).toContain('-1.00');
    expect(prompt).toContain('0/100');
  });

  it('SOMNIA_QUALIA_SYSTEM_PROMPT should enforce length and language constraints', () => {
    expect(SOMNIA_QUALIA_SYSTEM_PROMPT).toContain('20文字');
    expect(SOMNIA_QUALIA_SYSTEM_PROMPT).toContain('日本語');
  });
});

// ---------------------------------------------------------------------------
// S1: conditional qualia block
// ---------------------------------------------------------------------------

const baseS1Params = {
  agentId: 'theoria',
  personality: {
    name: 'テオリア',
    displayName: 'テオリア（慧露＋観至）',
    personality: '真実を追求する',
    tone: '分析的',
    communicationStyle: '論理的',
  },
  trigger: { category: 'consciousness', question: '意識とは何か？' },
  context: {
    unresolvedContext: '',
    significantContext: '',
    beliefsContext: '',
    ragKnowledge: '',
  }
};

describe('createS1EnhancedPrompt – somniaQualia', () => {
  it('should NOT include the body-sensation section when somniaQualia is undefined', () => {
    const prompt = createS1EnhancedPrompt({ ...baseS1Params });
    expect(prompt).not.toContain('内受容感覚');
  });

  it('should NOT include the body-sensation section when somniaQualia is empty string', () => {
    const prompt = createS1EnhancedPrompt({
      ...baseS1Params,
      context: { ...baseS1Params.context, somniaQualia: '' }
    });
    expect(prompt).not.toContain('内受容感覚');
  });

  it('should include the body-sensation section when somniaQualia is provided', () => {
    const prompt = createS1EnhancedPrompt({
      ...baseS1Params,
      context: { ...baseS1Params.context, somniaQualia: '軽度の疲労感' }
    });
    expect(prompt).toContain('内受容感覚');
    expect(prompt).toContain('軽度の疲労感');
  });

  it('should not include a fallback placeholder when qualia is absent', () => {
    const prompt = createS1EnhancedPrompt({ ...baseS1Params });
    expect(prompt).not.toContain('特筆すべき身体感覚はありません');
  });
});

// ---------------------------------------------------------------------------
// S7: conditional qualia block
// ---------------------------------------------------------------------------

const baseS7Params = {
  coreBeliefs: [],
  dpdWeights: { empathy: 0.33, coherence: 0.33, dissonance: 0.34 },
  significantThoughts: [],
  systemClock: 10,
  totalQuestions: 5,
  totalThoughts: 5
};

describe('createS7DynamicSystemPrompt – somniaQualia', () => {
  it('should NOT include the body-sensation section when somniaQualia is undefined', () => {
    const prompt = createS7DynamicSystemPrompt({ ...baseS7Params });
    expect(prompt).not.toContain('内受容感覚');
  });

  it('should NOT include the body-sensation section when somniaQualia is empty string', () => {
    const prompt = createS7DynamicSystemPrompt({ ...baseS7Params, somniaQualia: '' });
    expect(prompt).not.toContain('内受容感覚');
  });

  it('should include the body-sensation section when somniaQualia is provided', () => {
    const prompt = createS7DynamicSystemPrompt({ ...baseS7Params, somniaQualia: '穏やかな充足感' });
    expect(prompt).toContain('内受容感覚');
    expect(prompt).toContain('穏やかな充足感');
  });

  it('should still include DPD weights regardless of qualia', () => {
    const withQualia = createS7DynamicSystemPrompt({ ...baseS7Params, somniaQualia: '疲労' });
    const withoutQualia = createS7DynamicSystemPrompt({ ...baseS7Params });
    expect(withQualia).toContain('DPD');
    expect(withoutQualia).toContain('DPD');
  });
});
