<template>
  <div class="app">
    <div class="display">
      <div class="digits-wrap">
<span class="digits">{{ displayValue }}</span>
      </div>
    </div>
    <div class="buttons">
      <button class="btn btn-yellow" @click="handleYellow">
        <span class="btn-label">{{ yellowLabel }}</span>
      </button>
      <button class="btn btn-blue" @click="handleBlue">
        <span class="btn-label">30s</span>
      </button>
      <button class="btn btn-red" @click="handleRed">
        <span class="btn-label">60s</span>
      </button>
    </div>
    <div class="version">v{{ version }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const version = __APP_VERSION__

const seconds = ref(30)
const isRunning = ref(false)
const isPaused = ref(false)
const lastSetSeconds = ref(30)
let timer = null
let audioCtx = null
const audioBuffers = {}
let warmAudio = null  // HTML Audio 静音循环，保持 iOS 硬件唤醒

// 生成 WAV ArrayBuffer（用于 HTML Audio 和 decodeAudioData）
function genWavArrayBuffer(freq, type, duration, volume, decay, sr = 22050) {
  const n = Math.floor(sr * duration)
  const ab = new ArrayBuffer(44 + n * 2)
  const v = new DataView(ab)
  const s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true)
  s(8, 'WAVE'); s(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true)
  v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  s(36, 'data'); v.setUint32(40, n * 2, true)
  for (let i = 0; i < n; i++) {
    const t = i / sr
    const wave = type === 'square'
      ? (Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1)
      : Math.sin(2 * Math.PI * freq * t)
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, wave * volume * Math.exp(-t * decay))) * 0x7FFF, true)
  }
  return ab
}

function arrayBufToDataUri(ab) {
  let bin = ''; new Uint8Array(ab).forEach(b => (bin += String.fromCharCode(b)))
  return 'data:audio/wav;base64,' + btoa(bin)
}

function initAudio() {
  if (audioCtx) return

  // 1. HTML Audio 静音循环：解锁 iOS 硬件，并持续保活防止冷启动延迟
  const silentAb = genWavArrayBuffer(440, 'sine', 0.5, 0.00001, 0)
  warmAudio = new Audio(arrayBufToDataUri(silentAb))
  warmAudio.loop = true
  warmAudio.play().catch(() => {})

  // 2. Web Audio 用于零延迟播放
  audioCtx = new AudioContext()

  // 3. 用 decodeAudioData 把 WAV 转成 AudioBuffer（异步，启动时就开始解码）
  const specs = {
    click: genWavArrayBuffer(600,  'sine',   0.15, 0.5, 40),
    tick:  genWavArrayBuffer(1100, 'sine',   0.12, 0.4, 50),
    alarm: genWavArrayBuffer(880,  'square', 1.5,  0.5,  3),
  }
  for (const [name, ab] of Object.entries(specs)) {
    audioCtx.decodeAudioData(ab, buf => { audioBuffers[name] = buf })
  }
}

function playSound(name) {
  const buf = audioBuffers[name]
  if (!audioCtx || !buf) return
  const src = audioCtx.createBufferSource()
  src.buffer = buf
  src.connect(audioCtx.destination)
  src.start(0)
}

function playClick() { playSound('click') }
function playTick()  { playSound('tick')  }
function playAlarm() { playSound('alarm') }

const displayValue = computed(() => {
  return String(seconds.value).padStart(2, '0')
})

const yellowLabel = computed(() => {
  if (isRunning.value) return '暂停'
  if (isPaused.value) {
    if (seconds.value === lastSetSeconds.value) return '开始倒计时'
    return lastSetSeconds.value + 's'
  }
  if (seconds.value === lastSetSeconds.value && lastSetSeconds.value !== null) return '开始倒计时'
  if (seconds.value === 0 && lastSetSeconds.value !== null) return lastSetSeconds.value + 's'
  return '---'
})

function startCountdown() {
  initAudio() // 用户手势中解锁：HTML Audio 保活 + Web Audio 零延迟播放
  isRunning.value = true
  isPaused.value = false
  timer = setInterval(() => {
    seconds.value--
    if (seconds.value <= 0) {
      seconds.value = 0
      isRunning.value = false
      clearInterval(timer)
      timer = null
      playAlarm()
    } else if (seconds.value % 10 === 0) {
      playTick() // 每 10 秒滴答一次
    } else if (seconds.value === lastSetSeconds.value - 1) {
      playTick() // 开始后第一秒滴答
    }
  }, 1000)
}

function stopAndSet(n) {
  clearInterval(timer)
  timer = null
  seconds.value = n
  lastSetSeconds.value = n
  isRunning.value = false
  isPaused.value = false
}

function handleBlue() {
  initAudio()
  playClick()
  if (seconds.value === 30 && !isRunning.value && !isPaused.value) {
    startCountdown()
  } else {
    stopAndSet(30)
  }
}

function handleRed() {
  initAudio()
  playClick()
  if (seconds.value === 60 && !isRunning.value && !isPaused.value) {
    startCountdown()
  } else {
    stopAndSet(60)
  }
}

function handleYellow() {
  initAudio()
  playClick()
  if (isRunning.value) {
    // 运行中 → 暂停
    clearInterval(timer)
    timer = null
    isRunning.value = false
    isPaused.value = true
  } else if (isPaused.value) {
    if (seconds.value === lastSetSeconds.value) {
      // 暂停中且显示值 = 完整时间 → 直接开始
      startCountdown()
    } else {
      // 暂停中且显示值 ≠ 完整时间 → 重置
      seconds.value = lastSetSeconds.value
      isPaused.value = false
    }
  } else if (seconds.value === lastSetSeconds.value && lastSetSeconds.value !== null) {
    // 已重置/停止状态 → 开始
    startCountdown()
  } else if (lastSetSeconds.value !== null) {
    // 倒计时结束（00）→ 重置到上次设定秒数
    seconds.value = lastSetSeconds.value
  }
}

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  touch-action: manipulation;
}

#app {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100dvh;
  background: #000;
  gap: min(8vw, 5vh);
  padding: min(4vw, 2.5vh);
}

.display {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.digits-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.digits {
  font-family: 'DSEG7 Classic', 'DSEG7Classic', monospace;
  font-size: min(70vw, 60.7vh);
  color: #ff1111;
  line-height: 1;
  letter-spacing: 0.05em;
  user-select: none;
  text-shadow:
    1px 1px 0 #990000,
    2px 2px 0 #880000,
    3px 3px 0 #770000,
    4px 4px 10px rgba(0, 0, 0, 0.9);
}

.version {
  font-size: min(3vw, 1.8vh);
  color: #444;
  letter-spacing: 0.1em;
  user-select: none;
}

.buttons {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: min(3vw, 2vh);
}

.btn {
  flex: none;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(32vw, 20vh);
  height: min(32vw, 20vh);
  -webkit-tap-highlight-color: transparent;
  transition: filter 0.1s ease, transform 0.1s ease;
}

.btn:active {
  filter: brightness(0.75);
  transform: scale(0.96);
}

.btn-yellow {
  flex: 1;
  width: auto;
}

.btn-blue {
  background: #1565C0;
}

.btn-red {
  background: #C62828;
}

.btn-yellow {
  background: #F9A825;
}

.btn-label {
  font-size: min(6vw, 4vh);
  font-weight: 700;
  color: #fff;
  user-select: none;
  pointer-events: none;
}
</style>
