import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import spotifyIcon from "@/assets/spotify-icon.svg";
import applePodcastsIcon from "@/assets/apple-podcasts-icon.svg";
import youtubeIcon from "@/assets/youtube-icon.svg";

const platformLinks = [
  {
    name: "Spotify",
    url: "https://open.spotify.com/show/0nTNXugQTY4Ww8JiSULeiu",
    icon: spotifyIcon,
  },
  {
    name: "Apple Podcasts",
    url: "https://podcasts.apple.com/ca/podcast/revenue-optimization-with-statsdrone/id1700893670",
    icon: applePodcastsIcon,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/watch?v=NKHxEFxKXXA&list=PLxACGKJVEhOk31EcEPhnao6O1SSpu8Qaa",
    icon: youtubeIcon,
  },
];

const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/episodes/", label: "Episodes" },
    { to: "/stats/", label: "Stats" },
    { to: "/affiliate-tools/", label: "Affiliate Tools" },
    { to: "/made-with-lovable/", label: "Made with Lovable" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-4">
            {platformLinks.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Listen on ${platform.name}`}
                className="opacity-80 hover:opacity-100 transition-all hover:scale-110"
              >
                <img
                  src={platform.icon}
                  alt={platform.name}
                  className="w-7 h-7 object-contain"
                />
              </a>
            ))}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === link.to
                    ? "text-accent"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    location.pathname === link.to
                      ? "text-accent"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
