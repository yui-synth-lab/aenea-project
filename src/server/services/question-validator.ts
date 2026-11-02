/**
 * Validation and splitting of LLM-produced follow-up questions before they are
 * stored as unresolved ideas. Pure functions moved from ThoughtPipeline
 * (Issue #7).
 */

/**
 * Validates if a text is a proper question
 *
 * Valid questions satisfy ONE of:
 * 1. End with question mark (？ or ?)
 * 2. Start with interrogative words (何、どう、なぜ、いつ、どこ、誰、どの、どれ、いかに)
 *    - Even without question mark: "何が真実か", "どう生きるべきか"
 *
 * Rejected patterns:
 * - Poetic descriptions: （指先で...）, 「静寂を破り...」
 * - Assertions without interrogatives: 存在は記憶から生じる。
 * - Too short (< 3 characters)
 */
/**
 * Strip Markdown decorations and split compound questions into individual ones.
 * Handles two patterns found in LLM output:
 *   - "** 問いA？ 問いB？"  → ["問いA？", "問いB？"]
 *   - "1. 問いA？ 2. 問いB？" → ["問いA？", "問いB？"]
 */
export function sanitizeAndSplitQuestions(raw: string): string[] {
  const cleaned = raw.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  // Numbered list: "1. ... 2. ..."
  if (/\d+\.\s/.test(cleaned)) {
    return cleaned
      .split(/\d+\.\s+/)
      .map(q => q.trim())
      .filter(q => q.length >= 3);
  }

  // Multiple question marks — split at "？ " boundaries
  const questionMarkCount = (cleaned.match(/？/g) || []).length;
  if (questionMarkCount > 1) {
    return cleaned
      .split(/？\s+/)
      .map((q, i, arr) => (i < arr.length - 1 ? q + '？' : q))
      .map(q => q.trim())
      .filter(q => q.length >= 3);
  }

  return [cleaned];
}

export function isValidQuestion(text: string): boolean {
  const trimmed = text.trim();

  // Too short
  if (trimmed.length < 3) return false;

  // Reject poetic descriptions (parentheses at start)
  if (trimmed.startsWith('（') || trimmed.startsWith('(')) return false;

  // Reject quoted descriptions (often poetic)
  if (trimmed.startsWith('「') && !trimmed.includes('？') && !trimmed.includes('?')) {
    return false;
  }

  // Check for question mark ending (strongest signal)
  if (trimmed.endsWith('？') || trimmed.endsWith('?')) return true;

  // Check for interrogative word at start (Japanese)
  const interrogatives = ['何', 'どう', 'なぜ', 'いつ', 'どこ', '誰', 'どの', 'どれ', 'いかに'];
  const hasInterrogative = interrogatives.some(word => trimmed.startsWith(word));

  if (hasInterrogative) {
    // Valid question: "何が真実か", "どう生きるべきか"
    return true;
  }

  // Reject assertions ending with period (no interrogative, no question mark)
  if (trimmed.endsWith('。') || trimmed.endsWith('.') || trimmed.endsWith('」')) return false;

  return false; // Default: not a valid question
}
