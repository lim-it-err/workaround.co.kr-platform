<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  staticMode: { type: Boolean, default: false }
})

const publicBase = import.meta.env.BASE_URL || '/'
const localTestApi = typeof window !== 'undefined'
  && ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname)
  ? String(window.__WORKAROUND_ETS2_DEV_TEST_API__ || '')
  : ''
const apiBase = String(localTestApi || import.meta.env.VITE_ETS2_DEV_API || 'http://127.0.0.1:8765').replace(/\/+$/, '')
const apiHost = (() => {
  try { return new URL(apiBase).host }
  catch { return '127.0.0.1:8765' }
})()

const state = ref(createEmptyState())
const serverAvailable = ref(false)
const loading = ref(false)
const displayedFrame = ref('')
const displayedFrameId = ref(null)
const frameLoading = ref(false)
const clearRoad = ref(false)
const laneAssistOff = ref(false)
const simulatorOpen = ref(false)
const recoveryDialog = ref(null)
const frameMessage = ref('')
const actionFeedback = ref({ scope: '', tone: '', text: '' })
const activity = ref([])
let pollTimer = 0
let active = true

function createEmptyState() {
  return {
    telemetry: { connected: false, paused: false },
    armed: false,
    pendingArm: false,
    maneuver: null,
    reason: '',
    events: [],
    token: '',
    monitor: { enabled: false, lowSpeedSeconds: 0, thresholdSeconds: 120, phase: 'off' },
    capture: { available: false },
    recovery: { running: false, configured: false, reason: '' }
  }
}

const telemetry = computed(() => state.value.telemetry || {})
const connected = computed(() => serverAvailable.value && telemetry.value.connected === true)
const armed = computed(() => Boolean(state.value.armed || state.value.pendingArm))
const speedKmhValue = computed(() => Number(telemetry.value.speedMps) * 3.6)
const cruiseKmhValue = computed(() => Number(telemetry.value.cruiseMps) * 3.6)
const withinLaneSpeed = computed(() => connected.value && speedKmhValue.value >= 30 && speedKmhValue.value <= 110)
const laneReady = computed(() => armed.value && clearRoad.value && laneAssistOff.value && withinLaneSpeed.value && !state.value.maneuver)
const controlReady = computed(() => connected.value && armed.value)
const plusReady = computed(() => controlReady.value && cruiseKmhValue.value > 0 && cruiseKmhValue.value + 5 <= 110.1)
const controlReason = computed(() => {
  if (!connected.value) return '게임 연결 후 명령을 준비할 수 있습니다.'
  if (!armed.value) return '명령 준비를 누르면 ACC와 차선유지 조작이 활성화됩니다.'
  if (telemetry.value.paused) return '게임 일시정지 중에는 명령이 복귀 시점까지 예약됩니다.'
  return '명령 준비됨 · 브레이크 또는 F8로 즉시 중단할 수 있습니다.'
})
const laneReason = computed(() => {
  if (!armed.value) return '먼저 명령을 준비하세요.'
  if (!withinLaneSpeed.value) return '30–110 km/h에서만 요청할 수 있습니다.'
  if (!clearRoad.value || !laneAssistOff.value) return '두 확인란을 모두 확인하세요.'
  if (state.value.maneuver) return '차선 변경이 진행 중입니다.'
  return '차선 변경 요청 준비됨'
})
const connectionText = computed(() => {
  if (!serverAvailable.value) return `PoC 서버 없음 — ${apiHost}`
  if (!telemetry.value.connected) return 'PoC 연결됨 · 게임 연결 대기'
  return `연결됨 · 25Hz · ${telemetry.value.paused ? '일시정지' : '일시정지 아님'}`
})
const recoveryStatus = computed(() => {
  if (state.value.recovery?.running || state.value.monitor?.phase === 'recovering') return '요청됨'
  if (['blocked', 'cooldown'].includes(state.value.monitor?.phase) || state.value.recovery?.configured === false) return '보류'
  return '요청 없음'
})
const lastRecoveryRequest = computed(() => {
  const event = (state.value.events || []).find(item => ['recovery', 'recovery-blocked', 'recovered'].includes(item.type))
  return event?.time ? formatTime(event.time) : '—'
})
const maneuverText = computed(() => {
  const maneuver = state.value.maneuver
  if (!maneuver) return '진행 중인 변경 없음'
  const direction = maneuver.direction === 'left' ? '왼쪽' : maneuver.direction === 'right' ? '오른쪽' : '차선'
  return `${direction} 변경 중 · ${formatNumber(maneuver.elapsed, 1, '0.0')}초`
})
const frameStatus = computed(() => state.value.capture?.available
  ? `1초 간격 · ${state.value.capture.width || '—'}×${state.value.capture.height || '—'}`
  : state.value.capture?.reason || '게임 화면 연결 대기')
