<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const publicBase = import.meta.env.BASE_URL || '/'
const remoteBase = String(import.meta.env.VITE_ETS2_FRAME_URL || '').replace(/\/+$/, '')
const sampleMode = remoteBase.length === 0
const samples = [1, 2, 3].map(index => ({
  frame: `${publicBase}mockups/ets2-sample/frame-${index}.svg`,
  meta: `${publicBase}mockups/ets2-sample/meta-${index}.json`
}))

const displayedSrc = ref('')
const frameSequence = ref('')
const metadata = ref({
  capturedAt: '',
  connected: false,
  monitor: null,
  width: 1280,
  height: 720
})
const now = ref(Date.now())
const loading = ref(false)
const consecutiveFailures = ref(0)
const sampleIndex = ref(0)
const announcedFreshness = ref('첫 화면을 기다리는 중')
let pollTimer = 0
let clockTimer = 0
let active = true

const capturedAtMs = computed(() => Date.parse(metadata.value.capturedAt) || now.value)
const ageSeconds = computed(() => Math.max(0, Math.floor((now.value - capturedAtMs.value) / 1000)))
const signalLost = computed(() => consecutiveFailures.value >= 3)
const stale = computed(() => ageSeconds.value >= 30)
const pollingMs = computed(() => {
  if (ageSeconds.value >= 300) return 30000
  if (ageSeconds.value >= 30) return 10000
  return 2000
})
const pollingLabel = computed(() => `${pollingMs.value / 1000}초`)
const ageLabel = computed(() => `${ageSeconds.value}초 전`)
const freshnessLabel = computed(() => {
  if (signalLost.value) return '관제 신호 없음'
  if (!displayedSrc.value) return '첫 화면을 기다리는 중'
  const detail = `${ageLabel.value} · ${metadata.value.width || 1280}×${metadata.value.height || 720}`
  return sampleMode ? `샘플 화면 · 실제 주행 정보 아님 · ${detail}` : detail
})
const staleLabel = computed(() => {
  const minutes = Math.max(1, Math.floor(ageSeconds.value / 60))
  return `마지막 화면 · ${minutes}분 전`
})
const frameAlt = computed(() => `유로트럭 화면, ${ageLabel.value}`)
const announcementKey = computed(() => {
  if (signalLost.value) return 'lost'
  if (!displayedSrc.value) return 'waiting'
  return `${stale.value ? 'stale' : 'live'}-${Math.floor(ageSeconds.value / 30)}`
})
const connected = computed(() => metadata.value.connected !== false)
const lastReceived = computed(() => (stale.value || signalLost.value) && displayedSrc.value)

function dashOr(value, formatter) {
  if (!connected.value || value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? formatter(number) : '—'
}

const speedText = computed(() => dashOr(metadata.value.speedKmh, value => `${Math.round(value)} km/h`))
const cruiseText = computed(() => dashOr(metadata.value.cruiseKmh, value => `${Math.round(value)} km/h`))
const speedLimitText = computed(() => dashOr(metadata.value.speedLimitKmh, value => `${Math.round(value)} km/h`))
const distanceText = computed(() => dashOr(metadata.value.routeDistanceKm, value => `${value.toFixed(1)} km`))
const monitorText = computed(() => {
  if (!connected.value) return '—'
  const monitor = metadata.value.monitor || {}
  if (monitor.recoveryState && !['idle', 'ready'].includes(String(monitor.recoveryState).toLowerCase())) {
    return `복구 중 · 정지 ${Math.max(0, Math.round(Number(monitor.stillSeconds) || 0))}초`
  }
  if (monitor.active === false) return '감시 멈춤'
  return `감시 중 · 정지 ${Math.max(0, Math.round(Number(monitor.stillSeconds) || 0))}초`
})

watch(announcementKey, () => {
  announcedFreshness.value = freshnessLabel.value
}, { immediate: true })

function normalizeMeta(raw, sample = false) {
  const telemetry = raw?.telemetry && typeof raw.telemetry === 'object' ? raw.telemetry : raw || {}
  const age = Math.max(0, Number(raw?.ageSeconds) || 0)
  return {
    capturedAt: sample
      ? new Date(Date.now() - age * 1000).toISOString()
      : String(raw?.capturedAt || telemetry?.capturedAt || new Date().toISOString()),
    connected: telemetry.connected !== false,
    speedKmh: telemetry.speedKmh,
    cruiseKmh: telemetry.cruiseKmh,
    speedLimitKmh: telemetry.speedLimitKmh,
    routeDistanceKm: telemetry.routeDistanceKm,
    paused: Boolean(telemetry.paused),
    blank: Boolean(raw?.blank ?? telemetry.blank),
    monitor: telemetry.monitor || raw?.monitor || null,
    width: Number(raw?.width || telemetry.width) || 1280,
    height: Number(raw?.height || telemetry.height) || 720,
    seq: raw?.seq ?? telemetry.seq ?? ''
  }
}

function preloadFrame(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(src)
    image.onerror = () => reject(new Error('frame-load-failed'))
    image.src = src
  })
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`meta-load-${response.status}`)
  return response.json()
}

