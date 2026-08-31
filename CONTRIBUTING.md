# Contributing

This is a small static site: vanilla JS, no build step. Keep it that way.

## Run locally

```bash
./start-local.sh
```

Opens `http://127.0.0.1:8765`. Opening `index.html` as a file works for some changes, but font/image/download behavior is only reliable through the local server.

## Tests

```bash
node --test
```

Runs filename sanitization tests. No extra packages. Keep helpers in `filename.js` so they can be tested without a browser.

## What belongs here

Bug fixes and small, concrete features that make the PNG closer to a real Twitch chat message, or that make export more reliable. Match existing style in `app.js` / `styles.css` (strict IIFE, no framework, no extra dependencies unless the issue requires it).

Please do not:

- Rewrite the app into a framework
- Drive-by refactors, formatting-only diffs, or dependency bumps
- Change the Pages workflow unless the issue is about deploy

## Pull requests

One concern per PR. Describe what you changed and how you checked it (browser + `./start-local.sh`, which OS). If you used AI assistance, say so in the PR body and make sure you can defend every line.

## Issues

Open an issue before a non-trivial change. If an issue is already open, comment there instead of starting a parallel thread.
