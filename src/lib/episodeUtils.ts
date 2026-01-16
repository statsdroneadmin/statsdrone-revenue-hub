export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  duration: string;
  link: string;
  enclosure?: {
    url: string;
    type: string;
  };
  image?: string;
}

/**
 * Converts an episode title to a URL-friendly slug
 * - Lowercase
 * - Replace dots with hyphens
 * - Replace spaces and special characters with hyphens
 * - Remove consecutive hyphens
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')             // Decompose Unicode characters (ü → u + combining mark)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
    .replace(/\./g, '-')          // Replace dots with hyphens
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
};

/**
 * Find an episode by its slug
 */
export const findEpisodeBySlug = (episodes: Episode[], slug: string): Episode | undefined => {
  return episodes.find(episode => generateSlug(episode.title) === slug);
};

/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Format duration from seconds or HH:MM:SS format
 */
export const formatDuration = (duration: string): string => {
  if (!duration) return "";
  
  // If it's already in HH:MM:SS or MM:SS format
  if (duration.includes(":")) {
    return duration;
  }
  
  // If it's in seconds
  const seconds = parseInt(duration, 10);
  if (isNaN(seconds)) return duration;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Fetch episodes from RSS feed
 */
export const fetchEpisodes = async (): Promise<Episode[]> => {
  // Add cache-busting timestamp to ensure returning visitors see new episodes
  const cacheBuster = Date.now();
  const corsProxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  ];
  
  const feedUrl = "https://feeds.castplus.fm/affiliatebi";
  let text = "";
  let lastError: Error | null = null;
  
  for (const proxyFn of corsProxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const proxyUrl = proxyFn(feedUrl);
      console.log(`Trying proxy: ${proxyUrl.substring(0, 50)}...`);
      
      const response = await fetch(proxyUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        text = await response.text();
        console.log(`Successfully fetched ${text.length} bytes`);
        break;
      } else {
        console.log(`Proxy returned status ${response.status}`);
      }
    } catch (e) {
      lastError = e as Error;
      console.log(`Proxy failed:`, e);
      continue;
    }
  }
  
  if (!text) {
    console.error("All proxies failed. Last error:", lastError);
    throw new Error("Failed to fetch episodes from all proxies");
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  
  // Check for XML parsing errors
  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    console.error("XML parsing error:", parseError.textContent);
    throw new Error("Failed to parse RSS feed");
  }
  
  const items = xml.querySelectorAll("item");
  const parsedEpisodes: Episode[] = [];

  items.forEach((item) => {
    const title = item.querySelector("title")?.textContent || "";
    const description =
      item.querySelector("description")?.textContent || "";
    const pubDate = item.querySelector("pubDate")?.textContent || "";
    const link = item.querySelector("link")?.textContent || "";
    const enclosure = item.querySelector("enclosure");
    
    // Handle itunes:duration - try multiple approaches for cross-browser compatibility
    let duration = "";
    // Try getElementsByTagNameNS first (proper namespace handling)
    let durationElements = item.getElementsByTagNameNS("http://www.itunes.com/dtds/podcast-1.0.dtd", "duration");
    if (durationElements.length === 0) {
      // Fallback to getElementsByTagName with prefix
      durationElements = item.getElementsByTagName("itunes:duration");
    }
    if (durationElements.length > 0) {
      duration = durationElements[0]?.textContent || "";
    }
    
    // Handle itunes:image - try multiple approaches for cross-browser compatibility
    let image = "";
    // Try getElementsByTagNameNS first (proper namespace handling)
    let imageElements = item.getElementsByTagNameNS("http://www.itunes.com/dtds/podcast-1.0.dtd", "image");
    if (imageElements.length === 0) {
      // Fallback to getElementsByTagName with prefix
      imageElements = item.getElementsByTagName("itunes:image");
    }
    if (imageElements.length > 0) {
      image = imageElements[0]?.getAttribute("href") || "";
    }

    parsedEpisodes.push({
      title,
      description: description.replace(/<[^>]*>/g, ""),
      pubDate,
      duration,
      link,
      enclosure: enclosure
        ? {
            url: enclosure.getAttribute("url") || "",
            type: enclosure.getAttribute("type") || "",
          }
        : undefined,
      image,
    });
  });

  return parsedEpisodes;
};
