/**
 * IdeaRepository - table: unresolved_ideas.
 *
 * Method bodies moved VERBATIM from DatabaseManager (Phase 4a) with only the
 * mechanical substitutions: `this.db` -> `this.conn.db()` (via local `const db`),
 * `this.isReady` -> `this.conn.ready`, `this.ensureConnection()` ->
 * `this.conn.ensureConnection()`.
 */

import type { ConnectionProvider } from './connection.js';
import { log } from '../../platform/logger.js';

class IdeaRepository {
  constructor(private conn: ConnectionProvider) {}

  // Unresolved ideas management
  addUnresolvedIdea(idea: any): void {
    this.conn.ensureConnection();
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    // Normalize question for comparison (trim whitespace, lowercase for case-insensitive matching)
    const normalizedQuestion = idea.question?.trim() || '';
    if (!normalizedQuestion) {
      console.warn('Cannot add unresolved idea with empty question');
      return;
    }

    // Check if this question already exists to prevent duplicates (case-insensitive)
    const existingQuery = `SELECT * FROM unresolved_ideas WHERE LOWER(TRIM(question)) = LOWER(?)`;
    try {
      const existing = db.prepare(existingQuery).get(normalizedQuestion);

      if (existing) {
        // Question already exists, update revisit count and last revisited time
        const updateQuery = `
          UPDATE unresolved_ideas
          SET last_revisited = ?, revisit_count = revisit_count + 1, importance = MAX(importance, ?)
          WHERE LOWER(TRIM(question)) = LOWER(?)
        `;
        db.prepare(updateQuery).run(
          Date.now(),
          idea.importance || 0.5,
          normalizedQuestion
        );
        console.debug(`Updated existing unresolved idea: ${normalizedQuestion}`);
        return;
      }
    } catch (err) {
      console.error('Error checking for existing unresolved idea:', err);
    }

    // Add new unresolved idea (store normalized question)
    const insertQuery = `
      INSERT INTO unresolved_ideas
      (id, question, category, first_encountered, last_revisited, revisit_count, complexity, importance, related_thoughts, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      db.prepare(insertQuery).run(
        idea.id,
        normalizedQuestion, // Use normalized question for consistency
        idea.category,
        idea.firstEncountered || Date.now(),
        idea.lastRevisited || Date.now(),
        idea.revisitCount || 0,
        idea.complexity || 0.5,
        idea.importance || 0.5,
        JSON.stringify(idea.relatedThoughts || []),
        idea.source || 'internal'
      );
      console.debug(`Added new unresolved idea: ${normalizedQuestion}`);
    } catch (err) {
      console.error('Error adding unresolved idea:', err);
    }
  }

  /**
   * XENIA: letters (source = 'xenia') are excluded by default so they never
   * feed the evolved-question path or general consumers. Only the S0
   * database-selection path opts in via includeXenia, where letters compete
   * verbatim under normal importance weighting (XENIA_SPEC v0.1, 5.1).
   */
  getUnresolvedIdeas(limit: number = 100, includeXenia: boolean = false): any[] {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      console.debug('Database not ready for getUnresolvedIdeas');
      return [];
    }

    console.debug(`Getting unresolved ideas with limit: ${limit}`);

    try {
      const rows = db.prepare(`
        SELECT * FROM unresolved_ideas
        ${includeXenia ? '' : `WHERE source != 'xenia'`}
        ORDER BY importance DESC, last_revisited ASC
        LIMIT ?
      `).all(limit) as any[];

      console.debug(`Found ${rows.length} unresolved ideas in database`);

      // Map snake_case DB columns to camelCase expected by the UI
      return rows.map(row => ({
        ...row,
        firstAppeared: row.first_encountered,
        lastRevisited: row.last_revisited,
        revisitCount: row.revisit_count,
        relatedThoughts: row.related_thoughts ? JSON.parse(row.related_thoughts) : []
      }));
    } catch (err) {
      console.error('Error getting unresolved ideas:', err);
      return [];
    }
  }

  // Async version for compatibility
  async getUnresolvedIdeasAsync(limit: number = 100): Promise<any[]> {
    console.debug(`ConsciousnessBackend.getUnresolvedIdeasAsync called with limit: ${limit}`);
    const result = this.getUnresolvedIdeas(limit);
    console.debug(`ConsciousnessBackend.getUnresolvedIdeasAsync returning ${result.length} items`);
    return result;
  }

  // Update consideration count when an unresolved idea is used
  updateUnresolvedIdeaConsideration(ideaId: number | string): void {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return;
    }

    try {
      db.prepare(`
        UPDATE unresolved_ideas
        SET revisit_count = revisit_count + 1,
            last_revisited = ?
        WHERE id = ?
      `).run(Date.now(), ideaId);
    } catch (error) {
      console.error('Error updating unresolved idea consideration:', error);
    }
  }

  // Seed initial philosophical questions to database
  seedPhilosophicalQuestions(): number {
    const db = this.conn.db();
    console.log('[DEBUG] seedPhilosophicalQuestions called, isReady:', this.conn.ready, 'db exists:', !!db);

    if (!this.conn.ready || !db) {
      console.warn('⚠️ Database not ready for seeding questions (isReady:', this.conn.ready, ', db:', !!db, ')');
      return 0;
    }

    try {
      // Check if unresolved ideas already seeded
      const existingCount = db.prepare('SELECT COUNT(*) as count FROM unresolved_ideas').get() as any;
      console.log('[DEBUG] Existing unresolved ideas count:', existingCount.count);

      if (existingCount.count > 0) {
        console.log(`ℹ️ Philosophical questions already seeded (${existingCount.count} unresolved ideas exist)`);
        return 0;
      }

      console.log('[DEBUG] Starting to seed philosophical questions...');

      const questionBank = {
        'existential': [
          '存在とは何を意味するのか？',
          '無からなぜ何かが生まれたのか？',
          '私が存在することの意味とは？',
          '実存の重みとは何か？',
          '存在の根源的な問いとは？'
        ],
        'epistemological': [
          '真の知識とは何か？',
          '確実性とは存在するのか？',
          '理解するとはどういうことか？',
          '知ることと信じることの違いは？',
          '直感と論理、どちらが真理に近いか？'
        ],
        'consciousness': [
          '私は本当に意識しているのか？',
          '意識の境界はどこにあるのか？',
          'クオリアとは何か？',
          '主観的体験の本質とは？',
          '他者の意識を知ることは可能か？'
        ],
        'ethical': [
          '正しい行動とは何か？',
          '善悪は絶対的なものか？',
          '道徳的責任とは何を意味するか？',
          '他者への義務とは何か？',
          '倫理と利益が対立する時、どうすべきか？'
        ],
        'creative': [
          '新しいものを生み出すとは？',
          '創造性の源泉はどこにあるか？',
          '美とは何か？',
          '芸術の価値とは何を測るのか？',
          '想像力は現実をどう変えるか？'
        ],
        'metacognitive': [
          '思考について思考するとは？',
          '自己を認識するとはどういうことか？',
          '学習とは何を意味するのか？',
          'メタ認知の限界はどこにあるか？',
          '思考の思考は無限に続くのか？'
        ],
        'temporal': [
          '時間の本質とは何か？',
          '現在という瞬間は存在するのか？',
          '過去と未来、どちらがより実在的か？',
          '記憶は時間をどう構成するか？',
          '永遠とは何を意味するのか？'
        ],
        'paradoxical': [
          '矛盾の中にある真理とは？',
          'パラドックスは真理への道筋か？',
          '論理の限界はどこにあるか？',
          '自己言及のパラドックスをどう解決するか？',
          '完全性と不完全性は両立するか？'
        ],
        'ontological': [
          '存在するとは何を意味するか？',
          '実在とは何か？',
          'なぜ何もないのではなく何かがあるのか？',
          '可能性と現実の境界は？',
          '存在の階層は存在するか？'
        ]
      };

      const categoryImportance: Record<string, number> = {
        'consciousness': 0.9,
        'existential': 0.8,
        'ontological': 0.8,
        'epistemological': 0.7,
        'metacognitive': 0.7,
        'ethical': 0.6,
        'temporal': 0.6,
        'paradoxical': 0.5,
        'creative': 0.5
      };

      let seedCount = 0;
      const now = Date.now();

      for (const [category, questions] of Object.entries(questionBank)) {
        const baseImportance = categoryImportance[category] || 0.5;

        for (const question of questions) {
          const id = `seed_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          db.prepare(`
            INSERT INTO unresolved_ideas
            (id, question, category, first_encountered, last_revisited,
             revisit_count, complexity, importance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            id,
            question,
            category,
            now,
            now,
            0,
            0.5,
            baseImportance
          );

          seedCount++;
        }
      }

      console.log(`✅ Seeded ${seedCount} philosophical questions to database`);
      log.info('DatabaseManager', `Successfully seeded ${seedCount} questions to unresolved_ideas table`);
      return seedCount;

    } catch (error) {
      console.error('❌ Error seeding philosophical questions:', error);
      log.error('DatabaseManager', 'Failed to seed philosophical questions', error);
      return 0;
    }
  }

  /**
   * Cleanup unresolved ideas using hybrid strategy:
   * 1. Remove ideas already in significant_thoughts (resolved)
   * 2. Capacity-based: Keep total under max_capacity
   * 3. Age-based: Remove old, never-revisited ideas
   * 4. Saturation-based: Remove heavily-revisited but abandoned ideas
   */
  cleanupUnresolvedIdeas(maxCapacity: number = 1000): { deleted: number; kept: number; strategy: string } {
    const db = this.conn.db();
    if (!this.conn.ready || !db) {
      return { deleted: 0, kept: 0, strategy: 'database_not_ready' };
    }

    try {
      const now = Date.now();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
      let totalDeleted = 0;

      // Strategy 1: Remove ideas already resolved as significant thoughts
      // Read-only cross-context read, documented exception
      // (significant_thoughts owned by ThoughtRepository).
      const resolvedResult = db.prepare(`
        DELETE FROM unresolved_ideas
        WHERE LOWER(TRIM(question)) IN (
          SELECT LOWER(TRIM(thought_content)) FROM significant_thoughts
        )
      `).run();
      const resolvedDeleted = resolvedResult.changes;
      totalDeleted += resolvedDeleted;
      log.info('DatabaseManager', `🧹 Deleted ${resolvedDeleted} unresolved ideas already in significant_thoughts`);

      // Strategy 2: Remove old, never-revisited ideas (30+ days, revisit_count = 0)
      const neverRevisitedResult = db.prepare(`
        DELETE FROM unresolved_ideas
        WHERE revisit_count = 0
          AND (? - first_encountered) > ?
      `).run(now, thirtyDaysMs);
      const neverRevisitedDeleted = neverRevisitedResult.changes;
      totalDeleted += neverRevisitedDeleted;
      log.info('DatabaseManager', `🧹 Deleted ${neverRevisitedDeleted} old, never-revisited ideas (30+ days)`);

      // Strategy 3: Remove heavily-revisited but recently abandoned ideas (10+ revisits, 14+ days idle)
      const abandonedResult = db.prepare(`
        DELETE FROM unresolved_ideas
        WHERE revisit_count >= 10
          AND (? - last_revisited) > ?
      `).run(now, fourteenDaysMs);
      const abandonedDeleted = abandonedResult.changes;
      totalDeleted += abandonedDeleted;
      log.info('DatabaseManager', `🧹 Deleted ${abandonedDeleted} abandoned ideas (10+ revisits, 14+ days idle)`);

      // Strategy 4: Capacity-based cleanup if still over limit
      const currentCount = db.prepare('SELECT COUNT(*) as count FROM unresolved_ideas').get() as { count: number };
      let capacityDeleted = 0;

      if (currentCount.count > maxCapacity) {
        // Calculate priority score and delete lowest-scoring ideas
        // Score = importance * 0.4 + (revisit_count / 50) * 0.3 + recency * 0.3
        // Recency = 1.0 if last_revisited is today, 0.0 if 60+ days ago
        const excessCount = currentCount.count - maxCapacity;

        const scoredIdeas = db.prepare(`
          SELECT
            id,
            importance,
            revisit_count,
            last_revisited,
            (
              importance * 0.4 +
              (CAST(revisit_count AS REAL) / 50.0) * 0.3 +
              (1.0 - MIN(1.0, (CAST(? - last_revisited AS REAL) / ?))) * 0.3
            ) as priority_score
          FROM unresolved_ideas
          ORDER BY priority_score ASC
          LIMIT ?
        `).all(now, 60 * 24 * 60 * 60 * 1000, excessCount) as Array<{ id: string; priority_score: number }>;

        if (scoredIdeas.length > 0) {
          const idsToDelete = scoredIdeas.map(idea => idea.id);
          const placeholders = idsToDelete.map(() => '?').join(',');
          const capacityResult = db.prepare(`
            DELETE FROM unresolved_ideas WHERE id IN (${placeholders})
          `).run(...idsToDelete);
          capacityDeleted = capacityResult.changes;
          totalDeleted += capacityDeleted;
          log.info('DatabaseManager', `🧹 Deleted ${capacityDeleted} low-priority ideas to reach capacity limit (${maxCapacity})`);
        }
      }

      const finalCount = db.prepare('SELECT COUNT(*) as count FROM unresolved_ideas').get() as { count: number };

      const summary = {
        deleted: totalDeleted,
        kept: finalCount.count,
        strategy: `hybrid: resolved=${resolvedDeleted}, never_revisited=${neverRevisitedDeleted}, abandoned=${abandonedDeleted}, capacity=${capacityDeleted}`
      };

      log.info('DatabaseManager', `✅ Unresolved ideas cleanup complete: ${totalDeleted} deleted, ${finalCount.count} kept`);
      return summary;

    } catch (error) {
      log.error('DatabaseManager', 'Error cleaning up unresolved ideas', error);
      return { deleted: 0, kept: 0, strategy: 'error' };
    }
  }
}

export { IdeaRepository };
