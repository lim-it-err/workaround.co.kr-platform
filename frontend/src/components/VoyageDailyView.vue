<script setup>
import { computed, nextTick, ref } from 'vue'
import StationHeader from './StationHeader.vue'
import VoyageDaySession from './voyage/VoyageDaySession.vue'
import { VOYAGE } from '../data/voyage.js'

defineEmits(['back', 'exit', 'open-archive'])

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${value}T00:00:00`))
}

function formatDrive(minutes) {
  if (minutes < 60) {
    return `${minutes}분`
  }
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`
}

const todayIndex = VOYAGE.days.findIndex((day) => day.date === localDateKey())
const guideStatus = todayIndex >= 0 ? '오늘 운행' : '일정 미리보기'
const selectedIndex = ref(todayIndex >= 0 ? todayIndex : 0)
const activeSession = ref(null)
const savedScrollTop = ref(0)
const selectedDay = computed(() => VOYAGE.days[selectedIndex.value])
const selectedSession = computed(() => VOYAGE.daySessions.find((session) => session.dayIndex === selectedIndex.value))
const hasDrive = computed(() => selectedDay.value.driveMin > 0)
const driveRule = VOYAGE.principles.find((principle) => principle.key === 'drive')?.text || ''
const daySegments = computed(() => [
  { key: 'am', label: '오전', value: selectedDay.value.am },
  { key: 'pm', label: '오후', value: selectedDay.value.pm },
  { key: 'eve', label: '저녁', value: selectedDay.value.eve }
])

function selectDay(index) {
  if (index >= 0 && index < VOYAGE.days.length) {
    selectedIndex.value = index
  }
}

async function openSession() {
  if (!selectedSession.value) return
  const scroller = document.querySelector('.page-scroller')
  savedScrollTop.value = scroller?.scrollTop || window.scrollY || 0
  activeSession.value = selectedSession.value
  await nextTick()
  scroller?.scrollTo({ top: 0 })
}

async function closeSession() {
  const restoreTop = savedScrollTop.value
  activeSession.value = null
  await nextTick()
  const scroller = document.querySelector('.page-scroller')
  if (scroller) {
    scroller.scrollTo({ top: restoreTop })
  } else {
    window.scrollTo({ top: restoreTop })
  }
}
</script>

<template>
  <VoyageDaySession
    v-if="activeSession"
    :session="activeSession"
    :day-number="activeSession.dayIndex + 1"
    @back="closeSession"
    @exit="$emit('exit')"
  />
  <section v-else class="feature-shell line-v voyage-daily">
    <StationHeader
      line-class="line-v"
      station-code="V02"
      title="오늘의 여행 지침서"
      title-en="DAILY GUIDE"
      :status="guideStatus"
      status-tone="ok"
      summary="오전 · 오후 · 저녁"
      @exit="$emit('exit')"
    >
      <template #actions>
        <button type="button" class="btn btn-ghost" @click="$emit('back')">여행 준비</button>
        <button type="button" class="btn btn-ghost" @click="$emit('open-archive')">여행 기록</button>
      </template>
    </StationHeader>

    <section class="section-block voyage-day-board" aria-labelledby="voyage-day-title" aria-live="polite">
      <div class="voyage-day-heading">
        <div>
          <p class="eyebrow">DAY {{ selectedIndex + 1 }}</p>
          <h3 id="voyage-day-title">{{ selectedDay.city }}</h3>
          <p>{{ formatDate(selectedDay.date) }} · {{ selectedDay.dow }}요일 · {{ selectedDay.stay }} 숙박</p>
        </div>
        <div class="voyage-day-controls" aria-label="날짜 이동">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="selectedIndex === 0"
            @click="selectDay(selectedIndex - 1)"
          >
            전날
          </button>
          <strong class="num">{{ selectedIndex + 1 }}/{{ VOYAGE.days.length }}</strong>
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="selectedIndex === VOYAGE.days.length - 1"
            @click="selectDay(selectedIndex + 1)"
          >
            다음날
          </button>
        </div>
      </div>

      <ol class="voyage-day-strip" aria-label="전체 일정">
        <li v-for="(day, index) in VOYAGE.days" :key="day.date">
          <button
            type="button"
            :class="{ active: index === selectedIndex, today: index === todayIndex }"
            :aria-label="`${index + 1}일차 ${formatDate(day.date)} ${day.city}`"
            :aria-current="index === selectedIndex ? 'date' : undefined"
            @click="selectDay(index)"
          >
            <span aria-hidden="true"></span>
            <small>{{ index + 1 }}</small>
          </button>
        </li>
      </ol>

      <button
        v-if="selectedSession"
        type="button"
        class="voyage-session-entry"
        @click="openSession"
      >
        <span>
          <small>FIELD SESSION</small>
          <strong>{{ selectedIndex + 1 }}일차 상세 세션 열기</strong>
        </span>
        <span aria-hidden="true">→</span>
      </button>
    </section>

    <section
      class="voyage-drive-status"
      :class="{ resting: !hasDrive }"
      :aria-label="hasDrive ? '운전 일정' : '운전 없는 날'"
    >
      <div class="voyage-drive-badge">
        <span aria-hidden="true">{{ hasDrive ? '↗' : '○' }}</span>
        <div>
          <small>{{ hasDrive ? '오늘의 운전' : 'DRIVE FREE' }}</small>
          <strong>{{ hasDrive ? formatDrive(selectedDay.driveMin) : '운전 없는 날' }}</strong>
        </div>
      </div>
      <p v-if="hasDrive">{{ driveRule }}</p>
      <p v-else>이동은 대중교통과 도보로 이어갑니다.</p>
    </section>

    <section class="voyage-segment-grid" aria-label="오늘 일정">
      <article v-for="segment in daySegments" :key="segment.key" class="section-block voyage-segment-card">
        <div class="voyage-segment-label">
          <span aria-hidden="true"></span>
          <strong>{{ segment.label }}</strong>
        </div>
        <p>{{ segment.value }}</p>
      </article>
    </section>

    <aside v-if="selectedDay.tip" class="section-block voyage-tip" aria-labelledby="voyage-tip-title">
      <p class="eyebrow">TODAY'S TIP</p>
      <h3 id="voyage-tip-title">오늘 기억할 것</h3>
      <p>{{ selectedDay.tip }}</p>
    </aside>
  </section>
