const NEGATIVE_KEYWORDS = ['疲労', '焦燥', '息苦しさ', '停滞', '不安', '空虚', '重苦しい', '倦怠'];
const POSITIVE_KEYWORDS = ['軽やか', '充実', '明晰', '安らぎ', '高揚', '爽快'];

/**
 * Estimate affective valence from qualia text by keyword counting.
 * Returns a value in [-1, 1]: negative means stressed/tired, positive means energized.
 * Returns 0 when no keywords are found (no opinion).
 */
export function estimateValenceFromQualia(qualia: string): number {
  let negCount = 0;
  let posCount = 0;
  for (const kw of NEGATIVE_KEYWORDS) if (qualia.includes(kw)) negCount++;
  for (const kw of POSITIVE_KEYWORDS) if (qualia.includes(kw)) posCount++;

  if (negCount === 0 && posCount === 0) return 0;
  return (posCount - negCount) / (posCount + negCount);
}
