import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessions as sessionsApi, reports as reportsApi } from '../api.js';
import ReportView from '../components/ReportView.jsx';
import { TASK_META } from '../utils.js';

export default function SessionMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession]             = useState(null);
  const [report, setReport]               = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError]                 = useState('');
  const [lastUpdated, setLastUpdated]     = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      const { data } = await sessionsApi.getById(id);
      setSession(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load session');
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 10_000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  async function generateReport() {
    setLoadingReport(true); setError('');
    try {
      const { data } = await reportsApi.generate(id);
      setReport(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally { setLoadingReport(false); }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="scanlines" />
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="font-orbitron text-cyber-muted text-xs tracking-widest">Loading session data...</div>
        </div>
      </div>
    );
  }

  const totalCps = session.checkpoints.length;
  const allDone  = session.teams.every(t => (t.completions?.length || 0) >= totalCps);

  return (
    <div className="min-h-screen bg-cyber-bg">
      <div className="scanlines" />

      <header className="bg-cyber-card border-b border-cyber-border px-4 py-3 flex items-center gap-3 flex-wrap relative z-10">
        <button onClick={() => navigate('/teacher')} className="text-cyber-muted hover:text-cyber-cyan transition-colors text-xl">←</button>
        <div>
          <h1 className="font-orbitron font-bold text-cyber-cyan text-sm tracking-widest uppercase">{session.name}</h1>
          <p className="text-xs text-cyber-muted font-mono-cyber">
            Code: <span className="text-cyber-cyan">{session.join_code}</span>
            {lastUpdated && <span className="ml-3 text-cyber-dim">· Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={fetchSession} className="text-xs cyber-btn-cyan px-3 py-2">
            Refresh
          </button>
          <button onClick={generateReport} disabled={loadingReport} className="text-xs cyber-btn-pink px-4 py-2 disabled:opacity-40">
            {loadingReport ? 'Generating...' : 'AI Report'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 bg-cyber-pink/10 border border-cyber-pink/40 text-cyber-pink text-sm px-4 py-2 rounded-xl font-mono-cyber relative z-10">
          {error}
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 space-y-5 relative z-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Squads',      val: session.teams.length,                                                                                              color: 'text-cyber-cyan'   },
            { label: 'Checkpoints', val: totalCps,                                                                                                          color: 'text-cyber-pink'   },
            { label: 'Completions', val: session.teams.reduce((s,t) => s+(t.completions?.length||0), 0),                                                    color: 'text-cyber-green'  },
            { label: 'Hints Used',  val: session.teams.reduce((s,t) => s+(t.completions?.reduce((h,c) => h+(c.hints_used||0), 0)||0), 0),                   color: 'text-cyber-yellow' },
          ].map(({ label, val, color }) => (
            <div key={label} className="cyber-card p-4 text-center">
              <div className={`text-3xl font-orbitron font-black ${color}`}>{val}</div>
              <div className="text-xs text-cyber-muted font-mono-cyber mt-1 tracking-widest uppercase">{label}</div>
            </div>
          ))}
        </div>

        {/* Live progress */}
        <div className="cyber-card">
          <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
            <h2 className="font-orbitron font-bold text-cyber-cyan text-xs tracking-widest uppercase">Live Squad Progress</h2>
            <span className="text-xs text-cyber-green font-mono-cyber animate-neon-pulse">● Live</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="text-left px-4 py-3 text-cyber-muted font-mono-cyber text-xs tracking-widest w-40">Squad</th>
                  {session.checkpoints.map((cp, i) => (
                    <th key={cp.id} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-mono-cyber text-cyber-muted">{TASK_META[cp.task_type]?.label || 'CP'}</span>
                        <span className="text-xs text-cyber-dim font-mono-cyber">#{i+1}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-cyber-muted font-mono-cyber text-xs tracking-widest">Score</th>
                  <th className="px-4 py-3 text-center text-cyber-muted font-mono-cyber text-xs tracking-widest">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border">
                {session.teams.length === 0 && (
                  <tr>
                    <td colSpan={totalCps + 3} className="text-center text-cyber-muted py-12 font-mono-cyber">
                      No squads have joined yet. Share the join code.
                    </td>
                  </tr>
                )}
                {session.teams.map(team => {
                  const done       = team.completions?.length || 0;
                  const pct        = totalCps ? Math.round((done / totalCps) * 100) : 0;
                  const totalScore = team.completions?.reduce((s,c) => s+(c.score||0), 0) || 0;

                  return (
                    <tr key={team.id} className="hover:bg-cyber-panel transition-colors">
                      <td className="px-4 py-3 font-bold text-cyber-text font-mono-cyber">{team.name}</td>
                      {session.checkpoints.map(cp => {
                        const comp = team.completions?.find(c => c.checkpoint_id === cp.id);
                        return (
                          <td key={cp.id} className="px-3 py-3 text-center">
                            {comp ? (
                              <div className="flex flex-col items-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="neon-text-green">
                                  <polyline points="2,8 6,12 14,4"/>
                                </svg>
                                <span className="text-xs text-cyber-muted">{comp.score}</span>
                              </div>
                            ) : (
                              <span className="text-cyber-dim text-sm font-mono-cyber">--</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-orbitron font-black neon-text-cyan">{totalScore}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-cyber-border rounded-full h-1.5 min-w-16">
                            <div
                              className="h-1.5 rounded-full transition-all duration-700"
                              style={{
                                width: `${pct}%`,
                                background: 'linear-gradient(90deg,#00e5ff,#b44fff)',
                                boxShadow: pct > 0 ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
                              }}
                            />
                          </div>
                          <span className="text-xs text-cyber-muted font-mono-cyber w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Checkpoint legend */}
        <div className="flex flex-wrap gap-2">
          {session.checkpoints.map((cp, i) => (
            <div key={cp.id} className="bg-cyber-card border border-cyber-border rounded-lg px-3 py-1.5 text-xs text-cyber-muted flex items-center gap-2 font-mono-cyber">
              <span className="text-cyber-dim">#{i+1}</span>
              <span className="text-cyber-text">{cp.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                cp.difficulty === 'easy'   ? 'bg-emerald-500/10 text-emerald-400' :
                cp.difficulty === 'medium' ? 'bg-amber-500/10   text-amber-400'   :
                                            'bg-red-500/10     text-red-400'
              }`}>{cp.difficulty.toUpperCase()}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${TASK_META[cp.task_type]?.color || ''}`}>
                {TASK_META[cp.task_type]?.label}
              </span>
            </div>
          ))}
        </div>

        {allDone && !report && session.teams.length > 0 && (
          <div className="cyber-card border-cyber-green p-6 text-center" style={{ boxShadow: '0 0 20px rgba(0,255,133,0.15)' }}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-cyber-green bg-cyber-green/10 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-green">
                <polyline points="4,11 9,16 18,6"/>
              </svg>
            </div>
            <p className="font-orbitron font-bold neon-text-green tracking-widest">Mission Complete</p>
            <p className="text-xs text-cyber-muted mt-2 font-mono-cyber">
              All squads finished. Click <span className="text-cyber-pink font-bold">AI Report</span> for the debrief.
            </p>
          </div>
        )}

        {report && <ReportView report={report} />}
      </div>
    </div>
  );
}
