#!/usr/bin/env node

/**
 * Generate full static HTML site:
 * - Homepage (index.html)
 * - Episodes listing (/episodes/index.html)
 * - Individual episode pages (/ep/:slug/index.html)
 * - Sitemap.xml
 * 
 * Run with: node scripts/generate-static-site.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_FEED_URL = 'https://feeds.castplus.fm/affiliatebi';
const SITE_BASE_URL = 'https://revenueoptimization.io';

// Where to write generated files
const outDirArgIndex = process.argv.findIndex((a) => a === '--outDir');
const OUT_DIR = outDirArgIndex !== -1 ? process.argv[outDirArgIndex + 1] : null;
const OUTPUT_ROOT = OUT_DIR
  ? path.join(__dirname, '..', OUT_DIR)
  : path.join(__dirname, '..', 'public');

const OUTPUT_EP_DIR = path.join(OUTPUT_ROOT, 'ep');
const OUTPUT_EPISODES_DIR = path.join(OUTPUT_ROOT, 'episodes');

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

// Common header HTML
function generateHeader(activePage = '') {
  return `
    <header class="navbar-custom fixed-top">
      <nav class="container d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-4">
          <a href="/" class="navbar-brand gradient-text">Affiliate BI</a>
          <div class="navbar-brand-icons d-none d-md-flex gap-3">
            <a href="https://open.spotify.com/show/6by0l9FanqMi9VfNjAMgyV" target="_blank" class="nav-platform-icon" aria-label="Spotify">
              <img src="/images/spotify-icon.svg" alt="Spotify" width="28" height="28">
            </a>
            <a href="https://podcasts.apple.com/ca/podcast/affiliate-bi/id1613eeeee" target="_blank" class="nav-platform-icon" aria-label="Apple Podcasts">
              <img src="/images/apple-podcasts-icon.svg" alt="Apple Podcasts" width="28" height="28">
            </a>
            <a href="https://www.youtube.com/@affiliatebi" target="_blank" class="nav-platform-icon" aria-label="YouTube">
              <img src="/images/youtube-icon.svg" alt="YouTube" width="28" height="28">
            </a>
          </div>
        </div>
        <div class="nav-links d-flex align-items-center gap-2">
          <a href="/" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
          <a href="/episodes/" class="nav-link ${activePage === 'episodes' ? 'active' : ''}">Episodes</a>
          <a href="/stats/" class="nav-link ${activePage === 'stats' ? 'active' : ''}">Stats</a>
        </div>
      </nav>
    </header>`;
}

// Common footer HTML
function generateFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <div class="mb-3 mb-md-0">
            <div class="footer-brand gradient-text">Affiliate BI</div>
            <div class="footer-tagline">Revenue Optimization with StatsDrone</div>
          </div>
          <div class="footer-links">
            <a href="/" class="footer-link">Home</a>
            <a href="/episodes/" class="footer-link">Episodes</a>
            <a href="/stats/" class="footer-link">Stats</a>
            <a href="/affiliate-tools/" class="footer-link">Tools</a>
          </div>
        </div>
        <div class="text-center mt-4">
          <p class="footer-tagline">&copy; ${new Date().getFullYear()} Affiliate BI Podcast. All rights reserved.</p>
        </div>
      </div>
    </footer>`;
}

// Generate Homepage HTML
function generateHomepageHtml(episodes) {
  const latestEpisode = episodes[0];
  const latestSlug = latestEpisode ? generateSlug(latestEpisode.title) : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-statsdrone-static-page" content="homepage">
  
  <!-- SEO Meta Tags -->
  <title>Revenue Optimization Podcast | StatsDrone</title>
  <meta name="description" content="Revenue Optimization with StatsDrone: an affiliate marketing podcast hosted by John Wright. Where affiliate marketing uses data, SEO, and AI to gain the unfair advantage.">
  <meta name="keywords" content="affiliate marketing, revenue optimization, SEO, data analytics, podcast, StatsDrone">
  <meta name="author" content="John Wright">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_BASE_URL}/">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_BASE_URL}/">
  <meta property="og:title" content="Revenue Optimization Podcast | StatsDrone">
  <meta property="og:description" content="Where affiliate marketing uses data, SEO, and AI to gain the unfair advantage.">
  <meta property="og:image" content="${SITE_BASE_URL}/images/podcast-cover.png">
  <meta property="og:site_name" content="Affiliate BI Podcast">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_BASE_URL}/">
  <meta name="twitter:title" content="Revenue Optimization Podcast | StatsDrone">
  <meta name="twitter:description" content="Where affiliate marketing uses data, SEO, and AI to gain the unfair advantage.">
  <meta name="twitter:image" content="${SITE_BASE_URL}/images/podcast-cover.png">
  
  <!-- Schema.org structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "name": "Revenue Optimization with StatsDrone",
    "description": "An affiliate marketing podcast where data, SEO, and AI combine to gain the unfair advantage.",
    "url": "${SITE_BASE_URL}",
    "author": {
      "@type": "Person",
      "name": "John Wright"
    },
    "numberOfEpisodes": ${episodes.length}
  }
  </script>
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SPZPNLVSDV"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SPZPNLVSDV');
  </script>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  ${generateHeader('home')}

  <!-- Hero Section -->
  <section class="hero-section wave-pattern">
    <div class="container hero-content">
      <div class="row align-items-center g-5">
        <div class="col-lg-5">
          <div class="podcast-cover">
            <img src="/images/podcast-cover.png" alt="Revenue Optimization with StatsDrone Podcast" class="img-fluid">
          </div>
        </div>
        <div class="col-lg-7">
          <h1 class="hero-title">
            <span class="gradient-text">Revenue Optimization Podcast</span>
          </h1>
          <p class="hero-description">
            Where affiliate marketing uses data, SEO, and AI to gain the unfair advantage
          </p>
          
          <div class="d-flex gap-4 mb-4">
            <div class="text-center">
              <div class="fs-2 fw-bold">${episodes.length}</div>
              <div class="text-muted text-uppercase small">Episodes</div>
            </div>
            <div class="text-center">
              <div class="fs-2 fw-bold">101,381</div>
              <div class="text-muted text-uppercase small">Downloads</div>
            </div>
          </div>
          
          ${latestEpisode ? `
          <a href="/ep/${latestSlug}/" class="d-inline-flex flex-column gap-1 p-3 rounded-3 text-decoration-none latest-episode-card">
            <span class="text-muted text-uppercase small">Latest Episode</span>
            <span class="fw-medium text-white">${escapeHtml(latestEpisode.title)}</span>
            <span class="small" style="color: var(--accent-orange);">${formatDate(latestEpisode.pubDate)}</span>
          </a>
          ` : ''}
        </div>
      </div>
    </div>
  </section>

  <!-- Platforms Section -->
  <section class="platforms-section">
    <div class="container text-center">
      <h2 class="section-title gradient-text">Listen Everywhere</h2>
      <p class="section-description">Subscribe to the podcast on your favorite platform</p>
      <div class="d-flex flex-wrap justify-content-center gap-3">
        <a href="https://open.spotify.com/show/6by0l9FanqMi9VfNjAMgyV" target="_blank" class="btn-platform">
          <img src="/images/spotify-icon.svg" alt="" width="32" height="32">
          Spotify
        </a>
        <a href="https://podcasts.apple.com/ca/podcast/affiliate-bi/id1613eeeee" target="_blank" class="btn-platform">
          <img src="/images/apple-podcasts-icon.svg" alt="" width="32" height="32">
          Apple Podcasts
        </a>
        <a href="https://www.youtube.com/@affiliatebi" target="_blank" class="btn-platform">
          <img src="/images/youtube-icon.svg" alt="" width="32" height="32">
          YouTube
        </a>
      </div>
    </div>
  </section>

  <!-- Sponsors Section -->
  <section class="sponsors-section">
    <div class="container text-center">
      <div class="sponsor-label">Presented By</div>
      <div class="row justify-content-center g-4 mb-5">
        <div class="col-6 col-md-4 col-lg-3">
          <a href="https://statsdrone.com?ref=affiliatebi" target="_blank" class="major-sponsor-card d-flex flex-column align-items-center">
            <div class="sponsor-placeholder">SD</div>
            <div class="sponsor-name">StatsDrone</div>
          </a>
        </div>
      </div>
      
      <div class="sponsor-label sponsor-label-muted">Also Supported By</div>
      <div class="d-flex flex-wrap justify-content-center gap-2">
        <a href="https://www.myaffiliates.com/" target="_blank" class="sub-sponsor">
          <div class="sub-sponsor-icon">M</div>
          <span class="sub-sponsor-name">MyAffiliates</span>
        </a>
        <a href="https://raventrack.com/" target="_blank" class="sub-sponsor">
          <div class="sub-sponsor-icon">R</div>
          <span class="sub-sponsor-name">RavenTrack</span>
        </a>
        <a href="https://www.affilka.com/" target="_blank" class="sub-sponsor">
          <div class="sub-sponsor-icon">A</div>
          <span class="sub-sponsor-name">Affilka</span>
        </a>
        <a href="https://referon.com/" target="_blank" class="sub-sponsor">
          <div class="sub-sponsor-icon">R</div>
          <span class="sub-sponsor-name">ReferOn</span>
        </a>
      </div>
    </div>
  </section>

  ${generateFooter()}

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
}

// Generate Episodes Listing HTML
function generateEpisodesListingHtml(episodes) {
  const episodeCards = episodes.map((episode, index) => {
    const slug = generateSlug(episode.title);
    const description = truncate(episode.description, 300);
    
    return `
      <article class="episode-card">
        <div class="d-flex flex-column flex-md-row gap-4">
          <a href="/ep/${slug}/" class="episode-image">
            ${episode.image 
              ? `<img src="${episode.image}" alt="${escapeHtml(episode.title)}" loading="lazy">`
              : `<div class="episode-image-placeholder">▶</div>`
            }
          </a>
          <div class="flex-grow-1">
            <a href="/ep/${slug}/" class="text-decoration-none">
              <h2 class="episode-title">${escapeHtml(episode.title)}</h2>
            </a>
            <div class="episode-meta">
              ${episode.pubDate ? `<span>📅 ${formatDate(episode.pubDate)}</span>` : ''}
              ${episode.duration ? `<span>⏱️ ${formatDuration(episode.duration)}</span>` : ''}
            </div>
            <p class="episode-description">${escapeHtml(description)}</p>
            <div class="d-flex gap-2 flex-wrap">
              ${episode.enclosure?.url 
                ? `<a href="${episode.enclosure.url}" target="_blank" rel="noopener noreferrer" class="btn btn-accent btn-sm">▶ Play Episode</a>` 
                : ''
              }
              <a href="/ep/${slug}/" class="btn btn-outline-custom btn-sm">View Details</a>
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
  <meta name="x-statsdrone-static-page" content="episodes">
  
  <!-- SEO Meta Tags -->
  <title>All Episodes | Revenue Optimization</title>
  <meta name="description" content="Browse all ${episodes.length} Revenue Optimization episodes with insights on affiliate marketing, tracking, and conversion optimization.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_BASE_URL}/episodes/">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_BASE_URL}/episodes/">
  <meta property="og:title" content="All Episodes | Revenue Optimization">
  <meta property="og:description" content="Browse all ${episodes.length} Revenue Optimization episodes with insights on affiliate marketing, tracking, and conversion optimization.">
  <meta property="og:image" content="${SITE_BASE_URL}/images/podcast-cover.png">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${SITE_BASE_URL}/episodes/">
  <meta name="twitter:title" content="All Episodes | Revenue Optimization">
  <meta name="twitter:description" content="Browse all ${episodes.length} episodes">
  <meta name="twitter:image" content="${SITE_BASE_URL}/images/podcast-cover.png">
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SPZPNLVSDV"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SPZPNLVSDV');
  </script>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  
  <style>
    /* Search functionality */
    .search-container {
      position: relative;
      max-width: 600px;
      margin: 0 auto 2rem;
    }
    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      background: var(--background-secondary);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      color: var(--foreground);
      font-size: 1rem;
    }
    .search-input:focus {
      outline: none;
      border-color: var(--accent-orange);
    }
    .search-input::placeholder {
      color: var(--muted);
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
    }
    .search-results {
      color: var(--muted);
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
    .episode-hidden {
      display: none !important;
    }
  </style>
</head>
<body>
  ${generateHeader('episodes')}

  <section class="episodes-section">
    <div class="container">
      <div class="text-center mb-5">
        <h1 class="section-title">
          <span class="gradient-text">All Episodes</span>
        </h1>
        <p class="section-description">
          Explore our complete archive of ${episodes.length} episodes featuring insights on revenue optimization and affiliate marketing.
        </p>
      </div>

      <!-- Search -->
      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input 
          type="text" 
          class="search-input" 
          id="episodeSearch" 
          placeholder="Search episodes by keyword..."
          autocomplete="off"
        >
        <div class="search-results" id="searchResults"></div>
      </div>

      <!-- Episodes List -->
      <div class="episodes-list" style="max-width: 900px; margin: 0 auto;">
        ${episodeCards}
      </div>
    </div>
  </section>

  ${generateFooter()}

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- Client-side search -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.getElementById('episodeSearch');
      const searchResults = document.getElementById('searchResults');
      const episodes = document.querySelectorAll('.episode-card');
      
      searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        let visibleCount = 0;
        
        episodes.forEach(function(card) {
          const title = card.querySelector('.episode-title')?.textContent.toLowerCase() || '';
          const desc = card.querySelector('.episode-description')?.textContent.toLowerCase() || '';
          
          if (!query || title.includes(query) || desc.includes(query)) {
            card.classList.remove('episode-hidden');
            visibleCount++;
          } else {
            card.classList.add('episode-hidden');
          }
        });
        
        if (query) {
          searchResults.textContent = 'Found ' + visibleCount + ' episode' + (visibleCount !== 1 ? 's' : '');
        } else {
          searchResults.textContent = '';
        }
      });
    });
  </script>
