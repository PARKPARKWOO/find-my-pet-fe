import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        "xs": "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        surface: {
          canvas: "rgb(var(--fmp-canvas) / <alpha-value>)",
          paper: "rgb(var(--fmp-paper) / <alpha-value>)",
          raised: "rgb(var(--fmp-raised) / <alpha-value>)",
          inverse: "rgb(var(--fmp-ink) / <alpha-value>)",
        },
        ink: "rgb(var(--fmp-ink) / <alpha-value>)",
        forest: "rgb(var(--fmp-forest) / <alpha-value>)",
        "forest-strong": "rgb(var(--fmp-forest-strong) / <alpha-value>)",
        "forest-tint": "rgb(var(--fmp-forest-tint) / <alpha-value>)",
        clay: "rgb(var(--fmp-clay) / <alpha-value>)",
        "accent-readable": "rgb(var(--fmp-accent-text) / <alpha-value>)",
        wine: "rgb(var(--fmp-wine) / <alpha-value>)",
        sighting: "rgb(var(--fmp-sighting) / <alpha-value>)",
        waiting: "rgb(var(--fmp-waiting) / <alpha-value>)",
        kakao: "rgb(var(--fmp-kakao) / <alpha-value>)",
        content: {
          primary: "rgb(var(--fmp-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--fmp-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--fmp-text-muted) / <alpha-value>)",
          inverse: "rgb(var(--fmp-text-inverse) / <alpha-value>)",
        },
        action: {
          primary: "rgb(var(--fmp-action-primary) / <alpha-value>)",
          secondary: "rgb(var(--fmp-action-secondary) / <alpha-value>)",
          destructive: "rgb(var(--fmp-action-destructive) / <alpha-value>)",
          brand: "rgb(var(--fmp-action-brand) / <alpha-value>)",
        },
        state: {
          searching: "rgb(var(--fmp-state-searching) / <alpha-value>)",
          sighting: "rgb(var(--fmp-state-sighting) / <alpha-value>)",
          found: "rgb(var(--fmp-state-found) / <alpha-value>)",
          protected: "rgb(var(--fmp-state-protected) / <alpha-value>)",
          waiting: "rgb(var(--fmp-state-waiting) / <alpha-value>)",
          archived: "rgb(var(--fmp-state-archived) / <alpha-value>)",
        },
        map: {
          missing: "rgb(var(--fmp-map-missing-pin) / <alpha-value>)",
          sighting: "rgb(var(--fmp-map-sighting-pin) / <alpha-value>)",
          radius: "rgb(var(--fmp-map-radius) / <alpha-value>)",
          selected: "rgb(var(--fmp-map-selected) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        // 리뉴얼로 세리프 디스플레이는 은퇴 — 기존 font-editorial 사용처는 같은 산세리프의
        // 무게·자간 위계로 수렴한다 (클래스 삭제 대신 토큰 재정의로 전 화면 일괄 전환).
        editorial: ["var(--font-pretendard)", "Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "80rem",
        reading: "48rem",
      },
      boxShadow: {
        raised: "var(--fmp-shadow-raised)",
        lifted: "var(--fmp-shadow-lifted)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
