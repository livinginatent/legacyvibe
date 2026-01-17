import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/src/components/layout/navbar";
import Footer from "@/app/src/components/layout/footer";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cadracode - AI-Powered Code Architecture Analysis",
    template: "%s | Cadracode",
  },
  description:
    "Scan your codebase in minutes. AI-powered architecture analysis that visualizes business logic, tracks technical debt, analyzes impact, and generates onboarding paths. $14.99/month for 5 scans.",
  keywords: [
    "code architecture analysis",
    "codebase visualization",
    "technical debt tracking",
    "code impact analysis",
    "developer onboarding",
    "code documentation",
    "AI code analysis",
    "software architecture",
    "codebase understanding",
    "legacy code analysis",
  ],
  authors: [{ name: "Cadracode" }],
  creator: "Cadracode",
  publisher: "Cadracode",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://cadracode.com"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Cadracode",
    title: "Cadracode - AI-Powered Code Architecture Analysis",
    description:
      "Scan your codebase in minutes. Visualize business logic, track technical debt, and onboard new developers with AI-powered architecture analysis.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cadracode - Code Architecture Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadracode - AI-Powered Code Architecture Analysis",
    description:
      "Scan your codebase in minutes. Visualize business logic, track technical debt, and onboard new developers.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="xdy9KtrVgSa7wUDM6IPIyoHrsbR9OKrDDKycybbY76w"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics gaId="G-W21NCZ70BC" />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
