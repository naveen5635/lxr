import { Router } from 'express';
import db from '../db.js';
import QRCode from 'qrcode';

const router = Router();

// POST /api/sessions — create a new session
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Session name is required' });

  // Generate a 6-char alphanumeric join code
  const join_code = Math.random().toString(36).slice(2, 8).toUpperCase();

  try {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO sessions (name, join_code) VALUES (?, ?)')
      .run(name.trim(), join_code);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(lastInsertRowid);
    res.json(session);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      // Extremely unlikely collision — just retry with a new code
      return router.handle(req, res);
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:code — get session by join code (student join)
router.get('/:code', (req, res) => {
  const session = db
    .prepare('SELECT * FROM sessions WHERE join_code = ?')
    .get(req.params.code.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE session_id = ? ORDER BY order_num')
    .all(session.id);

  res.json({ ...session, checkpoints });
});

// GET /api/sessions/id/:id — full session detail for teacher dashboard
router.get('/id/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE session_id = ? ORDER BY order_num')
    .all(session.id);

  const rawTeams = db.prepare('SELECT * FROM teams WHERE session_id = ?').all(session.id);

  const teams = rawTeams.map(team => {
    const completions = db
      .prepare(`
        SELECT tc.*, c.order_num, c.task_type, c.difficulty, c.label
        FROM task_completions tc
        JOIN checkpoints c ON tc.checkpoint_id = c.id
        WHERE tc.team_id = ?
        ORDER BY c.order_num
      `)
      .all(team.id);
    return { ...team, completions };
  });

  res.json({ ...session, checkpoints, teams });
});

// GET /api/sessions/:id/qr — generate QR code data URL
router.get('/:id/qr', async (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  try {
    const qr = await QRCode.toDataURL(session.join_code, { width: 300, margin: 2 });
    res.json({ qr, code: session.join_code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:code/join — student team joins a session
router.post('/:code/join', (req, res) => {
  const { teamName } = req.body;
  if (!teamName?.trim()) return res.status(400).json({ error: 'Team name is required' });

  const session = db
    .prepare('SELECT * FROM sessions WHERE join_code = ?')
    .get(req.params.code.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.status !== 'active')
    return res.status(400).json({ error: 'This session has ended' });

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE session_id = ? ORDER BY order_num')
    .all(session.id);

  if (checkpoints.length === 0)
    return res.status(400).json({ error: 'Session has no checkpoints yet' });

  try {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO teams (session_id, name, current_checkpoint) VALUES (?, ?, ?)')
      .run(session.id, teamName.trim(), checkpoints[0].id);

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(lastInsertRowid);
    res.json({ team, session: { ...session, checkpoints } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/sessions/:id/status — end / reactivate a session
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'ended'].includes(status))
    return res.status(400).json({ error: 'status must be active or ended' });

  db.prepare('UPDATE sessions SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

export default router;
