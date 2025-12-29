import { useEffect, useState } from "react";
import podcastCover from "@/assets/podcast-cover.png";

const HeroSection = () => {
  const [episodeCount, setEpisodeCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchEpisodeCount = async () => {
      const RSS_FEED_URL = 'https://feeds.castplus.fm/affiliatebi';
      const CORS_PROXIES = [
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      ];

      for (const proxy of CORS_PROXIES) {
        try {
          const response = await fetch(proxy(RSS_FEED_URL));
          if (!response.ok) continue;
          const text = await response.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const items = xml.querySelectorAll('item');
          setEpisodeCount(items.length);
          return;
        } catch {
          continue;
        }
      }
    };

    fetchEpisodeCount();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 wave-pattern overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-glow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Cover Image */}
          <div className="w-full max-w-md lg:max-w-lg animate-float">
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl transform rotate-3" />
              <img
                src={podcastCover}
                alt="Revenue Optimization with StatsDrone Podcast"
                className="relative rounded-3xl shadow-glow w-full"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="gradient-text">Revenue Optimization</span>
              <br />
              <span className="text-foreground">with StatsDrone Podcast</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              An Affiliate Marketing Podcast
            </p>
            
            <div className="flex gap-8 justify-center lg:justify-start">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  {episodeCount !== null ? episodeCount : '—'}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Episodes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">
                  101,381
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
