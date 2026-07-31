/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        primary: "#6366f1",
        secondary: "#1f2937",
        text: "#f3f4f6",
        textMuted: "#9ca3af",
      },
    },
  },
  plugins: [],
}