</body>
</html>`;
}

// Generate individual episode HTML (same as before but enhanced)
function generateEpisodeHtml(episode, prevEpisodes, nextEpisodes) {
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
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-SPZPNLVSDV"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-SPZPNLVSDV');
  </script>
  
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  
  <style>
    .episode-page { min-height: 100vh; display: flex; flex-direction: column; }
    .episode-content { flex: 1; padding: 8rem 0 4rem; }
    .episode-hero-image { max-width: 400px; margin: 0 auto 2rem; border-radius: 1rem; overflow: hidden; }
    .episode-hero-image img { width: 100%; height: auto; display: block; }
    .back-link { color: var(--accent-orange); margin-bottom: 2rem; display: inline-block; }
    .back-link:hover { text-decoration: underline; }
    .episode-actions { margin: 2rem 0; display: flex; gap: 1rem; flex-wrap: wrap; }
    .episode-about { background: var(--gradient-card); border: 1px solid var(--border); border-radius: 1rem; padding: 2rem; margin: 2rem 0; }
    .episode-about h2 { margin-bottom: 1rem; }
    .related-episodes { margin-top: 3rem; }
    .related-episodes h2 { margin-bottom: 1.5rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .related-section h3 { font-size: 1rem; color: var(--muted); margin-bottom: 1rem; }
    .related-list { list-style: none; padding: 0; margin: 0; }
    .related-list li { margin-bottom: 0.75rem; }
    .related-list a { display: flex; flex-direction: column; padding: 1rem; background: var(--gradient-card); border: 1px solid var(--border); border-radius: 0.5rem; transition: all 0.3s ease; }
    .related-list a:hover { border-color: var(--accent-orange); }
    .related-title { font-weight: 500; margin-bottom: 0.25rem; }
    .related-date { font-size: 0.875rem; color: var(--muted); }
  </style>
</head>
<body>
  <div class="episode-page">
    ${generateHeader()}

    <main class="episode-content">
      <div class="container" style="max-width: 900px;">
        <a href="/episodes/" class="back-link">← Back to Episodes</a>
        
        <div class="episode-hero-image">
          <img src="${image}" alt="${title}" loading="lazy">
        </div>
        
        <h1 class="section-title text-center mb-3">${title}</h1>
        
        <div class="episode-meta justify-content-center mb-4">
          ${episode.pubDate ? `<span>📅 ${formatDate(episode.pubDate)}</span>` : ''}
          ${episode.duration ? `<span>⏱️ ${formatDuration(episode.duration)}</span>` : ''}
        </div>
        
        <div class="episode-actions justify-content-center">
          ${episode.enclosure?.url ? `<a href="${episode.enclosure.url}" target="_blank" rel="noopener noreferrer" class="btn btn-accent">▶ Play Episode</a>` : ''}
          ${episode.link ? `<a href="${episode.link}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-custom">View on Podcast Platform</a>` : ''}
        </div>
        
        <div class="episode-about">
          <h2>About This Episode</h2>
          <p style="color: var(--muted); line-height: 1.8;">${fullDescription}</p>
        </div>
        
        ${(prevEpisodes.length > 0 || nextEpisodes.length > 0) ? `
        <div class="related-episodes">
          <h2 class="gradient-text">More Episodes</h2>
          <div class="related-grid">
            ${prevEpisodes.length > 0 ? `
            <div class="related-section">
              <h3>← Previous Episodes</h3>
              <ul class="related-list">
                ${prevEpisodes.map(ep => `
                <li>
                  <a href="/ep/${generateSlug(ep.title)}/">
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
                  <a href="/ep/${generateSlug(ep.title)}/">
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

    ${generateFooter()}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
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
  
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/episodes/', changefreq: 'weekly', priority: '0.9' },
    { loc: '/stats/', changefreq: 'weekly', priority: '0.8' },
    { loc: '/affiliate-tools/', changefreq: 'monthly', priority: '0.7' },
    { loc: '/made-with-lovable/', changefreq: 'monthly', priority: '0.6' },
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
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
  console.log('🎙️ Generating full static site...\n');
  
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
    
    // Create output directories
    if (!fs.existsSync(OUTPUT_EP_DIR)) {
      fs.mkdirSync(OUTPUT_EP_DIR, { recursive: true });
    }
    if (!fs.existsSync(OUTPUT_EPISODES_DIR)) {
      fs.mkdirSync(OUTPUT_EPISODES_DIR, { recursive: true });
    }
    
    // 1. Generate Homepage
    console.log('🏠 Generating homepage...');
    const homepageHtml = generateHomepageHtml(episodes);
    fs.writeFileSync(path.join(OUTPUT_ROOT, 'static-index.html'), homepageHtml, 'utf8');
    console.log('✅ Generated: /static-index.html');
    
    // 2. Generate Episodes Listing
    console.log('\n📋 Generating episodes listing...');
    const episodesHtml = generateEpisodesListingHtml(episodes);
    fs.writeFileSync(path.join(OUTPUT_EPISODES_DIR, 'index.html'), episodesHtml, 'utf8');
    console.log('✅ Generated: /episodes/index.html');
    
    // 3. Generate individual episode pages
    console.log('\n📄 Generating individual episode pages...');
    let generated = 0;
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      const slug = generateSlug(episode.title);
      
      const prevEpisodes = episodes.slice(Math.max(0, i - 3), i).reverse();
      const nextEpisodes = episodes.slice(i + 1, i + 4);
      
      const html = generateEpisodeHtml(episode, prevEpisodes, nextEpisodes);
      
      const episodeDir = path.join(OUTPUT_EP_DIR, slug);
      if (!fs.existsSync(episodeDir)) {
        fs.mkdirSync(episodeDir, { recursive: true });
      }
      fs.writeFileSync(path.join(episodeDir, 'index.html'), html, 'utf8');
      
      generated++;
      if (generated % 20 === 0) {
        console.log(`  Progress: ${generated}/${episodes.length} episodes...`);
      }
    }
    console.log(`✅ Generated: ${generated} episode pages`);
    
    // 4. Generate ep index redirect
    const epIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=/episodes/">
  <title>Episodes | Revenue Optimization</title>
</head>
<body>
  <p>Redirecting to <a href="/episodes/">episodes</a>...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(OUTPUT_EP_DIR, 'index.html'), epIndexHtml, 'utf8');
    console.log('✅ Generated: /ep/index.html (redirect)');
    
    // 5. Generate sitemap
    console.log('\n📍 Generating sitemap...');
    const sitemap = generateSitemap(episodes);
    fs.writeFileSync(path.join(OUTPUT_ROOT, 'sitemap.xml'), sitemap, 'utf8');
    console.log(`✅ Generated: sitemap.xml with ${episodes.length} episodes`);
    
    console.log('\n🎉 Full static site generation complete!');
    console.log('\nGenerated files:');
    console.log('  - /static-index.html (homepage)');
    console.log('  - /episodes/index.html (episodes listing)');
    console.log(`  - /ep/:slug/index.html (${episodes.length} episode pages)`);
    console.log('  - /sitemap.xml');
    console.log('\nNote: Update _redirects to serve static-index.html for / route');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
