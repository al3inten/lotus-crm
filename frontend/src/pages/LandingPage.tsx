import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { ProductPreview } from "../components/landing/ProductPreview";
import { ChannelBand } from "../components/landing/ChannelBand";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { PipelineSection } from "../components/landing/PipelineSection";
import { ImpactSection } from "../components/landing/ImpactSection";
import { FaqSection } from "../components/landing/FaqSection";
import { CtaSection } from "../components/landing/CtaSection";
import { Footer } from "../components/landing/Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
      <Navbar />
      <HeroSection />
      <ProductPreview />
      <ChannelBand />
      <FeaturesSection />
      <PipelineSection />
      <ImpactSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
