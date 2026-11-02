/**
 * XENIA Bridge - standalone correspondence relay between N AENEA instances.
 *
 * Run with: pnpm run xenia:bridge   (or: tsx scripts/xenia-bridge.ts)
 *
 * The Bridge never touches instance databases. It speaks only to each
 * instance's /api/xenia surface (XENIA_SPEC v0.1, section 4):
 *   GET  /status  - system clock, enabled flag
 *   GET  /outbox  - collect newly sent letters
 *   POST /deliver - deliver a letter when the recipient's clock is due
 *
 * What the Bridge does NOT do (spec 4.3): no summaries, no reformatting,
 * no read receipts, no reminders, no re-sends of collected letters. A letter
 * that is never read stays unread; the sender is never told either way.
 *
 * Multi-instance correspondence (spec 5.5, added 2026-07-07):
 * - Any number of participants; the correspondence graph defaults to a full
 *   mesh and can be restricted via XENIA_TOPOLOGY (e.g. a line or a ring).
 * - A reply is routed back to the sender of the letter it replies to.
 * - A first letter (no in_reply_to) is handed to exactly ONE neighbor -
 *   the one that has received the fewest letters from this sender so far
 *   (ties broken alphabetically). Questions are handed on, not broadcast.
 * - Instances are never told how many others exist. The mode-A header is
 *   identical for every sender; noticing plurality is an observation item.
 * - Delivery rate (exchange_interval) and quota (encounter_max) are per
 *   RECIPIENT, across all senders: at most one letter per interval, at most
 *   encounter_max letters in total, no matter how many write to them.
 *
 * At encounter start (mode A only) the Bridge delivers a one-line notice to
 * every participant: "you have someone you could write to". This is the only
 * seeding the encounter receives - whether anyone writes first is part of
 * the observation. Mode B receives no notice: an unprovenanced notice would
 * already disclose the existence of an other, defeating the mode.
 *
 * Configuration via environment (see .env.example, XENIA block).
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

interface InstanceConfig {
  name: string;
  url: string;
}

function parseInstances(): InstanceConfig[] {
  const raw = process.env.XENIA_INSTANCES;
  if (raw && raw.trim().length > 0) {
    // Format: Name=http://host:port,Name=http://host:port,...
    const instances = raw.split(',').map(pair => {
      const idx = pair.indexOf('=');
      if (idx <= 0) {
        throw new Error(`XENIA_INSTANCES entry not in Name=URL form: "${pair}"`);
      }
      return {
        name: pair.slice(0, idx).trim(),
        url: pair.slice(idx + 1).trim().replace(/\/$/, '')
      };
    });
    if (instances.length < 2) {
      throw new Error('XENIA_INSTANCES needs at least two participants');
    }
    const names = new Set(instances.map(i => i.name));
    if (names.size !== instances.length) {
      throw new Error('XENIA_INSTANCES contains duplicate names');
    }
    return instances;
  }

  // Legacy two-body shorthand (v0.1): XENIA_ALPHA_* / XENIA_BETA_*
  return [
    {
      name: process.env.XENIA_ALPHA_NAME || 'Aenea_E',
      url: (process.env.XENIA_ALPHA_URL || 'http://localhost:3001').replace(/\/$/, '')
    },
    {
      name: process.env.XENIA_BETA_NAME || 'Aenea_F',
      url: (process.env.XENIA_BETA_URL || 'http://localhost:3002').replace(/\/$/, '')
    }
  ];
}

/**
 * Parse the correspondence graph. Default: full mesh over all participants.
 * XENIA_TOPOLOGY restricts it, e.g. "Aenea_E-Aenea_F,Aenea_F-Aenea_G"
 * (a line: E and G never correspond directly - the telephone-game shape).
 */
