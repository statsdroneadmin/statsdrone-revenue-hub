#!/usr/bin/env python3
"""Build /guests/ pages, guest JSON, episode backlinks, and nav links."""
from __future__ import annotations

import html as htmlmod
import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

REPO = Path("/workspace/statsdrone-revenue-hub")
PUBLIC = REPO / "public"
EP_DIR = PUBLIC / "ep"
GUEST_DIR = PUBLIC / "guests"
RSS = Path("/tmp/affiliatebi.xml")
SITE = "https://revenueoptimization.io"
NS = {"itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd"}
LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")
TURN_RE = re.compile(r"^\[(\d{2}:\d{2}:\d{2})\]\s+([^:]+):\s*(.*)$")
NAME_TOKEN = r"[A-ZÀ-Ý][\w'.’-]*"
NAME_2PLUS = rf"({NAME_TOKEN}(?:\s+{NAME_TOKEN}){{1,3}})"
NAME_1TO4 = rf"({NAME_TOKEN}(?:\s+(?:-\s+)?{NAME_TOKEN}){{0,3}})"
NOT_GUESTS = {
    "ai", "ai tools", "affiliate track", "statsdrone", "ppc", "seo", "geo",
    "claude", "chatgpt", "tableau", "salesforce", "igaming", "john wright",
    "nousviz", "odys", "affilka", "affiliate bi", "surfer seo", "the crowd's line",
    "crowds line", "the crowds line", "crowd's line", "the crowd's line",
}
SKIP_SOCIAL = (
    "youtube.com", "youtu.be", "podcasts.apple.com", "open.spotify.com",
    "castplus.fm", "castplus.io", "spotify.com",
)
GA = """<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-L30V57C011"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-L30V57C011');
</script>"""


def e(text: str) -> str:
    return htmlmod.escape(text or "", quote=True)


