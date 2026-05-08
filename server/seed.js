import db from './db.js';

console.log('Seeding demo data...\n');

// ── Wipe existing demo ────────────────────────────────────────────────────────
const existing = db.prepare("SELECT id FROM sessions WHERE join_code = 'DEMO01'").get();
if (existing) {
  const sid = existing.id;
  const teamIds = db.prepare('SELECT id FROM teams WHERE session_id = ?').all(sid).map(t => t.id);
  const cpIds   = db.prepare('SELECT id FROM checkpoints WHERE session_id = ?').all(sid).map(c => c.id);

  teamIds.forEach(id => {
    db.prepare('DELETE FROM task_completions WHERE team_id = ?').run(id);
  });
  cpIds.forEach(id => {
    db.prepare('DELETE FROM task_cache WHERE checkpoint_id = ?').run(id);
  });
  db.prepare('DELETE FROM teams       WHERE session_id = ?').run(sid);
  db.prepare('DELETE FROM checkpoints WHERE session_id = ?').run(sid);
  db.prepare("DELETE FROM sessions    WHERE join_code  = 'DEMO01'").run();
}

// ── Create session ────────────────────────────────────────────────────────────
const { lastInsertRowid: sessionId } = db
  .prepare("INSERT INTO sessions (name, join_code, status) VALUES (?, 'DEMO01', 'active')")
  .run('Spring Field Day Hunt');

// ── Checkpoints ───────────────────────────────────────────────────────────────
const checkpoints = [
  { lat: 49.25460216243028,  lng: 7.04048242414636,   task_type: 'physical',  difficulty: 'easy',   order_num: 1, label: 'Starting Line'       },
  { lat: 49.254741508117874, lng: 7.042547725066189,  task_type: 'cognitive', difficulty: 'medium', order_num: 2, label: 'Brain Teaser Station' },
  { lat: 49.25732386273906,  lng: 7.0428852731889755, task_type: 'social',    difficulty: 'easy',   order_num: 3, label: 'Team Challenge Point' },
  { lat: 49.2554150857629,   lng: 7.041457937927682,  task_type: 'creative',  difficulty: 'medium', order_num: 4, label: 'Creative Corner'      },
];

const cpStmt = db.prepare(
  'INSERT INTO checkpoints (session_id, lat, lng, task_type, difficulty, order_num, label) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
checkpoints.forEach(cp =>
  cpStmt.run(sessionId, cp.lat, cp.lng, cp.task_type, cp.difficulty, cp.order_num, cp.label)
);

// ── Demo teams ────────────────────────────────────────────────────────────────
db.prepare("INSERT INTO teams (session_id, name, current_checkpoint) VALUES (?, 'Team Phoenix', 0)").run(sessionId);
db.prepare("INSERT INTO teams (session_id, name, current_checkpoint) VALUES (?, 'Team Falcon',  0)").run(sessionId);

console.log('Session  : "Spring Field Day Hunt"');
console.log('Code     : DEMO01');
console.log(`Waypoints: ${checkpoints.length}`);
console.log('Teams    : Team Phoenix, Team Falcon');
console.log('\n   Start the app and use join code DEMO01 to explore!\n');
