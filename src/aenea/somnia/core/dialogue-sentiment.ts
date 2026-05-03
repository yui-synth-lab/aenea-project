/**
 * Dialogue Sentiment Classifier
 *
 * Keyword-based sentiment analysis for user chat messages (JP + EN).
 * Maps tone to SOMNIA ExternalStimulus parameters so that joyful messages
 * gently raise λ/serotonin and hostile messages lower λ/raise cortisol.
 */

export interface SentimentResult {
  valence: number;      // [-1, 1]
  arousal: number;      // [0, 1]
  significance: number; // [0, 0.5] — capped so chat never overwhelms a thought cycle
  label: 'joyful' | 'positive' | 'neutral' | 'negative' | 'hostile';
}

const JP_POSITIVE = [
  '嬉しい', '楽しい', 'ありがとう', '好き', '素晴らしい', '感謝', '幸せ', '喜び', '面白い',
  '軽やか', '充実', '明晰', '安らぎ', '高揚', '爽快', '好きだ', '大好き', '最高', '感動',
  '優しい', '温かい', 'ありがとうございます', '嬉しかった', '楽しかった',
];

const JP_NEGATIVE = [
  '嫌い', '怒り', 'うざい', '消えろ', 'バカ', '最悪', '嫌', '憎い', 'つまらない',
  '疲労', '焦燥', '不安', '空虚', '倦怠', 'むかつく', '死ね', 'アホ', 'クズ',
  'ダメ', '嫌だ', '怖い', 'ひどい', '最低', 'キモい',
];

const EN_POSITIVE = [
  'happy', 'joy', 'love', 'wonderful', 'thank', 'great', 'beautiful', 'excited',
  'amazing', 'glad', 'fantastic', 'appreciate', 'nice', 'lovely', 'awesome',
];

const EN_NEGATIVE = [
  'hate', 'stupid', 'idiot', 'shut up', 'worthless', 'boring', 'terrible',
  'disgusting', 'awful', 'dumb', 'useless', 'annoying', 'horrible', 'pathetic',
];

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
}

/**
 * Analyze a user dialogue message and return sentiment parameters
 * suitable for use as a SOMNIA ExternalStimulus.
 *
 * Neutral messages return significance=0 so the caller can skip the tick.
 */
export function analyzeDialogueSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { valence: 0, arousal: 0, significance: 0, label: 'neutral' };
  }

  const pos = countKeywords(text, JP_POSITIVE) + countKeywords(text, EN_POSITIVE);
  const neg = countKeywords(text, JP_NEGATIVE) + countKeywords(text, EN_NEGATIVE);

  const total = pos + neg;
  const rawScore = total === 0 ? 0 : (pos - neg) / total;

  // Map score bands to labelled stimulus values
  if (rawScore >= 0.6) {
    return { valence: 0.7, arousal: 0.5, significance: 0.4, label: 'joyful' };
  }
  if (rawScore >= 0.2) {
    return { valence: 0.4, arousal: 0.3, significance: 0.3, label: 'positive' };
  }
  if (rawScore <= -0.6) {
    return { valence: -0.9, arousal: 0.8, significance: 0.5, label: 'hostile' };
  }
  if (rawScore <= -0.2) {
    return { valence: -0.5, arousal: 0.6, significance: 0.35, label: 'negative' };
  }
  return { valence: 0, arousal: 0, significance: 0, label: 'neutral' };
}
