import { isValidQuestion, sanitizeAndSplitQuestions } from '../../src/server/services/question-validator';

describe('isValidQuestion', () => {
  test.each([
    ['存在とは何か？', true],
    ['What is being?', true],
    ['何が真実か', true],
    ['どう生きるべきか', true],
    ['「なぜ私は問うのか？」', false], // characterization: the closing 」 defeats the ？ check
  ])('classifies %s', (text, expected) => {
    expect(isValidQuestion(text)).toBe(expected);
  });

  test.each([
    ['ab'],                          // below 3 chars
    ['abc'],                         // 3 chars but no question form
    ['（指先で静寂に触れる）'],        // poetic parenthetical
    ['(softly)'],
    ['「静寂を破り」'],                // quoted description without ?
    ['存在は記憶から生じる。'],         // assertion
    [''],
  ])('rejects %j', (text) => {
    expect(isValidQuestion(text)).toBe(false);
  });

  test('boundary: exactly 3 characters with a question mark is valid, trimmed first', () => {
    expect(isValidQuestion('  あい？  ')).toBe(true);
    expect(isValidQuestion('  あ？')).toBe(false); // 2 chars after trim
  });
});

describe('sanitizeAndSplitQuestions', () => {
  test('strips markdown emphasis', () => {
    expect(sanitizeAndSplitQuestions('**問いとは何か？**')).toEqual(['問いとは何か？']);
  });

  test('splits numbered lists', () => {
    expect(sanitizeAndSplitQuestions('1. 問いAは何か？ 2. 問いBはなぜか？'))
      .toEqual(['問いAは何か？', '問いBはなぜか？']);
  });

  test('splits several full-width question marks at whitespace boundaries', () => {
    expect(sanitizeAndSplitQuestions('問いAは何か？ 問いBはなぜか？'))
      .toEqual(['問いAは何か？', '問いBはなぜか？']);
  });

  test('drops fragments shorter than 3 characters', () => {
    expect(sanitizeAndSplitQuestions('1. 問いAは何か？ 2. はい')).toEqual(['問いAは何か？']);
  });

  test('a single question passes through unchanged', () => {
    expect(sanitizeAndSplitQuestions('何が真実か')).toEqual(['何が真実か']);
  });
});