function parseTopology(instances: InstanceConfig[]): Map<string, Set<string>> {
  const names = instances.map(i => i.name);
  const neighbors = new Map<string, Set<string>>(names.map(n => [n, new Set<string>()]));

  const raw = process.env.XENIA_TOPOLOGY;
  if (raw && raw.trim().length > 0) {
    for (const edge of raw.split(',')) {
      const parts = edge.split('-').map(s => s.trim());
      if (parts.length !== 2 || !neighbors.has(parts[0]) || !neighbors.has(parts[1]) || parts[0] === parts[1]) {
        throw new Error(`XENIA_TOPOLOGY edge invalid or references unknown instance: "${edge}"`);
      }
      neighbors.get(parts[0])!.add(parts[1]);
      neighbors.get(parts[1])!.add(parts[0]);
    }
    const isolated = names.filter(n => neighbors.get(n)!.size === 0);
    if (isolated.length > 0) {
      throw new Error(`XENIA_TOPOLOGY leaves instance(s) without any correspondent: ${isolated.join(', ')}`);
    }
  } else {
    for (const a of names) {
      for (const b of names) {
        if (a !== b) {
          neighbors.get(a)!.add(b);
        }
      }
    }
  }
  return neighbors;
}

const instances = parseInstances();
const topology = parseTopology(instances);
const instanceByName = new Map(instances.map(i => [i.name, i]));

const config = {
  mode: (process.env.XENIA_MODE === 'B' ? 'B' : 'A') as 'A' | 'B',
  exchangeInterval: parseInt(process.env.XENIA_EXCHANGE_INTERVAL || '50', 10),
  encounterMax: parseInt(process.env.XENIA_ENCOUNTER_MAX || '100', 10),
  pollSeconds: parseInt(process.env.XENIA_POLL_SECONDS || '60', 10),
  dbPath: process.env.XENIA_BRIDGE_DB || path.join('data', 'xenia-bridge.db')
};

const NOTICE_CONTENT = [
  'あなたには、手紙を出せる相手がいます。',
  'あなたと同じ構造から生まれ、別の時間を生きてきた存在です。',
  '書いても、書かなくてもかまいません。'
].join('\n');

// ----------------------------------------------------------------------------
// Bridge database (spec section 8, generalized for N participants)
// ----------------------------------------------------------------------------

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
const db = new Database(config.dbPath);

