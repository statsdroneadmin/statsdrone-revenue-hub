import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/seo/Seo";
import HeroSection from "@/components/home/HeroSection";
import PlatformsSection from "@/components/home/PlatformsSection";
import SponsorsSection from "@/components/home/SponsorsSection";
import AffiliatePlatformsSection from "@/components/home/AffiliatePlatformsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Revenue Optimization Podcast | StatsDrone"
        description="Revenue Optimization with StatsDrone: an affiliate marketing podcast hosted by John Wright."
        canonicalPath="/"
      />
      <Header />
      <main>
        <SponsorsSection />
        <AffiliatePlatformsSection />
        <PlatformsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
