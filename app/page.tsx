import BentoFeatures from "@/components/LandingPage/bento-features";
import FinalCTA from "@/components/LandingPage/final-cta";
import Hero from "@/components/LandingPage/hero";
import HowItWorks from "@/components/LandingPage/how-it-works";
import ProblemSection from "@/components/LandingPage/problem-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <BentoFeatures />
      <FinalCTA />
   
    </div>
  );
}
