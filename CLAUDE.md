# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

No test framework is configured.

## Architecture

Single-page Vue 3 app — all logic lives in one file: `src/App.vue`.

**State machine (in `App.vue`):**
- `seconds` — current displayed countdown value
- `isRunning` / `isPaused` — three states: idle, running, paused
- `lastSetSeconds` — tracks which duration (30s or 60s) was last selected

**Button behavior:**
- Blue (30s): if already at 30s idle → start; otherwise → reset to 30s
- Red (60s): if already at 60s idle → start; otherwise → reset to 60s
- Yellow: running → pause; paused+full → start; paused+partial → reset to full; idle+full → start

**Audio:** Web Audio API only — no audio files. Three synthesized sounds:
- `playClick()` — button press feedback (600Hz sine, 80ms)
- `playTick()` — periodic tick (1100Hz sine, 50ms) at start and every 10s
- `playAlarm()` — countdown end (880Hz square, 1.2s)

AudioContext is lazily initialized on first user gesture to satisfy mobile autoplay restrictions.

**Display:** DSEG7 font loaded via CDN (`cdn.jsdelivr.net/npm/dseg@0.46.0`). Two overlaid `<span>` elements create the LED effect: dark background layer (`#3a0000`) + bright red foreground (`#ff1111`) with CSS glow.

**Layout:** Mobile-first, `100dvh`, `min()` clamps for all font/spacing sizes. Viewport meta disables user scaling.
