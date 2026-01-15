import { Metadata } from "next";
import BentoFeatures from "@/app/src/components/LandingPage/bento-features";
import FinalCTA from "@/app/src/components/LandingPage/final-cta";
import Hero from "@/app/src/components/LandingPage/hero";

export const metadata: Metadata = {
  title: "AI-Powered Code Architecture Analysis Tool",
  description:
    "Scan your Vibe Code in minutes. Cadracode uses AI to visualize business logic, track technical debt, analyze code impact, generate onboarding paths, and create comprehensive documentation. Start with 5 scans for $14.99/month.",
  keywords: [
    "code architecture analysis",
    "codebase visualization",
    "technical debt tracking",
    "code impact analysis",
    "developer onboarding",
    "code documentation generator",
    "AI code analysis",
    "software architecture tool",
    "legacy code understanding",
    "codebase mapping",
  ],
  openGraph: {
    title: "Cadracode - Scan Your Vibe Code in Minutes",
    description:
      "AI-powered architecture analysis that visualizes business logic, tracks technical debt, and helps onboard new developers. $14.99/month for 5 scans.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cadracode Code Architecture Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadracode - AI-Powered Code Architecture Analysis",
    description:
      "Scan your codebase in minutes. Visualize business logic, track technical debt, and onboard new developers.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Cadracode",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "14.99",
              priceCurrency: "USD",
              priceValidUntil: "2026-12-31",
            },
            description:
              "AI-powered code architecture analysis tool that visualizes business logic, tracks technical debt, and generates documentation.",
            featureList: [
              "Business Logic Blueprint Visualization",
              "Technical Debt Heatmap",
              "Impact Analysis Engine",
              "Onboarding Copilot",
              "Smart Documentation Generator",
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1",
            },
          }),
        }}
      />
      <div className="min-h-screen bg-background">
        <Hero />
        {/* <ProblemSection /> */}
        {/*       <HowItWorks />
         */}{" "}
        <BentoFeatures />
        <FinalCTA />
      </div>
    </>
  );
}
