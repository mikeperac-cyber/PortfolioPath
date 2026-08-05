import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA", foreground: "#16202A", card: { DEFAULT: "#FFFFFF", foreground: "#16202A" }, popover: { DEFAULT: "#FFFFFF", foreground: "#16202A" },
        primary: { DEFAULT: "#071B33", foreground: "#FFFFFF" }, secondary: { DEFAULT: "#244E78", foreground: "#FFFFFF" }, muted: { DEFAULT: "#EDF1F5", foreground: "#637083" },
        accent: { DEFAULT: "#C6A15B", foreground: "#071B33" }, destructive: { DEFAULT: "#B84242", foreground: "#FFFFFF" }, border: "#DCE2E9", input: "#CBD3DC", ring: "#244E78", success: "#287A55", warning: "#B46C24",
        sidebar: { DEFAULT: "#071B33", foreground: "#FFFFFF", primary: "#244E78", "primary-foreground": "#FFFFFF", accent: "#102E4D", "accent-foreground": "#FFFFFF", border: "#24415F", ring: "#C6A15B" },
      },
      borderRadius: { sm: "calc(var(--radius) - 2px)", md: "var(--radius)", lg: "calc(var(--radius) + 2px)" },
      fontFamily: { sans: ["Inter", "Arial", "sans-serif"], heading: ["Sora", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
}
export default config
