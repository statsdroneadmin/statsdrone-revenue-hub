# Episode Workflow Guide

## Quick Start: Adding Episode Files

### 1. Add your markdown files to the episode folder

```bash
# Navigate to the episode folder
cd public/ep/your-episode-name/

# Add your files
# - socials.md (for social media links)
# - transcript.md (for episode transcript)
```

### 2. Sync to GitHub and deploy

**Simple way (recommended):**
```bash
./sync-episodes.sh "Added transcript for Episode X"
```

**Or with default message:**
```bash
./sync-episodes.sh
```

That's it! The script will:
- Pull latest changes from GitHub
- Stage your episode files
- Commit with your message
- Push to GitHub
- Lovable will auto-deploy in 2-5 minutes

---

## File Formats

### socials.md Format
```markdown
[YouTube](https://youtube.com/watch?v=xxx)
[YouTube Shorts](https://youtube.com/shorts/xxx)
[Spotify](https://open.spotify.com/episode/xxx)
[Apple Podcasts](https://podcasts.apple.com/xxx)
```

### transcript.md Format
```markdown
# Episode Title

Your transcript text here...

Multiple paragraphs are supported.

## Section Headers
You can use headers to organize the transcript.

**Bold text** and *italic text* are supported.
```

---

## Manual Workflow (if script doesn't work)

```bash
# 1. Check what changed
git status

# 2. Pull latest
git pull origin main --rebase

# 3. Add files
git add public/ep/

# 4. Commit
git commit -m "Your message here"

# 5. Push
git push origin master:main
```

---

## Troubleshooting

### Script says "No changes detected"
- Make sure you saved your `.md` files
- Check that files are in the correct `public/ep/episode-name/` folder

### Push failed / conflicts
- Run: `git pull origin main --rebase`
- Resolve any conflicts
- Run the sync script again

### Files not showing on website
- Wait 5-10 minutes for Lovable to deploy
- Check Lovable dashboard for deployment status
- Clear browser cache and refresh

---

## Example Workflow

```bash
# Add files to episode folder
cd public/ep/kasra-dash-on-why-lazy-seo-is-dead-and-brands-win/
# (add socials.md and transcript.md)

# Go back to project root
cd ../../../

# Sync to GitHub
./sync-episodes.sh "Added socials and transcript for Kasra episode"

# Wait 5 minutes, then check:
# https://revenueoptimization.io/ep/kasra-dash-on-why-lazy-seo-is-dead-and-brands-win/
```
