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
          main: '#F8FAFC',       // Clean, bright, luxury slate 50
          secondary: '#FFFFFF',  // Pure white header / navbar
          sidebar: '#FFFFFF',    // Crisp white sidebar
          card: '#FFFFFF',       // Pure white card background
          surface: '#F1F5F9',    // Soft subtle slate 100 for interactive elements
        },
        accent: {
          primary: '#2563EB',    // Electric Royal Blue (technology, trust)
          secondary: '#4F46E5',  // Indigo accent
          success: '#10B981',    // Vibrant Emerald (Safe, Low Risk)
          warning: '#F59E0B',    // Warm Amber (Caution, Moderate Risk)
          critical: '#EF4444',   // High-impact Crimson (Danger, High Hazard)
        },
        text: {
          main: '#0F172A',       // Rich obsidian Slate 900 (ultra-crisp contrast)
          muted: '#475569',      // Readable Slate 600
          subtle: '#64748B',     // Caption Slate 500
        },
        border: {
          dark: '#E2E8F0',       // Clean, crisp hairline border (Slate 200)
          subtle: '#F1F5F9',     // Faint separator (Slate 100)
          highlight: '#CBD5E1',  // Active/hover border (Slate 300)
          glow: 'rgba(37, 99, 235, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 4px 14px 0 rgba(37, 99, 235, 0.25)',
        'glow-success': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        'glow-warning': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        'glow-critical': '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
        'card-dark': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(203, 213, 225, 0.8)',
      }
    },
  },
  plugins: [],
}