const simulatorSrc = computed(() => `${publicBase}ets2-sim/index.html`)

function formatNumber(value, fraction = 0, fallback = '—') {
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(fraction) : fallback
}

function kmh(value, fraction = 0) {
  const number = Number(value)
  if (!connected.value || !Number.isFinite(number)) return '—'
  return `${(number * 3.6).toFixed(fraction)} km/h`
}

function percent(value) {
  const number = Number(value)
  return connected.value && Number.isFinite(number) ? `${Math.round(number * 100)}%` : '—'
}

function distance(value) {
  const number = Number(value)
  return connected.value && Number.isFinite(number) && number > 0 ? `${(number / 1000).toFixed(1)} km` : '—'
}

function formatTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('ko-KR', { hour12: false })
}

function pushActivity(entry) {
  const key = `${entry.id || ''}:${entry.time || ''}:${entry.message || ''}`
  const next = [{ ...entry, key }, ...activity.value.filter(item => item.key !== key)]
  activity.value = next.slice(0, 20)
}

function mergeState(next) {
  const previous = state.value
  state.value = next
  for (const event of [...(next.events || [])].reverse()) pushActivity(event)
  const changes = [
    previous.armed !== next.armed ? `명령 준비 ${next.armed ? '활성' : '해제'}` : '',
    previous.monitor?.enabled !== next.monitor?.enabled ? `정체 감시 ${next.monitor?.enabled ? '시작' : '중단'}` : '',
    Boolean(previous.maneuver) !== Boolean(next.maneuver) ? `차선 변경 ${next.maneuver ? '시작' : '종료'}` : ''
  ].filter(Boolean)
  for (const text of changes) pushActivity({ time: new Date().toISOString(), message: text, type: 'state' })
}

function preloadFrame(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(src)
    image.onerror = () => reject(new Error('frame-load-failed'))
    image.src = src
  })
}

async function refreshFrame(capture) {
  if (!capture?.available || capture.id === displayedFrameId.value || frameLoading.value) return
  frameLoading.value = true
  const candidate = `${apiBase}/api/frame.jpg?id=${encodeURIComponent(capture.id)}`
  try {
    await preloadFrame(candidate)
    if (!active) return
    displayedFrame.value = candidate
    displayedFrameId.value = capture.id
  } catch {
    frameMessage.value = '게임 화면을 다시 연결하고 있습니다.'
  } finally {
    frameLoading.value = false
  }
}

async function poll() {
  if (!active || props.staticMode || loading.value) return
  loading.value = true
  try {
    const response = await fetch(`${apiBase}/api/state`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`state-${response.status}`)
    const next = await response.json()
    serverAvailable.value = true
    mergeState(next)
    await refreshFrame(next.capture)
  } catch {
    serverAvailable.value = false
  } finally {
    loading.value = false
    if (active) pollTimer = window.setTimeout(poll, 1000)
  }
}

