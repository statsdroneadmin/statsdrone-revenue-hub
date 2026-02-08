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
  <!-- Episode Pages (${episodes.length} episodes auto-generated from RSS feed) -->
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

// Parse Apple's oddly-formatted country/city data
function parseAppleData(raw) {
  if (!raw || raw.length === 0) return [];
  const result = [];
  const first = raw[0];
  const keys = Object.keys(first);
  const nameKey = keys.find(k => isNaN(parseFloat(k)));
  const valueKey = keys.find(k => !isNaN(parseFloat(k)));
  if (!nameKey || !valueKey) return [];
  result.push({ name: nameKey, value: parseFloat(valueKey) });
  for (const item of raw) {
    const name = String(item[nameKey]);
    const value = Number(item[valueKey]);
    if (!result.find(r => r.name === name)) {
      result.push({ name, value });
    }
  }
  return result.sort((a, b) => b.value - a.value);
}

// Generate static stats dashboard page
function generateStatsPage(outputRoot) {
  const jsonPath = path.join(__dirname, '..', 'public', 'data', 'revenue_data_all_sheets_dec_31_2025.json');
  if (!fs.existsSync(jsonPath)) {
    console.log('  ⚠️ Stats JSON not found, skipping stats page');
    return;
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const s = data.Sheet1;
  const p = data.PreviousSnapshot;

  const fmt = (n) => Number(n).toLocaleString('en-US');
  const pct = (cur, prev) => {
    if (!prev) return '';
    const c = ((cur - prev) / prev) * 100;
    if (c === 0) return '';
    const cls = c > 0 ? 'positive' : 'negative';
    const arrow = c > 0 ? '&#8593;' : '&#8595;';
    return `<span class="stats-change ${cls}">${arrow}&thinsp;${Math.abs(c).toFixed(1)}%</span>`;
  };
  const dlt = (cur, prev) => {
    const d = cur - prev;
    if (d <= 0) return '';
    return `<span class="stats-delta">+${fmt(d)}</span>`;
  };

  const reportDate = new Date(s.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const prevDate = p ? new Date(p.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  const totalFollowers = s["Spotify Followers"] + s["Apple Podcast Followers"] + s["YouTube Subscribers"];
  const pFollowers = p ? p["Spotify Followers"] + p["Apple Podcast Followers"] + p["YouTube Subscribers"] : 0;
  const totalPlays = s["Spotify Plays"] + s["Apple Podcast Plays"] + s["YouTube Views"];
  const pPlays = p ? p["Spotify Plays"] + p["Apple Podcast Plays"] + p["YouTube Views"] : 0;
  const totalHours = Math.round(s["Spotify Hours"] + s["Apple Podcast Hours"] + s["YouTube Watchtime Hours"]);
  const pHours = p ? Math.round(p["Spotify Hours"] + p["Apple Podcast Hours"] + p["YouTube Watchtime Hours"]) : 0;

  const spotifyTop = (data["Spotify Countries"] || []).slice(0, 10);
  const appleCountries = parseAppleData(data["Apple Podcast Countries"] || []);
  const appleCities = parseAppleData(data["Apple Podcast Cities"] || []);

  const ages = [
    { label: '18-22', val: s["Spotify age 18-22"] * 100 },
    { label: '23-27', val: s["Spotify age 23-27"] * 100 },
    { label: '28-34', val: s["Spotify age 28-34"] * 100 },
    { label: '35-44', val: s["Spotify age 35-44"] * 100 },
    { label: '45-59', val: s["Spotify age 45-59"] * 100 },
    { label: '60+', val: s["Spotify age 60+"] * 100 },
  ];
  const maxAge = Math.max(...ages.map(a => a.val));

  const male = s["Spotify Male %"] * 100;
  const female = s["Spotify Female %"] * 100;
  const gOther = s["Spotify Gender Not Defined %"] * 100;
  const maleDeg = (male / 100) * 360;
  const femaleDeg = maleDeg + (female / 100) * 360;

  const ytTop = (data["YouTube "] || []).slice(0, 10);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Podcast Stats | Revenue Optimization with StatsDrone</title>
  <meta name="description" content="Podcast analytics dashboard for Revenue Optimization with StatsDrone. ${fmt(s.Downloads)} downloads across ${(data["Spotify Countries"] || []).length} countries.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_BASE_URL}/stats/">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_BASE_URL}/stats/">
  <meta property="og:title" content="Podcast Stats | Revenue Optimization">
  <meta property="og:description" content="Podcast analytics: ${fmt(s.Downloads)} downloads, ${totalFollowers} followers across Spotify, Apple Podcasts, and YouTube.">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div class="stats-page">
    <header class="header">
      <nav class="nav-container">
        <a href="/" class="logo">Revenue Optimization</a>
        <div class="nav-links">
          <a href="/">Home</a>
          <a href="/episodes/">Episodes</a>
          <a href="/stats/" class="active">Stats</a>
        </div>
      </nav>
    </header>

    <main class="stats-content">
      <div class="container">
        <div class="stats-header">
          <h1><span class="gradient-text">Podcast Stats</span></h1>
          <p class="stats-subtitle">Data as of ${reportDate}</p>
          ${prevDate ? `<p class="stats-comparison">Growth since ${prevDate}</p>` : ''}
        </div>

        <!-- Key Metrics -->
        <div class="stats-metrics">
          <div class="stats-metric">
            <span class="stats-metric-label">Total Downloads</span>
            <span class="stats-metric-value">${fmt(s.Downloads)}</span>
            ${p ? pct(s.Downloads, p.Downloads) + dlt(s.Downloads, p.Downloads) : ''}
          </div>
          <div class="stats-metric">
            <span class="stats-metric-label">Followers</span>
            <span class="stats-metric-value">${fmt(totalFollowers)}</span>
            ${p ? pct(totalFollowers, pFollowers) + dlt(totalFollowers, pFollowers) : ''}
          </div>
          <div class="stats-metric">
            <span class="stats-metric-label">Total Plays</span>
            <span class="stats-metric-value">${fmt(totalPlays)}</span>
            ${p ? pct(totalPlays, pPlays) + dlt(totalPlays, pPlays) : ''}
          </div>
          <div class="stats-metric">
            <span class="stats-metric-label">Watch Hours</span>
            <span class="stats-metric-value">${fmt(totalHours)}</span>
            ${p ? pct(totalHours, pHours) + dlt(totalHours, pHours) : ''}
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div class="stats-platforms">
          <div class="stats-platform">
            <div class="stats-platform-accent" style="background:#1DB954"></div>
            <div class="stats-platform-body">
              <div class="stats-platform-name">
                <svg viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Spotify
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Followers</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["Spotify Followers"]}</span>${p ? pct(s["Spotify Followers"], p["Spotify Followers"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Plays</span>
                <span class="stats-row-right"><span class="stats-row-number">${fmt(s["Spotify Plays"])}</span>${p ? pct(s["Spotify Plays"], p["Spotify Plays"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Hours</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["Spotify Hours"]}</span>${p ? pct(s["Spotify Hours"], p["Spotify Hours"]) : ''}</span>
              </div>
            </div>
          </div>
          <div class="stats-platform">
            <div class="stats-platform-accent" style="background:#D56DFB"></div>
            <div class="stats-platform-body">
              <div class="stats-platform-name">
                <svg viewBox="0 0 24 24" fill="#D56DFB"><path d="M5.34 0A5.328 5.328 0 0 0 0 5.34v13.32A5.328 5.328 0 0 0 5.34 24h13.32A5.328 5.328 0 0 0 24 18.66V5.34A5.328 5.328 0 0 0 18.66 0H5.34zm6.525 2.568c4.992 0 9.066 4.074 9.066 9.066 0 5.013-4.074 9.09-9.066 9.09-5.01 0-9.09-4.077-9.09-9.09 0-4.992 4.08-9.066 9.09-9.066z"/></svg>
                Apple Podcasts
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Followers</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["Apple Podcast Followers"]}</span></span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Plays</span>
                <span class="stats-row-right"><span class="stats-row-number">${fmt(s["Apple Podcast Plays"])}</span>${p ? pct(s["Apple Podcast Plays"], p["Apple Podcast Plays"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Hours</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["Apple Podcast Hours"]}</span>${p ? pct(s["Apple Podcast Hours"], p["Apple Podcast Hours"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Listeners</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["Apple Podcast Listeners"]}</span>${p ? pct(s["Apple Podcast Listeners"], p["Apple Podcast Listeners"]) : ''}</span>
              </div>
            </div>
          </div>
          <div class="stats-platform">
            <div class="stats-platform-accent" style="background:#FF0000"></div>
            <div class="stats-platform-body">
              <div class="stats-platform-name">
                <svg viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                YouTube
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Subscribers</span>
                <span class="stats-row-right"><span class="stats-row-number">${s["YouTube Subscribers"]}</span>${p ? pct(s["YouTube Subscribers"], p["YouTube Subscribers"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Views</span>
                <span class="stats-row-right"><span class="stats-row-number">${fmt(s["YouTube Views"])}</span>${p ? pct(s["YouTube Views"], p["YouTube Views"]) : ''}</span>
              </div>
              <div class="stats-platform-row">
                <span class="stats-row-label">Watch Hours</span>
                <span class="stats-row-right"><span class="stats-row-number">${Math.round(s["YouTube Watchtime Hours"])}</span>${p ? pct(s["YouTube Watchtime Hours"], p["YouTube Watchtime Hours"]) : ''}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Demographics -->
        <div class="stats-demographics">
          <div class="stats-card">
            <h2 class="stats-section-title">Spotify Age Demographics</h2>
            ${ages.map(a => `<div class="stats-bar-row">
              <span class="stats-bar-label">${a.label}</span>
              <div class="stats-bar-track"><div class="stats-bar-fill" style="width:${(a.val / maxAge * 100).toFixed(0)}%"></div></div>
              <span class="stats-bar-value">${a.val.toFixed(1)}%</span>
            </div>`).join('\n            ')}
          </div>
          <div class="stats-card">
            <h2 class="stats-section-title">Spotify Gender Split</h2>
            <div class="stats-donut-wrap">
              <div class="stats-donut" style="background:conic-gradient(var(--accent-orange) 0deg ${maleDeg.toFixed(1)}deg, #D56DFB ${maleDeg.toFixed(1)}deg ${femaleDeg.toFixed(1)}deg, #64748b ${femaleDeg.toFixed(1)}deg 360deg);-webkit-mask:radial-gradient(circle,transparent 48%,black 49%);mask:radial-gradient(circle,transparent 48%,black 49%)">
              </div>
              <div class="stats-legend">
                <div class="stats-legend-item">
                  <span class="stats-legend-dot" style="background:var(--accent-orange)"></span>
                  <span class="stats-legend-pct">${male.toFixed(1)}%</span> Male
                </div>
                <div class="stats-legend-item">
                  <span class="stats-legend-dot" style="background:#D56DFB"></span>
                  <span class="stats-legend-pct">${female.toFixed(1)}%</span> Female
                </div>
                <div class="stats-legend-item">
                  <span class="stats-legend-dot" style="background:#64748b"></span>
                  <span class="stats-legend-pct">${gOther.toFixed(1)}%</span> Other
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Country Tables -->
        <div class="stats-tables">
          <div class="stats-card">
            <div class="stats-table-header">
              <h2>Top Countries</h2>
              <span class="stats-table-label">Spotify Streams</span>
            </div>
            <table class="stats-table">
              <tbody>
                ${spotifyTop.map((c, i) => `<tr>
                  <td class="stats-td-rank">${i + 1}</td>
                  <td class="stats-td-name">${escapeHtml(c.Country)}</td>
                  <td class="stats-td-value">${fmt(c.Streams)}</td>
                </tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
          <div class="stats-card">
            <div class="stats-table-header">
              <h2>Top Countries</h2>
              <span class="stats-table-label">Apple Listeners</span>
            </div>
            <table class="stats-table">
              <tbody>
                ${appleCountries.slice(0, 10).map((c, i) => `<tr>
                  <td class="stats-td-rank">${i + 1}</td>
                  <td class="stats-td-name">${escapeHtml(c.name)}</td>
                  <td class="stats-td-value">${fmt(c.value)}</td>
                </tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
        </div>

        ${appleCities.length > 0 ? `
        <!-- Cities -->
        <div class="stats-tables" style="margin-bottom:2.5rem">
          <div class="stats-card">
            <div class="stats-table-header">
              <h2>Top Cities</h2>
              <span class="stats-table-label">Apple Listeners</span>
            </div>
            <table class="stats-table">
              <tbody>
                ${appleCities.slice(0, 10).map((c, i) => `<tr>
                  <td class="stats-td-rank">${i + 1}</td>
                  <td class="stats-td-name">${escapeHtml(c.name)}</td>
                  <td class="stats-td-value">${fmt(c.value)}</td>
                </tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
          <div></div>
        </div>
        ` : ''}

        <!-- Top YouTube Videos -->
        <div class="stats-card">
          <h2 class="stats-section-title">Top YouTube Videos</h2>
          <div style="overflow-x:auto">
            <table class="stats-yt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Video</th>
                  <th class="text-right">Views</th>
                  <th class="text-right">Hours</th>
                  <th class="text-right">Published</th>
                </tr>
              </thead>
              <tbody>
                ${ytTop.map((v, i) => `<tr>
                  <td class="yt-rank">${i + 1}</td>
                  <td class="yt-title">${escapeHtml(v["Video title"])}</td>
                  <td class="yt-views">${fmt(v.Views)}</td>
                  <td class="yt-hours">${v["Watch time (hours)"].toFixed(1)}</td>
                  <td class="yt-date">${new Date(v["Video publish time"]).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</td>
                </tr>`).join('\n                ')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} StatsDrone. All rights reserved.</p>
        <div class="footer-links">
          <a href="/">Home</a>
          <a href="/episodes/">Episodes</a>
          <a href="/stats/">Stats</a>
        </div>
      </div>
    </footer>
  </div>
</body>
</html>`;

  const statsDir = path.join(outputRoot, 'stats');
  if (!fs.existsSync(statsDir)) fs.mkdirSync(statsDir, { recursive: true });
  fs.writeFileSync(path.join(statsDir, 'index.html'), html, 'utf8');
  console.log('✅ Generated: /stats/index.html');
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

    // Inject latest episode info into homepage
    const homepagePath = path.join(OUTPUT_ROOT, 'index.html');
    if (fs.existsSync(homepagePath) && episodes.length > 0) {
      console.log('\n🏠 Injecting latest episode into homepage...');
      let homepageHtml = fs.readFileSync(homepagePath, 'utf8');
      const latestEp = episodes[0];
      const latestSlug = generateSlug(latestEp.title);
      const latestTitle = escapeHtml(latestEp.title);
      const latestDate = latestEp.pubDate ? new Date(latestEp.pubDate).toISOString() : '';
      const totalEpisodes = episodes.length;

      // Read downloads total from stats JSON
      const statsJsonPath = path.join(__dirname, '..', 'public', 'data', 'revenue_data_all_sheets_dec_31_2025.json');
      let totalDownloads = '';
      if (fs.existsSync(statsJsonPath)) {
        const statsData = JSON.parse(fs.readFileSync(statsJsonPath, 'utf8'));
        if (statsData.Sheet1 && statsData.Sheet1.Downloads) {
          totalDownloads = Number(statsData.Sheet1.Downloads).toLocaleString('en-US');
        }
      }

      const latestEpisodeHtml = `<div class="latest-episode-banner mt-4">
                        <div class="episode-count-badge">
                            <span class="episode-count-number">${totalEpisodes}</span> episodes${totalDownloads ? ` <span class="episode-count-sep">&middot;</span> <span class="episode-count-number">${totalDownloads}</span> downloads` : ''}
                        </div>
                        <a href="/ep/${latestSlug}/" class="latest-episode-link">
                            <span class="latest-episode-label">Latest Episode</span>
                            <span class="latest-episode-title">${latestTitle}</span>
                            <span class="latest-episode-time" data-pubdate="${latestDate}"></span>
                        </a>
                    </div>
                    <script>
                    (function() {
                      var el = document.querySelector('.latest-episode-time');
                      if (!el) return;
                      var pubDate = new Date(el.getAttribute('data-pubdate'));
                      var now = new Date();
                      var diffMs = now - pubDate;
                      var diffMins = Math.floor(diffMs / 60000);
                      var diffHours = Math.floor(diffMs / 3600000);
                      var diffDays = Math.floor(diffMs / 86400000);
                      var text = '';
                      if (diffDays > 0) text = diffDays + ' day' + (diffDays !== 1 ? 's' : '') + ' ago';
                      else if (diffHours > 0) text = diffHours + ' hour' + (diffHours !== 1 ? 's' : '') + ' ago';
                      else text = diffMins + ' min' + (diffMins !== 1 ? 's' : '') + ' ago';
                      el.textContent = '\\u00B7 ' + text;
                    })();
                    </script>`;

      homepageHtml = homepageHtml.replace('<!-- LATEST_EPISODE_PLACEHOLDER -->', latestEpisodeHtml);
      fs.writeFileSync(homepagePath, homepageHtml, 'utf8');
      console.log(`✅ Injected latest episode: ${latestEp.title}`);
      console.log(`✅ Total episodes: ${totalEpisodes}`);
    }

    // Generate stats dashboard page
    console.log('\n📊 Generating stats page...');
    generateStatsPage(OUTPUT_ROOT);

    console.log('\n🎉 All done! Run this script whenever you publish new episodes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
