// CommonJS version for debugging
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'sessions', 'aenea_sessions.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });

  console.log('\n=== DATABASE VERIFICATION ===\n');

  // 1. Check sessions table
  console.log('1. SESSIONS TABLE:');
  const sessions = db.prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 1').all();
  if (sessions.length > 0) {
    const latestSession = sessions[0];
    console.log('Latest session:', {
      sessionId: latestSession.session_id,
      systemClock: latestSession.system_clock,
      energy: latestSession.energy,
      totalQuestions: latestSession.total_questions,
      totalThoughts: latestSession.total_thoughts,
      status: latestSession.status,
      isRunning: Boolean(latestSession.is_running),
      isPaused: Boolean(latestSession.is_paused),
      createdAt: latestSession.created_at,
      updatedAt: latestSession.updated_at
    });
  } else {
    console.log('No sessions found');
  }

  // 2. Check questions table
  console.log('\n2. QUESTIONS TABLE:');
  const questionsCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  console.log('Total questions in DB:', questionsCount.count);

  const latestQuestion = db.prepare('SELECT * FROM questions ORDER BY timestamp DESC LIMIT 1').get();
  if (latestQuestion) {
    console.log('Latest question:', {
      id: latestQuestion.id,
      content: latestQuestion.content,
      category: latestQuestion.category,
      importance: latestQuestion.importance,
      source: latestQuestion.source,
      timestamp: latestQuestion.timestamp
    });
  }

  // 3. Check thought_cycles table
  console.log('\n3. THOUGHT_CYCLES TABLE:');
  const thoughtCyclesCount = db.prepare('SELECT COUNT(*) as count FROM thought_cycles').get();
  console.log('Total thought cycles in DB:', thoughtCyclesCount.count);

  // 4. Check DPD weights table
  console.log('\n4. DPD_WEIGHTS TABLE:');
  const dpdWeightsCount = db.prepare('SELECT COUNT(*) as count FROM dpd_weights').get();
  console.log('Total DPD weight records:', dpdWeightsCount.count);

  // 5. Show all table schemas
  console.log('\n5. TABLE SCHEMAS:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => {
    console.log(`\nTable: ${table.name}`);
    const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
  });

  db.close();
  console.log('\n=== DATABASE VERIFICATION COMPLETE ===');

} catch (error) {
  console.error('Error accessing database:', error);
}