async function loadRemoteFrame() {
  const cacheKey = Date.now()
  const raw = await fetchJson(`${remoteBase}/meta.json?t=${cacheKey}`)
  const candidate = `${remoteBase}/latest.jpg?t=${cacheKey}`
  await preloadFrame(candidate)
  metadata.value = normalizeMeta(raw)
  frameSequence.value = String(raw?.seq ?? cacheKey)
  displayedSrc.value = candidate
}

async function loadSampleFrame() {
  const index = sampleIndex.value
  const sample = samples[index]
  sampleIndex.value = (index + 1) % samples.length
  const raw = await fetchJson(`${sample.meta}?t=${Date.now()}`)
  await preloadFrame(sample.frame)
  metadata.value = normalizeMeta(raw, true)
  frameSequence.value = String(raw?.seq ?? index + 1)
  displayedSrc.value = sample.frame
}

function scheduleNextPoll() {
  if (!active) return
  window.clearTimeout(pollTimer)
  pollTimer = window.setTimeout(poll, pollingMs.value)
}

async function poll() {
  if (loading.value) return
  loading.value = true
  try {
    if (remoteBase) await loadRemoteFrame()
    else await loadSampleFrame()
    consecutiveFailures.value = 0
  } catch {
    consecutiveFailures.value += 1
  } finally {
    loading.value = false
    now.value = Date.now()
    scheduleNextPoll()
  }
}

onMounted(() => {
  clockTimer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
  poll()
})

onBeforeUnmount(() => {
  active = false
  window.clearInterval(clockTimer)
  window.clearTimeout(pollTimer)
})
</script>

<template>
  <section class="ets2-live-page" :data-poll-ms="pollingMs" :data-frame-sequence="frameSequence">
    <header class="ets2-live-head">
      <h1>유로트럭 관제</h1>
      <p class="ets2-freshness" aria-hidden="true">{{ freshnessLabel }}</p>
      <p class="ets2-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {{ announcedFreshness }}
      </p>
    </header>

    <p v-if="lastReceived" class="ets2-last-received">주행 값 · 마지막 수신 정보</p>
    <dl class="ets2-telemetry" :aria-label="lastReceived ? '마지막 수신 주행 정보' : '주행 정보'">
      <div>
        <dt>속도</dt>
        <dd>{{ speedText }}</dd>
      </div>
      <div>
        <dt>크루즈</dt>
        <dd>{{ cruiseText }}</dd>
      </div>
      <div>
        <dt>제한</dt>
        <dd>{{ speedLimitText }}</dd>
      </div>
      <div>
        <dt>목적지</dt>
        <dd>{{ distanceText }}</dd>
      </div>
      <div>
        <dt>감시</dt>
        <dd>{{ monitorText }}</dd>
      </div>
    </dl>

    <figure class="ets2-frame-figure">
      <div
        class="ets2-frame-shell"
        :class="{ stale, 'signal-lost': signalLost }"
        :aria-busy="loading && !displayedSrc"
      >
        <img v-if="displayedSrc" :src="displayedSrc" :alt="frameAlt" />
        <p v-else>첫 화면을 기다리는 중</p>
      </div>
      <figcaption v-if="signalLost" class="ets2-frame-alert" role="alert">관제 신호 없음</figcaption>
      <figcaption v-else-if="stale" class="ets2-frame-alert">{{ staleLabel }}</figcaption>
    </figure>

    <footer class="ets2-polling-row">
      <span>읽기 전용</span>
      <span>자동 확인 · {{ pollingLabel }}</span>
    </footer>
  </section>
</template>
