/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#080D17',
          secondary: '#0D1422',
          sidebar: '#0A101C',
          card: '#111B2B',
          surface: '#172337',
        },
        accent: {
          primary: '#38BDF8',   // Sky / Cyan
          secondary: '#818CF8', // Indigo
          success: '#34D399',   // Emerald
          warning: '#FBBF24',   // Amber
          critical: '#F87171',  // Coral / Red
        },
        text: {
          main: '#F1F5F9',
          muted: '#94A3B8',
          subtle: '#64748B',
        },
        border: {
          dark: '#243247',
          subtle: '#1E293B',
          glow: 'rgba(56, 189, 248, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(56, 189, 248, 0.3)',
        'glow-critical': '0 0 20px -5px rgba(248, 113, 113, 0.3)',
        'card-dark': '0 4px 20px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