</template>

<style scoped>
.voyage-daily,
.voyage-daily > * {
  min-width: 0;
}

.voyage-day-board {
  display: grid;
  gap: 20px;
  box-shadow: inset 0 4px 0 var(--accent);
}

.voyage-day-heading {
  display: grid;
  gap: 18px;
}

.voyage-day-heading h3 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.5rem, 6vw, 2.4rem);
  overflow-wrap: anywhere;
}

.voyage-day-heading p:not(.eyebrow) {
  margin: 6px 0 0;
  color: var(--text-2);
}

.voyage-day-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
}

.voyage-day-controls button:last-child {
  justify-self: end;
}

.voyage-day-controls button:disabled {
  cursor: default;
  opacity: 0.38;
}

.voyage-day-strip {
  display: grid;
  grid-template-columns: repeat(11, minmax(0, 1fr));
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.voyage-day-strip button {
  display: grid;
  justify-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
  padding: 6px 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.voyage-day-strip button > span {
  width: 10px;
  height: 10px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  background: var(--panel);
}

.voyage-day-strip button.active {
  color: var(--text);
  font-weight: 800;
}

.voyage-day-strip button.active > span {
  background: var(--accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 20%, transparent);
  animation: voyage-day-pulse 1.8s ease-out infinite;
}

.voyage-day-strip button.today > span {
  outline: 2px solid var(--safety);
  outline-offset: 3px;
}

.voyage-session-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--line));
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 9%, var(--panel-2));
  color: var(--accent-text);
  text-align: left;
  cursor: pointer;
}

.voyage-session-entry > span:first-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.voyage-session-entry small {
  color: var(--muted);
  font-size: var(--fs-caption);
  letter-spacing: 0.08em;
}

.voyage-session-entry strong {
  overflow-wrap: anywhere;
}

.voyage-drive-status {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--line));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--accent) 12%, var(--panel));
}

.voyage-drive-status.resting {
  border-color: color-mix(in srgb, var(--exit) 55%, var(--line));
  background: color-mix(in srgb, var(--exit) 10%, var(--panel));
}

.voyage-drive-badge {
  display: flex;
  align-items: center;
  gap: 12px;
}

.voyage-drive-badge > span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 1.15rem;
  font-weight: 900;
}

.voyage-drive-status.resting .voyage-drive-badge > span {
  background: var(--exit);
}

.voyage-drive-badge div {
  display: grid;
  gap: 2px;
}

.voyage-drive-badge small {
  color: var(--muted);
  font-size: var(--fs-caption);
  letter-spacing: 0.08em;
}

.voyage-drive-badge strong {
  color: var(--text);
  font-size: 1.15rem;
}

.voyage-drive-status p {
  margin: 0;
  color: var(--text-2);
  font-size: 0.84rem;
}

.voyage-segment-grid {
  display: grid;
  gap: 12px;
}

.voyage-segment-card {
  display: grid;
  align-content: start;
  gap: 14px;
  min-height: 150px;
}

.voyage-segment-label {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--accent-text);
}

.voyage-segment-label span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
}

.voyage-segment-card p,
.voyage-tip > p:last-child {
  margin: 0;
  color: var(--text-2);
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.voyage-tip {
  border-left: 4px solid var(--safety);
}

.voyage-tip h3 {
  margin: 0 0 10px;
  color: var(--text);
  font-size: 1.05rem;
}

@keyframes voyage-day-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 38%, transparent); }
  70%, 100% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 0%, transparent); }
}

@media (min-width: 761px) {
  .voyage-day-heading {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .voyage-day-controls {
    min-width: 280px;
  }

  .voyage-drive-status {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .voyage-drive-status p {
    justify-self: end;
  }

  .voyage-segment-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .voyage-day-strip button.active > span {
    animation: none;
  }
}
</style>
