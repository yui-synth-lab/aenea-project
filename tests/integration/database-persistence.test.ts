/**
 * Database Persistence Tests
 * Tests for somnia_state qualia column migration and save/load.
 */

import * as fs from 'fs';
import * as path from 'path';
import BetterSqlite3 from 'better-sqlite3';
import { DatabaseManager } from '../../src/server/database-manager';

const TEST_DB_DIR = path.join(process.cwd(), 'tests', 'data');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test_persistence.db');

function makeMinimalSomniaState(overrides: Record<string, any> = {}) {
  return {
    timestamp: Date.now(),
    mode: 'awake',
    somatic: {
      lambda: 0.1,
      phi: 80,
      mu: { serotonin: 0.2, dopamine: 0.2, cortisol: 0.3, oxytocin: 0.4 }
    },
    affective: { theta: 0.5, psi: 0.6, xi: 0.1 },
    cognitive: {
      empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' },
      dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 },
      temporalDilation: 1.0,
      qualia: undefined as string | undefined
    },
    ...overrides
  };
}

describe('Database Persistence – somnia_state qualia', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    db = new DatabaseManager(TEST_DB_PATH);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Schema', () => {
    it('should create somnia_state table with a qualia column', () => {
      const raw = new BetterSqlite3(TEST_DB_PATH);
      const cols = raw.prepare(`PRAGMA table_info(somnia_state)`).all() as Array<{ name: string; type: string }>;
      raw.close();

      const qualiaCol = cols.find(c => c.name === 'qualia');
      expect(qualiaCol).toBeDefined();
      expect(qualiaCol!.type).toBe('TEXT');
    });
  });

  describe('saveSomniaState', () => {
    it('should save a row with qualia = NULL when cognitive.qualia is undefined', () => {
      const state = makeMinimalSomniaState();
      db.saveSomniaState(state);

      const raw = new BetterSqlite3(TEST_DB_PATH);
      const row = raw.prepare(`SELECT qualia FROM somnia_state ORDER BY id DESC LIMIT 1`).get() as any;
      raw.close();

      expect(row.qualia).toBeNull();
    });

    it('should save a row with the correct qualia text', () => {
      const state = makeMinimalSomniaState({
        cognitive: {
          empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' },
          dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 },
          temporalDilation: 1.0,
          qualia: '軽度の疲労感'
        }
      });

      db.saveSomniaState(state);

      const raw = new BetterSqlite3(TEST_DB_PATH);
      const row = raw.prepare(`SELECT qualia FROM somnia_state ORDER BY id DESC LIMIT 1`).get() as any;
      raw.close();

      expect(row.qualia).toBe('軽度の疲労感');
    });

    it('should save multiple rows with independent qualia values', () => {
      db.saveSomniaState(makeMinimalSomniaState({
        cognitive: { qualia: '焦燥感', empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' }, dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 }, temporalDilation: 1.0 }
      }));
      db.saveSomniaState(makeMinimalSomniaState({
        cognitive: { qualia: '穏やかな集中', empathicProjection: { dimensions: [], magnitude: 0, context: 'awake' }, dpdInfluence: { empathy: 0, coherence: 0, dissonance: 0 }, temporalDilation: 1.0 }
      }));

      const raw = new BetterSqlite3(TEST_DB_PATH);
      const rows = raw.prepare(`SELECT qualia FROM somnia_state ORDER BY id ASC`).all() as any[];
      raw.close();

      expect(rows).toHaveLength(2);
      expect(rows[0].qualia).toBe('焦燥感');
      expect(rows[1].qualia).toBe('穏やかな集中');
    });
  });

  describe('runMigrations (existing DB without qualia column)', () => {
    // Use a unique path per test run to avoid Windows file-lock races with WAL files
    const legacyPath = path.join(TEST_DB_DIR, `test_legacy_${process.hrtime.bigint()}.db`);
    let migratedDb: DatabaseManager | undefined;

    afterAll(() => {
      migratedDb?.close();
      for (const suffix of ['', '-wal', '-shm']) {
        const p = legacyPath + suffix;
        if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch { /* best-effort */ }
      }
    });

    it('should add qualia column to a pre-existing DB that lacks it', () => {
      // Create a DB that mimics the old schema (without qualia)
      const legacyDb = new BetterSqlite3(legacyPath);
      legacyDb.exec(`PRAGMA journal_mode = DELETE`); // avoid WAL lock on Windows
      legacyDb.exec(`
        CREATE TABLE somnia_state (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp INTEGER NOT NULL,
          cycle_id TEXT,
          mode TEXT NOT NULL,
          lambda REAL NOT NULL DEFAULT 0,
          phi REAL NOT NULL DEFAULT 100,
          mu_serotonin REAL NOT NULL DEFAULT 0,
          mu_dopamine REAL NOT NULL DEFAULT 0,
          mu_cortisol REAL NOT NULL DEFAULT 0,
          mu_oxytocin REAL NOT NULL DEFAULT 0,
          theta REAL NOT NULL DEFAULT 0,
          psi REAL NOT NULL DEFAULT 0,
          xi REAL NOT NULL DEFAULT 0
        )
      `);
      legacyDb.close();

      // DatabaseManager.open() should run runMigrations and add the column
      migratedDb = new DatabaseManager(legacyPath);
      migratedDb.close();

      const raw = new BetterSqlite3(legacyPath);
      const cols = raw.prepare(`PRAGMA table_info(somnia_state)`).all() as Array<{ name: string }>;
      raw.close();

      expect(cols.some(c => c.name === 'qualia')).toBe(true);
    });

    it('should NOT throw if qualia column already exists (idempotent)', () => {
      // db from beforeEach is already open; open a second instance and close it immediately
      let second: DatabaseManager | undefined;
      try {
        expect(() => { second = new DatabaseManager(TEST_DB_PATH); }).not.toThrow();
      } finally {
        second?.close();
      }
    });
  });
});
