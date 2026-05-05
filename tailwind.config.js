/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          purple: '#A855F7',
          pink:   '#EC4899',
          cyan:   '#06B6D4',
          gold:   '#F59E0B',
          lime:   '#84CC16',
        },
        dark: {
          950: '#020209',
          900: '#07071a',
          800: '#0e0e2a',
          700: '#16163a',
          600: '#1e1e4a',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'neon-gradient':  'linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #06B6D4 100%)',
        'card-gradient':  'linear-gradient(145deg, rgba(168,85,247,0.08) 0%, rgba(6,182,212,0.04) 100%)',
        'hero-gradient':  'radial-gradient(ellipse at 60% 40%, rgba(168,85,247,0.25) 0%, rgba(6,182,212,0.1) 50%, transparent 70%)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168,85,247,0.4), 0 0 60px rgba(168,85,247,0.1)',
        'neon-cyan':   '0 0 20px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.1)',
        'neon-pink':   '0 0 20px rgba(236,72,153,0.4), 0 0 60px rgba(236,72,153,0.1)',
        'card':        '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'pulse-neon':  'pulseNeon 2s ease-in-out infinite',
        'scroll-left': 'scrollLeft 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-16px)' },
        },
        pulseNeon: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        scrollLeft: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
