import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import {
  Play,
  Calendar,
  Clock,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Episode,
  fetchEpisodes,
  findEpisodeBySlug,
  generateSlug,
  formatDate,
  formatDuration,
} from "@/lib/episodeUtils";

const EpisodeDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const data = await fetchEpisodes();
        setEpisodes(data);
      } catch (err) {
        setError("Unable to load episode. Please try again later.");
        console.error("Error fetching RSS feed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  const episode = slug ? findEpisodeBySlug(episodes, slug) : undefined;
  const currentIndex = episode ? episodes.findIndex(ep => ep.title === episode.title) : -1;
  
  // Get 3 episodes before and 3 after
  const previousEpisodes = currentIndex > 0 
    ? episodes.slice(Math.max(0, currentIndex - 3), currentIndex)
    : [];
  
  const nextEpisodes = currentIndex >= 0 && currentIndex < episodes.length - 1
    ? episodes.slice(currentIndex + 1, currentIndex + 4)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="w-full aspect-square max-w-md mx-auto rounded-2xl mb-8" />
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/3 mx-auto mb-8" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-4xl font-bold mb-4">
              Episode Not Found
            </h1>
            <p className="text-muted-foreground mb-8">
              {error || "The episode you're looking for doesn't exist."}
            </p>
            <Button variant="accent" asChild>
              <Link to="/episodes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Episodes
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${episode.title} | Revenue Optimization`}
        description={episode.description?.slice(0, 155)}
        canonicalPath={`/ep/${slug ?? ""}`}
        image={episode.image}
        ogType="article"
      />
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="max-w-4xl mx-auto mb-8">
            <Button variant="ghost" asChild>
              <Link to="/episodes">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Episodes
              </Link>
            </Button>
          </div>

          {/* Episode Content */}
          <article className="max-w-4xl mx-auto">
            {/* Episode Image */}
            <div className="w-full max-w-md mx-auto mb-8">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border shadow-card">
                {episode.image ? (
                  <img
                    src={episode.image}
                    alt={episode.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Play className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Episode Title */}
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
              {episode.title}
            </h1>

            {/* Episode Meta */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground mb-8">
              {episode.pubDate && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDate(episode.pubDate)}
                </span>
              )}
              {episode.duration && (
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {formatDuration(episode.duration)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              {episode.enclosure?.url && (
                <Button variant="accent" size="lg" asChild>
                  <a
                    href={episode.enclosure.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Play className="w-5 h-5" />
                    Play Episode
                  </a>
                </Button>
              )}
              {episode.link && (
                <Button variant="outline" size="lg" asChild>
                  <a
                    href={episode.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Details
                  </a>
                </Button>
              )}
            </div>

            {/* Episode Description */}
            <div className="bg-gradient-card rounded-2xl p-8 border border-border mb-16">
              <h2 className="font-display text-xl font-bold mb-4">About This Episode</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {episode.description}
              </p>
            </div>

            {/* Related Episodes */}
            {(previousEpisodes.length > 0 || nextEpisodes.length > 0) && (
              <section>
                <h2 className="font-display text-2xl font-bold text-center mb-8">
                  More Episodes
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Previous Episodes */}
                  {previousEpisodes.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-muted-foreground">
                        <ChevronLeft className="w-5 h-5" />
                        Previous Episodes
                      </h3>
                      <div className="space-y-4">
                        {previousEpisodes.map((ep, index) => (
                          <Link
                            key={index}
                            to={`/ep/${generateSlug(ep.title)}`}
                            reloadDocument
                            className="group block bg-secondary/50 rounded-xl p-4 border border-border hover:border-accent/50 transition-all duration-300"
                          >
                            <div className="flex gap-4">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                {ep.image ? (
                                  <img
                                    src={ep.image}
                                    alt={ep.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm group-hover:text-accent transition-colors line-clamp-2">
                                  {ep.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(ep.pubDate)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Episodes */}
                  {nextEpisodes.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold mb-4 text-muted-foreground">
                        Next Episodes
                        <ChevronRight className="w-5 h-5" />
                      </h3>
                      <div className="space-y-4">
                        {nextEpisodes.map((ep, index) => (
                          <Link
                            key={index}
                            to={`/ep/${generateSlug(ep.title)}`}
                            reloadDocument
                            className="group block bg-secondary/50 rounded-xl p-4 border border-border hover:border-accent/50 transition-all duration-300"
                          >
                            <div className="flex gap-4">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                {ep.image ? (
                                  <img
                                    src={ep.image}
                                    alt={ep.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm group-hover:text-accent transition-colors line-clamp-2">
                                  {ep.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(ep.pubDate)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EpisodeDetail;
