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
                // Primary - Blue
                primary: {
                    DEFAULT: "#3b82f6", // Blue 500
                    dark: "#2563eb",    // Blue 600
                    light: "#60a5fa",   // Blue 400
                    50: "#eff6ff",      // Blue 50
                },
                // Secondary - Purple
                secondary: {
                    DEFAULT: "#8b5cf6", // Purple 500
                    dark: "#7c3aed",    // Purple 600
                    light: "#a78bfa",   // Purple 400
                },
                // Semantic Colors
                success: {
                    DEFAULT: "#22c55e", // Green 500
                    dark: "#16a34a",    // Green 600
                    light: "#dcfce7",   // Green 50
                },
                error: {
                    DEFAULT: "#ef4444", // Red 500
                    dark: "#dc2626",    // Red 600
                    light: "#fee2e2",   // Red 50
                },
                warning: {
                    DEFAULT: "#f59e0b", // Amber 500
                    dark: "#d97706",    // Amber 600
                    light: "#fef3c7",   // Amber 50
                },
                streak: {
                    DEFAULT: "#f97316", // Orange 500
                    light: "#ffedd5",   // Orange 50
                },
                "background-light": "#f8fafc",
                "background-dark": "#0f172a",
                surface: {
                    light: "#ffffff",
                    dark: "#1e293b",
                }
            },
            fontFamily: {
                display: ["var(--font-lexend)", "sans-serif"],
                sans: ["var(--font-nunito)", "sans-serif"],
                nunito: ["var(--font-nunito)", "sans-serif"], // Explicit alias for A11y
            },
            borderRadius: {
                lg: "1rem",     // 16px
                xl: "1.5rem",   // 24px
                "2xl": "2rem",  // 32px
                "3xl": "3rem",  // 48px
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'card': '0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.05)',
                '3d-primary': '0 4px 0 0 #2563eb', // Blue 600 shadow
                '3d-success': '0 4px 0 0 #16a34a', // Green 600 shadow
                '3d-default': '0 4px 0 0 #cbd5e1', // Slate 300 shadow
            }
        },
    },
    plugins: [],
};
export default config;
