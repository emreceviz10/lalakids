import type { Metadata } from "next";
import { Lexend, Noto_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend" });
const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-noto-sans" });

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
          notoSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
