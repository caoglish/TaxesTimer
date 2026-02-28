# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev               # Start dev server (http://localhost:5173/TaxesTimer/)
npm run dev -- --host     # Expose to LAN for mobile testing
npm run build             # Production build → dist/
npm run preview           # Preview production build
```

No test framework is configured.

## Deployment

- Hosted on **GitHub Pages**: https://caoglish.github.io/TaxesTimer/
- Auto-deploys via `.github/workflows/deploy.yml` on every push to `master`
- Vite `base` is set to `/TaxesTimer/` in `vite.config.js`

## Architecture

Single-page Vue 3 app — all logic lives in one file: `src/App.vue`.

**State machine (in `App.vue`):**
- `seconds` — current displayed countdown value
- `isRunning` / `isPaused` — three states: idle, running, paused
- `lastSetSeconds` — tracks which duration (30s or 60s) was last selected

**Button behavior:**
- Blue (30s): if already at 30s idle → start; otherwise → reset to 30s
- Red (60s): if already at 60s idle → start; otherwise → reset to 60s
- Yellow: running → pause; paused+full → start; paused+partial → reset to full; idle+full → start; at 00 → reset to lastSetSeconds

**Audio architecture (iOS-compatible):**
- `initAudio()` called on first button tap (iOS requires user gesture)
- A silent WAV loops via HTML Audio to keep iOS audio hardware warm (prevents cold-start delay)
- Tone WAVs are generated as ArrayBuffers in JS, decoded via `decodeAudioData()` into `AudioBuffer`s
- Playback uses `AudioBufferSourceNode.start(0)` — near-zero latency
- Three sounds: `playClick()` 600Hz sine, `playTick()` 1100Hz sine, `playAlarm()` 880Hz square

**Display:**
- DSEG7 Classic font bundled locally (`src/assets/fonts/DSEG7Classic-Regular.woff2`) from `dseg` npm package
- `@font-face` declared in global `<style>` block in `App.vue`
- Single `<span class="digits">` with red color (`#ff1111`) and 3D layered `text-shadow`

**Layout:**
- Mobile-first, `100dvh`, `min()` clamps for all font/spacing sizes
- Portrait: `font-size: min(52vw, 62vh)`; Landscape: `min(52vw, 42vh)` via `@media (orientation: landscape)`
- `viewport-fit=cover` + `env(safe-area-inset-top)` for notch/browser-chrome handling
- Blue and Red buttons are fixed squares (`min(32vw, 20vh)`); Yellow takes remaining width (`flex: 1`)

**Version:**
- Defined in `package.json`, injected at build time via Vite `define: { __APP_VERSION__ }` in `vite.config.js`
- Displayed at bottom of screen as `v0.1.1`
