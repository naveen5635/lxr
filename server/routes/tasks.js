import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Static fallback tasks when Claude API is unavailable
const FALLBACKS = {
  physical: {
    task: 'Team Plank Challenge',
    instructions:
      '1. Every team member gets into a plank position side by side.\n2. Hold the plank for 30 seconds while maintaining eye contact with the person next to you.\n3. If someone drops, the whole team starts their 30 seconds again.\n4. Complete two successful rounds.',
    completionCriteria: 'All team members hold a plank for 30 consecutive seconds (twice).',
    estimatedTime: '3 minutes',
    materials: 'None',
  },
  cognitive: {
    task: 'Nature Pattern Hunt',
    instructions:
      '1. Look around within a 5-metre radius.\n2. Find and name 10 different natural objects (leaf, pebble, bark, etc.).\n3. Group them into categories your team invents.\n4. Agree on the best category name for each group.',
    completionCriteria: 'Team agrees on 10 objects sorted into at least 3 categories.',
    estimatedTime: '5 minutes',
    materials: 'None',
  },
  social: {
    task: 'Team Story Circle',
    instructions:
      '1. Stand in a circle.\n2. One person starts a story with one sentence about your adventure today.\n3. Each person adds exactly one sentence.\n4. Go around the circle at least twice.\n5. End with a group cheer.',
    completionCriteria: 'Story has at least 8 sentences and the whole team laughs or cheers at the end.',
    estimatedTime: '4 minutes',
    materials: 'None',
  },
  creative: {
    task: 'Nature Sculpture',
    instructions:
      '1. Each person collects 3–5 objects from the ground (no living plants).\n2. Together, build a small sculpture that represents your team.\n3. Give it a name and a one-sentence description.\n4. Take a mental picture — you\'ll describe it at the finish.',
    completionCriteria: 'Sculpture stands for 30 seconds and team agrees it represents them.',
    estimatedTime: '6 minutes',
    materials: 'Natural objects found on the ground',
  },
};

// GET /api/task/:checkpointId/:teamId — generate (or retrieve cached) AI task
router.get('/task/:checkpointId/:teamId', async (req, res) => {
  const { checkpointId, teamId } = req.params;

  // Return cached task if it exists
  const cached = db
    .prepare('SELECT task_json FROM task_cache WHERE checkpoint_id = ? AND team_id = ?')
    .get(checkpointId, teamId);
  if (cached) return res.json(JSON.parse(cached.task_json));

  const checkpoint = db.prepare('SELECT * FROM checkpoints WHERE id = ?').get(checkpointId);
  if (!checkpoint) return res.status(404).json({ error: 'Checkpoint not found' });

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  // Adapt difficulty based on team speed
  const completions = db
    .prepare('SELECT time_taken FROM task_completions WHERE team_id = ? AND time_taken > 0')
    .all(teamId);

  let adaptedDifficulty = checkpoint.difficulty;
  if (completions.length >= 2) {
    const avg = completions.reduce((s, c) => s + c.time_taken, 0) / completions.length;
    if (avg < 120 && checkpoint.difficulty !== 'hard') adaptedDifficulty = 'hard';
    else if (avg > 360 && checkpoint.difficulty !== 'easy') adaptedDifficulty = 'easy';
  }

  const typeDescriptions = {
    physical: 'involves movement, exercise, balance, or coordination',
    cognitive: 'is a puzzle, quiz, observation challenge, or problem-solving task',
    social: 'requires teamwork, communication, trust, or collaboration',
    creative: 'involves drawing, storytelling, acting, or building something',
  };

  const prompt = `Generate a ${adaptedDifficulty} ${checkpoint.task_type} outdoor task for a team of students aged 12–16 participating in a PE scavenger hunt.

Task type: ${checkpoint.task_type} — this task ${typeDescriptions[checkpoint.task_type]}.
Difficulty: ${adaptedDifficulty}
Checkpoint: ${checkpoint.order_num} of the hunt

Rules:
- Must be safe to do outdoors
- Should take 3–8 minutes
- Needs no special equipment
- Be creative, fun, and age-appropriate

Return ONLY valid JSON (no markdown fences) exactly like this:
{
  "task": "Short task name (max 6 words)",
  "instructions": "Clear numbered step-by-step instructions",
  "completionCriteria": "Specific, observable sign that the task is done",
  "estimatedTime": "X minutes",
  "materials": "None OR simple materials already outside"
}`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('No API key');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const taskData = { ...JSON.parse(jsonMatch[0]), difficulty: adaptedDifficulty, type: checkpoint.task_type };
    db.prepare('INSERT OR REPLACE INTO task_cache (checkpoint_id, team_id, task_json) VALUES (?, ?, ?)').run(
      checkpointId, teamId, JSON.stringify(taskData)
    );
    res.json(taskData);
  } catch (err) {
    console.warn('Claude task generation failed, using fallback:', err.message);
    const fallback = { ...FALLBACKS[checkpoint.task_type], difficulty: adaptedDifficulty, type: checkpoint.task_type };
    db.prepare('INSERT OR REPLACE INTO task_cache (checkpoint_id, team_id, task_json) VALUES (?, ?, ?)').run(
      checkpointId, teamId, JSON.stringify(fallback)
    );
    res.json(fallback);
  }
});

export default router;
