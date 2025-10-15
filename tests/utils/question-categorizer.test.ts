/**
 * Question Categorizer Tests - Style
 * Tests for the advanced semantic question classification system
 */

import {
  categorizeQuestion,
  getQuestionCategory,
  analyzeQuestionComplexity,
  getQuestionTemplate,
  QuestionCategorizer
} from '../../src/utils/question-categorizer';

describe('Question Categorizer', () => {

  describe('Basic Categorization', () => {
    test('should return a valid category for any question', () => {
      const questions = [
        'What is the meaning of life?',
        'How do we know what we know?',
        'Am I truly conscious?',
        'What is right and wrong?',
        'How does creativity emerge?'
      ];

      questions.forEach(question => {
        const category = categorizeQuestion(question);
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });

    test('should handle empty or short questions', () => {
      expect(() => categorizeQuestion('')).not.toThrow();
      expect(() => categorizeQuestion('Why?')).not.toThrow();
      expect(() => categorizeQuestion('What?')).not.toThrow();
    });

    test('should return consistent results for the same question', () => {
      const question = 'What is the nature of consciousness?';
      const category1 = categorizeQuestion(question);
      const category2 = categorizeQuestion(question);

      expect(category1).toBe(category2);
    });
  });

  describe('Question Complexity Analysis', () => {
    test('should analyze complexity correctly', () => {
      const simpleQuestion = 'What is time?';
      const complexQuestion = 'How does the subjective experience of temporal flow relate to the fundamental nature of causality in quantum mechanics?';

      const simpleAnalysis = analyzeQuestionComplexity(simpleQuestion);
      const complexAnalysis = analyzeQuestionComplexity(complexQuestion);

      expect(simpleAnalysis.score).toBeGreaterThanOrEqual(0);
      expect(simpleAnalysis.score).toBeLessThanOrEqual(1);
      expect(complexAnalysis.score).toBeGreaterThanOrEqual(0);
      expect(complexAnalysis.score).toBeLessThanOrEqual(1);
      expect(Array.isArray(simpleAnalysis.factors)).toBe(true);
      expect(Array.isArray(complexAnalysis.factors)).toBe(true);
    });

    test('should return factors array', () => {
      const analysis = analyzeQuestionComplexity('What is consciousness?');
      expect(Array.isArray(analysis.factors)).toBe(true);
      expect(analysis.factors.length).toBeGreaterThan(0);
    });
  });

  describe('Question Templates', () => {
    test('should provide templates for all major categories', () => {
      const categories = [
        'existential', 'epistemological', 'consciousness', 'ethical',
        'creative', 'metacognitive', 'temporal', 'paradoxical', 'ontological'
      ];

      categories.forEach(category => {
        const template = getQuestionTemplate(category);
        expect(typeof template).toBe('string');
        expect(template.length).toBeGreaterThan(0);
      });
    });

    test('should handle unknown categories gracefully', () => {
      const template = getQuestionTemplate('unknown_category');
      expect(typeof template).toBe('string');
    });
  });

  describe('QuestionCategorizer Class', () => {
    let categorizer: QuestionCategorizer;

    beforeEach(() => {
      categorizer = new QuestionCategorizer();
    });

    test('should categorize questions with full metrics', () => {
      const question = 'What is the meaning of existence?';
      const result = categorizer.categorizeQuestion(question);

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('semanticAnalysis');
      expect(result).toHaveProperty('isRecommended');

      expect(typeof result.category).toBe('string');
      expect(typeof result.isRecommended).toBe('boolean');
      expect(result.metrics).toBeDefined();
      expect(result.semanticAnalysis).toBeDefined();
    });

    test('should provide semantic analysis', () => {
      const question = 'How does consciousness emerge from physical processes?';
      const result = categorizer.categorizeQuestion(question);

      expect(result.semanticAnalysis).toHaveProperty('keyTerms');
      expect(result.semanticAnalysis).toHaveProperty('conceptualClusters');
      expect(Array.isArray(result.semanticAnalysis.keyTerms)).toBe(true);
      expect(Array.isArray(result.semanticAnalysis.conceptualClusters)).toBe(true);
    });

    test('should calculate question metrics', () => {
      const question = 'What is truth?';
      const result = categorizer.categorizeQuestion(question);

      expect(result.metrics).toHaveProperty('diversity');
      expect(result.metrics).toHaveProperty('importance');
      expect(result.metrics).toHaveProperty('depth');
      expect(result.metrics.diversity).toBeGreaterThanOrEqual(0);
      expect(result.metrics.diversity).toBeLessThanOrEqual(1);
      expect(result.metrics.importance).toBeGreaterThanOrEqual(0);
      expect(result.metrics.importance).toBeLessThanOrEqual(1);
    });

    test('should record question history', () => {
      const question1 = 'What is reality?';
      const question2 = 'How do we perceive time?';

      const result1 = categorizer.categorizeQuestion(question1);
      categorizer.recordQuestion(
        question1,
        result1.category,
        result1.metrics,
        result1.semanticAnalysis,
        true,
        0.8
      );

      const result2 = categorizer.categorizeQuestion(question2);
      categorizer.recordQuestion(
        question2,
        result2.category,
        result2.metrics,
        result2.semanticAnalysis,
        true,
        0.7
      );

      expect(() => categorizer.getCategoryStatistics()).not.toThrow();
    });

    test('should provide category statistics', () => {
      const stats = categorizer.getCategoryStatistics();

      expect(stats).toHaveProperty('categories');
      expect(stats).toHaveProperty('totalQuestions');
      expect(Array.isArray(stats.categories)).toBe(true);
      expect(typeof stats.totalQuestions).toBe('number');
    });

    test('should handle context in categorization', () => {
      const question = 'What is awareness?';
      const context = ['consciousness', 'mind', 'subjective experience'];

      const result = categorizer.categorizeQuestion(question, context);

      expect(result).toBeDefined();
      expect(result.metrics.relevance).toBeGreaterThanOrEqual(0);
      expect(result.metrics.relevance).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle very long questions', () => {
      const longQuestion = 'What is ' + 'the meaning of existence and consciousness and awareness and being '.repeat(20) + '?';

      expect(() => categorizeQuestion(longQuestion)).not.toThrow();
      const category = categorizeQuestion(longQuestion);
      expect(typeof category).toBe('string');
    });

    test('should handle questions with special characters', () => {
      const questions = [
        'What is "truth"?',
        'How do we know... anything?',
        'Why?!?!',
        'What is consciousness?',
        'How do we think?'
      ];

      questions.forEach(question => {
        expect(() => categorizeQuestion(question)).not.toThrow();
      });
    });

    test('should handle non-question sentences', () => {
      const statements = [
        'This is a statement.',
        'I think therefore I am.',
        'Consciousness is complex.'
      ];

      statements.forEach(statement => {
        expect(() => categorizeQuestion(statement)).not.toThrow();
      });
    });
  });

  describe('Category Balance', () => {
    test('should track category usage', () => {
      const categorizer = new QuestionCategorizer();
      const questions = [
        'What is existence?',
        'How do we know truth?',
        'Am I conscious?',
        'What is right?',
        'How do we create?'
      ];

      questions.forEach(question => {
        const result = categorizer.categorizeQuestion(question);
        categorizer.recordQuestion(
          question,
          result.category,
          result.metrics,
          result.semanticAnalysis
        );
      });

      const stats = categorizer.getCategoryStatistics();
      expect(stats.totalQuestions).toBe(5);
    });
  });

  describe('Functional Helpers', () => {
    test('getQuestionCategory should return same as categorizeQuestion', () => {
      const question = 'What is time?';
      expect(getQuestionCategory(question)).toBe(categorizeQuestion(question));
    });

    test('analyzeQuestionComplexity should return score and factors', () => {
      const analysis = analyzeQuestionComplexity('What is consciousness?');
      expect(analysis).toHaveProperty('score');
      expect(analysis).toHaveProperty('factors');
      expect(typeof analysis.score).toBe('number');
      expect(Array.isArray(analysis.factors)).toBe(true);
    });
  });
});
