import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/Toaster";

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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai-analyst.app",
    title: "AI Analyst - Intelligent Data Analytics",
    description: "Transform raw data into actionable intelligence with AI",
    siteName: "AI Analyst",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Analyst - Intelligent Data Analytics",
    description: "Transform raw data into actionable intelligence with AI",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Main app content */}
          <div className="relative min-h-screen bg-background">
            {/* Background gradient orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-info/15 rounded-full blur-3xl" />
            </div>

            {/* Page content */}
            <main className="relative z-10">{children}</main>
          </div>

          {/* Global toast notifications */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}