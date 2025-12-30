import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import podcastCover from "@/assets/podcast-cover.png";
import { generateSlug } from "@/lib/episodeUtils";

interface LatestEpisode {
  title: string;
  pubDate: string;
  slug: string;
}

const HeroSection = () => {
  const [episodeCount, setEpisodeCount] = useState<number | null>(null);
  const [latestEpisode, setLatestEpisode] = useState<LatestEpisode | null>(null);

  const getDaysAgo = (dateString: string): number => {
    const pubDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - pubDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const fetchEpisodeData = async () => {
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
          
          // Get latest episode
          if (items.length > 0) {
            const firstItem = items[0];
            const title = firstItem.querySelector('title')?.textContent || '';
            const pubDate = firstItem.querySelector('pubDate')?.textContent || '';
            setLatestEpisode({
              title,
              pubDate,
              slug: generateSlug(title),
            });
          }
          return;
        } catch {
          continue;
        }
      }
    };

    fetchEpisodeData();
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
            
            {latestEpisode && (
              <Link
                to={`/${latestEpisode.slug}`}
                className="inline-flex flex-col gap-1 mt-6 p-4 rounded-xl bg-secondary/30 border border-border hover:border-accent/50 hover:bg-secondary/50 transition-all duration-300 max-w-xl mx-auto lg:mx-0"
              >
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Latest Episode</span>
                <span className="text-foreground font-medium hover:text-accent transition-colors line-clamp-2">
                  {latestEpisode.title}
                </span>
                <span className="text-sm text-accent">
                  {getDaysAgo(latestEpisode.pubDate) === 0 
                    ? 'Published today' 
                    : getDaysAgo(latestEpisode.pubDate) === 1 
                      ? 'Published 1 day ago'
                      : `Published ${getDaysAgo(latestEpisode.pubDate)} days ago`}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
