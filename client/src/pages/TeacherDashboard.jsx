import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessions, checkpoints as cpApi } from '../api.js';
import MapPicker from '../components/MapPicker.jsx';
import QRDisplay from '../components/QRDisplay.jsx';

const STEPS = ['NAME', 'PLACE', 'LAUNCH'];
const LS_KEY = 'orienteering_teacher_sessions';

const TYPE_META = {
  physical:  { label: 'Physical',  cls: 'border-red-500/40    text-red-400    bg-red-500/10'    },
  cognitive: { label: 'Cognitive', cls: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10' },
  social:    { label: 'Social',    cls: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' },
  creative:  { label: 'Creative',  cls: 'border-pink-500/40   text-pink-400   bg-pink-500/10'   },
};
const DIFF_META = {
  easy:   { cls: 'text-emerald-400 bg-emerald-500/10' },
  medium: { cls: 'text-amber-400   bg-amber-500/10'   },
  hard:   { cls: 'text-red-400     bg-red-500/10'     },
};

// ── localStorage helpers ────────────────────────────────────────────────────
function loadSavedSessions() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveSessionToHistory(s) {
  try {
    const existing = loadSavedSessions().filter(x => x.id !== s.id);
    const updated  = [{ id: s.id, name: s.name, join_code: s.join_code, saved_at: new Date().toISOString() }, ...existing].slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

function removeSessionFromHistory(id) {
  try {
    const updated = loadSavedSessions().filter(x => x.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export default function TeacherDashboard() {
  const navigate = useNavigate();

  const [step, setStep]               = useState(0);
  const [sessionName, setSessionName] = useState('');
  const [session, setSession]         = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Rejoin state
  const [savedSessions, setSavedSessions] = useState([]);
  const [rejoinCode, setRejoinCode]       = useState('');
  const [rejoining, setRejoining]         = useState(false);
  const [rejoinError, setRejoinError]     = useState('');

  // GPS location for map centering
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]     = useState('');
  const [mapFlyTo, setMapFlyTo]     = useState(null);

  useEffect(() => {
    setSavedSessions(loadSavedSessions());
  }, []);

  function handleUseMyLocation() {
    if (!navigator.geolocation) { setGpsError('GPS not supported by this browser'); return; }
    setGpsLoading(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setMapFlyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude, _key: Date.now() });
        setGpsLoading(false);
      },
      err => { setGpsError('Could not get location. Check browser permissions.'); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Create new session ──────────────────────────────────────────────────
  async function handleCreateSession(e) {
    e.preventDefault();
    if (!sessionName.trim()) return;
    setLoading(true); setError('');
    try {
      const { data } = await sessions.create(sessionName.trim());
      saveSessionToHistory(data);
      setSavedSessions(loadSavedSessions());
      setSession(data);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create session');
    } finally { setLoading(false); }
  }

  // ── Rejoin by join code ─────────────────────────────────────────────────
  async function handleRejoin(e) {
    e.preventDefault();
    if (!rejoinCode.trim()) return;
    setRejoining(true); setRejoinError('');
    try {
      const { data } = await sessions.getByCode(rejoinCode.trim());
      saveSessionToHistory(data);
      setSavedSessions(loadSavedSessions());
      navigate(`/teacher/session/${data.id}`);
    } catch (err) {
      setRejoinError(err.response?.status === 404 ? 'No session found with that code.' : (err.response?.data?.error || 'Could not rejoin session'));
    } finally { setRejoining(false); }
  }

  // ── Rejoin from saved history ───────────────────────────────────────────
  async function handleRejoinSaved(saved) {
    try {
      // Verify session still exists
      const { data } = await sessions.getById(saved.id);
      saveSessionToHistory(data);
      setSavedSessions(loadSavedSessions());
      navigate(`/teacher/session/${data.id}`);
    } catch {
      // Session gone — remove from history
      removeSessionFromHistory(saved.id);
      setSavedSessions(loadSavedSessions());
      setRejoinError(`Session "${saved.name}" no longer exists on this server.`);
    }
  }

  function handleRemoveSaved(e, id) {
    e.stopPropagation();
    removeSessionFromHistory(id);
    setSavedSessions(loadSavedSessions());
  }

  // ── Checkpoint handlers ─────────────────────────────────────────────────
  async function handleAddCheckpoint(cpData) {
    setError('');
    try {
      const { data } = await cpApi.add({ ...cpData, session_id: session.id });
      setCheckpoints(prev => [...prev, data]);
    } catch (err) { setError(err.response?.data?.error || 'Failed to add checkpoint'); }
  }

  async function handleDeleteCheckpoint(id) {
    try {
      await cpApi.remove(id);
      setCheckpoints(prev => prev.filter(cp => cp.id !== id));
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete'); }
  }

  async function handleUpdateCheckpoint(id, updates) {
    try {
      const { data } = await cpApi.update(id, updates);
      setCheckpoints(prev => prev.map(cp => (cp.id === id ? data : cp)));
    } catch (err) { setError(err.response?.data?.error || 'Failed to update'); }
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  }

  return (
    <div className="min-h-screen bg-cyber-bg">
      <div className="scanlines" />

      {/* Header */}
      <header className="bg-cyber-card border-b border-cyber-border px-4 py-3 flex items-center gap-4 relative z-10">
        <button onClick={() => navigate('/')} className="text-cyber-muted hover:text-cyber-cyan transition-colors text-xl">←</button>
        <div>
          <h1 className="font-orbitron font-bold text-cyber-cyan text-sm tracking-widest uppercase">
            Mission Control
          </h1>
          {session && (
            <p className="text-xs text-cyber-muted font-mono-cyber">
              {session.name} · CODE: <span className="text-cyber-cyan">{session.join_code}</span>
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-xs font-orbitron font-bold flex items-center justify-center border transition-all
                ${i < step  ? 'border-cyber-green  bg-cyber-green/10  text-cyber-green'
                : i === step ? 'border-cyber-cyan   bg-cyber-cyan/10   text-cyber-cyan shadow-neon-cyan'
                :              'border-cyber-border bg-transparent     text-cyber-muted'}`}>
                {i < step ? 'OK' : i + 1}
              </div>
              <span className={`text-xs font-mono-cyber hidden md:block tracking-widest ${i === step ? 'text-cyber-cyan' : 'text-cyber-muted'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-5 h-px bg-cyber-border mx-1" />}
            </div>
          ))}
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 bg-cyber-pink/10 border border-cyber-pink/40 text-cyber-pink text-sm px-4 py-2 rounded-xl font-mono-cyber relative z-10">
          {error}
        </div>
      )}

      {/* ── Step 0: New session + Rejoin ─────────────────────────────────────── */}
      {step === 0 && (
        <div className="max-w-2xl mx-auto p-6 mt-10 relative z-10 space-y-5">

          <div className="grid sm:grid-cols-2 gap-5">

            {/* Create new */}
            <div className="cyber-card corner-accent p-6">
              <div className="w-12 h-12 mb-4 rounded-xl border-2 border-cyber-cyan bg-cyber-cyan/5 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyber-cyan">
                  <line x1="11" y1="3" x2="11" y2="19"/><line x1="3" y1="11" x2="19" y2="11"/>
                </svg>
              </div>
              <h2 className="font-orbitron text-lg font-black neon-text-cyan tracking-wider uppercase mb-1">
                New Mission
              </h2>
              <p className="text-cyber-muted text-xs mb-5 font-mono-cyber">
                Create a fresh scavenger hunt session
              </p>
              <form onSubmit={handleCreateSession} className="space-y-3">
                <input
                  type="text"
                  placeholder="Mission name..."
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="cyber-input w-full h-12 text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!sessionName.trim() || loading}
                  className="cyber-btn-solid-cyan w-full h-12 text-sm font-orbitron tracking-widest uppercase"
                >
                  {loading ? 'Creating...' : 'Create Session →'}
                </button>
              </form>
            </div>

            {/* Rejoin by code */}
            <div className="cyber-card corner-accent p-6" style={{ borderColor: '#b44fff22' }}>
              <div className="w-12 h-12 mb-4 rounded-xl border-2 border-cyber-purple bg-cyber-purple/5 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-purple">
                  <path d="M4 11 A7 7 0 1 1 11 18"/>
                  <polyline points="4,7 4,11 8,11"/>
                </svg>
              </div>
              <h2 className="font-orbitron text-lg font-black tracking-wider uppercase mb-1" style={{ color: '#b44fff', textShadow: '0 0 12px rgba(180,79,255,0.7)' }}>
                Rejoin Session
              </h2>
              <p className="text-cyber-muted text-xs mb-5 font-mono-cyber">
                Enter a join code to resume monitoring
              </p>
              <form onSubmit={handleRejoin} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter join code..."
                  value={rejoinCode}
                  onChange={e => setRejoinCode(e.target.value.toUpperCase())}
                  className="cyber-input w-full h-12 text-sm font-mono-cyber tracking-widest text-cyber-cyan text-center uppercase"
                  maxLength={8}
                />
                {rejoinError && (
                  <p className="text-cyber-pink text-xs font-mono-cyber">{rejoinError}</p>
                )}
                <button
                  type="submit"
                  disabled={!rejoinCode.trim() || rejoining}
                  className="w-full h-12 text-sm font-orbitron tracking-widest uppercase rounded-xl border border-cyber-purple text-cyber-purple bg-cyber-purple/10 hover:bg-cyber-purple/20 transition-all disabled:opacity-40"
                >
                  {rejoining ? 'Looking up...' : 'Rejoin →'}
                </button>
              </form>
            </div>
          </div>

          {/* Recent sessions */}
          {savedSessions.length > 0 && (
            <div className="cyber-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron font-bold text-xs tracking-widest uppercase text-cyber-muted">
                  Recent Sessions
                </h3>
                <button
                  onClick={() => { localStorage.removeItem(LS_KEY); setSavedSessions([]); }}
                  className="text-xs text-cyber-dim hover:text-cyber-pink transition-colors font-mono-cyber"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {savedSessions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => handleRejoinSaved(s)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-cyber-border hover:border-cyber-cyan hover:bg-cyber-cyan/5 cursor-pointer transition-all group"
                  >
                    {/* Code badge */}
                    <div className="w-16 h-10 rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono-cyber text-cyber-cyan text-xs font-bold tracking-widest">{s.join_code}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-cyber-text text-sm truncate group-hover:text-cyber-cyan transition-colors">
                        {s.name}
                      </div>
                      <div className="text-xs text-cyber-muted font-mono-cyber mt-0.5">
                        Saved {fmtDate(s.saved_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity font-mono-cyber">
                        Open →
                      </span>
                      <button
                        onClick={e => handleRemoveSaved(e, s.id)}
                        className="text-cyber-dim hover:text-cyber-pink transition-colors text-base leading-none px-1"
                        title="Remove from history"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-cyber-dim font-mono-cyber mt-3 text-center">
                Sessions are saved in this browser. Click any to resume monitoring.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Place checkpoints on map ─────────────────────────────────── */}
      {step === 1 && session && (
        <div className="flex flex-col lg:flex-row relative z-10" style={{ height: 'calc(100vh - 57px)' }}>
          <aside className="w-full lg:w-80 bg-cyber-card border-r border-cyber-border flex flex-col overflow-hidden">
            <div className="p-4 border-b border-cyber-border space-y-3">
              <h3 className="font-orbitron font-bold text-cyber-cyan text-xs tracking-widest uppercase">
                Waypoints <span className="text-cyber-muted">({checkpoints.length})</span>
              </h3>

              <button
                onClick={handleUseMyLocation}
                disabled={gpsLoading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-cyber-green/50 bg-cyber-green/10 text-cyber-green text-sm font-mono-cyber hover:bg-cyber-green/20 transition-colors disabled:opacity-50"
              >
                {gpsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
                      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                    </svg>
                    Use My Location
                  </>
                )}
              </button>

              {gpsError && (
                <p className="text-xs text-cyber-pink font-mono-cyber">{gpsError}</p>
              )}

              <p className="text-xs text-cyber-muted font-mono-cyber">
                Click anywhere on the map to place a waypoint
              </p>
            </div>

            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
              {checkpoints.length === 0 && (
                <li className="text-center text-cyber-muted text-sm py-12 px-4 font-mono-cyber">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full border border-cyber-border flex items-center justify-center text-cyber-dim font-orbitron font-bold">0</div>
                  No waypoints yet. Search a place or click the map.
                </li>
              )}
              {checkpoints.map((cp, i) => (
                <li key={cp.id} className="rounded-xl p-3 hover:bg-cyber-panel border border-transparent hover:border-cyber-border transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full border border-cyber-cyan/50 text-cyber-cyan font-orbitron font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono-cyber text-cyber-text text-xs truncate">{cp.label}</div>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <select
                          value={cp.task_type}
                          onChange={e => handleUpdateCheckpoint(cp.id, { task_type: e.target.value })}
                          className="text-xs bg-cyber-darker border border-cyber-border text-cyber-text rounded-lg px-2 py-1 focus:outline-none focus:border-cyber-cyan"
                        >
                          {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                        </select>
                        <select
                          value={cp.difficulty}
                          onChange={e => handleUpdateCheckpoint(cp.id, { difficulty: e.target.value })}
                          className="text-xs bg-cyber-darker border border-cyber-border text-cyber-text rounded-lg px-2 py-1 focus:outline-none focus:border-cyber-cyan"
                        >
                          {['easy','medium','hard'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded border font-mono-cyber ${TYPE_META[cp.task_type]?.cls}`}>
                          {TYPE_META[cp.task_type]?.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${DIFF_META[cp.difficulty]?.cls}`}>
                          {cp.difficulty.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCheckpoint(cp.id)}
                      className="text-cyber-muted hover:text-cyber-pink transition-colors text-lg leading-none"
                    >x</button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-4 border-t border-cyber-border space-y-2">
              <button
                onClick={() => setStep(2)}
                disabled={checkpoints.length < 2}
                className="w-full cyber-btn-cyan py-3 font-orbitron tracking-widest text-sm uppercase disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {checkpoints.length < 2
                  ? `Need ${2 - checkpoints.length} more waypoint${2 - checkpoints.length !== 1 ? 's' : ''}`
                  : 'Next: Launch →'}
              </button>
              {checkpoints.length >= 2 && (
                <p className="text-xs text-cyber-muted text-center font-mono-cyber">{checkpoints.length} waypoints ready</p>
              )}
            </div>
          </aside>

          <div className="flex-1 min-h-64">
            <MapPicker checkpoints={checkpoints} onAdd={handleAddCheckpoint} flyTo={mapFlyTo} />
          </div>
        </div>
      )}

      {/* ── Step 2: Launch ───────────────────────────────────────────────────── */}
      {step === 2 && session && (
        <div className="max-w-2xl mx-auto p-6 mt-8 relative z-10">
          <div className="cyber-card corner-accent p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-cyber-green bg-cyber-green/5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-green">
                  <circle cx="12" cy="15" r="2.5" fill="currentColor" stroke="none"/>
                  <path d="M7 11.5 Q12 7.5 17 11.5"/>
                  <path d="M3.5 8 Q12 2 20.5 8"/>
                </svg>
              </div>
              <h2 className="font-orbitron text-2xl font-black neon-text-cyan tracking-wider uppercase">{session.name}</h2>
              <p className="text-cyber-muted text-sm mt-1 font-mono-cyber">{checkpoints.length} waypoints · Ready to deploy</p>
            </div>

            <QRDisplay sessionId={session.id} joinCode={session.join_code} />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {checkpoints.map((cp, i) => (
                <div key={cp.id} className="bg-cyber-panel border border-cyber-border rounded-xl p-3 text-center">
                  <div className="font-orbitron font-bold text-cyber-cyan text-sm">#{i+1}</div>
                  <div className="text-xs text-cyber-muted truncate font-mono-cyber mt-0.5">{cp.label}</div>
                  <div className={`text-xs mt-1.5 px-2 py-0.5 rounded border inline-block ${TYPE_META[cp.task_type]?.cls}`}>
                    {TYPE_META[cp.task_type]?.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 cyber-btn-cyan py-3 font-orbitron text-sm tracking-widest uppercase">
                Edit
              </button>
              <button
                onClick={() => navigate(`/teacher/session/${session.id}`)}
                className="flex-1 cyber-btn-solid-cyan py-3 font-orbitron text-sm tracking-widest uppercase"
              >
                Go Live →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
