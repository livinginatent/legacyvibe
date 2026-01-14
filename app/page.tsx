import BentoFeatures from "@/app/src/components/LandingPage/bento-features";
import FinalCTA from "@/app/src/components/LandingPage/final-cta";
import Hero from "@/app/src/components/LandingPage/hero";
import HowItWorks from "@/app/src/components/LandingPage/how-it-works";
import ProblemSection from "@/app/src/components/LandingPage/problem-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ProblemSection />
{/*       <HowItWorks />
 */}      <BentoFeatures />
      <FinalCTA />
    </div>
  );
}
