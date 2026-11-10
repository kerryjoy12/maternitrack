/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Map Tailwind to the existing CSS custom properties so
      // both systems share the same design tokens.
      colors: {
        primary:   'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        danger:    'var(--danger)',
        warning:   'var(--warning)',
        success:   'var(--success)',
        purple:    'var(--purple)',
        'bg-base':  'var(--bg-base)',
        'bg-card':  'var(--bg-card)',
        'bg-input': 'var(--bg-input)',
      },
      fontFamily: {
        body:    ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        // Standardized Typography System (Base 16px)
        'tiny': ['0.625rem', { lineHeight: '1rem' }],    // 10px - Micro text
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],   // 12px - Captions, tags, small footnotes
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px - Secondary text, dense dashboards
        'base': ['1rem', { lineHeight: '1.5rem' }],      // 16px - Default Body text
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px - Large body, emphasis
        'h4': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px - Sub-section headings
        'h3': ['1.5rem', { lineHeight: '2rem' }],        // 24px - Section headings
        'h2': ['2rem', { lineHeight: '2.5rem' }],        // 32px - Page headings
        'h1': ['2.5rem', { lineHeight: '3rem' }],        // 40px - Hero headings
        'display': ['3rem', { lineHeight: '1.1' }],      // 48px - Large promotional text
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  corePlugins: {
    preflight: false,   // ← keeps all your existing vanilla CSS intact
  },
  plugins: [],
}
