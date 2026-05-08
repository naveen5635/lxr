import { TASK_META, DIFF_META } from '../utils.js';

export default function TaskCard({ task }) {
  const meta     = TASK_META[task.type]       || TASK_META.cognitive;
  const diffMeta = DIFF_META[task.difficulty] || DIFF_META.medium;

  const steps = task.instructions
    ? task.instructions.split('\n').filter(s => s.trim())
    : [];

  return (
    <div className="cyber-card corner-accent">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-cyber-border rounded-t-xl ${meta.color}`}>
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg border border-current/40 flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-current opacity-70" />
          </div>
          <div className="flex-1">
            <div className="font-orbitron font-black text-cyber-text text-lg leading-tight">{task.task}</div>
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <span className={`text-xs font-bold px-2.5 py-1 rounded border ${meta.color}`}>
                {meta.label}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded ${diffMeta.color}`}>
                {diffMeta.label.toUpperCase()}
              </span>
              <span className="text-xs text-cyber-muted font-mono-cyber">{task.estimatedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <div className="text-xs font-mono-cyber text-cyber-muted uppercase tracking-widest mb-3">Instructions</div>
          {steps.length > 1 ? (
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded border border-cyber-cyan/40 bg-cyber-cyan/5 text-cyber-cyan text-xs font-orbitron font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-cyber-text text-sm leading-relaxed">
                    {step.replace(/^\d+\.\s*/, '')}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-cyber-text text-sm leading-relaxed">{task.instructions}</p>
          )}
        </div>

        <div className="bg-cyber-green/5 border border-cyber-green/30 rounded-xl px-4 py-3">
          <div className="text-xs font-mono-cyber text-cyber-green uppercase tracking-widest mb-1.5">Done when</div>
          <p className="text-cyber-text text-sm">{task.completionCriteria}</p>
        </div>

        {task.materials && task.materials.toLowerCase() !== 'none' && (
          <div className="bg-cyber-cyan/5 border border-cyber-cyan/30 rounded-xl px-4 py-3">
            <div className="text-xs font-mono-cyber text-cyber-cyan uppercase tracking-widest mb-1.5">You might need</div>
            <p className="text-cyber-text text-sm">{task.materials}</p>
          </div>
        )}
      </div>
    </div>
  );
}
