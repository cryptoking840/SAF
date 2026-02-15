/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#13ec80",
        "background-light": "#f6f8f7",
        "background-dark": "#102219",
      },
    },
  },
  plugins: [],
};
