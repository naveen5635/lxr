import { useTheme } from '../context/ThemeContext.jsx';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${className}`}
      style={{
        background: isDark ? 'rgba(0,229,255,0.07)' : 'rgba(0,102,187,0.09)',
        border: `1px solid ${isDark ? 'rgba(0,229,255,0.3)' : 'rgba(0,102,187,0.35)'}`,
      }}
    >
      {isDark ? (
        /* Sun — click to go light */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"     x2="12" y2="3"/>
          <line x1="12" y1="21"    x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        /* Moon — click to go dark */
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="#0066bb" strokeWidth="2" strokeLinecap="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
