#!/usr/bin/env python3
"""Build a static JSON API from RSS + episode markdown."""
from __future__ import annotations

import json
import re
import unicodedata
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

REPO = Path("/workspace/statsdrone-revenue-hub")
PUBLIC = REPO / "public"
EP_DIR = PUBLIC / "ep"
API = PUBLIC / "api"
RSS = Path("/tmp/affiliatebi.xml")
SITE = "https://revenueoptimization.io"
NS = {"itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd"}

TURN_RE = re.compile(
    r"^\[(\d{2}:\d{2}:\d{2})\]\s+([^:]+):\s*(.*)$"
)
LINK_RE = re.compile(r"\[([^\]]+)\]\((https?://[^)]+)\)")


def slugify(title: str) -> str:
    s = unicodedata.normalize("NFD", title.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace(".", "-")
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def fmt_dur(d: str) -> str:
    d = (d or "").strip()
    if d.isdigit():
        s = int(d)
        m, sec = divmod(s, 60)
        if m >= 60:
            h, m = divmod(m, 60)
            return f"{h}:{m:02d}:{sec:02d}"
        return f"{m}:{sec:02d}"
    return d


def parse_socials(path: Path) -> dict:
    out = {}
    if not path.exists():
        return out
    for m in LINK_RE.finditer(path.read_text(encoding="utf-8")):
        out[m.group(1).strip().lower()] = m.group(2).strip()
    return out


def parse_turns(md: str) -> list[dict]:
    turns = []
    for line in md.splitlines():
        m = TURN_RE.match(line.strip())
        if not m:
            continue
        text = m.group(3).strip()
        if not text:
            continue
        turns.append({"t": m.group(1), "speaker": m.group(2).strip(), "text": text})
    return turns


def guest_from_title(title: str) -> str | None:
    named = list(
        re.finditer(
            r"\bwith\s+([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,3})(?:\s+from\s+|\s+of\s+|$)",
            title,
        )
    )
    if named:
        name = named[-1].group(1).strip()
        if name.lower() not in {"ai", "ppc", "seo", "statsdrone"}:
            return name
    m = re.search(r"['\u2019]s\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\s+on\b", title)
    return m.group(1) if m else None


def guest_from_md(md: str) -> str | None:
    m = re.search(r"^\*\*Guest:\*\*\s+(.+)$", md, re.M)
    return m.group(1).strip() if m else None


def load_rss() -> list[dict]:
    if not RSS.exists():
        raise SystemExit("missing /tmp/affiliatebi.xml")
    root = ET.parse(RSS).getroot()
    items = []
    for it in root.findall("./channel/item"):
        title = (it.findtext("title") or "").strip()
        enc = it.find("enclosure")
        items.append(
            {
                "title": title,
                "slug": slugify(title),
                "audio": enc.get("url") if enc is not None else "",
                "duration": fmt_dur(it.findtext("itunes:duration", default="", namespaces=NS) or ""),
                "pubDate": it.findtext("pubDate") or "",
                "description": (it.findtext("description") or "").strip(),
                "guid": (it.findtext("guid") or "").strip(),
            }
        )
    return items


def main() -> None:
    API.mkdir(parents=True, exist_ok=True)
    (API / "episodes").mkdir(exist_ok=True)
    rss = load_rss()
    index = []
    full_rows = []
    for ep in rss:
        slug = ep["slug"]
        folder = EP_DIR / slug
        tpath = folder / "transcript.md"
        md = tpath.read_text(encoding="utf-8") if tpath.exists() and tpath.stat().st_size > 200 else ""
        turns = parse_turns(md) if md else []
        guest = guest_from_md(md) or guest_from_title(ep["title"])
        socials = parse_socials(folder / "socials.md")
        rec = {
            "id": slug,
            "slug": slug,
            "show": "Revenue Optimization with StatsDrone",
            "host": "John Wright",
            "title": ep["title"],
            "guest": guest,
            "url": f"{SITE}/ep/{slug}/",
            "pubDate": ep["pubDate"],
            "duration": ep["duration"],
            "audio": ep["audio"],
            "guid": ep["guid"],
            "description": re.sub(r"<[^>]+>", "", ep["description"]).strip(),
            "has_transcript": bool(turns or md),
            "socials": socials,
            "transcript_url": f"{SITE}/api/episodes/{slug}.json",
            "transcript_md_url": f"{SITE}/ep/{slug}/transcript.md" if md else None,
        }
        full = dict(rec)
        full["transcript_markdown"] = md or None
        full["turns"] = turns
        full["turn_count"] = len(turns)
        (API / "episodes" / f"{slug}.json").write_text(
            json.dumps(full, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        index.append(rec)
        full_rows.append(full)

    payload = {
        "show": "Revenue Optimization with StatsDrone",
        "site": SITE,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "count": len(index),
        "with_transcript": sum(1 for e in index if e["has_transcript"]),
        "episodes_url": f"{SITE}/api/episodes.json",
        "episodes_jsonl_url": f"{SITE}/api/episodes.jsonl",
        "episodes": index,
    }
    (API / "episodes.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (API / "episodes.jsonl").open("w", encoding="utf-8") as f:
        for row in full_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"wrote {len(index)} episodes, {payload['with_transcript']} with transcript")
    print(f"  {API / 'episodes.json'}")
    print(f"  {API / 'episodes.jsonl'}")
    print(f"  {API / 'episodes'}/*.json")


if __name__ == "__main__":
    main()
