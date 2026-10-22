/** Theme colors are CSS variables (RGB triplets) set by ThemeProvider via nativewind `vars()`. */
const token = name => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: token('bg'),
        surface: token('surface'),
        surface2: token('surface2'),
        sunken: token('sunken'),
        line: token('line'),
        strong: token('line-strong'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        inv: token('inv-bg'),
        'inv-fg': token('inv-fg'),
        movie: token('movie'),
        series: token('series'),
        game: token('game'),
      },
    },
  },
  plugins: [],
};
