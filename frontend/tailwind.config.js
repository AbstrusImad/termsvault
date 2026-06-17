/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic Archive UI palette
        ink: {
          DEFAULT: '#0a0c14',
          deep: '#06070d',
          soft: '#11141f',
          panel: '#141826',
          edge: '#1d2233',
        },
        ivory: {
          DEFAULT: '#f4efe3',
          dim: '#cdc7b8',
          faint: '#8a8678',
        },
        gold: {
          DEFAULT: '#c8a45b',
          soft: '#e0c585',
          deep: '#9a7836',
        },
        juridical: {
          DEFAULT: '#3fd6b0',
          soft: '#6ee9cc',
          deep: '#1f8f74',
        },
        coral: {
          DEFAULT: '#e85c5c',
          soft: '#ff8585',
          deep: '#b53e3e',
        },
        drift: {
          DEFAULT: '#7b5cff',
          soft: '#a48cff',
          deep: '#523aa6',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        grotesk: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
      boxShadow: {
        vault: '0 30px 80px -20px rgba(0,0,0,0.8)',
        glow: '0 0 28px -4px rgba(200,164,91,0.45)',
        glowcyan: '0 0 28px -4px rgba(63,214,176,0.45)',
        glowred: '0 0 32px -4px rgba(232,92,92,0.5)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(110%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulsering: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fracture: {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        },
      },
      animation: {
        scan: 'scan 2.6s ease-in-out infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        pulsering: 'pulsering 2.2s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        fracture: 'fracture 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
