// This file might not be necessary at all. Having or deleting it didn't change anything.
// It's kept here if its needed in the future.

module.exports = {
  darkMode: 'class',
  content: [
    // the website itself
    './apps/website/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { 
    extend: {
      colors: {
        gray: {
          650: '#4b5563',
          750: '#374151',
          850: '#1f2937',
        }
      }
    } 
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
