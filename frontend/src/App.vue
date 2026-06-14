<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const splash = ref(true)
const loading = ref(true)
const activeTicker = ref(0)
const services = ref([])
const tickets = ref([])
const health = ref(null)
const selectedServiceId = ref('elevator-service')
const elevatorState = ref(null)
const elevatorBusy = ref(false)
const elevatorNotice = ref('')

const fallbackServices = [
  {
    id: 'elevator-service',
    name: 'Elevator Service',
    description: 'A small elevator simulator station for the v0.3.0 preview loop.',
    routePrefix: '/api/services/elevator-service',
    node: 'ion2',
    loadProfile: 'light'
  },
  {
    id: 'sample-spring-service',
    name: 'Sample Spring Service',
    description: 'The companion Spring service that proves the gateway can coordinate more than one service.',
    routePrefix: '/api/services/sample-spring-service',
    node: 'ion2',
    loadProfile: 'light'
  }
]

const fallbackTickets = [
  {
    id: 'T-1032',
    type: 'job.ticket.create',
    status: 'queued',
    targetNode: 'ion2',
    summary: 'Poke the friend list before they turn into legends'
  },
  {
    id: 'T-1031',
    type: 'job.llm.draft',
    status: 'waiting_llm',
    targetNode: 'rtx5070',
    summary: 'Draft the next code change when the GPU comes back'
  },
  {
    id: 'T-1030',
    type: 'job.ops.report',
    status: 'running',
    targetNode: 'ion2',
    summary: 'Build the current platform health snapshot'
  }
]

const tickerLines = [
  '연락 안 한 친구들 연락 돌리는 중...',
  '배포는 줄 섰고 로그는 아직 묵묵부답...',
  '버그가 도망가면 코드는 잠깐 숨 고르기...',
  'CPU는 바쁘고 마음은 더 바쁨...',
  '레거시가 말을 걸면 일단 예의부터...',
  '오늘도 플랫폼은 승차감부터 챙기는 중...'
]

const splashClock = computed(() => {
  const now = new Date()
  return now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
})

const activeFlap = computed(() => tickerLines[activeTicker.value])
const selectedService = computed(() => services.value.find((service) => service.id === selectedServiceId.value) ?? services.value[0])
const elevatorFloors = computed(() => elevatorState.value?.targetFloors ?? [1, 3, 5, 7, 9])
const elevatorRoute = computed(() => services.value.find((service) => service.id === 'elevator-service')?.routePrefix ?? '/api/services/elevator-service')
const elevatorQueue = computed(() => elevatorState.value?.queue ?? [])

let splashTimer
let tickerTimer

function normalizeService(service) {
  return {
    id: service.id ?? service.serviceId ?? service.name,
    name: service.name ?? service.displayName ?? service.id,
    description: service.description ?? service.summary ?? '',
    routePrefix: service.routePrefix ?? service.route ?? `/api/services/${service.id}`,
    node: service.node ?? service.targetNode ?? 'ion2',
    loadProfile: service.loadProfile ?? service.intensity ?? 'light'
  }
}

function normalizeTicket(ticket) {
  return {
    id: ticket.id ?? ticket.ticketId ?? 'unknown',
    type: ticket.type ?? 'job.ticket',
    status: ticket.status ?? 'queued',
    targetNode: ticket.targetNode ?? 'ion2',
    summary: ticket.summary ?? ticket.message ?? 'Pending ticket'
  }
}

async function loadServices() {
  try {
    const response = await fetch('/api/services')
    if (!response.ok) throw new Error('services fetch failed')
    const payload = await response.json()
    const list = Array.isArray(payload) ? payload : payload.services ?? []
    services.value = list.length ? list.map(normalizeService) : fallbackServices
  } catch {
    services.value = fallbackServices
  }
}

async function loadTickets() {
  try {
    const response = await fetch('/api/tickets')
    if (!response.ok) throw new Error('tickets fetch failed')
    const payload = await response.json()
    const list = Array.isArray(payload) ? payload : payload.tickets ?? []
    tickets.value = list.length ? list.map(normalizeTicket) : fallbackTickets
  } catch {
    tickets.value = fallbackTickets
  }
}

async function loadHealth() {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) throw new Error('health fetch failed')
    health.value = await response.json()
  } catch {
    health.value = {
      status: 'degraded',
      components: {
        gateway: 'local',
        redis: 'planned',
        ollama: 'unavailable'
      }
    }
  }
}

