/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary':     '#0a0a0f',
        'bg-card':        '#111118',
        'bg-surface':     '#1a1a24',
        'accent-green':   '#00e5a0',
        'text-primary':   '#f0f0f0',
        'text-secondary': '#888899',
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.08)',
      },
      borderRadius: {
        app: '12px',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.4)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%':       { opacity: '1'    },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
        shimmer:   'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
