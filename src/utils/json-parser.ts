/**
 * Robust JSON Parser Utility
 * Handles Japanese quotes, smart quotes, and other common JSON formatting issues
 */

import { log } from '../server/logger.js';

export interface JsonParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Clean JSON string by removing problematic characters
 * Converts Japanese quotes and smart quotes to apostrophes while preserving JSON structure
 */
export function cleanJsonString(jsonText: string): string {
  // Remove markdown code blocks
  let cleaned = jsonText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Extract JSON array or object if present
  const jsonMatch = cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!jsonMatch) {
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
 * Parse JSON with robust error handling and automatic cleaning
 */
export function parseRobustJson<T = any>(
  jsonText: string,
  context: string = 'JSON'
): JsonParseResult<T> {
  try {
    // First pass: Basic cleaning
    const cleaned = cleanJsonString(jsonText);

    try {
      const data = JSON.parse(cleaned);
      return { success: true, data };
    } catch (firstError) {
      // Second pass: Aggressive cleaning
      log.warn(context, `JSON parse failed (first attempt): ${(firstError as Error).message}`);
      log.warn(context, `Cleaned JSON (first 500 chars): ${cleaned.substring(0, 500)}`);

      const aggressiveCleaned = aggressiveCleanJson(cleaned);

      try {
        const data = JSON.parse(aggressiveCleaned);
        log.info(context, 'JSON parsing succeeded after aggressive cleaning');
        return { success: true, data };
      } catch (secondError) {
        log.error(context, 'JSON parsing failed after aggressive cleaning');
        log.error(context, `Full cleaned JSON:\n${aggressiveCleaned}`);
        return {
          success: false,
          error: `Failed to parse JSON: ${(firstError as Error).message}`
        };
      }
    }
  } catch (error) {
    log.error(context, 'Unexpected error during JSON parsing', error);
    return {
      success: false,
      error: `Unexpected error: ${(error as Error).message}`
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
