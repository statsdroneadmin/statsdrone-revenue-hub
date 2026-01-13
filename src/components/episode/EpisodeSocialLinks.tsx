import { useState, useEffect } from "react";
import YouTubeIcon from "@/assets/youtube-icon.svg";
import YouTubeShortsIcon from "@/assets/youtube-shorts-icon.svg";
import SpotifyIcon from "@/assets/spotify-icon.svg";
import ApplePodcastsIcon from "@/assets/apple-podcasts-icon.svg";

interface SocialLinks {
  youtube?: string;
  youtubeShorts?: string;
  spotify?: string;
  applePodcasts?: string;
}

interface EpisodeSocialLinksProps {
  slug: string;
}

const parseSocialsMarkdown = (content: string): SocialLinks => {
  const links: SocialLinks = {};
  
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, url] = match;
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('youtube short') || lowerText.includes('shorts')) {
      links.youtubeShorts = url;
    } else if (lowerText.includes('youtube')) {
      links.youtube = url;
    } else if (lowerText.includes('spotify')) {
      links.spotify = url;
    } else if (lowerText.includes('apple') || lowerText.includes('podcast')) {
      links.applePodcasts = url;
    }
  }
  
  return links;
};

const EpisodeSocialLinks = ({ slug }: EpisodeSocialLinksProps) => {
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocials = async () => {
      try {
        const response = await fetch(`/ep/${slug}/socials.md`);
        if (response.ok) {
          const text = await response.text();
          const links = parseSocialsMarkdown(text);
          // Only set if at least one link exists
          if (Object.keys(links).length > 0) {
            setSocialLinks(links);
          }
        }
      } catch {
        setSocialLinks(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSocials();
  }, [slug]);

  if (loading || !socialLinks) {
    return null;
  }

  const hasAnyLinks = socialLinks.youtube || socialLinks.youtubeShorts || socialLinks.spotify || socialLinks.applePodcasts;

  if (!hasAnyLinks) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {socialLinks.youtube && (
        <a
          href={socialLinks.youtube}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on YouTube"
          className="transition-transform hover:scale-110"
        >
          <img src={YouTubeIcon} alt="YouTube" className="w-8 h-8" />
        </a>
      )}
      {socialLinks.youtubeShorts && (
        <a
          href={socialLinks.youtubeShorts}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch YouTube Short"
          className="transition-transform hover:scale-110"
        >
          <img src={YouTubeShortsIcon} alt="YouTube Shorts" className="w-8 h-8" />
        </a>
      )}
      {socialLinks.spotify && (
        <a
          href={socialLinks.spotify}
          target="_blank"
          rel="noopener noreferrer"
          title="Listen on Spotify"
          className="transition-transform hover:scale-110"
        >
          <img src={SpotifyIcon} alt="Spotify" className="w-8 h-8" />
        </a>
      )}
      {socialLinks.applePodcasts && (
        <a
          href={socialLinks.applePodcasts}
          target="_blank"
          rel="noopener noreferrer"
          title="Listen on Apple Podcasts"
          className="transition-transform hover:scale-110"
        >
          <img src={ApplePodcastsIcon} alt="Apple Podcasts" className="w-8 h-8" />
        </a>
      )}
    </div>
  );
};

export default EpisodeSocialLinks;
