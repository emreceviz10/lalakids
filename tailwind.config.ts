import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#2b7cee",
                "background-light": "#f6f7f8",
                "background-dark": "#101822",
            },
            fontFamily: {
                display: ["var(--font-lexend)", "sans-serif"],
                sans: ["var(--font-noto-sans)", "sans-serif"],
            },
            borderRadius: {
                lg: "1rem",
                xl: "1.5rem",
                "2xl": "2rem",
            },
        },
    },
    plugins: [],
};
export default config;
