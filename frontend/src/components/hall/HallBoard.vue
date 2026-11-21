<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BOOT_AFTER_MS,
  BOOT_LINE_MS,
  BOOT_LOG,
  HALL_LINES,
  HALL_ROWS,
  resolveHallTarget,
  takeBootLog
} from '../../data/hallBoard.js'
import { withBasePath } from '../../staticRouting.js'

// TKT-219 (D-036): 기본 보기의 환승 홀 — 첫 방문엔 부팅 로그(줄당 90ms)가 흐른 뒤 출발 안내판,
// 재방문·모션 줄이기엔 안내판부터. 로그 중 클릭·탭·키 입력이면 바로 안내판.
const props = defineProps({
  disabledPages: { type: Array, default: () => [] }
})

const emit = defineEmits(['open', 'notice'])

const reducedMotion = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const playingLog = takeBootLog({ reducedMotion })
const phase = ref(playingLog ? 'log' : 'board')
const shownLines = ref(0)
const cameFromLog = ref(false)
let timers = []

function two(value) {
  return String(value).padStart(2, '0')
}
const now = new Date()
const stamp = `${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}:${two(now.getMinutes())}`

function clearTimers() {
  timers.forEach(window.clearTimeout)
  timers = []
}

function removeSkipListeners() {
  window.removeEventListener('pointerdown', finishLog, true)
  window.removeEventListener('keydown', finishLog, true)
}

function finishLog() {
  clearTimers()
  removeSkipListeners()
  if (phase.value === 'log') {
    cameFromLog.value = true
    phase.value = 'board'
  }
}

onMounted(() => {
  if (phase.value !== 'log') return
  BOOT_LOG.forEach((_, index) => {
    timers.push(window.setTimeout(() => { shownLines.value = index + 1 }, index * BOOT_LINE_MS))
  })
  timers.push(window.setTimeout(finishLog, BOOT_LOG.length * BOOT_LINE_MS + BOOT_AFTER_MS))
  window.addEventListener('pointerdown', finishLog, true)
  window.addEventListener('keydown', finishLog, true)
})

onBeforeUnmount(() => {
  clearTimers()
  removeSkipListeners()
})

function entryHref(row) {
  return row.entryPath ? withBasePath(row.entryPath, import.meta.env.BASE_URL) : undefined
}

function press(row) {
  const action = resolveHallTarget(row, props.disabledPages)
  if (action.type === 'notice') emit('notice', action.message)
  else if (action.type === 'open') emit('open', action.page)
}
</script>

<template>
  <section class="junction-overview hall" aria-label="환승 홀" data-hall="board" :data-phase="phase">
    <div v-if="phase === 'log'" class="hall-screen hall-log" data-hall-log>
      <p class="hall-sr" role="status">환승 홀을 여는 중입니다</p>
      <pre aria-hidden="true"><template v-for="(entry, index) in BOOT_LOG.slice(0, shownLines)" :key="index"><span :class="entry.tone ? `t-${entry.tone}` : undefined">{{ entry.text }}<template v-if="entry.line"> <span :class="`t-${HALL_LINES[entry.line].tone}`">{{ HALL_LINES[entry.line].name }}</span> {{ entry.rest }}</template><template v-if="entry.status"> <span :class="`t-${entry.statusTone}`">{{ entry.status }}</span></template></span>
</template></pre>
    </div>

    <div v-else class="hall-screen hall-board" :class="{ 'hall-fade': cameFromLog }" data-hall-board>
      <h3 class="hall-title">환승 홀 · 출발 안내 <span class="hall-stamp">{{ stamp }}</span></h3>
      <div class="hall-head" aria-hidden="true">
        <span>노선</span><span>행선지</span><span>상태</span>
      </div>
      <ul class="hall-rows">
        <li v-for="row in HALL_ROWS" :key="row.id">
          <component
            :is="row.entryPath ? 'a' : 'button'"
            class="hall-row"
            :class="{ 'is-dim': row.tone === 'dim' }"
            :href="entryHref(row)"
            :type="row.entryPath ? undefined : 'button'"
            :data-hall-row="row.id"
            @click="row.entryPath ? undefined : press(row)"
          >
            <span class="hall-line" :class="`t-${HALL_LINES[row.line].tone}`">{{ HALL_LINES[row.line].name }}</span>
            <span class="hall-dest">{{ row.destination }}</span>
            <span class="hall-status" :class="`t-${row.tone}`">{{ row.status }}</span>
          </component>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.hall {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  width: min(100%, 720px);
}

.hall-screen {
  min-width: 0;
  max-width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono), "D2Coding", "Noto Sans Mono CJK KR", "Apple SD Gothic Neo", monospace;
  font-size: 13px;
  line-height: 1.6;
}

.hall-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.hall-log {
  min-height: 300px;
}

.hall-log pre {
  margin: 0;
  font: inherit;
  white-space: pre;
  overflow: hidden;
}

.t-d { color: var(--muted); }
.t-h { color: var(--text); font-weight: 700; }
.t-ok { color: #7ef0a8; }
.t-warn { color: var(--safety); }
.t-dim { color: var(--muted); }
.t-rec { color: var(--line-b-text); }
.t-learn { color: var(--line-r-text); }
.t-play { color: var(--line-t-text); }
.t-life { color: var(--line-w-text); }
.t-base { color: var(--line-e-text); }

.hall-title {
  margin: 0 0 10px;
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
}

.hall-stamp {
  color: var(--muted);
  font-weight: 400;
}

.hall-head,
.hall-row {
  display: grid;
  grid-template-columns: 5.2em minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
}

.hall-head {
  padding: 4px 8px;
  border-bottom: 1px solid var(--line-strong);
  color: var(--muted);
  font-size: 12.5px;
}

.hall-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.hall-row {
  box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  padding: 0 8px;
  border: 0;
  border-bottom: 1px dotted var(--line);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.hall-row:hover {
  background: var(--panel-soft);
}

.hall-row:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: -2px;
}

.hall-row.is-dim .hall-line,
.hall-row.is-dim .hall-dest {
  color: var(--muted);
}

.hall-dest {
  overflow-wrap: anywhere;
}

.hall-status {
  white-space: nowrap;
}

.hall-fade {
  animation: hall-fade-in 0.35s ease-out;
}

@keyframes hall-fade-in {
  from { opacity: 0.2; }
  to { opacity: 1; }
}

@media (max-width: 480px) {
  .hall-screen {
    padding: 12px 10px;
  }

  .hall-log pre {
    font-size: 11px;
  }

  .hall-head,
  .hall-row {
    column-gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hall-fade {
    animation: none;
  }
}
</style>
