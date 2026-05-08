import { fmtTime } from '../utils.js';

export default function ReportView({ report: { report, teamStats, session } }) {
  if (!report) return null;

  const engagementStyle =
    report.overallEngagement?.toLowerCase().startsWith('high')
      ? { borderColor: '#00ff85', boxShadow: '0 0 12px rgba(0,255,133,0.15)' }
      : report.overallEngagement?.toLowerCase().startsWith('medium')
      ? { borderColor: '#ffe600', boxShadow: '0 0 12px rgba(255,230,0,0.15)' }
      : { borderColor: '#ff2d78', boxShadow: '0 0 12px rgba(255,45,120,0.15)' };

  const engagementTextColor =
    report.overallEngagement?.toLowerCase().startsWith('high')   ? 'text-cyber-green'  :
    report.overallEngagement?.toLowerCase().startsWith('medium') ? 'text-cyber-yellow' :
    'text-cyber-pink';

  return (
    <div className="cyber-card corner-accent">
      {/* Header */}
      <div className="px-5 py-4 border-b border-cyber-border"
           style={{ background: 'linear-gradient(135deg,rgba(0,229,255,0.06),rgba(180,79,255,0.06))' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-cyber-purple/40 bg-cyber-purple/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-purple">
              <line x1="2" y1="16" x2="16" y2="16"/>
              <line x1="4" y1="16" x2="4" y2="11"/><line x1="7.5" y1="16" x2="7.5" y2="7"/>
              <line x1="11" y1="16" x2="11" y2="9"/><line x1="14.5" y1="16" x2="14.5" y2="5"/>
            </svg>
          </div>
          <div>
            <h2 className="font-orbitron font-black text-cyber-cyan text-base tracking-wider uppercase">
              AI Debrief Report
            </h2>
            <p className="text-cyber-muted text-xs font-mono-cyber mt-0.5">
              {session.name} · {session.teams} squad{session.teams !== 1 ? 's' : ''} · {session.checkpoints} waypoints
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* Engagement */}
        <div className="cyber-card px-4 py-3" style={engagementStyle}>
          <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-1">Overall Engagement</div>
          <div className={`text-sm font-medium ${engagementTextColor}`}>{report.overallEngagement}</div>
        </div>

        {/* Leaderboard */}
        {teamStats?.length > 0 && (
          <div>
            <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-3">Squad Leaderboard</div>
            <div className="space-y-2">
              {teamStats
                .slice()
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((t, i) => (
                  <div key={t.teamName} className="bg-cyber-panel border border-cyber-border rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className={`font-orbitron font-black text-base w-7 text-center
                      ${i === 0 ? 'neon-text-yellow' : 'text-cyber-muted'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-cyber-text text-sm">{t.teamName}</div>
                      <div className="flex gap-3 text-xs text-cyber-muted font-mono-cyber mt-0.5">
                        <span>{t.completionRate}% done</span>
                        <span>{fmtTime(t.avgTimeSeconds)} avg</span>
                        <span>{t.totalHintsUsed} hints</span>
                      </div>
                    </div>
                    <span className="font-orbitron font-black neon-text-cyan text-xl">{t.totalScore}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {report.highlights?.length > 0 && (
          <div>
            <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">Highlights</div>
            <ul className="space-y-2">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-cyber-text">
                  <span className="neon-text-green flex-shrink-0 mt-0.5">›</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Team observations */}
        {report.teamObservations?.length > 0 && (
          <div>
            <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">Squad Notes</div>
            <div className="space-y-2">
              {report.teamObservations.map((t, i) => (
                <div key={i} className="bg-cyber-panel border border-cyber-border rounded-xl px-4 py-3">
                  <div className="font-bold text-cyber-cyan text-sm font-orbitron">{t.team}</div>
                  <div className="text-cyber-muted text-sm mt-1">{t.observation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Physical activity */}
        {report.physicalActivitySummary && (
          <div className="bg-red-500/5 border border-red-500/30 rounded-xl px-4 py-3">
            <div className="text-xs font-mono-cyber text-red-400 uppercase tracking-widest mb-1.5">Physical Activity</div>
            <div className="text-cyber-text text-sm">{report.physicalActivitySummary}</div>
          </div>
        )}

        {/* Suggestions */}
        {report.suggestions?.length > 0 && (
          <div>
            <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-2">Next Session Improvements</div>
            <ul className="space-y-1.5">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-cyber-muted">
                  <span className="text-cyber-purple flex-shrink-0">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up */}
        {report.recommendedFollowUp && (
          <div className="bg-cyber-purple/5 border border-cyber-purple/30 rounded-xl px-4 py-3">
            <div className="text-xs font-mono-cyber text-cyber-purple uppercase tracking-widest mb-1.5">Recommended Follow-up</div>
            <div className="text-cyber-text text-sm">{report.recommendedFollowUp}</div>
          </div>
        )}
      </div>
    </div>
  );
}
