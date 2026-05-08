import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import db from '../db.js';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /api/report/:sessionId
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const checkpoints = db
    .prepare('SELECT * FROM checkpoints WHERE session_id = ? ORDER BY order_num')
    .all(sessionId);
  const teams = db.prepare('SELECT * FROM teams WHERE session_id = ?').all(sessionId);

  const teamStats = teams.map(team => {
    const completions = db
      .prepare(`
        SELECT tc.*, c.order_num, c.task_type, c.difficulty
        FROM task_completions tc
        JOIN checkpoints c ON tc.checkpoint_id = c.id
        WHERE tc.team_id = ?
        ORDER BY c.order_num
      `)
      .all(team.id);

    const totalScore = completions.reduce((s, c) => s + (c.score ?? 0), 0);
    const avgTime = completions.length
      ? Math.round(completions.reduce((s, c) => s + (c.time_taken ?? 0), 0) / completions.length)
      : 0;
    const totalHints = completions.reduce((s, c) => s + (c.hints_used ?? 0), 0);

    return {
      teamName: team.name,
      checkpointsCompleted: completions.length,
      totalCheckpoints: checkpoints.length,
      completionRate: Math.round((completions.length / checkpoints.length) * 100),
      totalScore,
      avgTimeSeconds: avgTime,
      totalHintsUsed: totalHints,
      taskBreakdown: completions.map(c => ({
        checkpoint: c.order_num,
        type: c.task_type,
        difficulty: c.difficulty,
        score: c.score,
        timeSeconds: c.time_taken,
        hints: c.hints_used,
      })),
    };
  });

  const prompt = `You are a physical education teacher reviewing results from an outdoor AR scavenger hunt.

Session: "${session.name}"
Total checkpoints: ${checkpoints.length} (types: ${checkpoints.map(c => c.task_type).join(', ')})
Teams participating: ${teams.length}

Team data:
${teamStats.map(t => `
Team: ${t.teamName}
  Completed: ${t.checkpointsCompleted}/${t.totalCheckpoints} (${t.completionRate}%)
  Total score: ${t.totalScore}
  Avg time per task: ${t.avgTimeSeconds}s
  Hints used: ${t.totalHintsUsed}
`).join('')}

Write a concise, encouraging teacher report. Return ONLY valid JSON (no markdown):
{
  "overallEngagement": "High/Medium/Low — one sentence explanation",
  "highlights": ["3–4 positive observations about the session"],
  "teamObservations": [{"team": "name", "observation": "1–2 sentence insight"}],
  "suggestions": ["3–4 actionable improvements for next time"],
  "physicalActivitySummary": "2–3 sentences on physical activity levels observed",
  "recommendedFollowUp": "One specific follow-up activity for the next class"
}`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('No API key');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const report = JSON.parse(jsonMatch[0]);
    res.json({ report, teamStats, session: { name: session.name, checkpoints: checkpoints.length, teams: teams.length } });
  } catch (err) {
    console.warn('Claude report failed, using basic summary:', err.message);
    res.json({
      report: {
        overallEngagement: 'Medium — data collected successfully.',
        highlights: [
          'All teams participated in a variety of task types.',
          teamStats.length > 0
            ? `${teamStats.sort((a, b) => b.totalScore - a.totalScore)[0].teamName} achieved the highest score.`
            : 'Good effort from all teams.',
          'Students engaged with physical, cognitive, social, and creative challenges.',
        ],
        teamObservations: teamStats.map(t => ({
          team: t.teamName,
          observation: `Completed ${t.checkpointsCompleted} of ${t.totalCheckpoints} checkpoints with a total score of ${t.totalScore}.`,
        })),
        suggestions: [
          'Add more variety in checkpoint difficulty.',
          'Consider increasing time between checkpoints for reflection.',
          'Introduce a bonus creative challenge at the end.',
        ],
        physicalActivitySummary: 'Teams were active throughout the session, moving between checkpoints and completing physical tasks.',
        recommendedFollowUp: 'Hold a group debrief discussing which task type was most challenging and why.',
      },
      teamStats,
      session: { name: session.name, checkpoints: checkpoints.length, teams: teams.length },
    });
  }
});

export default router;
