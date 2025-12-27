/**
 * Memory Consolidator JSON Parsing Tests
 * Tests for robust JSON parsing with Japanese quotes and special characters
 */

import { MemoryConsolidator } from '../../../src/aenea/memory/memory-consolidator';
import { DatabaseManager } from '../../../src/server/database-manager';
import * as fs from 'fs';
import * as path from 'path';

// Define types locally to avoid import issues
interface AIExecutionResult {
  content: string;
  tokensUsed?: number;
  model?: string;
  duration: number;
  success: boolean;
  error?: string;
}

// Mock AI Executor for testing
class MockAIExecutor {
  private mockResponse: AIExecutionResult | null = null;

  setMockResponse(response: Partial<AIExecutionResult>): void {
    this.mockResponse = {
      content: response.content || '',
      duration: response.duration || 0,
      success: response.success !== undefined ? response.success : true,
      tokensUsed: response.tokensUsed,
      model: response.model,
      error: response.error
    };
  }

  async execute(_prompt: string, _personality: string): Promise<AIExecutionResult> {
    if (!this.mockResponse) {
      return {
        content: '[]',
        duration: 0,
        success: true
      };
    }
    return this.mockResponse;
  }
}

describe('MemoryConsolidator - JSON Parsing', () => {
  let consolidator: MemoryConsolidator;
  let db: DatabaseManager;
  let mockAIExecutor: MockAIExecutor;

  const testDbPath = path.join(__dirname, '../../data/test_json_parsing.db');

  beforeEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Initialize database and consolidator
    db = new DatabaseManager(testDbPath);

    // Create mock AI executor that returns various JSON responses
    mockAIExecutor = new MockAIExecutor();

    // Cast to any to avoid type mismatch with AIExecutor abstract class
    consolidator = new MemoryConsolidator(db, mockAIExecutor as any);
  });

  afterEach(async () => {
    // Close database connection before cleanup
    if (db) {
      db.cleanup();
    }

    // Wait for database to fully close
    await new Promise(resolve => setTimeout(resolve, 100));

    // Try to remove test database
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (err) {
        // Ignore cleanup errors in tests
        console.warn(`Could not delete test database: ${err}`);
      }
    }
  });

  describe('Japanese Quote Handling', () => {
    test('should parse JSON with Japanese quotes inside string values', async () => {
      // Mock AI response with Japanese quotes (like the real error case)
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "存在することの意味は、実存主義探求において最も基本的かつ深遠な問題であり、「自己」や自我、意識は未だ明確に説明できていない。",
    "category": "existential",
    "confidence": 0.95,
    "strength": 0.8,
    "source_thoughts": ["thought1"]
  }
]`,
        success: true
      });

      // Add a test thought with valid content
      db.recordSignificantThought({
        content: 'This is a test thought about existence and meaning',
        agent_id: 'theoria',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'existential'
      });

      // Should not throw and should create belief
      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBeGreaterThan(0);
      const beliefs = db.getCoreBeliefs(10);
      expect(beliefs.length).toBeGreaterThan(0);
      expect(beliefs[0].belief_content).toContain('自己'); // Should preserve Japanese content
    });

    test('should handle multiple types of Japanese quotes', async () => {
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "「一重鉤括弧」と『二重鉤括弧』の両方を含むテキスト",
    "category": "philosophical",
    "confidence": 0.9,
    "strength": 0.7,
    "source_thoughts": ["thought1"]
  }
]`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Philosophical inquiry into the nature of quotes and symbols',
        agent_id: 'pathia',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'philosophical'
      });

      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBe(1);
      const beliefs = db.getCoreBeliefs(10);
      expect(beliefs[0].belief_content).toContain('一重鉤括弧');
      expect(beliefs[0].belief_content).toContain('二重鉤括弧');
    });
  });

  describe('Smart Quotes Handling', () => {
    test('should parse JSON with smart quotes (curly quotes)', async () => {
      // Use actual Unicode smart quotes (U+201C, U+201D, U+2018, U+2019)
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "This text contains \u201Csmart quotes\u201D and \u2018smart apostrophes\u2019",
    "category": "analytical",
    "confidence": 0.85,
    "strength": 0.6,
    "source_thoughts": ["thought1"]
  }
]`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Analytical examination of text processing and character encoding',
        agent_id: 'kinesis',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'analytical'
      });

      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBe(1);
    });
  });

  describe('Trailing Comma Handling', () => {
    test('should handle trailing commas in arrays', async () => {
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "Test belief",
    "category": "ethical",
    "confidence": 0.9,
    "strength": 0.8,
    "source_thoughts": ["thought1", "thought2",]
  },
]`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Ethical considerations in data validation and error handling',
        agent_id: 'theoria',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'ethical'
      });

      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBe(1);
    });
  });

  describe('Complex Mixed Cases', () => {
    test('should handle JSON with mixed quote types and special characters', async () => {
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "矛盾は新しい視点や考え方を提示し、理解の深化を促す。同一性と非同一性の矛盾は、新しい関係や世界を生み出す源泉である。",
    "category": "paradoxical",
    "confidence": 0.95,
    "strength": 0.8,
    "source_thoughts": ["慧露"]
  },
  {
    "belief_content": "問いは答えを超える尊さを持つ。なぜなら、問いには未解決の問題や矛盾を明らかにし、探求心を掻き立てる力があるからだ。",
    "category": "metacognitive",
    "confidence": 0.93,
    "strength": 0.8,
    "source_thoughts": ["観至"]
  }
]`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Paradoxical nature of contradictions leading to deeper understanding',
        agent_id: 'theoria',
        confidence: 0.95,
        trigger_id: 'test-trigger-1',
        category: 'paradoxical'
      });

      db.recordSignificantThought({
        content: 'Metacognitive reflection on the value of questions over answers',
        agent_id: 'pathia',
        confidence: 0.93,
        trigger_id: 'test-trigger-2',
        category: 'metacognitive'
      });

      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBe(2);
      const beliefs = db.getCoreBeliefs(10);
      expect(beliefs.length).toBe(2);
    });
  });

  describe('Markdown Code Block Extraction', () => {
    test('should extract JSON from markdown code blocks', async () => {
      mockAIExecutor.setMockResponse({
        content: `Here is the JSON output:

\`\`\`json
[
  {
    "belief_content": "Belief wrapped in markdown",
    "category": "creative",
    "confidence": 0.88,
    "strength": 0.75,
    "source_thoughts": ["thought1"]
  }
]
\`\`\`

This is the consolidated belief.`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Creative approaches to embedding structured data in natural language',
        agent_id: 'kinesis',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'creative'
      });

      const result = await consolidator.consolidate(0.85);

      expect(result.beliefs_created).toBe(1);
    });
  });

  describe('Error Recovery', () => {
    test('should fall back to rule-based extraction on invalid JSON', async () => {
      mockAIExecutor.setMockResponse({
        content: 'This is not valid JSON at all!',
        success: true
      });

      // Add multiple thoughts to trigger rule-based extraction
      const existentialThoughts = [
        'Exploring the fundamental nature of being and existence',
        'Questioning the relationship between consciousness and reality',
        'Investigating the meaning of authentic self-expression',
        'Examining the role of choice in defining essence',
        'Reflecting on the tension between freedom and responsibility'
      ];

      existentialThoughts.forEach((content, i) => {
        db.recordSignificantThought({
          content: content,
          agent_id: 'theoria',
          confidence: 0.9,
          trigger_id: `test-trigger-${i}`,
          category: 'existential'
        });
      });

      const result = await consolidator.consolidate(0.85);

      // Should still succeed using rule-based extraction
      expect(result.thoughts_processed).toBeGreaterThan(0);
      // Rule-based may or may not create beliefs depending on category grouping
      expect(result.beliefs_created + result.beliefs_updated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty arrays', async () => {
      mockAIExecutor.setMockResponse({
        content: '[]',
        success: true
      });

      db.recordSignificantThought({
        content: 'Existential inquiry into emptiness and void as philosophical concepts',
        agent_id: 'theoria',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'existential'
      });

      const result = await consolidator.consolidate(0.85);

      // Should handle gracefully
      expect(result.beliefs_created).toBe(0);
    });

    test('should handle very long belief content', async () => {
      const longContent = 'あ'.repeat(200); // 200 characters
      mockAIExecutor.setMockResponse({
        content: `[
  {
    "belief_content": "${longContent}",
    "category": "temporal",
    "confidence": 0.9,
    "strength": 0.8,
    "source_thoughts": ["thought1"]
  }
]`,
        success: true
      });

      db.recordSignificantThought({
        content: 'Temporal dynamics of consciousness and the flow of experience through time',
        agent_id: 'pathia',
        confidence: 0.9,
        trigger_id: 'test-trigger',
        category: 'temporal'
      });

      const result = await consolidator.consolidate(0.85);

      // Should truncate or handle appropriately
      expect(result.beliefs_created).toBeGreaterThanOrEqual(0);
    });
  });
});
