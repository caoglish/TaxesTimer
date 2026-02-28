# Texas Hold'em Timer

[中文说明](README.zh.md)

A minimalist countdown timer for Texas Hold'em poker, designed for mobile use. Features a 7-segment LED display style with two preset durations.

## How to Use

### Buttons

| Button | Color | Action |
|--------|-------|--------|
| Left (wide) | Yellow | Start / Pause / Reset |
| Middle | Blue | 30 seconds |
| Right | Red | 60 seconds |

### Starting a Countdown

1. Tap **Blue** to set 30 seconds, or **Red** to set 60 seconds.
2. The display shows the selected time. Tap the same button again to start immediately, or tap **Yellow** to start.

### Pause & Resume

- Tap **Yellow** while the timer is running to **pause**.
- Tap **Yellow** again to **resume** from where it left off.

### Reset

- While paused, tap **Yellow** to reset to the full duration, then tap again to restart.
- After the timer reaches **00**, tap **Yellow** to reset to the last used duration.
- Tap **Blue** or **Red** at any time to instantly switch to a new duration and stop the current timer.

### Sound Effects

- A **click** plays on every button press.
- A **tick** sounds at the first second and every 10 seconds.
- An **alarm** plays when the countdown reaches 00.

> On mobile, sound requires at least one button tap to initialize the audio system.

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

To test on a mobile device on the same Wi-Fi network:

```bash
npm run dev -- --host
```

Then open the displayed network URL on your phone.
