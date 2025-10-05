import fs from 'fs';

// Minimal StructuredThought shape to match usage in dpd-engine.ts
export interface StructuredThought {
  id: string;
  agentId: string;
  content: string;
  confidence?: number; // 0.0 - 1.0
  emotionalTone?: string; // e.g., 'positive'|'neutral'|'negative'
  logicalCoherence?: number; // 0.0 - 1.0
  timestamp?: number;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  sections: {
    poem?: string;
    thoughtProcess?: string[];
    encouragement?: string;
  };
  structuredThought?: StructuredThought;
}

const FORBIDDEN_TOKENS = ['<think>', '<internal>', '<debug>'];

function containsJapanese(text: string): boolean {
  return /[ぁ-んァ-ン一-龯]/.test(text);
}

function detectMetaphor(text: string): boolean {
  // crude heuristic: common Japanese metaphor markers
  return /のように|ように|みたい|たとえば|比喩|比喩的/.test(text);
}

function extractSections(text: string): { poem?: string; thoughtProcess?: string[]; encouragement?: string } {
  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  let poem: string | undefined;
  let thoughtProcess: string[] | undefined;
  let encouragement: string | undefined;

  // Heuristic: first paragraph is the poem/answer
  if (paragraphs.length > 0) poem = paragraphs[0];

  // Look for a paragraph that contains '思考プロセス' or bullet lines
  for (const p of paragraphs.slice(1)) {
    if (/思考プロセス|思考の流れ|思考プロセス/.test(p) || /^(-|\*|\d+\.)/m.test(p)) {
      // split into lines and take lines that look like bullets
      thoughtProcess = p.split(/\r?\n/).map(l => l.replace(/^\s*[-\*\d\.\)]+\s*/, '').trim()).filter(Boolean);
      continue;
    }
    // encouragement: short closing sentence
    if (!encouragement && p.length > 0 && p.length < 200 && /励ま|励み|勇気|あなた|頑張/.test(p)) {
      encouragement = p.replace(/^\*+|\*+$/g, '').trim();
    }
  }

  // Fallback: last paragraph as encouragement if short
  if (!encouragement && paragraphs.length > 1) {
    const last = paragraphs[paragraphs.length - 1];
    if (last.length < 200) encouragement = last;
  }

  return { poem, thoughtProcess, encouragement };
}

export function validatePathiaResponse(text: string, modelName?: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = extractSections(text);

  // Forbidden tokens
  for (const t of FORBIDDEN_TOKENS) {
    if (text.includes(t)) errors.push(`Forbidden token found: ${t}`);
  }

  // Language check
  if (!containsJapanese(text)) warnings.push('No Japanese characters detected');

  // Poem length
  if (!sections.poem) {
    errors.push('Poem/primary answer not found');
  } else {
    const len = sections.poem.length;
    if (len < 80) warnings.push('Poem is short (<80 chars)');
    if (len > 1000) warnings.push('Poem is very long (>1000 chars)');
    if (!detectMetaphor(sections.poem)) warnings.push('No clear metaphor detected in poem');
  }

  // Thought process
  if (!sections.thoughtProcess || sections.thoughtProcess.length < 2) {
    warnings.push('Thought process lines are missing or too few (expect ~3)');
  }

  // Encouragement
  if (!sections.encouragement) warnings.push('Encouragement sentence not found');

  // Build structured thought compatible with dpd-engine expectations
  const structured: StructuredThought = {
    id: `pathia-${Date.now()}`,
    agentId: 'pathia',
    content: sections.poem || text,
    confidence: 0.7, // heuristic default
    emotionalTone: /悲|苦|哀|寂|痛/.test(text) ? 'negative' : 'positive',
    logicalCoherence: 0.8,
    timestamp: Date.now()
  };

  const ok = errors.length === 0;

  return {
    ok,
    errors,
    warnings,
    sections: {
      poem: sections.poem,
      thoughtProcess: sections.thoughtProcess,
      encouragement: sections.encouragement
    },
    structuredThought: structured
  };
}

export function saveValidationResult(result: ValidationResult, modelName: string, outPath = 'test-results.json') {
  let existing = [] as any[];
  try {
    if (fs.existsSync(outPath)) {
      existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    }
  } catch (e) {
    // ignore parse errors
  }

  existing.push({ model: modelName, timestamp: Date.now(), result });
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');
}
