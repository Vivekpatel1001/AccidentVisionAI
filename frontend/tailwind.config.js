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
          main: '#080C15',       // Deep prestige obsidian slate
          secondary: '#0D1322',  // Midnight navy
          sidebar: '#090D18',    // Classic dark sidebar/header
          card: '#121A2D',       // Premium card background
          surface: '#1A243C',    // Elevated card / button surface
        },
        accent: {
          primary: '#2563EB',    // Classic Royal Blue (confidence, navigation)
          secondary: '#6366F1',  // Classic Indigo
          success: '#10B981',    // Classic Emerald (Safe, Low Risk)
          warning: '#F59E0B',    // Classic Warm Amber (Caution, Moderate Risk)
          critical: '#EF4444',   // Classic Crimson (Danger, High Hazard)
        },
        text: {
          main: '#F8FAFC',       // Pure crisp white
          muted: '#94A3B8',      // Clean readable slate
          subtle: '#64748B',     // Caption slate
        },
        border: {
          dark: '#1E2B45',       // Refined subtle border
          subtle: '#162034',     // Very faint separator
          highlight: '#2D3E64',  // Active card border
          glow: 'rgba(37, 99, 235, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-success': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-warning': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-critical': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'card-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.65)',
        'card-hover': '0 10px 30px -4px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
}
