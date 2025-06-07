/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f0f23',
        'dark-surface': '#1a1a2e',
        'dark-surface-hover': '#252547',
        'dark-border': '#363670',
        'dark-text': '#f1f5f9',
        'dark-text-secondary': '#94a3b8',
        'accent-blue': '#4f46e5',
        'accent-blue-hover': '#3730a3',
        'accent-purple': '#7c3aed',
        'accent-cyan': '#06b6d4',
        'accent-pink': '#ec4899',
        'gradient-start': '#4f46e5',
        'gradient-middle': '#7c3aed',
        'gradient-end': '#06b6d4',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        'gradient-secondary': 'linear-gradient(135deg, #7c3aed, #06b6d4)',
        'gradient-accent': 'linear-gradient(135deg, #4f46e5, #7c3aed, #06b6d4)',
        'gradient-dark': 'linear-gradient(135deg, #0f0f23, #1a1a2e, #16213e)',
        'gradient-surface': 'linear-gradient(135deg, #1e1b4b, #312e81, #1e40af)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-soft': 'bounce 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(79, 70, 229, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(79, 70, 229, 0.3)',
        'glow-lg': '0 0 30px rgba(79, 70, 229, 0.4)',
        'glow-xl': '0 0 40px rgba(79, 70, 229, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(79, 70, 229, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 