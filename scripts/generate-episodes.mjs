#!/usr/bin/env node

/**
 * Generate static HTML files for each podcast episode
 * Run with: node scripts/generate-episodes.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_FEED_URL = 'https://feeds.castplus.fm/affiliatebi';
const SITE_BASE_URL = 'https://revenueoptimization.io';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ep');

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Format date
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// Format duration
function formatDuration(duration) {
  if (!duration) return '';
  if (duration.includes(':')) return duration;
  
  const seconds = parseInt(duration, 10);
  if (isNaN(seconds)) return duration;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Truncate text
function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Generate HTML for an episode
function generateEpisodeHtml(episode, prevEpisodes, nextEpisodes) {
  const slug = generateSlug(episode.title);
  const description = escapeHtml(truncate(episode.description, 160));
  const fullDescription = escapeHtml(episode.description);
  const title = escapeHtml(episode.title);
  const image = episode.image || '/images/podcast-cover.png';
  const canonicalUrl = `${SITE_BASE_URL}/ep/${slug}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- SEO Meta Tags -->
  <title>${title} | Affiliate BI Podcast</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:site_name" content="Affiliate BI Podcast">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  
  <!-- Podcast specific -->
  <meta property="og:audio" content="${episode.enclosure?.url || ''}">
  <meta property="og:audio:type" content="audio/mpeg">
  
  <!-- Schema.org structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "name": "${title}",
    "description": "${description}",
    "url": "${canonicalUrl}",
    "datePublished": "${episode.pubDate}",
    "duration": "${episode.duration || ''}",
    "image": "${image}",
    "partOfSeries": {
      "@type": "PodcastSeries",
      "name": "Affiliate BI Podcast",
      "url": "${SITE_BASE_URL}"
    }${episode.enclosure?.url ? `,
    "associatedMedia": {
      "@type": "AudioObject",
      "contentUrl": "${episode.enclosure.url}"
    }` : ''}
  }
  </script>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="episode-page">
    <!-- Header -->
    <header class="header">
      <nav class="nav-container">
        <a href="/" class="logo">Affiliate BI</a>
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/episodes">Episodes</a>
          <a href="/stats">Stats</a>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="episode-content">
      <div class="container">
        <!-- Back Button -->
        <a href="/episodes" class="back-link">← Back to Episodes</a>
        
        <!-- Episode Image -->
        <div class="episode-image-container">
          <img src="${image}" alt="${title}" class="episode-image" loading="lazy">
        </div>
        
        <!-- Episode Title -->
        <h1 class="episode-title">${title}</h1>
        
        <!-- Episode Meta -->
        <div class="episode-meta">
          ${episode.pubDate ? `<span class="meta-item">📅 ${formatDate(episode.pubDate)}</span>` : ''}
          ${episode.duration ? `<span class="meta-item">⏱️ ${formatDuration(episode.duration)}</span>` : ''}
        </div>
        
        <!-- Action Buttons -->
        <div class="episode-actions">
          ${episode.enclosure?.url ? `<a href="${episode.enclosure.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">▶ Play Episode</a>` : ''}
          ${episode.link ? `<a href="${episode.link}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">View Details</a>` : ''}
        </div>
        
        <!-- Description -->
        <div class="episode-description">
          <h2>About This Episode</h2>
          <p>${fullDescription}</p>
        </div>
        
        <!-- Related Episodes -->
        ${(prevEpisodes.length > 0 || nextEpisodes.length > 0) ? `
        <div class="related-episodes">
          <h2>More Episodes</h2>
          <div class="related-grid">
            ${prevEpisodes.length > 0 ? `
            <div class="related-section">
              <h3>← Previous Episodes</h3>
              <ul class="related-list">
                ${prevEpisodes.map(ep => `
                <li>
                  <a href="/ep/${generateSlug(ep.title)}">
                    <span class="related-title">${escapeHtml(ep.title)}</span>
                    <span class="related-date">${formatDate(ep.pubDate)}</span>
                  </a>
                </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
            ${nextEpisodes.length > 0 ? `
            <div class="related-section">
              <h3>Next Episodes →</h3>
              <ul class="related-list">
                ${nextEpisodes.map(ep => `
                <li>
                  <a href="/ep/${generateSlug(ep.title)}">
                    <span class="related-title">${escapeHtml(ep.title)}</span>
                    <span class="related-date">${formatDate(ep.pubDate)}</span>
                  </a>
                </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Affiliate BI Podcast. All rights reserved.</p>
        <div class="footer-links">
          <a href="/">Home</a>
          <a href="/episodes">Episodes</a>
          <a href="/stats">Stats</a>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;
}

// Parse RSS feed
function parseRssFeed(xml) {
  const episodes = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    
    const getTag = (tag) => {
      const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`);
      const m = item.match(regex);
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    
    const getAttr = (tag, attr) => {
      const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*>`);
      const m = item.match(regex);
      return m ? m[1] : '';
    };
    
    const title = getTag('title');
    const description = getTag('description').replace(/<[^>]*>/g, '');
    const pubDate = getTag('pubDate');
    const link = getTag('link');
    const duration = getTag('itunes:duration') || getTag('duration');
    const image = getAttr('itunes:image', 'href') || getAttr('image', 'href');
    const enclosureUrl = getAttr('enclosure', 'url');
    
    episodes.push({
      title,
      description,
      pubDate,
      link,
      duration,
      image,
      enclosure: enclosureUrl ? { url: enclosureUrl, type: 'audio/mpeg' } : undefined,
    });
  }
  
  return episodes;
}

// Generate sitemap.xml
function generateSitemap(episodes) {
  const baseUrl = SITE_BASE_URL;
  const today = new Date().toISOString().split('T')[0];
  
  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/episodes', changefreq: 'weekly', priority: '0.9' },
    { loc: '/stats', changefreq: 'weekly', priority: '0.8' },
    { loc: '/affiliate-tools', changefreq: 'monthly', priority: '0.7' },
    { loc: '/made-with-lovable', changefreq: 'monthly', priority: '0.6' },
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
  <!-- Episode Pages (auto-generated from RSS feed) -->
${episodes.map(ep => {
  const slug = generateSlug(ep.title);
  const pubDate = ep.pubDate ? new Date(ep.pubDate).toISOString().split('T')[0] : today;
  return `  <url>
    <loc>${baseUrl}/ep/${slug}/</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
}).join('\n')}
</urlset>`;
  
  return sitemap;
}

// Main function
async function main() {
  console.log('🎙️ Generating static episode pages and sitemap...\n');
  
  try {
    // Fetch RSS feed
    console.log('📡 Fetching RSS feed...');
    const response = await fetch(RSS_FEED_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }
    const xml = await response.text();
    
    // Parse episodes
    const episodes = parseRssFeed(xml);
    console.log(`📋 Found ${episodes.length} episodes\n`);
    
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Generate HTML for each episode
    let generated = 0;
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const slug = generateSlug(episode.title);

      // Get previous and next episodes
      const prevEpisodes = episodes.slice(Math.max(0, i - 3), i).reverse();
      const nextEpisodes = episodes.slice(i + 1, i + 4);

      // Generate HTML
      const html = generateEpisodeHtml(episode, prevEpisodes, nextEpisodes);

      // Write file as /public/ep/:slug/index.html so /ep/:slug works without ".html"
      const episodeDir = path.join(OUTPUT_DIR, slug);
      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }
      const filePath = path.join(episodeDir, "index.html");
      fs.writeFileSync(filePath, html, "utf8");

      generated++;
      console.log(`✅ Generated: /ep/${slug}/index.html`);
    }
    
    console.log(`\n🎉 Successfully generated ${generated} episode pages in /public/ep/`);
    
    // Generate index for the ep folder
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/episodes">
  <title>Episodes | Revenue Optimization</title>
</head>
<body>
  <p>Redirecting to <a href="/episodes">episodes</a>...</p>
</body>
</html>`;

    fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), indexHtml, "utf8");
    console.log("✅ Generated: /ep/index.html (redirect)");
    
    // Generate sitemap
    console.log('\n📍 Generating sitemap...');
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const sitemap = generateSitemap(episodes);
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log(`✅ Generated: /public/sitemap.xml with ${episodes.length} episodes`);
    
    console.log('\n🎉 All done! Run this script whenever you publish new episodes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
