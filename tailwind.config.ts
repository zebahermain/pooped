import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.9)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "score-fill": { "0%": { strokeDashoffset: "283" }, "100%": { strokeDashoffset: "var(--score-offset)" } },
        "reservoir-wobble": {
          "0%, 100%": { transform: "translateY(-4px)" },
          "50%": { transform: "translateY(4px)" },
        },
        "splat-arc": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "1" },
          "50%": { transform: "translate(50vw, -40vh) rotate(360deg)", opacity: "1" },
          "100%": { transform: "translate(100vw, 30vh) rotate(720deg)", opacity: "1" },
        },
        "screen-shake": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-8px, 4px)" },
          "20%": { transform: "translate(8px, -4px)" },
          "30%": { transform: "translate(-6px, -6px)" },
          "40%": { transform: "translate(6px, 6px)" },
          "50%": { transform: "translate(-4px, 2px)" },
          "60%": { transform: "translate(4px, -2px)" },
          "70%": { transform: "translate(-2px, 4px)" },
          "80%": { transform: "translate(2px, -4px)" },
        },
        "splat-pop": {
          "0%": { transform: "scale(0.2) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        gurgle: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(0.92) rotate(-2deg)" },
          "50%": { transform: "scale(0.78) rotate(3deg)" },
          "75%": { transform: "scale(0.55) rotate(-4deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "score-fill": "score-fill 1s ease-out forwards",
        "reservoir-wobble": "reservoir-wobble 2s ease-in-out infinite",
        "splat-arc": "splat-arc 1.4s cubic-bezier(0.4, 0, 0.6, 1) forwards",
        "screen-shake": "screen-shake 0.6s cubic-bezier(.36,.07,.19,.97) both",
        "splat-pop": "splat-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        gurgle: "gurgle 0.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
