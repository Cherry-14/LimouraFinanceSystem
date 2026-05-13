import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_SUBTITLE } from "@/constants";

// Geist isn't on Google Fonts by default, so we pair Inter (variable) used only
// as a sane fallback under the --font-geist token. The CSS still prefers it.
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_SUBTITLE}`,
  description: "Internal financial tracking, profitability, and analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-white text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