async function loadElevatorState() {
  try {
    const response = await fetch(`${elevatorRoute.value}/api/state`)
    if (!response.ok) throw new Error('elevator state fetch failed')
    elevatorState.value = await response.json()
  } catch {
    elevatorState.value = {
      service: 'elevator-service',
      currentFloor: 7,
      targetFloors: [1, 3, 5, 7, 9],
      mode: 'local-mock',
      direction: 'idle',
      queue: [],
      lastCommand: 'fallback'
    }
  }
}

function setMockDirection(state) {
  const queue = state.queue ?? []
  if (!queue.length) {
    return 'idle'
  }
  if (queue[0] > state.currentFloor) {
    return 'up'
  }
  if (queue[0] < state.currentFloor) {
    return 'down'
  }
  return 'idle'
}

function updateMockState(command, floor) {
  const base = elevatorState.value ?? {
    service: 'elevator-service',
    currentFloor: 7,
    targetFloors: [1, 3, 5, 7, 9],
    queue: []
  }
  const next = {
    ...base,
    mode: 'local-mock',
    queue: [...(base.queue ?? [])],
    lastCommand: command
  }

  if (command === 'call' && floor !== next.currentFloor && !next.queue.includes(floor)) {
    next.queue.push(floor)
    next.lastCommand = `mock-call:${floor}`
  }

  if (command === 'step' && next.queue.length) {
    const target = next.queue[0]
    if (target > next.currentFloor) next.currentFloor += 1
    if (target < next.currentFloor) next.currentFloor -= 1
    if (target === next.currentFloor) {
      next.queue.shift()
      next.lastCommand = `mock-arrived:${target}`
    } else {
      next.lastCommand = 'mock-step'
    }
  }

  if (command === 'reset') {
    next.currentFloor = 7
    next.queue = []
    next.lastCommand = 'mock-reset'
  }

  next.direction = setMockDirection(next)
  elevatorState.value = next
}

