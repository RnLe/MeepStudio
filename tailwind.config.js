// This file might not be necessary at all. Having or deleting it didn't change anything.
// It's kept here if its needed in the future.
const { join } = require('path');
const root = __dirname;

module.exports = {
  darkMode: 'class',
  content: [
    // the website itself
    join(root, 'apps/website/**/*.{js,ts,jsx,tsx,mdx}'),

    // all workspace packages when present as source
    join(root, 'packages/**/*.{js,ts,jsx,tsx,mdx}'),

    // same packages when they are installed into node_modules
    join(root, 'node_modules/@meepstudio/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: { extend: {} },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
