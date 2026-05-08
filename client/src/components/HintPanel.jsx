export default function HintPanel({ hints }) {
  if (!hints || hints.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono-cyber text-cyber-yellow uppercase tracking-widest">
        Intel Drops
      </div>
      {hints.map((h, i) => (
        <div key={i} className="bg-cyber-yellow/5 border border-cyber-yellow/30 rounded-xl px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded border border-cyber-yellow/40 bg-cyber-yellow/10 text-cyber-yellow text-xs font-orbitron font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="text-cyber-text text-sm leading-relaxed">{h.hint}</p>
              {h.encouragement && (
                <p className="text-cyber-yellow/70 text-xs font-mono-cyber mt-2 italic">"{h.encouragement}"</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
