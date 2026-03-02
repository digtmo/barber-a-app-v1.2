/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0D0D0D',
        surfaceAlt: '#141414',
        card: '#1C1C1C',
        input: '#242424',
        gold: '#C9A84C',
        goldLight: '#E8C96A',
        text: '#E8E4DC',
        textMuted: '#8A8480',
        error: '#FF6B6B',
      },
      borderColor: {
        gold: 'rgba(201, 168, 76, 0.2)',
        subtle: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Playfair Display', 'serif'],
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
