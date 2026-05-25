export default {
  content: [
    './index.html',
    './src/**/*.{ts,html}'
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff0f6',
          100: '#ffe3ec',
          200: '#ffcad6',
          300: '#ffbed6'
        }
      },
      boxShadow: {
        soft: '0 24px 80px rgba(109, 58, 97, 0.16)'
      }
    }
  },
  plugins: []
};
