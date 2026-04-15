/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-surface': '#13131a',
        'bg-card': '#1a1a24',
        'accent-green': '#1D9E75',
        'accent-green-light': '#5DCAA5',
        'text-primary': '#f0efe9',
        'text-secondary': '#9c9a92',
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
        card: '0 10px 30px rgba(0,0,0,0.35)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

