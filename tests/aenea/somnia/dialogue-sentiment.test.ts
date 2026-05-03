import { analyzeDialogueSentiment } from '../../../src/aenea/somnia/core/dialogue-sentiment';

describe('DialogueSentiment', () => {
  test('should identify joyful sentiment with strong positive words', () => {
    const result = analyzeDialogueSentiment('今日は本当に楽しいし、素晴らしい日だ！ありがとう！');
    expect(result.label).toBe('joyful');
    expect(result.valence).toBe(0.7);
  });

  test('should identify joyful even with single positive word due to 1.0 score', () => {
    const result = analyzeDialogueSentiment('ありがとう');
    expect(result.label).toBe('joyful');
  });

  test('should identify positive sentiment when mixed with some negative', () => {
    // rawScore = (2 - 1) / 3 = 0.33
    const result = analyzeDialogueSentiment('ありがとう、面白いけど、これはダメだ');
    expect(result.label).toBe('positive');
    expect(result.valence).toBe(0.4);
  });

  test('should identify hostile sentiment with strong negative words', () => {
    const result = analyzeDialogueSentiment('うるさい、消えろ！最悪だ。');
    expect(result.label).toBe('hostile');
    expect(result.valence).toBe(-0.9);
  });

  test('should identify negative sentiment when mixed', () => {
    // rawScore = (1 - 2) / 3 = -0.33
    const result = analyzeDialogueSentiment('好きだけど、つまらないし嫌いだ');
    expect(result.label).toBe('negative');
    expect(result.valence).toBe(-0.5);
  });

  test('should identify neutral sentiment', () => {
    const result = analyzeDialogueSentiment('今日は晴れています。');
    expect(result.label).toBe('neutral');
    expect(result.significance).toBe(0);
  });

  test('should handle English sentiment', () => {
    const result = analyzeDialogueSentiment('I love this wonderful idea, thank you!');
    expect(result.label).toBe('joyful');
    
    const hostile = analyzeDialogueSentiment('Shut up, you are stupid and worthless.');
    expect(hostile.label).toBe('hostile');
  });

  test('should handle empty or whitespace input', () => {
    expect(analyzeDialogueSentiment('').label).toBe('neutral');
    expect(analyzeDialogueSentiment('   ').label).toBe('neutral');
  });
});