async function sendAction(action, extra = {}) {
  if (props.staticMode || !state.value.token) return
  const scope = actionScope(action)
  const label = actionLabel(action)
  actionFeedback.value = { scope, tone: 'pending', text: `${label} 요청 중` }
  try {
    const response = await fetch(`${apiBase}/api/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Poc-Token': state.value.token
      },
      body: JSON.stringify({ action, ...extra })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || '요청 실패')
    pushActivity({ time: new Date().toISOString(), message: label, type: 'client' })
    actionFeedback.value = { scope, tone: 'success', text: `${label} 완료` }
    window.clearTimeout(pollTimer)
    await poll()
  } catch (error) {
    actionFeedback.value = { scope, tone: 'error', text: `${label} 실패 · ${error.message || 'PoC 요청을 보내지 못했습니다.'}` }
  }
}

function actionScope(action) {
  if (['monitorStart', 'monitorStop', 'recoveryNow'].includes(action)) return 'monitor'
  if (action === 'laneChange') return 'lane'
  return 'control'
}

function actionLabel(action) {
  return ({
    arm: '명령 준비 요청', stop: '커스텀 제어 중단', cruise: 'ACC 설정/해제',
    minus: '크루즈 −5 km/h', plus: '크루즈 +5 km/h', laneToggle: '차선유지 토글',
    monitorStart: '정체 감시 시작', monitorStop: '정체 감시 중단', recoveryNow: '견인 입력 시험 요청'
  })[action] || action
}

function requestLaneChange(direction) {
  if (!laneReady.value) return
  void sendAction('laneChange', { direction, clearRoad: true, laneAssistOff: true, widthM: 3.6 })
}

function openRecoveryDialog() {
  recoveryDialog.value?.showModal()
}

function confirmRecovery() {
  recoveryDialog.value?.close()
  void sendAction('recoveryNow')
}

onMounted(() => {
  if (!props.staticMode) void poll()
})

watch(connected, (isConnected) => {
  if (isConnected) return
  clearRoad.value = false
  laneAssistOff.value = false
})

onBeforeUnmount(() => {
  active = false
  window.clearTimeout(pollTimer)
})
</script>

<template>
  <section class="ets2-dev-page" :class="{ 'is-static-preview': staticMode }">
    <p v-if="staticMode" class="ets2-dev-static-toast" role="status">개발자 페이지 · 로컬 전용</p>

    <div class="ets2-dev-content" :inert="staticMode ? '' : null" :aria-disabled="staticMode ? 'true' : undefined">
      <header class="ets2-dev-head">
        <div>
          <p class="eyebrow">실험선 S · 보호 구역</p>
          <h1>유로트럭 개발자</h1>
        </div>
        <p class="ets2-dev-connection" :class="{ connected }">{{ connectionText }}</p>
      </header>

      <dl class="ets2-dev-telemetry" aria-label="주행 정보">
        <div><dt>속도</dt><dd>{{ kmh(telemetry.speedMps, 1) }}</dd></div>
        <div><dt>크루즈</dt><dd>{{ kmh(telemetry.cruiseMps) }}</dd></div>
        <div><dt>제한</dt><dd>{{ kmh(telemetry.speedLimitMps) }}</dd></div>
        <div><dt>목적지</dt><dd>{{ distance(telemetry.routeDistanceM) }}</dd></div>
        <div><dt>조향 입력</dt><dd>{{ percent(telemetry.inputSteer) }}</dd></div>
        <div><dt>브레이크</dt><dd>{{ percent(telemetry.inputBrake) }}</dd></div>
      </dl>

      <section class="ets2-dev-watch" aria-labelledby="ets2-dev-watch-title">
        <div class="ets2-dev-section-head">
          <h2 id="ets2-dev-watch-title">실시간 화면</h2>
          <span>{{ frameStatus }}</span>
        </div>
        <div class="ets2-dev-frame">
          <img v-if="displayedFrame" :src="displayedFrame" alt="ETS2 창의 최신 화면" />
          <p v-else>게임 화면을 기다리고 있습니다.</p>
        </div>
        <p v-if="frameMessage" class="ets2-dev-message" role="alert">{{ frameMessage }}</p>
      </section>

      <div class="ets2-dev-layout">
        <div class="ets2-dev-controls">
          <section class="ets2-dev-control-group" aria-labelledby="monitor-title">
            <div class="ets2-dev-section-head"><h2 id="monitor-title">정체 감시</h2><span>{{ state.monitor?.reason || '감시 대기' }}</span></div>
            <dl class="ets2-dev-read-row">
              <div><dt>저속 지속</dt><dd>{{ state.monitor?.lowSpeedSeconds || 0 }}초 / {{ state.monitor?.thresholdSeconds || 120 }}초</dd></div>
              <div><dt>복구</dt><dd>{{ recoveryStatus }}</dd></div>
              <div><dt>마지막 요청</dt><dd>{{ lastRecoveryRequest }}</dd></div>
            </dl>
            <div class="ets2-dev-button-row">
              <button type="button" :disabled="!serverAvailable || state.monitor?.enabled" @click="sendAction('monitorStart')">감시 시작</button>
              <button type="button" :disabled="!serverAvailable || !state.monitor?.enabled" @click="sendAction('monitorStop')">감시 중단</button>
              <button type="button" class="ets2-dev-danger" :disabled="!connected || Math.abs(speedKmhValue) >= 1 || state.recovery?.running" @click="openRecoveryDialog">견인 서비스 입력 시험</button>
            </div>
            <p
              v-if="actionFeedback.scope === 'monitor'"
              class="ets2-dev-action-feedback"
              :data-tone="actionFeedback.tone"
              :role="actionFeedback.tone === 'error' ? 'alert' : 'status'"
            >{{ actionFeedback.text }}</p>
          </section>

          <section class="ets2-dev-control-group" aria-labelledby="game-controls-title">
            <div class="ets2-dev-section-head"><h2 id="game-controls-title">실제 게임 제어</h2><span>{{ state.reason || '로컬 제어 대기' }}</span></div>
            <div class="ets2-dev-button-row">
              <button type="button" class="ets2-dev-primary" :disabled="!connected || armed" @click="sendAction('arm')">명령 준비</button>
              <button type="button" :disabled="!controlReady" @click="sendAction('cruise')">ACC 설정/해제</button>
              <button type="button" :disabled="!controlReady" @click="sendAction('minus')">−5 km/h</button>
              <button type="button" :disabled="!plusReady" @click="sendAction('plus')">+5 km/h</button>
              <button type="button" :disabled="!controlReady" @click="sendAction('laneToggle')">차선유지 토글</button>
              <button type="button" class="ets2-dev-danger" @click="sendAction('stop')">커스텀 제어 중단</button>
            </div>
            <p
              v-if="actionFeedback.scope === 'control'"
              class="ets2-dev-action-feedback"
              :data-tone="actionFeedback.tone"
              :role="actionFeedback.tone === 'error' ? 'alert' : 'status'"
            >{{ actionFeedback.text }}</p>
            <p class="ets2-dev-reason">{{ controlReason }}</p>
          </section>

          <section class="ets2-dev-control-group" aria-labelledby="lane-title">
            <div class="ets2-dev-section-head"><h2 id="lane-title">차선 변경</h2><span>{{ maneuverText }}</span></div>
            <label><input v-model="clearRoad" type="checkbox" :disabled="!controlReady" /> 빈 도로 확인</label>
            <label><input v-model="laneAssistOff" type="checkbox" :disabled="!controlReady" /> 내장 차선유지 껐음</label>
            <div class="ets2-dev-button-row">
              <button type="button" :disabled="!laneReady" @click="requestLaneChange('left')">← 왼쪽</button>
              <button type="button" :disabled="!laneReady" @click="requestLaneChange('right')">오른쪽 →</button>
            </div>
            <p
              v-if="actionFeedback.scope === 'lane'"
              class="ets2-dev-action-feedback"
              :data-tone="actionFeedback.tone"
              :role="actionFeedback.tone === 'error' ? 'alert' : 'status'"
            >{{ actionFeedback.text }}</p>
            <p class="ets2-dev-reason">{{ laneReason }}</p>
          </section>
        </div>

        <aside class="ets2-dev-events" aria-labelledby="events-title">
          <div class="ets2-dev-section-head"><h2 id="events-title">최근 이벤트</h2><span>최대 20줄</span></div>
          <ol>
            <li v-if="activity.length === 0">아직 기록이 없습니다.</li>
            <li v-for="event in activity" v-else :key="event.key"><time>{{ formatTime(event.time) }}</time>{{ event.message }}</li>
          </ol>
        </aside>
      </div>

      <details class="ets2-dev-simulator" @toggle="simulatorOpen = $event.currentTarget.open">
        <summary>02 시뮬레이션 <span>정적 · 게임 명령 없음</span></summary>
        <iframe v-if="simulatorOpen" :src="simulatorSrc" title="유로트럭 정적 주행 시뮬레이터" loading="lazy"></iframe>
      </details>

      <dl class="ets2-dev-settings" aria-label="로컬 설정">
        <div><dt>리미터 모드</dt><dd>ets2_speed_limit_110.scs</dd></div>
        <div><dt>현재 제한</dt><dd>{{ kmh(telemetry.speedLimitMps) }}</dd></div>
        <div><dt>접속 허용</dt><dd>POC_ALLOWED_ORIGINS에 이 개발 주소를 추가하세요.</dd></div>
      </dl>

    </div>

    <dialog ref="recoveryDialog" class="ets2-dev-dialog" aria-labelledby="ets2-recovery-dialog-title">
      <h2 id="ets2-recovery-dialog-title">견인 서비스 입력을 시험할까요?</h2>
      <p>게임이 연결되고 속도가 1 km/h 미만인지 다시 확인하세요. 실제 입력 어댑터가 구성된 경우 견인·수리 메뉴를 조작할 수 있습니다.</p>
      <div class="ets2-dev-button-row">
        <button type="button" @click="recoveryDialog.close()">취소</button>
        <button type="button" class="ets2-dev-danger" @click="confirmRecovery">시험 요청</button>
      </div>
    </dialog>
  </section>
</template>
