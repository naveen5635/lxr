import { Router } from 'express';
import db from '../db.js';

const router = Router();

// POST /api/checkpoints — add a checkpoint to a session
router.post('/', (req, res) => {
  const { session_id, lat, lng, task_type, difficulty, order_num, label } = req.body;

  if (!session_id || lat == null || lng == null || !task_type || !difficulty)
    return res.status(400).json({ error: 'session_id, lat, lng, task_type and difficulty are required' });

  const validTypes = ['physical', 'cognitive', 'social', 'creative'];
  const validDiffs = ['easy', 'medium', 'hard'];
  if (!validTypes.includes(task_type)) return res.status(400).json({ error: 'Invalid task_type' });
  if (!validDiffs.includes(difficulty)) return res.status(400).json({ error: 'Invalid difficulty' });

  try {
    const nextOrder = order_num ?? (() => {
      const row = db
        .prepare('SELECT COALESCE(MAX(order_num), 0) + 1 AS next FROM checkpoints WHERE session_id = ?')
        .get(session_id);
      return row.next;
    })();

    const cpLabel = label?.trim() || `Checkpoint ${nextOrder}`;

    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO checkpoints (session_id, lat, lng, task_type, difficulty, order_num, label) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(session_id, lat, lng, task_type, difficulty, nextOrder, cpLabel);

    const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(lastInsertRowid);
    res.json(checkpoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/checkpoints/session/:sessionId
router.get('/session/:sessionId', (req, res) => {
  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE session_id = ? ORDER BY order_num')
    .all(req.params.sessionId);
  res.json(checkpoints);
});

// PUT /api/checkpoints/:id — update task_type, difficulty, label
router.put('/:id', (req, res) => {
  const { task_type, difficulty, label, lat, lng } = req.body;
  try {
    db.prepare(
      'UPDATE checkpoints SET task_type = COALESCE(?, task_type), difficulty = COALESCE(?, difficulty), label = COALESCE(?, label), lat = COALESCE(?, lat), lng = COALESCE(?, lng) WHERE id = ?'
    ).run(task_type ?? null, difficulty ?? null, label ?? null, lat ?? null, lng ?? null, req.params.id);

    const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(req.params.id);
    res.json(checkpoint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/checkpoints/:id
router.delete('/:id', (req, res) => {
  try {
    // Clear any cached tasks for this checkpoint
    db.prepare('DELETE FROM task_cache WHERE checkpoint_id = ?').run(req.params.id);
    db.prepare('DELETE FROM checkpoints WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
