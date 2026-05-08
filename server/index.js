import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import sessionsRouter    from './routes/sessions.js';
import checkpointsRouter from './routes/checkpoints.js';
import tasksRouter       from './routes/tasks.js';
import hintsRouter       from './routes/hints.js';
import completionsRouter from './routes/completions.js';
import reportsRouter     from './routes/reports.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/sessions',     sessionsRouter);
app.use('/api/checkpoints',  checkpointsRouter);
app.use('/api',              tasksRouter);       // /api/task/:cpId/:teamId
app.use('/api/hint',         hintsRouter);
app.use('/api',              completionsRouter); // /api/complete, /api/completions/:teamId
app.use('/api/report',       reportsRouter);

// ── Static client (production) ───────────────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎯 AR Scavenger Hunt server running → http://localhost:${PORT}`);
  console.log(`   Set ANTHROPIC_API_KEY in .env to enable AI features.\n`);
});