def slugify(title: str) -> str:
    s = unicodedata.normalize("NFD", title.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace(".", "-")
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")

def clean_name(name: str) -> str | None:
    name = re.sub(r"[.,;:]+$", "", (name or "").strip())
    name = re.sub(r"\s+", " ", name)
    if not name:
        return None
    if name.lower() in NOT_GUESTS:
        return None
    if len(name.split()) < 2:
        return None
    return name


def guest_from_md(md: str) -> tuple[str | None, str]:
    m = re.search(r"^\*\*Guest:\*\*\s+(.+)$", md, re.M)
    if not m:
        return None, ""
    raw = m.group(1).strip()
    name = raw.split(",")[0]
    if " from " in name:
        name = name.split(" from ")[0]
    name = clean_name(name)
    role = raw.split(",", 1)[1].strip() if name and "," in raw else ""
    return name, role


def guest_from_title(title: str) -> str | None:
    if not title:
        return None
    if re.search(r"\(Copy\)\s*$", title):
        return None
    m = re.match(r"^([A-Z][a-zÀ-ÿ]+(?:[-'][A-Z][a-zÀ-ÿ]+)?\s+[A-Z][a-zÀ-ÿ]+(?:[-'][A-Z][a-zÀ-ÿ]+)?)\s*:", title)
    if m:
        n = clean_name(m.group(1))
        if n:
            return n
    m = re.search(rf"{NAME_2PLUS}\s+on\s+", title)
    if m:
        n = clean_name(m.group(1))
        if n:
            return n
    m = re.search(rf"['’]s\s+{NAME_2PLUS}", title)
    if m:
        n = clean_name(m.group(1))
        if n:
            return n
    m = re.search(r"\bwith\s+(.+)$", title)
    if m:
        tail = m.group(1)
        tail = re.split(r"\s+from\s+|\s+of\s+", tail, maxsplit=1)[0]
        tail = re.split(r",\s+|\.\s+(?=[A-Z]{2})|\s+author\b", tail, maxsplit=1)[0]
        tail = re.sub(r"[\s.,;:()]+$", "", tail)
        tokens = re.findall(NAME_TOKEN, tail)
        while tokens and tokens[0].lower() in {"the", "a", "an"}:
            tokens.pop(0)
        if len(tokens) > 3:
            tokens = tokens[-2:]
        if tokens:
            n = clean_name(" ".join(tokens))
            if n:
                return n
    m = re.search(rf"\b(?:tips from|from)\s+{NAME_2PLUS}\s*$", title)
    if m:
        n = clean_name(m.group(1))
        if n and n.lower() not in NOT_GUESTS:
            return n
    return None


def parse_socials(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out, seen = [], set()
    for m in LINK_RE.finditer(path.read_text(encoding="utf-8")):
        label, url = m.group(1).strip(), m.group(2).strip()
        host = urlparse(url).netloc.lower().removeprefix("www.")
        if any(s in host or s in url for s in SKIP_SOCIAL):
            continue
        if url in seen:
            continue
        seen.add(url)
        out.append({"label": label, "url": url})
    return out


def strip_html(text: str) -> str:
    t = re.sub(r"<[^>]+>", " ", text or "")
    t = htmlmod.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


def summarize(desc: str, n: int = 3) -> str:
    t = strip_html(desc)
    if not t:
        return ""
    parts = re.split(r"(?<=[.!?])\s+", t)
    out = " ".join(parts[:n]).strip()
    if len(out) > 420:
        out = out[:417].rsplit(" ", 1)[0] + "…"
    return out

def intro_bio(md: str, name: str) -> str:
    if not md or not name:
        return ""
    first = name.split()[0]
    chunks = []
    lines = md.splitlines()
    i = 0
    while i < len(lines) and len(chunks) < 6:
        line = lines[i].strip()
        if line.startswith("**John Wright**"):
            buf = []
            i += 1
            while i < len(lines) and lines[i].strip() and not lines[i].startswith("**") and not TURN_RE.match(lines[i].strip()):
                buf.append(lines[i].strip())
                i += 1
            chunks.append(" ".join(buf))
            continue
        m = TURN_RE.match(line)
        if m and "John" in m.group(2):
            chunks.append(m.group(3))
        i += 1
    blob = " ".join(chunks)
    if first.lower() not in blob.lower():
        return ""
    for sent in re.split(r"(?<=[.!?])\s+", blob):
        if first.lower() in sent.lower() and len(sent) > 20:
            return sent.strip()
    return ""


def load_rss() -> list[dict]:
    if not RSS.exists():
        raise SystemExit("missing /tmp/affiliatebi.xml")
    root = ET.parse(RSS).getroot()
    items = []
    for it in root.findall("./channel/item"):
        title = (it.findtext("title") or "").strip()
        enc = it.find("enclosure")
        img = it.find("itunes:image", NS)
        items.append({
            "title": title,
            "slug": slugify(title),
            "audio": enc.get("url") if enc is not None else "",
            "duration": (it.findtext("itunes:duration", default="", namespaces=NS) or "").strip(),
            "pubDate": it.findtext("pubDate") or "",
            "description": (it.findtext("description") or "").strip(),
            "image": (img.get("href") if img is not None else "") or "",
        })
    return items


def fmt_date(pub: str) -> str:
    try:
        dt = datetime.strptime(pub[:25], "%a, %d %b %Y %H:%M:%S")
        return dt.strftime("%B %-d, %Y")
    except Exception:
        return pub[:16]

def navbar(active: str) -> str:
    def cls(name: str) -> str:
        return " active" if active == name else ""
    return f'''<nav class="navbar navbar-expand-lg navbar-custom fixed-top">
    <div class="container">
      <div class="navbar-brand-icons d-flex align-items-center gap-3">
        <a href="https://open.spotify.com/show/0nTNXugQTY4Ww8JiSULeiu" target="_blank" rel="noopener noreferrer" title="Listen on Spotify" class="nav-platform-icon">
          <img src="/images/spotify-icon.svg" alt="Spotify" width="28" height="28">
        </a>
        <a href="https://podcasts.apple.com/ca/podcast/revenue-optimization-with-statsdrone/id1700893670" target="_blank" rel="noopener noreferrer" title="Listen on Apple Podcasts" class="nav-platform-icon">
          <img src="/images/apple-podcasts-icon.svg" alt="Apple Podcasts" width="28" height="28">
        </a>
        <a href="https://www.youtube.com/watch?v=NKHxEFxKXXA&list=PLxACGKJVEhOk31EcEPhnao6O1SSpu8Qaa" target="_blank" rel="noopener noreferrer" title="Watch on YouTube" class="nav-platform-icon">
          <img src="/images/youtube-icon.svg" alt="YouTube" width="32" height="22">
        </a>
      </div>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul class="navbar-nav align-items-center">
          <li class="nav-item"><a class="nav-link{cls("home")}" href="/">Home</a></li>
          <li class="nav-item"><a class="nav-link{cls("episodes")}" href="/episodes/">Episodes</a></li>
          <li class="nav-item"><a class="nav-link{cls("guests")}" href="/guests/">Guests</a></li>
          <li class="nav-item"><a class="nav-link{cls("stats")}" href="/stats/">Stats</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link{cls("tools")}" href="/affiliate-tools/">Tools</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="/affiliate-software/">Affiliate Software Reviews</a></li>
            </ul>
          </li>
          <li class="nav-item"><a class="nav-link{cls("blog")}" href="/blog/">Blog</a></li>
          <li class="nav-item"><a class="nav-link{cls("events")}" href="/events/">Events</a></li>
          <li class="nav-item dropdown">
            <a class="nav-link{cls("affiliate")}" href="/affiliate-programs/">Affiliate</a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="/affiliate-programs/casino/">Casino Affiliate Programs</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>'''


def footer() -> str:
    year = datetime.now().year
    return f'''<footer class="footer">
    <div class="container">
      <div class="row align-items-center text-center text-md-start">
        <div class="col-md-4 mb-3 mb-md-0">
          <div class="footer-brand"><span class="gradient-text">Revenue Optimization</span> with StatsDrone</div>
          <p class="footer-tagline">Optimizing revenue, one episode at a time.</p>
        </div>
        <div class="col-md-4 mb-3 mb-md-0 text-center text-md-start">
          <nav class="footer-nav">
            <a href="/" class="footer-link">Home</a>
            <a href="/episodes/" class="footer-link">Episodes</a>
            <a href="/guests/" class="footer-link">Guests</a>
            <a href="/stats/" class="footer-link">Stats</a>
            <a href="/affiliate-tools/" class="footer-link">Tools</a>
            <a href="/blog/" class="footer-link">Blog</a>
            <a href="/events/" class="footer-link">Events</a>
          </nav>
        </div>
        <div class="col-md-4 text-md-end">
          <p class="footer-copyright mb-0">&copy; {year} StatsDrone. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>'''

def page_shell(title, desc, canonical, active, body, jsonld):
    sample_dir = EP_DIR / "the-business-of-affiliate-growth-with-oleksandr-kulyk-from-makeberry-affiliates"
    sample = (sample_dir / "index.html").read_text(encoding="utf-8")
    sample = inject_nav_footer(sample)
    sample = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", sample, flags=re.S)
    sample = re.sub(
        r'<meta name="description" content=".*?"',
        f'<meta name="description" content="{e(desc)}"',
        sample, count=1, flags=re.S,
    )
    sample = re.sub(
        r'<link rel="canonical" href=".*?"',
        f'<link rel="canonical" href="{e(canonical)}"',
        sample, count=1,
    )
    sample = re.sub(r'<meta property="og:url" content=".*?"', f'<meta property="og:url" content="{e(canonical)}"', sample)
    sample = re.sub(r'<meta property="og:title" content=".*?"', f'<meta property="og:title" content="{e(title)}"', sample, count=1, flags=re.S)
    sample = re.sub(r'<meta property="og:description" content=".*?"', f'<meta property="og:description" content="{e(desc)}"', sample, count=1, flags=re.S)
    sample = re.sub(r'<meta name="twitter:url" content=".*?"', f'<meta name="twitter:url" content="{e(canonical)}"', sample)
    sample = re.sub(r'<meta name="twitter:title" content=".*?"', f'<meta name="twitter:title" content="{e(title)}"', sample, count=1, flags=re.S)
    sample = re.sub(r'<meta name="twitter:description" content=".*?"', f'<meta name="twitter:description" content="{e(desc)}"', sample, count=1, flags=re.S)
    sample = re.sub(
        r'<script type="application/ld\+json">.*?</script>',
        "",
        sample, flags=re.S,
    )
    s_open = "<" + "script type=\"application/ld+json\">"
    s_close = "</" + "script>"
    sample = sample.replace("</head>", f"{s_open}\n{jsonld}\n{s_close}\n</head>", 1)
    sample = re.sub(r'<meta name="twitter:image" content=".*?"\s*/?>', "", sample)
    sample = re.sub(r'<meta name="x-statsdrone-static-episode"[^>]*>\s*', "", sample)
    sample = re.sub(r'<!-- Podcast specific -->\s*', "", sample)
    sample = re.sub(r'<!-- Schema.org structured data -->\s*', "", sample)
    sample = re.sub(
        r'<main class="episode-content">.*?</main>',
        '<main class="episode-content">\n      <div class="container">\n' + body + "\n      </div>\n    </main>",
        sample, count=1, flags=re.S,
    )
    sample = sample.replace('href="/episodes/" class="nav-link active"', 'href="/episodes/" class="nav-link"')
    sample = sample.replace('class="nav-link active" href="/episodes/"', 'class="nav-link" href="/episodes/"')
    sample = sample.replace('href="/guests/" class="nav-link"', 'href="/guests/" class="nav-link active"')
    sample = sample.replace('class="nav-link" href="/guests/"', 'class="nav-link active" href="/guests/"')
    sample = re.sub(r'<meta property="og:audio".*?>\n?', "", sample)
    sample = re.sub(r'<meta property="og:audio:type".*?>\n?', "", sample)
    sample = re.sub(r'<meta property="og:image" content=".*?"', '<meta property="og:image" content="https://revenueoptimization.io/favicon.ico"', sample)
    return sample

def inject_nav_footer(html: str) -> str:
    nav_pat = re.compile(
        r'(<a class="nav-link(?: active)?" href="/episodes/">Episodes</a>\s*</li>\s*)'
        r'(<li class="nav-item">\s*<a class="nav-link(?: active)?" href="/stats/">)',
        re.S,
    )
    if not re.search(r'href="/guests/"[^>]*>Guests', html):
        html = nav_pat.sub(
            r'\1<li class="nav-item">\n            <a class="nav-link" href="/guests/">Guests</a>\n          </li>\n          \2',
            html,
            count=1,
        )
    foot_pat = re.compile(
        r'(<a href="/episodes/" class="footer-link">Episodes</a>\s*)'
        r'(<a href="/stats/" class="footer-link">Stats</a>)'
    )
    if not re.search(r'footer-link">Guests', html):
        html = foot_pat.sub(
            r'\1<a href="/guests/" class="footer-link">Guests</a>\n            \2',
            html,
            count=1,
        )
    return html


def inject_guest_line(html: str, name: str, gslug: str) -> str:
    html = re.sub(r'\s*<p class="episode-guest">.*?</p>', '', html, flags=re.S)
    line = f'<p class="episode-guest">Guest: <a href="/guests/{gslug}/">{e(name)}</a></p>'
    return re.sub(
        r'(<h1 class="episode-title">.*?</h1>\s*)',
        rf'\1{line}\n            ',
        html,
        count=1,
        flags=re.S,
    )


def patch_existing_html(guests_by_ep):
    n = 0
    for path in PUBLIC.rglob("index.html"):
        rel = path.relative_to(PUBLIC).as_posix()
        if rel.startswith("_app/") or rel.startswith("api/"):
            continue
        text = path.read_text(encoding="utf-8")
        orig = text
        text = inject_nav_footer(text)
        m = re.match(r"ep/([^/]+)/index.html", rel)
        if m and m.group(1) in guests_by_ep:
            name, gslug = guests_by_ep[m.group(1)]
            text = inject_guest_line(text, name, gslug)
        if text != orig:
            path.write_text(text, encoding="utf-8")
            n += 1
    return n

def update_sitemap(guest_slugs):
    path = PUBLIC / "sitemap.xml"
    if not path.exists():
        return
    xml = path.read_text(encoding="utf-8")
    xml = re.sub(r"\s*<!-- Guest Pages -->.*?<!-- /Guest Pages -->\s*", "\n", xml, flags=re.S)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    block = ["  <!-- Guest Pages -->", f"  <url>\n    <loc>{SITE}/guests/</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>"]
    for gs in guest_slugs:
        block.append(f"  <url>\n    <loc>{SITE}/guests/{gs}/</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>")
    block.append("  <!-- /Guest Pages -->")
    xml = xml.replace("</urlset>", "\n".join(block) + "\n</urlset>")
    path.write_text(xml, encoding="utf-8")


def ensure_css():
    css_path = PUBLIC / "styles.css"
    t = css_path.read_text(encoding="utf-8")
    if ".episode-guest" in t:
        return
    t += "\n.episode-guest { margin: 0.35rem 0 0.75rem; font-size: 1.05rem; color: var(--muted, #9ca3af); }\n"
    t += ".episode-guest a { color: var(--accent-orange, #f97316); text-decoration: none; font-weight: 600; }\n"
    t += ".episode-guest a:hover { text-decoration: underline; }\n"
    t += ".guest-meta { color: var(--muted, #9ca3af); margin-bottom: 0.5rem; }\n"
    t += ".guest-links { list-style: none; padding: 0; margin: 0 0 1.5rem; }\n"
    t += ".guest-links li { margin-bottom: 0.35rem; }\n"
    css_path.write_text(t, encoding="utf-8")

def collect_guests(rss):
    guests = {}
    guests_by_ep = {}
    skipped = []
    for ep in rss:
        folder = EP_DIR / ep["slug"]
        md = ""
        tpath = folder / "transcript.md"
        if tpath.exists():
            md = tpath.read_text(encoding="utf-8")
        name, role = guest_from_md(md)
        if not name:
            name = guest_from_title(ep["title"])
            role = ""
        if not name:
            skipped.append(ep["title"])
            continue
        gslug = slugify(name)
        rec = guests.setdefault(gslug, {
            "name": name, "slug": gslug, "role": role, "bio": "", "links": [], "episodes": [],
        })
        if len(name) > len(rec["name"]):
            rec["name"] = name
        if role and not rec["role"]:
            rec["role"] = role
        if not rec["bio"]:
            rec["bio"] = intro_bio(md, name)
        for link in parse_socials(folder / "socials.md"):
            if link not in rec["links"]:
                rec["links"].append(link)
        rec["episodes"].append({
            "title": ep["title"],
            "slug": ep["slug"],
            "url": f"{SITE}/ep/{ep['slug']}/",
            "pubDate": ep["pubDate"],
            "date": fmt_date(ep["pubDate"]),
            "summary": summarize(ep["description"]) or f"{name} joins John Wright on Revenue Optimization.",
            "image": ep["image"],
        })
        guests_by_ep[ep["slug"]] = (rec["name"], gslug)
    for g in guests.values():
        if not g["bio"]:
            if g["role"]:
                g["bio"] = f"{g['name']} is {g['role']}."
            else:
                g["bio"] = f"{g['name']} joined John Wright on Revenue Optimization."
        g["episodes"].sort(key=lambda x: x["pubDate"], reverse=True)
    ordered = sorted(guests.values(), key=lambda g: g["name"].lower())
    return ordered, guests_by_ep, skipped

def write_pages(ordered):
    GUEST_DIR.mkdir(parents=True, exist_ok=True)
    index_items = []
    cards = []
    for i, g in enumerate(ordered, 1):
        teaser = g["bio"]
        if len(teaser) > 160:
            teaser = teaser[:157].rsplit(" ", 1)[0] + "…"
        n = len(g["episodes"])
        count = f"{n} episode" if n == 1 else f"{n} episodes"
        cards.append(
            f'          <a href="/guests/{g["slug"]}/" class="episode-card d-block text-decoration-none text-reset">'
            f'<h2 class="episode-title">{e(g["name"])}</h2>'
            f'<p class="guest-meta">{e(count)}</p><p>{e(teaser)}</p></a>'
        )
        index_items.append({"@type": "ListItem", "position": i, "url": f"{SITE}/guests/{g['slug']}/", "name": g["name"]})
        ep_html = []
        for ep in g["episodes"]:
            ep_html.append(
                f'<article class="episode-card"><h2 class="episode-title">'
                f'<a href="/ep/{e(ep["slug"])}/">{e(ep["title"])}</a></h2>'
                f'<p class="guest-meta">{e(ep["date"])}</p><p>{e(ep["summary"])}</p>'
                f'<p><a href="/ep/{e(ep["slug"])}/">Listen and read the transcript</a></p></article>'
            )
        links_html = ""
        if g["links"]:
            lis = "".join(
                f'<li><a href="{e(l["url"])}" target="_blank" rel="noopener noreferrer">{e(l["label"])}</a></li>'
                for l in g["links"]
            )
            links_html = f"<h2>Links</h2><ul class=\"guest-links\">{lis}</ul>"
        person = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": g["name"],
            "url": f"{SITE}/guests/{g['slug']}/",
            "description": g["bio"],
        }
        if g["role"]:
            person["jobTitle"] = g["role"]
        if g["links"]:
            person["sameAs"] = [l["url"] for l in g["links"]]
        body = (
            f'<a href="/guests/" class="back-link">All Guests</a>'
            f'<div class="episode-header"><div class="episode-header-info">'
            f'<h1 class="episode-title">{e(g["name"])}</h1>'
            f'<p class="guest-meta">{e(count)} on Revenue Optimization</p>'
            f'<p>{e(g["bio"])}</p></div></div>{links_html}<h2>Episodes</h2>'
            + "".join(ep_html)
        )
        page = page_shell(
            f"{g['name']} | Guests | Revenue Optimization with StatsDrone",
            g["bio"][:160],
            f"{SITE}/guests/{g['slug']}/",
            "guests",
            body,
            json.dumps(person, ensure_ascii=False, indent=2),
        )
        dest = GUEST_DIR / g["slug"]
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "index.html").write_text(page, encoding="utf-8")
    itemlist = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Guests - Revenue Optimization with StatsDrone",
        "numberOfItems": len(ordered),
        "itemListElement": index_items,
    }
    index_body = (
        f'<a href="/episodes/" class="back-link">Episodes</a>'
        f'<div class="episode-header"><div class="episode-header-info">'
        f'<h1 class="episode-title">Guests</h1>'
        f'<p>Interviews on Revenue Optimization. Solocasts stay on the episodes page.</p>'
        f'<p class="guest-meta">{len(ordered)} guests</p></div></div>'
        + "".join(cards)
    )
    (GUEST_DIR / "index.html").write_text(
        page_shell(
            "Guests | Revenue Optimization with StatsDrone",
            "Guests of the Revenue Optimization podcast with StatsDrone.",
            f"{SITE}/guests/",
            "guests",
            index_body,
            json.dumps(itemlist, ensure_ascii=False, indent=2),
        ),
        encoding="utf-8",
    )

