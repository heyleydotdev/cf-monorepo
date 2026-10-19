// vinext reads an existing postcss config and never synthesizes one, so without
// this file Tailwind's utilities silently go missing.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
