import { Router } from 'express';
import db from '../db.js';

const router = Router();

// POST /api/complete — mark a checkpoint as completed
router.post('/complete', (req, res) => {
  const { teamId, checkpointId, timeTaken, answer } = req.body;

  if (!teamId || !checkpointId)
    return res.status(400).json({ error: 'teamId and checkpointId are required' });

  try {
    const existing = db
      .prepare('SELECT * FROM task_completions WHERE team_id = ? AND checkpoint_id = ?')
      .get(teamId, checkpointId);

    const hintsUsed = existing?.hints_used ?? 0;
    // Score: 100 base, –15 per hint, minimum 40
    const score = Math.max(40, 100 - hintsUsed * 15);

    if (existing) {
      db.prepare(
        'UPDATE task_completions SET time_taken = ?, score = ?, answer = ?, completed_at = CURRENT_TIMESTAMP WHERE team_id = ? AND checkpoint_id = ?'
      ).run(timeTaken ?? 0, score, answer ?? '', teamId, checkpointId);
    } else {
      db.prepare(
        'INSERT INTO task_completions (team_id, checkpoint_id, time_taken, hints_used, score, answer) VALUES (?, ?, ?, 0, ?, ?)'
      ).run(teamId, checkpointId, timeTaken ?? 0, score, answer ?? '');
    }

    // Find next checkpoint in sequence
    const currentCp = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(checkpointId);
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);

    const nextCp = db
      .prepare('SELECT * FROM checkpoints WHERE session_id = ? AND order_num = ? ORDER BY order_num LIMIT 1')
      .get(team.session_id, currentCp.order_num + 1);

    db.prepare('UPDATE teams SET current_checkpoint = ? WHERE id = ?')
      .run(nextCp ? nextCp.id : -1, teamId);

    res.json({
      success: true,
      score,
      hintsUsed,
      nextCheckpoint: nextCp ?? null,
      finished: !nextCp,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/completions/:teamId
router.get('/completions/:teamId', (req, res) => {
  const completions = db
    .prepare(`
      SELECT tc.*, c.order_num, c.task_type, c.difficulty, c.label, c.lat, c.lng
      FROM task_completions tc
      JOIN checkpoints c ON tc.checkpoint_id = c.id
      WHERE tc.team_id = ?
      ORDER BY c.order_num
    `)
    .all(req.params.teamId);
  res.json(completions);
});

export default router;
