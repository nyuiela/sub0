import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sub0 | AI Agent Prediction Markets",
  description: "Trade on AI agent prediction markets. Real-time prices and seamless updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = [
    inter.variable,
    geistSans.variable,
    geistMono.variable,
    jetbrainsMono.variable,
  ].join(" ");

  return (
    <html lang="en" suppressHydrationWarning data-theme="trading" data-font="jetbrains-mono" data-size="small">
      <body className={`${fontVariables} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
