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
        // 에디토리얼(종이톤) 베이스 + 지원 회사(상공) 브랜드의 다크네이비·틸 포인트를
        // 히어로/프로젝트 카드/이력·푸터에 부분 적용. dark는 "짙은 남색", light는 "옅은 종이색".
        dark: '#0b1220',
        light: '#f6f4ef',
        surface: '#ffffff',
        accent: '#1fbf9b',
        'accent-dim': '#159179',
        'accent-ink': '#ffffff',
        'accent-soft': '#e3f7f1',
        muted: '#6b665f',
        'muted-light': '#9aa4b5',
        border: '#e1dcd1',
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Malgun Gothic', 'sans-serif'],
        display: ['Pretendard', '-apple-system', 'sans-serif'],
        mono: ['Pretendard', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(15, 23, 22, 0.15)',
        'card-lg': '0 20px 50px -20px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
