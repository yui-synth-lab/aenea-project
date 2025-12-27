/**
 * Robust JSON Parser Utility
 * Handles Japanese quotes, smart quotes, and other common JSON formatting issues
 */

import { log } from '../server/logger.js';
import * as fs from 'fs';
import * as path from 'path';

export interface JsonParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Clean JSON string by removing problematic characters
 * Converts Japanese quotes and smart quotes to apostrophes while preserving JSON structure
 */
export function cleanJsonString(jsonText: string, context: string = 'JSON'): string {
  // Remove markdown code blocks
  let cleaned = jsonText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Remove common AI response prefixes (assistant, thought, etc.)
  // Match prefix at start, potentially on its own line
  cleaned = cleaned
    .replace(/^assistant\s*\n*/i, '')     // Remove "assistant" with optional newlines
    .replace(/^思考[:：]\s*\n*/i, '')
    .replace(/^応答[:：]\s*\n*/i, '');

  // Also remove English conversational prefixes that LLMs often add
  cleaned = cleaned
    .replace(/^I'll help you .*?\n/i, '')
    .replace(/^Let me .*?\n/i, '')
    .replace(/^Here (?:is|are) .*?\n/i, '')
    .trim();

  // Extract JSON array or object if present (greedy match to get the largest valid JSON)
  const jsonMatch = cleaned.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!jsonMatch) {
    // No JSON found - try to convert from numbered list format
    const convertedJson = convertNumberedListToJson(cleaned);
    if (convertedJson) {
      log.warn(context, 'No JSON found, but detected numbered list format - converting to JSON array');
      log.info(context, `Converted ${cleaned.split('\n').filter(l => /^\s*\d+[.．)）]/.test(l)).length} items from numbered list to JSON`);
      return convertedJson;
    }

    // Check if it looks like a numbered list that we couldn't convert
    if (/^\d+\.\s+["']/.test(cleaned.trim())) {
      log.warn(context, 'Detected numbered list format but conversion failed');
      log.warn(context, `Response starts with: ${cleaned.substring(0, 200)}...`);
    }
    return cleaned;
  }

  cleaned = jsonMatch[0]
    .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas
    .replace(/\n/g, ' ')            // Remove newlines
    .replace(/\r/g, '');            // Remove carriage returns

  // Strategy: Convert ONLY Japanese/smart quotes to apostrophes, NOT regular double quotes
  // This preserves JSON structure while making Japanese text safe
  cleaned = cleaned
    .replace(/「/g, "'")                    // Japanese opening quote → apostrophe
    .replace(/」/g, "'")                    // Japanese closing quote → apostrophe
    .replace(/『/g, "'")                    // Japanese double opening quote → apostrophe
    .replace(/』/g, "'")                    // Japanese double closing quote → apostrophe
    .replace(/\u201C/g, "'")                // Smart quote (left) U+201C → apostrophe
    .replace(/\u201D/g, "'")                // Smart quote (right) U+201D → apostrophe
    .replace(/\u2018/g, "'")                // Smart single quote (left) U+2018 → apostrophe
    .replace(/\u2019/g, "'");               // Smart single quote (right) U+2019 → apostrophe

  return cleaned;
}

/**
 * Aggressive JSON cleaning for second-pass parsing
 */
function aggressiveCleanJson(jsonText: string): string {
  return jsonText
    .replace(/,\s*,/g, ',')         // Remove duplicate commas
    .replace(/\[\s*,/g, '[')         // Remove leading commas in arrays
    .replace(/{\s*,/g, '{')          // Remove leading commas in objects
    .replace(/,\s*}/g, '}')          // Remove trailing commas before }
    .replace(/,\s*]/g, ']');         // Remove trailing commas before ]
}

/**
 * Convert numbered list format to JSON array
 * Supports both quoted and unquoted formats:
 *
 * Quoted: 1. "belief text"
 * Unquoted: 1. belief text (most common with LLMs)
 *
 * Returns: ["belief text", "another belief"]
 */
function convertNumberedListToJson(text: string): string | null {
  // Try quoted pattern first (for backward compatibility)
  const quotedPattern = /^\s*(\d+)[.．)）]\s*["'「『](.+?)["'」』]\s*$/gm;
  const quotedMatches = Array.from(text.matchAll(quotedPattern));

  if (quotedMatches.length > 0) {
    const items = quotedMatches.map(match => {
      const content = match[2].trim();
      const escaped = content.replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    return `[${items.join(', ')}]`;
  }

  // Try unquoted pattern (standard numbered list - most common)
  const unquotedPattern = /^\s*(\d+)[.．)）]\s+(.+?)$/gm;
  const unquotedMatches = Array.from(text.matchAll(unquotedPattern));

  if (unquotedMatches.length === 0) {
    return null;
  }

  // Extract content and escape for JSON
  const items = unquotedMatches.map(match => {
    const content = match[2].trim();
    const escaped = content.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

  return `[${items.join(', ')}]`;
}

/**
 * Save LLM JSON output to file for debugging
 */
function saveLlmOutput(originalText: string, context: string, success: boolean, error?: string): void {
  try {
    const outputDir = path.join(process.cwd(), 'data', 'llm-json-outputs');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}_${context.replace(/\s+/g, '_')}_${success ? 'success' : 'failed'}.txt`;
    const filepath = path.join(outputDir, filename);

    const content = `Context: ${context}
Timestamp: ${new Date().toISOString()}
Success: ${success}
${error ? `Error: ${error}\n` : ''}
--- Original LLM Output ---
${originalText}
--- End ---
`;

    fs.writeFileSync(filepath, content, 'utf-8');
  } catch (err) {
    // Silently fail - don't interrupt normal operation
    log.warn('JSON Parser', `Failed to save LLM output: ${(err as Error).message}`);
  }
}

/**
 * Parse JSON with robust error handling and automatic cleaning
 */
export function parseRobustJson<T = any>(
  jsonText: string,
  context: string = 'JSON'
): JsonParseResult<T> {
  try {
    // First pass: Basic cleaning
    const cleaned = cleanJsonString(jsonText, context);

    try {
      const data = JSON.parse(cleaned);
      // Save successful parse
      saveLlmOutput(jsonText, context, true);
      return { success: true, data };
    } catch (firstError) {
      // Second pass: Aggressive cleaning
      log.warn(context, `JSON parse failed (first attempt): ${(firstError as Error).message}`);
      log.warn(context, `Cleaned JSON (first 500 chars): ${cleaned.substring(0, 500)}`);

      const aggressiveCleaned = aggressiveCleanJson(cleaned);

      try {
        const data = JSON.parse(aggressiveCleaned);
        log.info(context, 'JSON parsing succeeded after aggressive cleaning');
        // Save successful parse after aggressive cleaning
        saveLlmOutput(jsonText, context, true);
        return { success: true, data };
      } catch (secondError) {
        log.error(context, 'JSON parsing failed after aggressive cleaning');
        log.error(context, `Full cleaned JSON:\n${aggressiveCleaned}`);

        // Save failed parse
        const errorMsg = `Failed to parse JSON: ${(firstError as Error).message}`;
        saveLlmOutput(jsonText, context, false, errorMsg);

        return {
          success: false,
          error: errorMsg
        };
      }
    }
  } catch (error) {
    log.error(context, 'Unexpected error during JSON parsing', error);
    const errorMsg = `Unexpected error: ${(error as Error).message}`;
    saveLlmOutput(jsonText, context, false, errorMsg);

    return {
      success: false,
      error: errorMsg
    };
  }
}

/**
 * Parse JSON array with type validation
 */
export function parseJsonArray<T = any>(
  jsonText: string,
  context: string = 'JSON Array'
): JsonParseResult<T[]> {
  const result = parseRobustJson<T[] | T>(jsonText, context);

  if (!result.success) {
    return result as JsonParseResult<T[]>;
  }

  if (!Array.isArray(result.data)) {
    return {
      success: false,
      error: 'Parsed JSON is not an array'
    };
  }

  return { success: true, data: result.data };
}

/**
 * Parse JSON object with type validation
 */
export function parseJsonObject<T = any>(
  jsonText: string,
  context: string = 'JSON Object'
): JsonParseResult<T> {
  const result = parseRobustJson<T>(jsonText, context);

  if (!result.success) {
    return result;
  }

  if (typeof result.data !== 'object' || result.data === null || Array.isArray(result.data)) {
    return {
      success: false,
      error: 'Parsed JSON is not an object'
    };
  }

  return result;
}
