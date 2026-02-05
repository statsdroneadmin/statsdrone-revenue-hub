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

// Where to write generated files.
// - Default: /public (useful for local preview)
// - Build: pass --outDir dist so Cloudflare Pages serves static HTML at /ep/:slug/
const outDirArgIndex = process.argv.findIndex((a) => a === '--outDir');
const OUT_DIR = outDirArgIndex !== -1 ? process.argv[outDirArgIndex + 1] : null;
const OUTPUT_ROOT = OUT_DIR
  ? path.join(__dirname, '..', OUT_DIR)
  : path.join(__dirname, '..', 'public');

const OUTPUT_DIR = path.join(OUTPUT_ROOT, 'ep');

// Source directory for transcripts (always in public/)
const PUBLIC_EP_DIR = path.join(__dirname, '..', 'public', 'ep');

// Convert markdown to simple HTML
function markdownToHtml(markdown) {
  if (!markdown) return '';
  return markdown
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Convert ## headings to h3
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Convert # headings to h2
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Convert **bold** to strong
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert timestamps [00:00:00] to spans
    .replace(/\[(\d{2}:\d{2}:\d{2})\]/g, '<span class="timestamp">[$1]</span>')
    // Convert paragraphs (double newlines)
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p && !p.startsWith('<h'))
    .map(p => p.startsWith('<h') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

// Read transcript if it exists
function readTranscript(slug) {
  const transcriptPath = path.join(PUBLIC_EP_DIR, slug, 'transcript.md');
  if (fs.existsSync(transcriptPath)) {
    const content = fs.readFileSync(transcriptPath, 'utf8');
    return markdownToHtml(content);
  }
  return null;
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')              // Decompose Unicode characters (ü → u + combining mark)
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
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

// Generate HTML for the episodes list page
function generateEpisodesListHtml(episodes) {
  const title = 'All Episodes';
  const description = 'Browse all episodes of the Revenue Optimization podcast with StatsDrone.';
  const canonicalUrl = `${SITE_BASE_URL}/episodes/`;

  const episodeItems = episodes.map(ep => {
    const slug = generateSlug(ep.title);
    const image = ep.image || '/images/podcast-cover.png';
    const desc = escapeHtml(truncate(ep.description, 300));
    return `
            <article class="episode-list-item" data-title="${escapeHtml(ep.title).toLowerCase()}" data-description="${desc.toLowerCase()}">
              <div class="episode-list-row">
                <a href="/ep/${slug}/" class="episode-list-image">
                  ${image ? `<img src="${image}" alt="${escapeHtml(ep.title)}" loading="lazy">` : '<div class="episode-image-placeholder">&#9654;</div>'}
                </a>
                <div class="episode-list-content">
                  <a href="/ep/${slug}/" class="episode-list-title-link">
                    <h2 class="episode-list-title">${escapeHtml(ep.title)}</h2>
                  </a>
                  <div class="episode-list-meta">
                    ${ep.pubDate ? `<span>&#128197; ${formatDate(ep.pubDate)}</span>` : ''}
                    ${ep.duration ? `<span>&#9201; ${formatDuration(ep.duration)}</span>` : ''}
                  </div>
                  <p class="episode-list-description">${desc}</p>
                  <div class="episode-list-actions">
                    ${ep.enclosure?.url ? `<a href="${ep.enclosure.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">&#9654; Play Episode</a>` : ''}
                    <a href="/ep/${slug}/" class="btn btn-secondary btn-sm">View Details</a>
                  </div>
                </div>
              </div>
            </article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-statsdrone-static-episodes" content="true">

  <!-- SEO Meta Tags -->
  <title>${title} | Revenue Optimization with StatsDrone</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title} | Revenue Optimization">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="Affiliate BI Podcast">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:url" content="${canonicalUrl}">
  <meta name="twitter:title" content="${title} | Revenue Optimization">
  <meta name="twitter:description" content="${description}">

  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="episodes-page">
    <!-- Header -->
    <header class="header">
      <nav class="nav-container">
        <a href="/" class="logo">Affiliate BI</a>
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/episodes/" class="active">Episodes</a>
          <a href="/stats/">Stats</a>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="episodes-content">
      <div class="container">
        <div class="episodes-header">
          <h1 class="page-title"><span class="gradient-text">All Episodes</span></h1>
          <p class="page-subtitle">
            Explore our complete archive of episodes featuring insights on
            revenue optimization and affiliate marketing.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <input type="text" id="episode-search" class="search-input" placeholder="Search episodes by keyword...">
          </div>
          <p id="search-results-count" class="search-results-count" style="display:none;"></p>
        </div>

        <!-- Episodes List -->
        <div class="episodes-list" id="episodes-list">
          ${episodeItems}
        </div>

        <div id="no-results" class="no-results" style="display:none;">
          <p>No episodes match your search.</p>
          <button onclick="document.getElementById('episode-search').value='';filterEpisodes();" class="btn btn-secondary">Clear Search</button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Affiliate BI Podcast. All rights reserved.</p>
        <div class="footer-links">
          <a href="/">Home</a>
          <a href="/episodes/">Episodes</a>
          <a href="/stats/">Stats</a>
        </div>
      </div>
    </footer>
  </div>

  <script>
    function filterEpisodes() {
      var query = document.getElementById('episode-search').value.toLowerCase().trim();
      var items = document.querySelectorAll('.episode-list-item');
      var count = 0;
      items.forEach(function(item) {
        var title = item.getAttribute('data-title') || '';
        var desc = item.getAttribute('data-description') || '';
        var match = !query || title.indexOf(query) !== -1 || desc.indexOf(query) !== -1;
        item.style.display = match ? '' : 'none';
        if (match) count++;
      });
      var countEl = document.getElementById('search-results-count');
      var noResults = document.getElementById('no-results');
      if (query) {
        countEl.textContent = 'Found ' + count + ' episode' + (count !== 1 ? 's' : '');
        countEl.style.display = '';
        noResults.style.display = count === 0 ? '' : 'none';
      } else {
        countEl.style.display = 'none';
        noResults.style.display = 'none';
      }
    }
    document.getElementById('episode-search').addEventListener('input', filterEpisodes);
  </script>
</body>
</html>`;
}

// Generate HTML for an episode
function generateEpisodeHtml(episode, prevEpisodes, nextEpisodes, transcriptHtml = null) {
  const slug = generateSlug(episode.title);
  const description = escapeHtml(truncate(episode.description, 160));
  const fullDescription = escapeHtml(episode.description);
  const title = escapeHtml(episode.title);
  const image = episode.image || '/images/podcast-cover.png';
  const canonicalUrl = `${SITE_BASE_URL}/ep/${slug}/`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-statsdrone-static-episode" content="true">
  
  <!-- SEO Meta Tags -->
  <title>${title} | Revenue Optimization with StatsDrone</title>
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

        ${transcriptHtml ? `
        <!-- Transcript -->
        <div class="episode-transcript">
          <h2>Full Transcript</h2>
          <div class="transcript-content">
            ${transcriptHtml}
          </div>
        </div>
        ` : ''}

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

      // Check for transcript
      const transcriptHtml = readTranscript(slug);
      if (transcriptHtml) {
        console.log(`  📝 Found transcript for ${slug}`);
      }

      // Generate HTML
      const html = generateEpisodeHtml(episode, prevEpisodes, nextEpisodes, transcriptHtml);

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

    // Generate episodes list page
    console.log('\n📋 Generating episodes list page...');
    const episodesDir = path.join(OUTPUT_ROOT, 'episodes');
    if (!fs.existsSync(episodesDir)) {
      fs.mkdirSync(episodesDir, { recursive: true });
    }
    const episodesListHtml = generateEpisodesListHtml(episodes);
    fs.writeFileSync(path.join(episodesDir, 'index.html'), episodesListHtml, 'utf8');
    console.log('✅ Generated: /episodes/index.html');

    // Generate sitemap
    console.log('\n📍 Generating sitemap...');
    const sitemapPath = path.join(OUTPUT_ROOT, 'sitemap.xml');
    const sitemap = generateSitemap(episodes);
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log(`✅ Generated: ${sitemapPath} with ${episodes.length} episodes`);
    
    console.log('\n🎉 All done! Run this script whenever you publish new episodes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
