/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    join(__dirname, 'app/**/*.{js,ts,jsx,tsx,mdx}'),
    join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}'),
    // Workspace packages (source)
    join(__dirname, '../../packages/**/*.{js,ts,jsx,tsx,mdx}'),
    // Linked copies inside node_modules
    join(__dirname, '../../../node_modules/@meepstudio/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: { extend: {} },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

module.exports = config;
