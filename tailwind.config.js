// This file might not be necessary at all. Having or deleting it didn't change anything.
// It's kept here if its needed in the future.

module.exports = {
  darkMode: 'class',
  content: [
    // the website itself
    './apps/website/**/*.{js,ts,jsx,tsx,mdx}',

    // all workspace packages when present as source
    './packages/**/*.{js,ts,jsx,tsx,mdx}',

    // same packages when they are installed into node_modules
    '/.node_modules/@meepstudio/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
