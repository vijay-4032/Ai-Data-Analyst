import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: "#4265FF",
          50: "#EEF1FF",
          100: "#D9E0FF",
          200: "#B3C1FF",
          300: "#8DA2FF",
          400: "#6783FF",
          500: "#4265FF",
          600: "#0A3AFF",
          700: "#002ED1",
          800: "#002299",
          900: "#001661",
        },
        // Secondary accent
        accent: {
          DEFAULT: "#7C3AED",
          light: "#A78BFA",
          dark: "#5B21B6",
        },
        // Neutral dark theme
        dark: {
          DEFAULT: "#1E1E1E",
          50: "#2A2A2A",
          100: "#1E1E1E",
          200: "#171717",
          300: "#121212",
          400: "#0A0A0F",
          surface: "#12121A",
          border: "rgba(255, 255, 255, 0.05)",
        },
        // Semantic colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#06B6D4",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(66, 101, 255, 0.3)",
        "glow-lg": "0 0 40px rgba(66, 101, 255, 0.4)",
        card: "0 4px 24px rgba(0, 0, 0, 0.1)",
        "card-dark": "0 4px 24px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #4265FF 0%, #7C3AED 100%)",
        "gradient-dark": "linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;