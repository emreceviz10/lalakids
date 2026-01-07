import type { Metadata } from "next";
import { Lexend, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Lala Kids",
  description: "AI-Powered Interactive Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={cn(
          "min-h-screen bg-background-light dark:bg-background-dark font-sans antialiased",
          lexend.variable,
          nunito.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
