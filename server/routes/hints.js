import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MAX_HINTS = 3;

const FALLBACK_HINTS = [
  { hint: "Take a step back and re-read the instructions carefully. What's the very first step asking you to do?", encouragement: "You've totally got this!" },
  { hint: "Focus on the completion criteria — it tells you exactly what 'done' looks like. Work backwards from there.", encouragement: "Almost there, keep pushing!" },
  { hint: "Break it into the smallest possible piece. Just do step 1, then stop and reassess.", encouragement: "One last push — you can nail it!" },
];

// POST /api/hint
router.post('/', async (req, res) => {
  const { teamId, checkpointId, taskJson } = req.body;

  if (!teamId || !checkpointId || !taskJson)
    return res.status(400).json({ error: 'teamId, checkpointId and taskJson are required' });

  // Check how many hints have already been used
  let completion = db
    .prepare('SELECT * FROM task_completions WHERE team_id = ? AND checkpoint_id = ?')
    .get(teamId, checkpointId);

  const hintsUsed = completion?.hints_used ?? 0;
  if (hintsUsed >= MAX_HINTS)
    return res.status(400).json({ error: 'Maximum hints reached for this checkpoint', hintsUsed });

  const task = typeof taskJson === 'string' ? JSON.parse(taskJson) : taskJson;
  const hintNumber = hintsUsed + 1;

  // Upsert the completion row to track hints
  if (completion) {
    db.prepare('UPDATE task_completions SET hints_used = hints_used + 1 WHERE team_id = ? AND checkpoint_id = ?')
      .run(teamId, checkpointId);
  } else {
    db.prepare('INSERT INTO task_completions (team_id, checkpoint_id, hints_used, score) VALUES (?, ?, 1, 100)')
      .run(teamId, checkpointId);
  }

  const prompt = `A student team (ages 12–16) is stuck on this outdoor scavenger hunt task:

Task: ${task.task}
Instructions: ${task.instructions}
Completion criteria: ${task.completionCriteria}

This is hint #${hintNumber} of a maximum ${MAX_HINTS}.

Write a hint that:
- Does NOT give away the answer directly
- Gets progressively more helpful (hint 1: vague encouragement, hint 2: specific guidance, hint 3: near-direct help)
- Is warm, friendly, and motivating for teenagers

Return ONLY valid JSON (no markdown):
{"hint": "The hint text", "encouragement": "A short motivating phrase (max 6 words)"}`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('No API key');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const hintData = JSON.parse(jsonMatch[0]);
    res.json({ ...hintData, hintsUsed: hintNumber, hintsRemaining: MAX_HINTS - hintNumber });
  } catch (err) {
    console.warn('Claude hint failed, using fallback:', err.message);
    const fallback = FALLBACK_HINTS[hintNumber - 1];
    res.json({ ...fallback, hintsUsed: hintNumber, hintsRemaining: MAX_HINTS - hintNumber });
  }
});

export default router;
