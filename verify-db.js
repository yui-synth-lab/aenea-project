import Database from 'better-sqlite3';
import path from 'path';

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

  const latestThoughtCycle = db.prepare('SELECT * FROM thought_cycles ORDER BY timestamp DESC LIMIT 1').get();
  if (latestThoughtCycle) {
    console.log('Latest thought cycle:', {
      id: latestThoughtCycle.id,
      sessionId: latestThoughtCycle.session_id,
      triggerId: latestThoughtCycle.trigger_id,
      duration: latestThoughtCycle.duration,
      timestamp: latestThoughtCycle.timestamp,
      stage_data: latestThoughtCycle.stage_data ? JSON.parse(latestThoughtCycle.stage_data) : null
    });
  }

  // 4. Check DPD weights table
  console.log('\n4. DPD_WEIGHTS TABLE:');
  const dpdWeightsCount = db.prepare('SELECT COUNT(*) as count FROM dpd_weights').get();
  console.log('Total DPD weight records:', dpdWeightsCount.count);

  const latestDpdWeights = db.prepare('SELECT * FROM dpd_weights ORDER BY timestamp DESC LIMIT 1').get();
  if (latestDpdWeights) {
    console.log('Latest DPD weights:', {
      empathy: latestDpdWeights.empathy,
      coherence: latestDpdWeights.coherence,
      dissonance: latestDpdWeights.dissonance,
      version: latestDpdWeights.version,
      timestamp: latestDpdWeights.timestamp,
      session_id: latestDpdWeights.session_id,
      event_type: latestDpdWeights.event_type
    });
  }

  // 5. Check unresolved_ideas table
  console.log('\n5. UNRESOLVED_IDEAS TABLE:');
  const unresolvedIdeasCount = db.prepare('SELECT COUNT(*) as count FROM unresolved_ideas').get();
  console.log('Total unresolved ideas:', unresolvedIdeasCount.count);

  // 6. Check significant_thoughts table
  console.log('\n6. SIGNIFICANT_THOUGHTS TABLE:');
  const significantThoughtsCount = db.prepare('SELECT COUNT(*) as count FROM significant_thoughts').get();
  console.log('Total significant thoughts:', significantThoughtsCount.count);

  db.close();
  console.log('\n=== DATABASE VERIFICATION COMPLETE ===');

} catch (error) {
  console.error('Error accessing database:', error);
}