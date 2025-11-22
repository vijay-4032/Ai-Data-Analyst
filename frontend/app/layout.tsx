import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

// Load Inter font with subsets
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "AI Analyst - Intelligent Data Analytics",
    template: "%s | AI Analyst",
  },
  description:
    "Upload your data and get instant AI-powered insights, visualizations, and analysis. Transform raw data into actionable intelligence.",
  keywords: [
    "data analytics",
    "AI analysis",
    "data visualization",
    "business intelligence",
    "CSV analysis",
  ],
  authors: [{ name: "AI Analyst" }],
  creator: "AI Analyst",
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0F" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}