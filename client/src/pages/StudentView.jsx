import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessions, tasks, hints as hintsApi, completions } from '../api.js';
import StudentMap from '../components/StudentMap.jsx';
import TaskCard from '../components/TaskCard.jsx';
import HintPanel from '../components/HintPanel.jsx';
import ARView from '../components/ARView.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { haversine, fmtDistance, TASK_META, DIFF_META, UNLOCK_DISTANCE } from '../utils.js';

const PHASE = { JOIN: 'join', MAP: 'map', TASK: 'task', SUBMIT: 'submit', FINISHED: 'finished' };
const LS_KEY = 'orienteering_student_session';

function saveStudentSession(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ...data, savedAt: new Date().toISOString() })); }
  catch { /* ignore */ }
}
function loadStudentSession() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
  catch { return null; }
}
function clearStudentSession() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
}

export default function StudentView() {
  const navigate = useNavigate();

  const [joinCode, setJoinCode]       = useState('');
  const [teamName, setTeamName]       = useState('');
  const [joinError, setJoinError]     = useState('');
  const [joining, setJoining]         = useState(false);

  const [savedSession, setSavedSession] = useState(null);

  const [phase, setPhase]             = useState(PHASE.JOIN);
  const [team, setTeam]               = useState(null);
  const [session, setSession]         = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentCp, setCurrentCp]     = useState(null);

  const [userPos, setUserPos]         = useState(null);
  const [gpsError, setGpsError]       = useState('');
  const [distance, setDistance]       = useState(null);
  const watchId = useRef(null);

  const [task, setTask]               = useState(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskStartTime, setTaskStartTime] = useState(null);

  const [hintsList, setHintsList]     = useState([]);
  const [hintsUsed, setHintsUsed]     = useState(0);
  const [showHints, setShowHints]     = useState(false);
  const [hintLoading, setHintLoading] = useState(false);

  const [answer, setAnswer]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [showResults, setShowResults]   = useState(false);
  const [resultsData, setResultsData]   = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [showAR, setShowAR] = useState(false);

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported by this browser'); return; }
    watchId.current = navigator.geolocation.watchPosition(
      pos => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsError(''); },
      err => setGpsError(err.message || 'GPS unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
  }, []);

  useEffect(() => () => stopGPS(), [stopGPS]);

  useEffect(() => {
    const saved = loadStudentSession();
    if (saved) setSavedSession(saved);
  }, []);

  useEffect(() => {
    if (userPos && currentCp) setDistance(haversine(userPos.lat, userPos.lng, currentCp.lat, currentCp.lng));
  }, [userPos, currentCp]);

  async function handleJoin(e) {
    e.preventDefault();
    if (!joinCode.trim() || !teamName.trim()) return;
    setJoining(true); setJoinError('');
    try {
      const { data } = await sessions.join(joinCode.trim(), teamName.trim());
      setTeam(data.team);
      setSession(data.session);
      const cps = data.session.checkpoints;
      const cp  = cps.find(c => c.id === data.team.current_checkpoint) || cps[0];
      setCheckpoints(cps);
      setCurrentCp(cp);
      saveStudentSession({
        team: data.team,
        session: { id: data.session.id, name: data.session.name, join_code: joinCode.trim() },
        checkpoints: cps,
        currentCpId: cp.id,
      });
      setSavedSession(null);
      setPhase(PHASE.MAP);
      startGPS();
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Could not join. Check your code and try again.');
    } finally { setJoining(false); }
  }

  function handleResume() {
    const saved = loadStudentSession();
    if (!saved) return;
    setTeam(saved.team);
    setSession(saved.session);
    setCheckpoints(saved.checkpoints);
    const cp = saved.checkpoints.find(c => c.id === saved.currentCpId) || saved.checkpoints[0];
    setCurrentCp(cp);
    setPhase(PHASE.MAP);
    startGPS();
  }

  function handleStartFresh() {
    clearStudentSession();
    setSavedSession(null);
  }

  async function openResults() {
    setShowResults(true);
    if (resultsData) return;
    setResultsLoading(true);
    try {
      const { data } = await sessions.getById(session.id);
      setResultsData(data);
    } catch { /* show whatever we have */ }
    finally { setResultsLoading(false); }
  }

  async function handleUnlockTask() {
    setTaskLoading(true);
    setHintsList([]); setHintsUsed(0); setAnswer(''); setSubmitResult(null); setShowHints(false);
    try {
      const { data } = await tasks.generate(currentCp.id, team.id);
      setTask(data); setTaskStartTime(Date.now()); setPhase(PHASE.TASK);
    } catch (err) { console.error(err); }
    finally { setTaskLoading(false); }
  }

  async function handleRequestHint() {
    if (hintsUsed >= 3 || hintLoading) return;
    setHintLoading(true);
    try {
      const { data } = await hintsApi.get({ teamId: team.id, checkpointId: currentCp.id, taskJson: task });
      setHintsList(prev => [...prev, data]);
      setHintsUsed(data.hintsUsed);
      setShowHints(true);
    } catch (err) { console.error(err); }
    finally { setHintLoading(false); }
  }

  async function handleComplete() {
    setSubmitting(true);
    const timeTaken = taskStartTime ? Math.round((Date.now() - taskStartTime) / 1000) : 0;
    try {
      const { data } = await completions.submit({ teamId: team.id, checkpointId: currentCp.id, timeTaken, answer });
      setSubmitResult(data);
      if (data.finished) { setPhase(PHASE.FINISHED); stopGPS(); }
      else { setPhase(PHASE.SUBMIT); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  }

  function handleAdvance() {
    if (!submitResult?.nextCheckpoint) return;
    const nextCp = checkpoints.find(cp => cp.id === submitResult.nextCheckpoint.id);
    setCurrentCp(nextCp);
    const saved = loadStudentSession();
    if (saved && nextCp) saveStudentSession({ ...saved, currentCpId: nextCp.id });
    setTask(null); setPhase(PHASE.MAP);
  }

  const cpIndex   = checkpoints.findIndex(cp => cp.id === currentCp?.id);
  const canUnlock = distance !== null && distance <= UNLOCK_DISTANCE;
  const meta      = currentCp ? TASK_META[currentCp.task_type] : null;

  // ── AR OVERLAY ────────────────────────────────────────────────────────────
  if (showAR && phase === PHASE.MAP) {
    return (
      <ARView
        userPos={userPos}
        currentCp={currentCp}
        distance={distance}
        canUnlock={canUnlock}
        taskLoading={taskLoading}
        onClose={() => setShowAR(false)}
        onUnlock={() => { setShowAR(false); handleUnlockTask(); }}
      />
    );
  }

  // ── SCORES OVERLAY ────────────────────────────────────────────────────────
  if (showResults) {
    const sorted = resultsData?.teams
      ?.map(t => ({
        ...t,
        totalScore: t.completions?.reduce((s, c) => s + (c.score || 0), 0) || 0,
        done: t.completions?.length || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore) || [];

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-cyber-bg">
        <div className="scanlines" />
        <div className="bg-cyber-card border-b border-cyber-border px-4 py-4 flex items-center justify-between flex-shrink-0 relative z-10">
          <div>
            <h2 className="font-orbitron font-black text-cyber-cyan text-sm tracking-widest uppercase">Mission Standings</h2>
            <p className="text-xs text-cyber-muted font-mono-cyber mt-0.5">{session?.name}</p>
          </div>
          <button onClick={() => setShowResults(false)}
            className="w-9 h-9 rounded-xl border border-cyber-border text-cyber-muted hover:text-cyber-cyan hover:border-cyber-cyan transition-colors flex items-center justify-center text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
          {/* Own team summary */}
          {team && (
            <div className="cyber-card p-4" style={{ borderColor: '#00e5ff', boxShadow: '0 0 12px rgba(0,229,255,0.1)' }}>
              <div className="text-xs font-mono-cyber text-cyber-cyan uppercase tracking-widest mb-3">Your Squad</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-orbitron font-bold text-cyber-text text-base">{team.name}</div>
                  <div className="text-xs text-cyber-muted font-mono-cyber mt-1">
                    {resultsData?.teams?.find(t => t.id === team.id)?.completions?.length || 0}
                    /{checkpoints.length} waypoints cleared
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-orbitron font-black neon-text-cyan text-3xl">
                    {resultsData?.teams?.find(t => t.id === team.id)?.completions?.reduce((s, c) => s + (c.score || 0), 0) || 0}
                  </div>
                  <div className="text-xs text-cyber-muted font-mono-cyber">pts</div>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {checkpoints.map((cp, i) => {
                  const myTeam = resultsData?.teams?.find(t => t.id === team.id);
                  const done = myTeam?.completions?.some(c => c.checkpoint_id === cp.id);
                  const isCurrent = cp.id === currentCp?.id;
                  return (
                    <div key={cp.id} className="flex-1 h-2 rounded-full"
                      style={{
                        background: done ? '#00ff85' : isCurrent ? '#00e5ff' : '#1a1a40',
                        boxShadow: done ? '0 0 6px rgba(0,255,133,0.5)' : isCurrent ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {resultsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <div className="text-xs text-cyber-muted font-mono-cyber">Loading standings...</div>
            </div>
          ) : sorted.length > 0 ? (
            <div>
              <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-3">All Squads</div>
              <div className="space-y-2">
                {sorted.map((t, i) => {
                  const isMe = t.id === team?.id;
                  return (
                    <div key={t.id} className="rounded-xl px-4 py-3 flex items-center gap-3 border"
                      style={{ background: isMe ? 'rgba(0,229,255,0.06)' : '#0c0c1e', borderColor: isMe ? '#00e5ff' : '#1a1a40' }}>
                      <span className={`font-orbitron font-black text-lg w-7 text-center flex-shrink-0
                        ${i === 0 ? 'neon-text-yellow' : 'text-cyber-muted'}`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold text-sm truncate ${isMe ? 'text-cyber-cyan' : 'text-cyber-text'}`}>
                          {t.name}
                          {isMe && <span className="text-xs font-mono-cyber text-cyber-cyan/60 ml-2">(you)</span>}
                        </div>
                        <div className="text-xs text-cyber-muted font-mono-cyber mt-0.5">
                          {t.done}/{checkpoints.length} waypoints
                        </div>
                      </div>
                      <span className={`font-orbitron font-black text-xl ${isMe ? 'neon-text-cyan' : 'text-cyber-text'}`}>
                        {t.totalScore}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-cyber-muted text-sm font-mono-cyber">
              No standings yet — complete a waypoint to appear here.
            </div>
          )}
        </div>

        <div className="p-4 flex-shrink-0 relative z-10">
          <button onClick={() => setShowResults(false)}
            className="cyber-btn-cyan w-full h-14 font-orbitron tracking-widest uppercase text-sm">
            Back to Mission
          </button>
        </div>
      </div>
    );
  }

  // ── JOIN ─────────────────────────────────────────────────────────────────
  if (phase === PHASE.JOIN) {
    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col items-center justify-center p-5 relative overflow-hidden">
        <div className="scanlines" />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,229,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.03) 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-cyber-cyan bg-cyber-cyan/5 flex items-center justify-center"
                 style={{ boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-cyan">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 6 L14.5 12 L12 10.5 L9.5 12 Z" fill="currentColor" stroke="none"/>
                <path d="M12 18 L9.5 12 L12 13.5 L14.5 12 Z" fill="currentColor" stroke="none" opacity="0.35"/>
              </svg>
            </div>
            <h1 className="font-orbitron text-3xl font-black neon-text-cyan tracking-widest uppercase">Join Mission</h1>
            <p className="text-cyber-muted mt-2 text-sm font-mono-cyber">Enter your squad name and mission code</p>
          </div>

          {/* Resume Mission card */}
          {savedSession && (
            <div className="cyber-card mb-5 p-5"
                 style={{ borderColor: '#b44fff', boxShadow: '0 0 16px rgba(180,79,255,0.15)' }}>
              <div className="text-xs font-mono-cyber uppercase tracking-widest mb-3"
                   style={{ color: '#b44fff' }}>Resume Mission</div>
              <div className="flex items-center justify-between mb-1">
                <div className="font-orbitron font-bold text-cyber-text text-base">{savedSession.team?.name}</div>
                <span className="text-xs font-mono-cyber px-2.5 py-1 rounded border"
                      style={{ borderColor: '#b44fff', color: '#b44fff', background: 'rgba(180,79,255,0.08)' }}>
                  {savedSession.session?.join_code}
                </span>
              </div>
              <div className="text-xs text-cyber-muted font-mono-cyber mb-1">{savedSession.session?.name}</div>
              <div className="text-xs text-cyber-muted font-mono-cyber mb-4">
                Waypoint {(savedSession.checkpoints?.findIndex(c => c.id === savedSession.currentCpId) ?? 0) + 1}
                {' / '}{savedSession.checkpoints?.length}
              </div>
              <button
                onClick={handleResume}
                className="w-full h-14 font-orbitron font-black tracking-widest uppercase rounded-xl text-sm transition-all"
                style={{
                  background: 'rgba(180,79,255,0.12)',
                  border: '1px solid #b44fff',
                  color: '#b44fff',
                  boxShadow: '0 0 12px rgba(180,79,255,0.2)',
                }}
              >
                Continue Mission
              </button>
              <button
                onClick={handleStartFresh}
                className="mt-3 w-full text-xs text-cyber-muted text-center font-mono-cyber hover:text-cyber-cyan transition-colors"
              >
                Start a new mission instead
              </button>
            </div>
          )}

          <div className="cyber-card corner-accent p-6">
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">
                  Squad Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Phoenix"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="cyber-input w-full h-14 text-base"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">
                  Mission Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEMO01"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="cyber-input w-full h-14 font-mono-cyber text-2xl tracking-[0.3em] text-cyber-cyan text-center uppercase"
                  maxLength={8}
                  autoComplete="off"
                />
              </div>
              {joinError && (
                <div className="bg-cyber-pink/10 border border-cyber-pink/40 text-cyber-pink text-sm px-4 py-3 rounded-xl font-mono-cyber">
                  {joinError}
                </div>
              )}
              <button
                type="submit"
                disabled={!teamName.trim() || !joinCode.trim() || joining}
                className="cyber-btn-solid-cyan w-full h-16 text-lg font-orbitron tracking-widest uppercase"
              >
                {joining ? 'Connecting...' : 'Enter Mission'}
              </button>
            </form>
          </div>

          <button onClick={() => navigate('/')} className="mt-6 w-full text-cyber-muted text-sm text-center hover:text-cyber-cyan transition-colors font-mono-cyber">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── MAP ──────────────────────────────────────────────────────────────────
  if (phase === PHASE.MAP) {
    return (
      <div className="h-screen flex flex-col bg-cyber-bg">
        <div className="bg-cyber-card/95 backdrop-blur border-b border-cyber-border px-4 py-3 flex items-center justify-between relative z-10">
          <div>
            <div className="font-orbitron font-bold text-cyber-cyan text-sm tracking-wide">{team.name}</div>
            <div className="text-xs text-cyber-muted font-mono-cyber">{session.name}</div>
          </div>
          <button onClick={openResults}
            className="text-xs font-mono-cyber px-3 py-1.5 rounded-lg border border-cyber-purple/50 text-cyber-purple bg-cyber-purple/10 hover:bg-cyber-purple/20 transition-colors">
            Scores
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="text-right">
              <div className="text-xs text-cyber-muted font-mono-cyber tracking-widest">Waypoint</div>
              <div className="font-orbitron font-bold text-cyber-cyan">
                {cpIndex + 1}<span className="text-cyber-muted text-sm">/{checkpoints.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-cyber-border relative z-10">
          <div className="h-1 transition-all duration-700"
            style={{
              width: `${(cpIndex / checkpoints.length) * 100}%`,
              background: 'linear-gradient(90deg,#00e5ff,#b44fff)',
              boxShadow: '0 0 8px rgba(0,229,255,0.5)',
            }}
          />
        </div>

        <div className="flex-1 relative">
          <StudentMap userPos={userPos} checkpoints={checkpoints} currentCp={currentCp} />
          {gpsError && (
            <div className="absolute top-3 left-3 right-3 bg-cyber-yellow/10 border border-cyber-yellow/40 text-cyber-yellow text-xs px-3 py-2 rounded-xl z-10 font-mono-cyber">
              {gpsError}
            </div>
          )}
          <button onClick={handleUnlockTask} disabled={taskLoading}
            className="absolute top-3 right-3 z-20 text-xs text-cyber-cyan/50 underline font-mono-cyber bg-cyber-bg/70 px-2 py-1 rounded">
            Demo: skip GPS
          </button>
        </div>

        <div className="bg-cyber-card/95 backdrop-blur border-t border-cyber-border px-4 pt-4 pb-5 safe-bottom relative z-10">
          {currentCp && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${meta?.color}`}>
                  {meta?.label} ({meta?.tag})
                </span>
                <div className="text-right">
                  <div className="text-xs text-cyber-muted font-mono-cyber">Distance</div>
                  <div className={`font-orbitron font-black text-2xl ${canUnlock ? 'neon-text-green' : 'text-cyber-cyan'}`}>
                    {userPos ? fmtDistance(distance) : '--'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="font-bold text-cyber-text text-base">{currentCp.label}</div>
                <div className="text-xs font-mono-cyber mt-0.5">
                  {canUnlock
                    ? <span className="neon-text-green">In range — objective unlocked</span>
                    : <span className="text-cyber-muted">Move within {UNLOCK_DISTANCE}m to unlock</span>}
                </div>
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setShowAR(true)}
                  className="flex-1 h-12 flex items-center justify-center gap-2 font-orbitron font-bold text-sm tracking-wide uppercase rounded-xl border border-cyber-purple/60 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20 transition-colors"
                  style={{ boxShadow: '0 0 10px rgba(180,79,255,0.15)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                  AR View
                </button>
                <button
                  onClick={handleUnlockTask}
                  disabled={!canUnlock || taskLoading}
                  className={`flex-1 h-12 text-sm font-orbitron tracking-widest uppercase rounded-xl font-black transition-all
                    ${canUnlock
                      ? 'bg-cyber-green/10 border border-cyber-green text-cyber-green hover:bg-cyber-green/20'
                      : 'bg-cyber-border/30 border border-cyber-border text-cyber-muted cursor-not-allowed'}`}
                  style={canUnlock ? { boxShadow: '0 0 12px rgba(0,255,133,0.3)' } : {}}
                >
                  {taskLoading ? 'Loading...' : canUnlock ? 'Unlock' : 'Get Closer'}
                </button>
              </div>

            </>
          )}
        </div>
      </div>
    );
  }

  // ── TASK ─────────────────────────────────────────────────────────────────
  if (phase === PHASE.TASK) {
    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col">
        <div className="scanlines" />

        <header className="bg-cyber-card border-b border-cyber-border px-4 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-orbitron font-bold text-cyber-cyan text-xs tracking-widest">{team.name}</div>
              <div className="text-xs text-cyber-muted font-mono-cyber">Waypoint {cpIndex+1} of {checkpoints.length}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={openResults}
                className="text-xs font-mono-cyber px-3 py-1.5 rounded-lg border border-cyber-purple/50 text-cyber-purple bg-cyber-purple/10 hover:bg-cyber-purple/20 transition-colors">
                Scores
              </button>
              {task && (
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${meta?.color}`}>
                    {meta?.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${DIFF_META[task.difficulty]?.color}`}>
                    {DIFF_META[task.difficulty]?.label}
                  </span>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
          <div className="flex gap-1 mt-2.5">
            {checkpoints.map((cp, i) => (
              <div key={cp.id} className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background: i < cpIndex ? '#00ff85' : i === cpIndex ? '#00e5ff' : '#1a1a40',
                  boxShadow: i === cpIndex ? '0 0 6px rgba(0,229,255,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
          {task && <TaskCard task={task} />}
          {showHints && hintsList.length > 0 && <HintPanel hints={hintsList} />}
        </div>

        <div className="bg-cyber-card border-t border-cyber-border px-4 pt-4 pb-5 safe-bottom space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHints(v => !v)}
              disabled={hintsList.length === 0}
              className="text-sm text-cyber-muted underline font-mono-cyber disabled:opacity-40"
            >
              {hintsList.length > 0 ? `${showHints ? 'Hide' : 'Show'} hints (${hintsList.length})` : 'No hints yet'}
            </button>
            <button
              onClick={handleRequestHint}
              disabled={hintsUsed >= 3 || hintLoading}
              className={`h-12 px-4 rounded-xl font-bold text-sm font-mono-cyber transition-colors
                ${hintsUsed >= 3
                  ? 'bg-cyber-border/20 text-cyber-muted cursor-not-allowed border border-cyber-border'
                  : 'bg-cyber-yellow/10 border border-cyber-yellow text-cyber-yellow hover:bg-cyber-yellow/20'}`}
            >
              {hintLoading ? 'Loading...' : hintsUsed >= 3 ? 'No hints left' : `Get Hint (${3 - hintsUsed} left)`}
            </button>
          </div>

          <button
            onClick={() => setPhase(PHASE.SUBMIT)}
            className="cyber-btn-green w-full h-16 text-lg font-orbitron tracking-widest uppercase"
          >
            Task Complete — Submit
          </button>
        </div>
      </div>
    );
  }

  // ── SUBMIT ───────────────────────────────────────────────────────────────
  if (phase === PHASE.SUBMIT) {
    const hasResult = !!submitResult;

    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col">
        <div className="scanlines" />
        <header className="bg-cyber-card border-b border-cyber-border px-4 py-3 relative z-10">
          <div className="font-orbitron font-bold text-cyber-cyan text-sm tracking-widest">
            {team.name} · Waypoint {cpIndex + 1}
          </div>
          <div className="text-xs text-cyber-muted font-mono-cyber">Submit your mission report</div>
        </header>

        <div className="flex-1 p-4 space-y-4 relative z-10">
          {!hasResult ? (
            <>
              <div className="cyber-card p-4">
                <div className="font-bold text-cyber-text text-base">{task?.task}</div>
                <div className="text-xs text-cyber-muted mt-1 font-mono-cyber">Done when: {task?.completionCriteria}</div>
              </div>
              <div>
                <label className="block text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">
                  Mission Notes (optional)
                </label>
                <textarea
                  rows={4}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Describe what your squad did..."
                  className="cyber-input w-full py-3 text-sm resize-none"
                />
              </div>
              {hintsUsed > 0 && (
                <div className="bg-cyber-yellow/10 border border-cyber-yellow/40 rounded-xl px-4 py-3 font-mono-cyber text-sm text-cyber-yellow">
                  {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''} used — score: {Math.max(40, 100 - hintsUsed * 15)} pts
                </div>
              )}
            </>
          ) : (
            <div className="cyber-card corner-accent p-8 text-center"
                 style={{ borderColor: '#00ff85', boxShadow: '0 0 20px rgba(0,255,133,0.2)' }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-cyber-green bg-cyber-green/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-green">
                  <polyline points="4,12 10,18 20,6"/>
                </svg>
              </div>
              <div className="font-orbitron text-4xl font-black neon-text-green">{submitResult.score}</div>
              <div className="text-cyber-green font-mono-cyber text-sm mt-1">Points Earned</div>
              <div className="text-cyber-muted text-sm mt-4 font-mono-cyber">
                {submitResult.nextCheckpoint
                  ? `Next: ${submitResult.nextCheckpoint.label}`
                  : 'All objectives complete!'}
              </div>
            </div>
          )}
        </div>

        <div className="bg-cyber-card border-t border-cyber-border px-4 pt-4 pb-5 safe-bottom relative z-10">
          {!hasResult ? (
            <button onClick={handleComplete} disabled={submitting}
              className="cyber-btn-cyan w-full h-16 text-lg font-orbitron tracking-widest uppercase disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit and Score'}
            </button>
          ) : submitResult?.nextCheckpoint ? (
            <button onClick={handleAdvance}
              className="cyber-btn-solid-cyan w-full h-16 text-lg font-orbitron tracking-widest uppercase">
              Next Waypoint
            </button>
          ) : (
            <button onClick={() => setPhase(PHASE.FINISHED)}
              className="cyber-btn-green w-full h-16 text-lg font-orbitron tracking-widest uppercase">
              View Final Results
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── FINISHED ─────────────────────────────────────────────────────────────
  if (phase === PHASE.FINISHED) {
    return (
      <div className="min-h-screen bg-cyber-bg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="scanlines" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,133,0.05) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-cyber-green bg-cyber-green/10 flex items-center justify-center animate-float"
               style={{ boxShadow: '0 0 30px rgba(0,255,133,0.3)' }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-green">
              <polyline points="4,12 10,18 20,6"/>
            </svg>
          </div>
          <h1 className="font-orbitron text-4xl font-black neon-text-green tracking-wider uppercase">{team.name}</h1>
          <p className="text-cyber-green font-mono-cyber text-lg mt-2 tracking-widest">Mission Complete</p>

          <div className="cyber-card mt-8 inline-block px-10 py-6"
               style={{ borderColor: '#00ff85', boxShadow: '0 0 20px rgba(0,255,133,0.2)' }}>
            <div className="text-cyber-muted font-mono-cyber text-xs tracking-widest mb-1">Objectives Cleared</div>
            <div className="font-orbitron text-6xl font-black neon-text-green">
              {checkpoints.length}<span className="text-cyber-muted text-2xl">/{checkpoints.length}</span>
            </div>
          </div>

          <p className="text-cyber-muted text-sm mt-8 max-w-xs font-mono-cyber">
            Outstanding work. Check in with your commander for the final debrief.
          </p>

          <div className="flex flex-col items-center gap-3 mt-8">
            <button onClick={openResults}
              className="cyber-btn-cyan w-64 h-14 text-base font-orbitron tracking-widest uppercase">
              View Standings
            </button>
            <button onClick={() => { clearStudentSession(); navigate('/'); }}
              className="cyber-btn-green w-64 h-14 text-base font-orbitron tracking-widest uppercase">
              Return to Base
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
