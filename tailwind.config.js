/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0b0f0e',
        dark2: '#111716',
        light: '#fafaf9',
        accent: '#2dd4bf',
        'accent-dim': '#14b8a6',
        muted: '#6b7280',
        'muted-light': '#9ca3af',
        border: '#e5e7eb',
        'border-dark': '#232b29',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Malgun Gothic', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(15, 23, 22, 0.15)',
        'card-lg': '0 20px 50px -20px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