async function sendElevatorCommand(path, payload, fallbackCommand, floor) {
  elevatorBusy.value = true
  elevatorNotice.value = ''
  try {
    const response = await fetch(`${elevatorRoute.value}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {})
    })
    if (!response.ok) throw new Error('elevator command failed')
    elevatorState.value = await response.json()
    elevatorNotice.value = 'service command accepted'
  } catch {
    updateMockState(fallbackCommand, floor)
    elevatorNotice.value = 'gateway/service unavailable, updated local mock state'
  } finally {
    elevatorBusy.value = false
  }
}

function callElevator(floor) {
  sendElevatorCommand('/api/call', { floor }, 'call', floor)
}

function stepElevator() {
  sendElevatorCommand('/api/step', {}, 'step')
}

function resetElevator() {
  sendElevatorCommand('/api/reset', {}, 'reset')
}

async function boot() {
  loading.value = true
  await Promise.all([loadServices(), loadTickets(), loadHealth()])
  await loadElevatorState()
  loading.value = false
}

function openService(service) {
  selectedServiceId.value = service.id
  if (service.id === 'elevator-service') {
    loadElevatorState()
  }
}

onMounted(() => {
  boot()
  tickerTimer = window.setInterval(() => {
    activeTicker.value = (activeTicker.value + 1) % tickerLines.length
  }, 1800)

  splashTimer = window.setTimeout(() => {
    splash.value = false
  }, 10000)
})

onBeforeUnmount(() => {
  window.clearTimeout(splashTimer)
  window.clearInterval(tickerTimer)
})

const railStations = computed(() => services.value.map((service, index) => ({
  ...service,
  left: services.value.length > 1 ? `${(index / (services.value.length - 1)) * 100}%` : '50%'
})))
</script>

<template>
  <div class="app-shell">
    <transition name="fade" mode="out-in">
      <section v-if="splash" key="splash" class="splash-stage">
        <div class="splash-board">
          <div class="clock-face" aria-hidden="true">
            <div class="clock-hand hour"></div>
            <div class="clock-hand minute"></div>
            <div class="clock-center"></div>
          </div>
          <div class="splash-copy">
            <p class="eyebrow">workaround.co.kr platform</p>
            <h1>열차가 곧 도착합니다</h1>
            <p class="splash-meta">
              Frontend is warming up. Gateway is checking the tracks. Heavy jobs will move to their own node.
            </p>
            <div class="status-chip">10 second station hold</div>
          </div>
          <div class="arrival-panel">
            <div class="arrival-label">이번 열차</div>
            <div class="arrival-value">Platform control room</div>
            <div class="arrival-label">다음 열차</div>
            <div class="arrival-value">service stations online</div>
            <div class="arrival-label">현재 시각</div>
            <div class="arrival-value">{{ splashClock }}</div>
          </div>
        </div>

        <div class="flap-strip" aria-live="polite">
          <span class="flap-item">{{ activeFlap }}</span>
        </div>
      </section>

      <main v-else key="main" class="main-stage">
        <header class="topbar">
          <div>
            <p class="eyebrow">station control room</p>
            <h2>Personal Platform</h2>
          </div>
          <div class="health-capsules">
            <span class="capsule" :class="health?.status || 'unknown'">{{ health?.status || 'unknown' }}</span>
            <span class="capsule">gateway</span>
            <span class="capsule">redis</span>
            <span class="capsule">ollama</span>
          </div>
        </header>

        <section class="tile-grid">
          <article v-for="service in services" :key="service.id" class="service-tile" :class="service.loadProfile">
            <div class="tile-head">
              <span class="tile-route">{{ service.routePrefix }}</span>
              <span class="tile-node">{{ service.node }}</span>
            </div>
            <h3>{{ service.name }}</h3>
            <p>{{ service.description }}</p>
            <footer>
              <span class="tile-profile">{{ service.loadProfile }}</span>
              <button type="button" @click="openService(service)">Open station</button>
            </footer>
          </article>
        </section>

        <section class="elevator-panel" :class="{ active: selectedService?.id === 'elevator-service' }">
          <div class="elevator-copy">
            <p class="eyebrow">v0.3.0 simulator station</p>
            <h3>Elevator dispatch loop</h3>
            <p>
              {{ elevatorState?.service || 'elevator-service' }} is visible inside the same preview shell.
              Mode: {{ elevatorState?.mode || 'simulated' }}.
            </p>
          </div>
          <div class="elevator-shaft" aria-label="Elevator simulator state">
            <div
              v-for="floor in elevatorFloors"
              :key="floor"
              class="floor-stop"
              :class="{ current: floor === elevatorState?.currentFloor }"
            >
              <span>{{ floor }}F</span>
              <strong v-if="floor === elevatorState?.currentFloor">현재 위치</strong>
            </div>
          </div>
          <div class="elevator-status">
            <span>route {{ elevatorRoute }}/api/state</span>
            <span>floor {{ elevatorState?.currentFloor ?? 'unknown' }}</span>
            <span>direction {{ elevatorState?.direction || 'idle' }}</span>
            <span>queue {{ elevatorQueue.length ? elevatorQueue.join('F, ') + 'F' : 'empty' }}</span>
            <span>last {{ elevatorState?.lastCommand || 'none' }}</span>
            <div class="elevator-controls" aria-label="Elevator simulator controls">
              <button
                v-for="floor in elevatorFloors"
                :key="`call-${floor}`"
                type="button"
                :disabled="elevatorBusy"
                @click="callElevator(floor)"
              >
                Call {{ floor }}F
              </button>
            </div>
            <div class="elevator-actions">
              <button type="button" :disabled="elevatorBusy" @click="stepElevator">Step</button>
              <button type="button" :disabled="elevatorBusy" @click="resetElevator">Reset</button>
            </div>
            <button type="button" @click="loadElevatorState">Refresh state</button>
            <small v-if="elevatorNotice">{{ elevatorNotice }}</small>
          </div>
        </section>

        <section class="ticket-panel">
          <div class="panel-head">
            <h3>Recent tickets</h3>
            <span class="panel-note">Typed jobs from the gateway</span>
          </div>
          <ul class="ticket-list">
            <li v-for="ticket in tickets" :key="ticket.id" class="ticket-row">
              <span class="ticket-id">{{ ticket.id }}</span>
              <span class="ticket-type">{{ ticket.type }}</span>
              <span class="ticket-summary">{{ ticket.summary }}</span>
              <span class="ticket-status" :class="ticket.status">{{ ticket.status }}</span>
              <span class="ticket-node">{{ ticket.targetNode }}</span>
            </li>
          </ul>
        </section>

        <section class="rail-shell">
          <div class="rail-head">
            <h3>Route map</h3>
            <span>Heavy services get offloaded to their own node</span>
          </div>
          <div class="rail-track">
            <div v-for="station in railStations" :key="station.id" class="station-pin" :style="{ left: station.left }">
              <span class="station-label">{{ station.name }}</span>
              <span class="station-node">{{ station.node }}</span>
            </div>
            <div class="train-marker" aria-hidden="true">🚆</div>
          </div>
        </section>
      </main>
    </transition>
  </div>
</template>
