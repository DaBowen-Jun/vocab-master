/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3366ff',
          600: '#1f47e6',
          700: '#1736b4',
          800: '#192f8f',
          900: '#1a2d72',
        },
        // 童趣辅助色：暖橙（能量/奖励）、薄荷绿（成功/成长）
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#ff9a1f',
          600: '#f97316',
        },
        mint: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Nunito', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Nunito', '"PingFang SC"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(31,71,230,0.10)',
        pop: '0 10px 28px rgba(255,154,31,0.18)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
}
