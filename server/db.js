// Uses Node.js built-in sqlite (available unflagged since Node 23.4 / Node 22 with --experimental-sqlite)
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, 'scavenger_hunt.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    join_code   TEXT    UNIQUE NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    status      TEXT    DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS checkpoints (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL,
    lat         REAL    NOT NULL,
    lng         REAL    NOT NULL,
    task_type   TEXT    NOT NULL,
    difficulty  TEXT    NOT NULL,
    order_num   INTEGER NOT NULL,
    label       TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS teams (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id          INTEGER NOT NULL,
    name                TEXT    NOT NULL,
    current_checkpoint  INTEGER DEFAULT 0,
    joined_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_completions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id       INTEGER NOT NULL,
    checkpoint_id INTEGER NOT NULL,
    time_taken    INTEGER DEFAULT 0,
    hints_used    INTEGER DEFAULT 0,
    score         INTEGER DEFAULT 100,
    answer        TEXT,
    completed_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id)       REFERENCES teams(id)       ON DELETE CASCADE,
    FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS task_cache (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    checkpoint_id INTEGER NOT NULL,
    team_id       INTEGER NOT NULL,
    task_json     TEXT    NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(checkpoint_id, team_id)
  );
`);

export default db;