def main():
    rss = load_rss()
    ordered, guests_by_ep, skipped = collect_guests(rss)
    write_pages(ordered)
    data_dir = PUBLIC / "data"
    data_dir.mkdir(exist_ok=True)
    payload = {
        "show": "Revenue Optimization with StatsDrone",
        "site": SITE,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(ordered),
        "guests": [
            {
                "name": g["name"],
                "slug": g["slug"],
                "url": f"{SITE}/guests/{g['slug']}/",
                "bio": g["bio"],
                "role": g["role"] or None,
                "links": g["links"],
                "episodes": [
                    {"title": ep["title"], "slug": ep["slug"], "url": ep["url"], "pubDate": ep["pubDate"]}
                    for ep in g["episodes"]
                ],
            }
            for g in ordered
        ],
    }
    (data_dir / "guests.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ensure_css()
    patched = patch_existing_html(guests_by_ep)
    update_sitemap([g["slug"] for g in ordered])
    wanted = {
        "shaurya-jain", "oleksandr-kulyk", "zak-ali", "koray-tugberk-gubur",
        "lazar-petrov", "jason-attard", "gael-goasdoue", "steve-toth",
    }
    print("guests:", len(ordered))
    print("interview episodes:", len(guests_by_ep))
    print("solos skipped:", len(skipped))
    print("examples:", ", ".join(g["slug"] for g in ordered if g["slug"] in wanted))
    print("patched html files:", patched)
    print("skipped titles:")
    for t in skipped:
        print(" -", t)


if __name__ == "__main__":
    main()
