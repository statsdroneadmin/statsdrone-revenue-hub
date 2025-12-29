import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import PlatformsSection from "@/components/home/PlatformsSection";
import SponsorsSection from "@/components/home/SponsorsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <SponsorsSection />
        <PlatformsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
