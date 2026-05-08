import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cyber-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="scanlines" />

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-cyan/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-pink/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-12 relative z-10">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl border-2 border-cyber-cyan flex items-center justify-center"
             style={{ boxShadow: '0 0 20px rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.05)' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-cyan">
            <circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/>
            <line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
          </svg>
        </div>

        <h1 className="font-orbitron text-3xl sm:text-4xl font-black tracking-widest uppercase neon-text-cyan">
          Orienteering
        </h1>
        <div className="font-orbitron text-xs tracking-[0.3em] text-cyber-muted uppercase mt-1">
          Digital AR Scavenger Hunt
        </div>
        <div className="w-32 h-px mx-auto mt-4"
          style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)' }} />
        <p className="mt-4 text-cyber-muted text-sm max-w-xs mx-auto font-mono-cyber">
          GPS-powered outdoor missions · AI-generated tasks · Real-time squad tracking
        </p>
      </div>

      {/* Role cards */}
      <div className="w-full max-w-sm space-y-4 relative z-10">
        <button
          onClick={() => navigate('/teacher')}
          className="w-full cyber-card corner-accent p-6 flex items-center gap-5 hover:border-cyber-cyan hover:shadow-neon-cyan transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-xl border border-cyber-cyan/40 bg-cyber-cyan/5 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-cyan">
              <polyline points="3,6 8.5,10 3,14"/><line x1="11" y1="14" x2="17" y2="14"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-orbitron font-bold text-cyber-text text-base tracking-wide group-hover:neon-text-cyan transition-all">
              Commander
            </div>
            <div className="text-xs text-cyber-muted mt-1 font-mono-cyber">
              Design missions · Deploy squads · Monitor ops
            </div>
          </div>
          <div className="text-cyber-cyan text-xl opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">›</div>
        </button>

        <button
          onClick={() => navigate('/student')}
          className="w-full cyber-card corner-accent p-6 flex items-center gap-5 hover:border-cyber-pink hover:shadow-neon-pink transition-all duration-200 text-left group"
        >
          <div className="w-12 h-12 rounded-xl border border-cyber-pink/40 bg-cyber-pink/5 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-cyber-pink">
              <circle cx="10" cy="4.5" r="2"/>
              <line x1="10" y1="6.5" x2="10" y2="13"/>
              <line x1="6" y1="10" x2="14" y2="10"/>
              <path d="M5 20 L8.5 13 L10 15.5 L11.5 13 L15 20"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-orbitron font-bold text-cyber-text text-base tracking-wide group-hover:neon-text-pink transition-all">
              Operative
            </div>
            <div className="text-xs text-cyber-muted mt-1 font-mono-cyber">
              Join mission · Navigate · Complete objectives
            </div>
          </div>
          <div className="text-cyber-pink text-xl opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">›</div>
        </button>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-10 max-w-sm relative z-10">
        {[
          { label: 'GPS NAV',     color: 'border-cyber-cyan/40   text-cyber-cyan/70'   },
          { label: 'AI TASKS',    color: 'border-cyber-purple/40 text-cyber-purple/70' },
          { label: 'LIVE OPS',    color: 'border-cyber-pink/40   text-cyber-pink/70'   },
          { label: '4 MODES',     color: 'border-cyber-green/40  text-cyber-green/70'  },
          { label: 'SMART HINTS', color: 'border-cyber-yellow/40 text-cyber-yellow/70' },
        ].map(f => (
          <span key={f.label} className={`border text-xs font-mono-cyber px-3 py-1.5 rounded-full ${f.color}`}>
            {f.label}
          </span>
        ))}
      </div>

      <p className="mt-8 text-cyber-muted text-xs text-center relative z-10 font-mono-cyber">
        DEMO CODE:{' '}
        <span className="text-cyber-cyan border border-cyber-cyan/30 px-2 py-0.5 rounded font-mono-cyber">
          DEMO01
        </span>
      </p>
    </div>
  );
}
