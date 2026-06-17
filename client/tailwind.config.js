/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cyber: {
          bg:     'rgb(var(--c-bg)     / <alpha-value>)',
          darker: 'rgb(var(--c-darker) / <alpha-value>)',
          card:   'rgb(var(--c-card)   / <alpha-value>)',
          panel:  'rgb(var(--c-panel)  / <alpha-value>)',
          border: 'rgb(var(--c-border) / <alpha-value>)',
          text:   'rgb(var(--c-text)   / <alpha-value>)',
          muted:  'rgb(var(--c-muted)  / <alpha-value>)',
          dim:    'rgb(var(--c-dim)    / <alpha-value>)',
          cyan:   'rgb(var(--c-cyan)   / <alpha-value>)',
          pink:   'rgb(var(--c-pink)   / <alpha-value>)',
          green:  'rgb(var(--c-green)  / <alpha-value>)',
          yellow: 'rgb(var(--c-yellow) / <alpha-value>)',
          purple: 'rgb(var(--c-purple) / <alpha-value>)',
        },
      },
      boxShadow: {
        'neon-cyan':   '0 0 8px rgba(0,229,255,0.6),  0 0 20px rgba(0,229,255,0.25)',
        'neon-pink':   '0 0 8px rgba(255,45,120,0.6),  0 0 20px rgba(255,45,120,0.25)',
        'neon-green':  '0 0 8px rgba(0,255,133,0.6),   0 0 20px rgba(0,255,133,0.25)',
        'neon-yellow': '0 0 8px rgba(255,230,0,0.6),   0 0 20px rgba(255,230,0,0.25)',
        'neon-purple': '0 0 8px rgba(180,79,255,0.6),  0 0 20px rgba(180,79,255,0.25)',
        'inner-cyan':  'inset 0 0 20px rgba(0,229,255,0.05)',
      },
      animation: {
        'neon-pulse':   'neonPulse 2s ease-in-out infinite',
        'glitch':       'glitch 3s infinite',
        'scan':         'scanline 6s linear infinite',
        'flicker':      'flicker 4s infinite',
        'float':        'float 3s ease-in-out infinite',
      },
      keyframes: {
        neonPulse: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.7' },
        },
        glitch: {
          '0%,95%,100%':  { transform: 'translate(0)' },
          '96%':           { transform: 'translate(-2px, 1px)' },
          '97%':           { transform: 'translate(2px, -1px)' },
          '98%':           { transform: 'translate(-1px, 2px)' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity: '1' },
          '20%,22%,24%,55%':                  { opacity: '0.6' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
