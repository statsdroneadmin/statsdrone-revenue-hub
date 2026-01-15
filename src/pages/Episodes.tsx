import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Seo from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Calendar, Clock, ExternalLink, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Episode,
  fetchEpisodes,
  generateSlug,
  formatDate,
  formatDuration,
} from "@/lib/episodeUtils";

const Episodes = () => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return episodes;
    const query = searchQuery.toLowerCase();
    return episodes.filter(
      (episode) =>
        episode.title.toLowerCase().includes(query) ||
        episode.description.toLowerCase().includes(query)
    );
  }, [episodes, searchQuery]);

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        const data = await fetchEpisodes();
        // Truncate description for listings
        const truncatedEpisodes = data.map(ep => ({
          ...ep,
          description: ep.description.slice(0, 300)
        }));
        setEpisodes(truncatedEpisodes);
      } catch (err) {
        setError("Unable to load episodes. Please try again later.");
        console.error("Error fetching RSS feed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="All Episodes | Revenue Optimization"
        description="Browse all Revenue Optimization episodes with insights on affiliate marketing, tracking, and conversion optimization."
        canonicalPath="/episodes"
      />
      <Header />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">All Episodes</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our complete archive of episodes featuring insights on
              revenue optimization and affiliate marketing.
            </p>
          </div>

          {/* Search Filter */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search episodes by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-secondary/50 border-border focus:border-accent/50"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredEpisodes.length} episode{filteredEpisodes.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Episodes List */}
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gradient-card rounded-2xl p-6 border border-border"
                  >
                    <div className="flex gap-6">
                      <Skeleton className="w-32 h-32 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-destructive text-lg mb-4">{error}</p>
                <Button
                  variant="accent"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : filteredEpisodes.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? "No episodes match your search." : "No episodes found."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredEpisodes.map((episode, index) => (
                  <article
                    key={index}
                    className="group bg-gradient-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-card"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Episode Image */}
                      <Link
                        to={`/ep/${generateSlug(episode.title)}/`}
                        reloadDocument
                        className="w-full md:w-32 aspect-square md:aspect-auto md:h-32 bg-secondary rounded-xl flex-shrink-0 overflow-hidden"
                      >
                        {episode.image ? (
                          <img
                            src={episode.image}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>

                      {/* Episode Content */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/ep/${generateSlug(episode.title)}/`}
                          reloadDocument
                          className="block"
                        >
                          <h2 className="font-display text-xl font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                            {episode.title}
                          </h2>
                        </Link>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          {episode.pubDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(episode.pubDate)}
                            </span>
                          )}
                          {episode.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(episode.duration)}
                            </span>
                          )}
                        </div>

                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {episode.description}...
                        </p>

                        <div className="flex items-center gap-3">
                          {episode.enclosure?.url && (
                            <Button variant="accent" size="sm" asChild>
                              <a
                                href={episode.enclosure.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Play className="w-4 h-4" />
                                Play Episode
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/ep/${generateSlug(episode.title)}/`} reloadDocument>
                              <ExternalLink className="w-4 h-4" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Episodes;
