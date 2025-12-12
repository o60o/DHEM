# DHEM Backend (YouTube -> MP3)

This repository contains a secure backend service to stream MP3 from YouTube using yt-dlp. It is prepared to run in Docker (recommended).

## Deploy (recommended) — Render.com using Docker
1. Create a GitHub repository and push these files.
2. Create an account on https://render.com and connect your GitHub.
3. Click "New" → "Web Service" → choose your repo.
4. For "Environment" choose Docker (Render will use the Dockerfile).
5. Set Instance to Free.
6. Deploy. Once deployed you'll get a URL like `https://your-service.onrender.com`.

## Usage (from frontend)
Send POST to:
`https://your-service.onrender.com/api/download`
Body JSON:
```json
{ "url": "https://www.youtube.com/watch?v=XXXX" }
```

The response will be streamed as an MP3 file to download.

## Security notes
- The container installs `yt-dlp` and runs it in-process. We limit concurrency and apply rate-limits.
- After deploy, update CORS origin in server.js to your GitHub Pages domain.
- Do not log long URLs in production.
- Review legal/copyright rules for converting YouTube content.
