# Local Twitch Message Creator

An offline, ad-free replacement for the single-message generator at
`twitchmessagecreator.site`. It uses the same `html-to-image` rendering library,
plus Twitch-style inline message layout and 2x export settings. The bundled
Inter font keeps previews and downloads consistent without a network request.

## Run Locally

```bash
cd twitch-message-creator
./start-local.sh
```

The script opens `http://127.0.0.1:8765`. This is a local-only server: no
message data, analytics, or images are sent anywhere. Press `Ctrl+C` in the
terminal to stop it.

You can also open `index.html` directly, although using `start-local.sh` avoids
browser restrictions around local fonts, images, and downloads.

## Tests

`node --test` runs filename sanitization tests (no browser required).

## GitHub Pages

Pushes to `main` deploy automatically through
`.github/workflows/deploy-pages.yml`. In the GitHub repository settings, set
**Pages > Build and deployment > Source** to **GitHub Actions**.

## Keep Using The Original Site

`block-popups.user.js` is an optional Tampermonkey or Violentmonkey userscript.
It blocks:

- The explicit `affectionatestorage.com` tab opened after PNG generation.
- Dynamically injected scripts from the site's current ad network.
- Empty ad containers that otherwise consume page space.

Install Tampermonkey or Violentmonkey, create a new userscript, and import
`block-popups.user.js`.

## How The Original Download Works

The site uses a browser-side DOM-to-canvas library. It renders `.message` at 2x
resolution, creates a PNG data URL, and clicks a temporary download link. No
image-generation API is involved. Only after that finishes does the site call:

```js
window.open("https://affectionatestorage.com/yQ28sh", "_blank");
```

Blocking that call does not interfere with the PNG download.

The vendored `html-to-image` library is MIT-licensed. Its license is retained at
`assets/html-to-image.LICENSE`.