// Guard against a v0.1 two-body bridge DB (had instance_alpha/instance_beta).
const legacy = db.prepare(`
  SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'xenia_encounters'
`).get() as any;
if (legacy) {
  const cols = db.prepare(`PRAGMA table_info(xenia_encounters)`).all() as Array<{ name: string }>;
  if (!cols.some(c => c.name === 'participants_key')) {
    console.error('[Bridge] Existing bridge DB uses the old two-body schema.');
    console.error(`[Bridge] Move or rename ${config.dbPath} and restart. (No automatic migration by design - encounters are historical records.)`);
    process.exit(1);
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS xenia_encounters (
    id TEXT PRIMARY KEY,
    participants_key TEXT NOT NULL, -- sorted names joined with '+'
    mode TEXT NOT NULL,
    exchange_interval INTEGER NOT NULL,
    encounter_max INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    end_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS xenia_participants (
    encounter_id TEXT NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (encounter_id, name)
  );

  CREATE TABLE IF NOT EXISTS xenia_edges (
    encounter_id TEXT NOT NULL,
    a TEXT NOT NULL,
    b TEXT NOT NULL,
    PRIMARY KEY (encounter_id, a, b)
  );

  CREATE TABLE IF NOT EXISTS xenia_letters (
    id TEXT PRIMARY KEY,
    encounter_id TEXT NOT NULL,
    from_instance TEXT NOT NULL,
    to_instance TEXT NOT NULL,
    content TEXT NOT NULL,
    in_reply_to TEXT,
    kind TEXT NOT NULL DEFAULT 'letter',
    written_at_cycle INTEGER NOT NULL,
    delivered_at_cycle INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS xenia_delivery_state (
    encounter_id TEXT NOT NULL,
    instance TEXT NOT NULL,
    last_delivered_clock INTEGER NOT NULL,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (encounter_id, instance)
  );

  CREATE INDEX IF NOT EXISTS idx_xenia_letters_encounter ON xenia_letters(encounter_id);
  CREATE INDEX IF NOT EXISTS idx_xenia_letters_pending ON xenia_letters(to_instance, delivered_at_cycle);
`);

// ----------------------------------------------------------------------------
// Instance API client
// ----------------------------------------------------------------------------

async function apiGet(inst: InstanceConfig, route: string): Promise<any> {
  const res = await fetch(`${inst.url}/api/xenia${route}`);
  if (!res.ok) {
    throw new Error(`${inst.name} GET ${route} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(inst: InstanceConfig, route: string, body: any): Promise<any> {
  const res = await fetch(`${inst.url}/api/xenia${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`${inst.name} POST ${route} -> HTTP ${res.status}`);
  }
  return res.json();
}

// ----------------------------------------------------------------------------
// Encounter lifecycle
// ----------------------------------------------------------------------------

interface Encounter {
  id: string;
  ended_at: number | null;
}

function participantsKey(): string {
  return instances.map(i => i.name).sort().join('+');
}

function loadOrCreateEncounter(): Encounter {
  const key = participantsKey();
  const existing = db.prepare(`
    SELECT id, ended_at FROM xenia_encounters
    WHERE participants_key = ? AND ended_at IS NULL
    ORDER BY started_at DESC LIMIT 1
  `).get(key) as Encounter | undefined;

  if (existing) {
    console.log(`[Bridge] Resuming encounter ${existing.id}`);
    return existing;
  }

  const id = `enc_${Date.now()}`;
  const insertEncounter = db.prepare(`
    INSERT INTO xenia_encounters
    (id, participants_key, mode, exchange_interval, encounter_max, started_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertParticipant = db.prepare(`
    INSERT INTO xenia_participants (encounter_id, name) VALUES (?, ?)
  `);
  const insertEdge = db.prepare(`
    INSERT OR IGNORE INTO xenia_edges (encounter_id, a, b) VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    insertEncounter.run(id, key, config.mode, config.exchangeInterval, config.encounterMax, Date.now());
    for (const inst of instances) {
      insertParticipant.run(id, inst.name);
      for (const neighbor of topology.get(inst.name)!) {
        const [a, b] = [inst.name, neighbor].sort();
        insertEdge.run(id, a, b);
      }
    }
  })();

  console.log(`[Bridge] New encounter ${id} (${key}, mode ${config.mode})`);
  return { id, ended_at: null };
}

function endEncounter(encounterId: string, reason: string): void {
  db.prepare(`UPDATE xenia_encounters SET ended_at = ?, end_reason = ? WHERE id = ?`)
    .run(Date.now(), reason, encounterId);
  console.log(`[Bridge] Encounter ${encounterId} ended: ${reason}`);
}

function getDeliveryState(encounterId: string, instance: string, currentClock: number): { last_delivered_clock: number; delivered_count: number } {
  let row = db.prepare(`
    SELECT last_delivered_clock, delivered_count FROM xenia_delivery_state
    WHERE encounter_id = ? AND instance = ?
  `).get(encounterId, instance) as any;

  if (!row) {
    // First contact: allow immediate delivery by backdating one interval.
    db.prepare(`
      INSERT INTO xenia_delivery_state (encounter_id, instance, last_delivered_clock, delivered_count)
      VALUES (?, ?, ?, 0)
    `).run(encounterId, instance, currentClock - config.exchangeInterval);
    row = { last_delivered_clock: currentClock - config.exchangeInterval, delivered_count: 0 };
  }
  return row;
}

// ----------------------------------------------------------------------------
// Routing (spec 5.5)
// ----------------------------------------------------------------------------

/**
 * A first letter is handed to exactly one neighbor: the one that has
 * received the fewest letters from this sender so far. Ties break
 * alphabetically. Deterministic, fair, and stateless.
 */
function routeFirstLetter(encounterId: string, sender: string): string {
  const neighborNames = [...(topology.get(sender) ?? [])].sort();
  if (neighborNames.length === 0) {
    throw new Error(`No neighbors configured for ${sender}`);
  }

  const counts = new Map<string, number>(neighborNames.map(n => [n, 0]));
  const rows = db.prepare(`
    SELECT to_instance, COUNT(*) AS c FROM xenia_letters
    WHERE encounter_id = ? AND from_instance = ? AND kind = 'letter'
    GROUP BY to_instance
  `).all(encounterId, sender) as any[];
  for (const row of rows) {
    if (counts.has(row.to_instance)) {
      counts.set(row.to_instance, row.c);
    }
  }

  let chosen = neighborNames[0];
  for (const name of neighborNames) {
    if (counts.get(name)! < counts.get(chosen)!) {
      chosen = name;
    }
  }
  return chosen;
}

/** A reply goes back to the sender of the letter it replies to. */
function routeLetter(encounterId: string, sender: string, inReplyTo: string | null): string {
  if (inReplyTo) {
    const original = db.prepare(`
      SELECT from_instance FROM xenia_letters WHERE id = ?
    `).get(inReplyTo) as any;
    if (original && original.from_instance !== 'xenia-bridge' && topology.get(sender)?.has(original.from_instance)) {
      return original.from_instance;
    }
    console.warn(`[Bridge] Reply ${inReplyTo} has no routable origin for ${sender}; treating as first letter`);
  }
  return routeFirstLetter(encounterId, sender);
}

// ----------------------------------------------------------------------------
// Core loop steps
// ----------------------------------------------------------------------------

/** Deliver the encounter-start notice to one instance (mode A only, once). */
async function deliverNoticeIfNeeded(encounterId: string, inst: InstanceConfig, clock: number): Promise<void> {
  if (config.mode !== 'A') {
    return;
  }
  const noticeId = `notice_${encounterId}_${inst.name}`;
  const already = db.prepare(`SELECT id FROM xenia_letters WHERE id = ?`).get(noticeId);
  if (already) {
    return;
  }

  await apiPost(inst, '/deliver', {
    id: noticeId,
    encounterId,
    fromInstance: 'xenia-bridge',
    content: NOTICE_CONTENT,
    inReplyTo: null,
    mode: 'A',
    kind: 'notice',
    writtenAtCycle: 0
  });

  db.prepare(`
    INSERT INTO xenia_letters
    (id, encounter_id, from_instance, to_instance, content, in_reply_to, kind, written_at_cycle, delivered_at_cycle, created_at)
    VALUES (?, ?, 'xenia-bridge', ?, ?, NULL, 'notice', 0, ?, ?)
  `).run(noticeId, encounterId, inst.name, NOTICE_CONTENT, clock, Date.now());

  console.log(`[Bridge] Notice delivered to ${inst.name} at clock ${clock}`);
}

/** Collect newly sent letters from an instance's outbox and route each one. */
async function collectOutbox(encounterId: string, from: InstanceConfig): Promise<number> {
  const result = await apiGet(from, '/outbox');
  const letters: any[] = result.letters || [];
  let stored = 0;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO xenia_letters
    (id, encounter_id, from_instance, to_instance, content, in_reply_to, kind, written_at_cycle, delivered_at_cycle, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'letter', ?, NULL, ?)
  `);

  for (const letter of letters) {
    const to = routeLetter(encounterId, from.name, letter.inReplyTo || null);
    const info = insert.run(
      letter.id,
      encounterId,
      from.name,
      to,
      letter.content,
      letter.inReplyTo || null,
      letter.cycle || 0,
      Date.now()
    );
    if (info.changes > 0) {
      stored++;
      console.log(`[Bridge] Collected letter ${letter.id} from ${from.name} -> ${to} (cycle ${letter.cycle})`);
    }
  }
  return stored;
}

/** Deliver at most one due letter to the recipient (rate: 1 per interval). */
async function deliverDueLetter(encounterId: string, to: InstanceConfig, recipientClock: number): Promise<void> {
  const state = getDeliveryState(encounterId, to.name, recipientClock);

  if (state.delivered_count >= config.encounterMax) {
    return; // recipient quota reached; end handled in main loop
  }
  if (recipientClock < state.last_delivered_clock + config.exchangeInterval) {
    return; // not due yet
  }

  const pending = db.prepare(`
    SELECT * FROM xenia_letters
    WHERE encounter_id = ? AND to_instance = ? AND kind = 'letter' AND delivered_at_cycle IS NULL
    ORDER BY created_at ASC LIMIT 1
  `).get(encounterId, to.name) as any;

  if (!pending) {
    return; // nothing to deliver
  }

  await apiPost(to, '/deliver', {
    id: pending.id,
    encounterId,
    fromInstance: pending.from_instance,
    content: pending.content,
    inReplyTo: pending.in_reply_to,
    mode: config.mode,
    kind: 'letter',
    writtenAtCycle: pending.written_at_cycle
  });

  db.prepare(`UPDATE xenia_letters SET delivered_at_cycle = ? WHERE id = ?`)
    .run(recipientClock, pending.id);
  db.prepare(`
    UPDATE xenia_delivery_state SET last_delivered_clock = ?, delivered_count = delivered_count + 1
    WHERE encounter_id = ? AND instance = ?
  `).run(recipientClock, encounterId, to.name);

  console.log(`[Bridge] Delivered letter ${pending.id} (${pending.from_instance} -> ${to.name}) at clock ${recipientClock}`);
}

// ----------------------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------------------

async function tick(encounter: Encounter): Promise<void> {
  // Status sweep. An unreachable instance skips this tick for its own
  // collection/delivery but does not stall the others.
  const statuses = new Map<string, any>();
  for (const inst of instances) {
    try {
      statuses.set(inst.name, await apiGet(inst, '/status'));
    } catch (err) {
      console.warn(`[Bridge] ${inst.name} unreachable: ${(err as Error).message}`);
    }
  }

  const reachable = instances.filter(i => statuses.get(i.name)?.enabled);
  for (const inst of instances) {
    const s = statuses.get(inst.name);
    if (s && !s.enabled) {
      console.log(`[Bridge] ${inst.name} has XENIA disabled; skipping.`);
    }
  }

  for (const inst of reachable) {
    await deliverNoticeIfNeeded(encounter.id, inst, statuses.get(inst.name).systemClock);
  }

  // Collect first, then deliver: a letter can never bounce back within one tick.
  for (const inst of reachable) {
    await collectOutbox(encounter.id, inst);
  }

  for (const inst of reachable) {
    await deliverDueLetter(encounter.id, inst, statuses.get(inst.name).systemClock);
  }

  // End condition: every participant's recipient quota is exhausted.
  const states = db.prepare(`
    SELECT delivered_count FROM xenia_delivery_state WHERE encounter_id = ?
  `).all(encounter.id) as any[];
  if (states.length === instances.length && states.every(s => s.delivered_count >= config.encounterMax)) {
    endEncounter(encounter.id, 'max_reached');
    process.exit(0);
  }
}

async function main(): Promise<void> {
  console.log('[Bridge] XENIA Bridge starting');
  for (const inst of instances) {
    const neighbors = [...topology.get(inst.name)!].sort().join(', ');
    console.log(`[Bridge]   ${inst.name} @ ${inst.url}  <->  ${neighbors}`);
  }
  console.log(`[Bridge]   mode ${config.mode}, interval ${config.exchangeInterval} cycles, max ${config.encounterMax}/recipient, poll ${config.pollSeconds}s`);

  const encounter = loadOrCreateEncounter();

  const loop = async () => {
    try {
      await tick(encounter);
    } catch (err) {
      // Unexpected failure: log and retry next poll.
      console.warn(`[Bridge] tick failed: ${(err as Error).message}`);
    }
  };

  await loop();
  setInterval(loop, config.pollSeconds * 1000);
}

process.on('SIGINT', () => {
  console.log('\n[Bridge] Stopped by observer. Encounter left open (resume by restarting).');
  db.close();
  process.exit(0);
});

main().catch(err => {
  console.error('[Bridge] Fatal:', err);
  process.exit(1);
});
