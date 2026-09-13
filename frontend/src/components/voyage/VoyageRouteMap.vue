<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import StationHeader from '../StationHeader.vue'
import {
  ROUTE_VIEWBOX,
  buildDayTimeline,
  buildRouteSegments,
  cityDayIndexes,
  currentCityId,
  findTripDayIndex,
  projectCity,
  routeGauges,
  routeItemState
} from './voyageRoute.js'

const props = defineProps({
  voyage: { type: Object, required: true },
  initialDayIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['back', 'exit', 'select-day'])

const selectedDayIndex = ref(clampDayIndex(props.initialDayIndex))
const detail = ref(null)
const detailPanel = ref(null)
const returnFocus = ref(null)
const todayIndex = computed(() => findTripDayIndex(props.voyage))
const activeCityId = computed(() => currentCityId(props.voyage, todayIndex.value))
const selectedDay = computed(() => props.voyage.days[selectedDayIndex.value])
const selectedSession = computed(() => (
  (props.voyage.daySessions || []).find((session) => session.dayIndex === selectedDayIndex.value) || null
))
const timeline = computed(() => buildDayTimeline(props.voyage, selectedDayIndex.value))
const segments = computed(() => buildRouteSegments(props.voyage, todayIndex.value, selectedDayIndex.value))
const gauges = computed(() => routeGauges(props.voyage, todayIndex.value))
const distanceProgress = computed(() => percent(gauges.value.completedDistance, gauges.value.totalDistance))
const spendProgress = computed(() => percent(gauges.value.spent, gauges.value.budgetPlan))
const currentStatus = computed(() => {
  if (todayIndex.value < 0) return '출발 전'
  if (todayIndex.value >= props.voyage.days.length) return '운행 종료'
  return `DAY ${todayIndex.value + 1} / ${props.voyage.days.length}`
})
const projectedCities = computed(() => props.voyage.cities.map((city) => {
  const indexes = cityDayIndexes(props.voyage, city)
  const label = cityLabelPlacement(city.id)
  const current = city.id === activeCityId.value
  return {
    ...city,
    ...projectCity(city),
    indexes,
    state: current ? 'current' : routeItemState(props.voyage, indexes[0] ?? props.voyage.days.length, todayIndex.value),
    current,
    selected: indexes.includes(selectedDayIndex.value),
    label
  }
}))
const daySpendText = computed(() => {
  const total = selectedDay.value?.spend?.total
  return total ? formatWon(total) : '기록 없음'
})
const selectedDayLabel = computed(() => {
  const day = selectedDay.value
  if (!day) return ''
  return `${formatDate(day.date)} · ${day.city}`
})
const detailPhotos = computed(() => {
  if (!detail.value) return []
  if (detail.value.type === 'city') {
    return detail.value.city.indexes.flatMap((index) => props.voyage.days[index]?.photos || [])
  }
  const mealPhoto = detail.value.item.meal?.photo
  const dayPhotos = selectedDay.value?.photos || []
  return [mealPhoto, ...dayPhotos].filter(Boolean).map(normalizePhoto)
})
const cityDetail = computed(() => {
  if (detail.value?.type !== 'city') return null
  const { city } = detail.value
  const days = city.indexes.map((index) => props.voyage.days[index]).filter(Boolean)
  return {
    stays: [...new Set(days.map((day) => day.stay).filter((stay) => stay && stay !== '—' && stay !== '기내'))],
    meals: days.flatMap((day) => day.meals || []),
    mapUrl: `https://maps.google.com/?q=${encodeURIComponent(city.name)}`
  }
})

watch(() => props.initialDayIndex, (value) => {
  selectedDayIndex.value = clampDayIndex(value)
})

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))

function clampDayIndex(index) {
  return Math.min(Math.max(Number(index) || 0, 0), props.voyage.days.length - 1)
}

function selectDay(index) {
  selectedDayIndex.value = clampDayIndex(index)
  detail.value = null
  emit('select-day', selectedDayIndex.value)
}

function selectSegment(segment) {
  selectDay(segment.dayIndex)
  nextTick(() => document.querySelector('#voyage-route-day-title')?.scrollIntoView({ block: 'nearest' }))
}

async function openStop(item, event) {
  if (item.kind === 'move' || item.kind === 'branch') return
  returnFocus.value = event?.currentTarget || null
  detail.value = { type: 'stop', item }
  await nextTick()
  detailPanel.value?.focus()
}

async function openCity(city, event) {
  const preferredDay = city.indexes.includes(todayIndex.value)
    ? todayIndex.value
    : city.indexes[0]
  if (Number.isInteger(preferredDay)) selectDay(preferredDay)
  returnFocus.value = event?.currentTarget || null
  detail.value = { type: 'city', city }
  await nextTick()
  detailPanel.value?.focus()
}

async function closeDetail() {
  detail.value = null
  await nextTick()
  returnFocus.value?.focus?.()
  returnFocus.value = null
}

function handleEscape(event) {
  if (event.key === 'Escape' && detail.value) closeDetail()
}

function percent(value, total) {
  if (!total) return 0
  return Math.min(100, Math.max(0, value / total * 100))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function formatWon(manwon) {
  return `${Math.round(manwon * 10000).toLocaleString('ko-KR')}원`
}

function formatMealAmount(meal) {
  if (meal?.amount === null || meal?.amount === undefined) return '금액 미확인'
  const amount = Number.isInteger(meal.amount) ? meal.amount.toLocaleString('ko-KR') : meal.amount
  return `${amount} ${meal.currency}`
}

function formatDrive(minutes) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return `${remainder}분`
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`
}

function cityLabelPlacement(id) {
  return ({
    prague: { dx: 24, dy: -12, anchor: 'start' },
    'prague-return': { hidden: true, dx: 0, dy: 0, anchor: 'start' },
    'cesky-krumlov': { dx: 24, dy: -8, anchor: 'start' },
    hallstatt: { dx: 24, dy: 30, anchor: 'start' },
    salzburg: { dx: 24, dy: -20, anchor: 'start' },
    wachau: { dx: -8, dy: 38, anchor: 'middle' },
    vienna: { dx: 24, dy: -10, anchor: 'start' },
    budapest: { dx: -18, dy: 38, anchor: 'end' },
    brno: { dx: 24, dy: -8, anchor: 'start' }
  })[id] || { dx: 22, dy: -8, anchor: 'start' }
}

function dayRange(indexes) {
  if (!indexes.length) return ''
  const first = indexes[0] + 1
  const last = indexes[indexes.length - 1] + 1
  return first === last ? `DAY ${first}` : `DAY ${first}–${last}`
}

function tooltipPosition(segment) {
  const centerX = (segment.fromPoint.x + segment.toPoint.x) / 2
  const centerY = (segment.fromPoint.y + segment.toPoint.y) / 2
  return {
    x: Math.min(ROUTE_VIEWBOX.width - 326, Math.max(8, centerX - 155)),
    y: Math.max(8, centerY - 44)
  }
}

function segmentLabel(segment) {
  return `DAY ${segment.dayIndex + 1} · ${segment.fromCity.name} → ${segment.toCity.name} · 운전 ${formatDrive(segment.driveMin)} · ${segment.km}km`
}

function stationAria(city) {
  const suffix = city.id === 'prague-return' ? ' 복귀' : ''
  return `${city.name}${suffix} · ${dayRange(city.indexes)} 정차역 상세`
}

function normalizePhoto(photo) {
  if (typeof photo === 'string') return { src: photo, caption: '여행 사진' }
  return photo
}

function entryFare(entry) {
  if (entry.spendItem) return formatWon(entry.spendItem.amount)
  if (entry.meal) return formatMealAmount(entry.meal)
  return '—'
}
</script>

<template>
  <section class="feature-shell line-v voyage-route-map">
    <StationHeader
      line-class="line-v"
      station-code="V02-R"
      title="여정 노선도"
      title-en="ROUTE MAP"
      :status="currentStatus"
      status-tone="ok"
      summary="지도 · 시간표 · 정차역 상세"
      @exit="$emit('exit')"
    >
      <template #actions>
        <button type="button" class="btn btn-ghost" @click="$emit('back')">같은 날짜로 돌아가기</button>
      </template>
    </StationHeader>

    <header class="route-heading">
      <span class="route-heading__badge" aria-hidden="true">V</span>
      <div>
        <h3>{{ voyage.title }}</h3>
        <p>{{ selectedDayLabel }}</p>
      </div>
    </header>

    <section class="route-gauges" aria-label="여행 진행 계기판">
      <div class="route-gauge">
        <p><span>달린 거리</span><strong>{{ gauges.completedDistance.toLocaleString('ko-KR') }}km <small>/ 약 {{ gauges.totalDistance.toLocaleString('ko-KR') }}km</small></strong></p>
        <div><i :style="{ width: `${distanceProgress}%` }"></i></div>
      </div>
      <div class="route-gauge route-gauge--spend">
        <p><span>지출</span><strong>{{ Math.floor(gauges.spent).toLocaleString('ko-KR') }}만원 <small>/ 계획 {{ gauges.budgetPlan.toLocaleString('ko-KR') }}만원</small></strong></p>
        <div><i :style="{ width: `${spendProgress}%` }"></i></div>
      </div>
    </section>

    <div class="route-layout">
      <section class="route-map-panel" aria-labelledby="route-map-title">
        <h3 id="route-map-title">순환선</h3>
        <svg
          class="route-map-svg"
          :viewBox="`0 0 ${ROUTE_VIEWBOX.width} ${ROUTE_VIEWBOX.height}`"
          role="img"
          :aria-label="`${voyage.title} 9개 정차역 여정 노선도`"
        >
          <g class="route-segments">
            <a
              v-for="segment in segments"
              :key="segment.id"
              class="route-segment"
              :class="[`route-segment--${segment.state}`, { 'route-segment--active': segment.active }]"
              :href="`#voyage-route-day-${segment.dayIndex + 1}`"
              :aria-label="segmentLabel(segment)"
              @click.prevent="selectSegment(segment)"
            >
              <title>{{ segmentLabel(segment) }}</title>
              <path
                :d="`M ${segment.fromPoint.x} ${segment.fromPoint.y} L ${segment.toPoint.x} ${segment.toPoint.y}`"
                :style="{ strokeWidth: segment.strokeWidth }"
              />
              <g
                class="route-tooltip"
                :transform="`translate(${tooltipPosition(segment).x} ${tooltipPosition(segment).y})`"
                aria-hidden="true"
              >
                <rect width="318" height="34" rx="6" />
                <text x="12" y="22">DAY {{ segment.dayIndex + 1 }} · {{ formatDrive(segment.driveMin) }} · {{ segment.km }}km</text>
              </g>
            </a>
          </g>

          <g class="route-stations">
            <a
              v-for="city in projectedCities"
              :key="city.id"
              class="route-station"
              :class="[`route-station--${city.state}`, { 'route-station--current': city.current, 'route-station--selected': city.selected, 'route-station--return': city.id === 'prague-return' }]"
              :href="`#voyage-city-${city.id}`"
              :aria-label="stationAria(city)"
              @click.prevent="openCity(city, $event)"
            >
              <circle v-if="city.current" class="route-station__pulse" :cx="city.x" :cy="city.y" r="15" />
              <circle class="route-station__dot" :cx="city.x" :cy="city.y" :r="city.id === 'prague-return' ? 18 : 10" />
              <circle v-if="city.selected && city.id !== 'prague-return'" class="route-station__ring" :cx="city.x" :cy="city.y" r="17" />
              <template v-if="!city.label.hidden">
                <text
                  class="route-station__name"
                  :x="city.x + city.label.dx"
                  :y="city.y + city.label.dy"
                  :text-anchor="city.label.anchor"
                >{{ city.name }}<tspan v-if="city.current" class="route-station__now"> · 지금</tspan></text>
                <text
                  class="route-station__days"
                  :x="city.x + city.label.dx"
                  :y="city.y + city.label.dy + 19"
                  :text-anchor="city.label.anchor"
                >{{ dayRange(city.indexes) }}</text>
              </template>
            </a>
          </g>
        </svg>
      </section>

      <section class="route-day-panel" :id="`voyage-route-day-${selectedDayIndex + 1}`" aria-labelledby="voyage-route-day-title">
        <nav class="route-day-tabs" aria-label="일차 선택">
          <button
            v-for="(day, index) in voyage.days"
            :key="day.date"
            type="button"
            :class="{ active: index === selectedDayIndex, today: index === todayIndex }"
            :aria-current="index === selectedDayIndex ? 'date' : undefined"
            :aria-label="`${index + 1}일차 ${day.city}`"
            @click="selectDay(index)"
          >
            {{ index + 1 }}<small v-if="index === todayIndex">오늘</small>
          </button>
        </nav>

        <header class="route-day-title">
          <div>
            <p>DAY {{ selectedDayIndex + 1 }}</p>
            <h3 id="voyage-route-day-title">{{ selectedSession?.title || selectedDay.city }}</h3>
          </div>
          <span>{{ selectedDayLabel }}</span>
        </header>
        <p class="route-day-goal">{{ selectedSession?.success || selectedDay.tip }}</p>

        <div v-if="selectedDayIndex === todayIndex" class="route-now" role="status"><span>지금</span></div>

        <div class="route-timetable" role="table" :aria-label="`${selectedDayIndex + 1}일차 세로 시간표`">
          <div class="route-timetable__head" role="row">
            <span role="columnheader">도착</span>
            <span role="columnheader">출발</span>
            <span role="columnheader">정차역</span>
            <span role="columnheader">요금</span>
          </div>
          <ol role="rowgroup">
            <li
              v-for="entry in timeline"
              :key="entry.id"
              :class="[`route-stop--${entry.kind}`]"
              role="row"
            >
              <time role="cell">{{ entry.arrival || '' }}</time>
              <time role="cell">{{ entry.departure || '' }}</time>
              <div class="route-stop__name" role="cell">
                <span v-if="entry.kind === 'branch'">{{ entry.title }}</span>
                <button v-else-if="entry.kind !== 'move'" type="button" @click="openStop(entry, $event)">
                  <strong>{{ entry.title }}</strong>
                  <small v-if="entry.detail">{{ entry.detail }}</small>
                </button>
                <span v-else><strong>{{ entry.title }}</strong><small v-if="entry.detail">{{ entry.detail }}</small></span>
              </div>
              <span class="route-stop__fare" role="cell">{{ entryFare(entry) }}</span>
            </li>
          </ol>
          <footer>
            <span>이 날 요금 합계<small v-if="selectedDay.spend?.pendingCount"> · 미확인 {{ selectedDay.spend.pendingCount }}건</small></span>
            <strong>{{ daySpendText }}</strong>
          </footer>
        </div>

        <blockquote v-if="selectedDay.tip">{{ selectedDay.tip }}</blockquote>
      </section>
    </div>

    <div v-if="detail" class="route-detail-backdrop" @click.self="closeDetail">
      <aside
        ref="detailPanel"
        class="route-detail"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="detail.type === 'city' ? 'route-city-detail-title' : 'route-stop-detail-title'"
        tabindex="-1"
      >
        <div class="route-detail__grab" aria-hidden="true"></div>
        <button type="button" class="route-detail__close" aria-label="상세 닫기" @click="closeDetail">×</button>

        <template v-if="detail.type === 'city'">
          <p class="route-detail__eyebrow">{{ dayRange(detail.city.indexes) }} · 도시</p>
          <h3 id="route-city-detail-title">{{ detail.city.name }}</h3>
          <dl>
            <dt>숙박</dt>
            <dd>{{ cityDetail.stays.length ? cityDetail.stays.join(' · ') : '경유' }}</dd>
            <dt>먹은 것</dt>
            <dd>{{ cityDetail.meals.length ? cityDetail.meals.map((meal) => `${meal.place} · ${meal.dish}`).join(' / ') : '기록 없음' }}</dd>
          </dl>
          <a class="route-detail__primary" :href="cityDetail.mapUrl" target="_blank" rel="noopener noreferrer">구글 지도에서 열기 ↗</a>
        </template>

        <template v-else>
          <p class="route-detail__eyebrow">DAY {{ selectedDayIndex + 1 }} · {{ detail.item.arrival || detail.item.departure }}</p>
          <h3 id="route-stop-detail-title">{{ detail.item.title }}</h3>
          <p v-if="detail.item.detail" class="route-detail__copy">{{ detail.item.detail }}</p>
          <dl v-if="detail.item.meal">
            <dt>먹은 것</dt>
            <dd>{{ detail.item.meal.dish }}</dd>
            <dt>금액</dt>
            <dd>{{ detail.item.spendItem ? formatWon(detail.item.spendItem.amount) : formatMealAmount(detail.item.meal) }}</dd>
          </dl>
          <a
            v-if="detail.item.meal?.mapUrl"
            class="route-detail__primary"
            :href="detail.item.meal.mapUrl"
            target="_blank"
            rel="noopener noreferrer"
          >구글 지도에서 열기 ↗</a>
        </template>

        <div v-if="detailPhotos.length" class="route-detail__photos">
          <figure v-for="photo in detailPhotos" :key="photo.src">
            <img :src="photo.src" :alt="photo.caption || '여행 사진'" />
            <figcaption>{{ photo.caption }}</figcaption>
          </figure>
        </div>
        <p v-else class="route-detail__empty">사진이 아직 없습니다.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.voyage-route-map,
.voyage-route-map > * {
  min-width: 0;
}

.route-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid var(--line);
}

.route-heading__badge {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  flex: none;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 900;
}

.route-heading h3,
.route-heading p {
  margin: 0;
}

.route-heading h3 {
  color: var(--text);
  font-size: 1rem;
}

.route-heading p {
  margin-top: 2px;
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-gauges {
  display: grid;
  gap: 14px;
  padding: 22px 0 8px;
}

.route-gauge p {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 7px;
  color: var(--text-2);
  font-size: var(--fs-caption);
}

.route-gauge strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.route-gauge small {
  color: var(--muted);
  font-weight: 400;
}

.route-gauge > div {
  height: 2px;
  overflow: hidden;
  background: var(--line);
}

.route-gauge i {
  display: block;
  height: 100%;
  background: var(--accent);
}

.route-gauge--spend i {
  background: var(--safety);
}

.route-layout {
  display: grid;
  gap: clamp(26px, 5vw, 48px);
  margin-top: 22px;
}

.route-map-panel {
  min-width: 0;
  padding-left: 14px;
  border-left: 3px solid var(--accent);
}

.route-map-panel > h3 {
  margin: 0;
  color: var(--muted);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}

.route-map-svg {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 8px;
  overflow: visible;
}

.route-segment path {
  fill: none;
  stroke: var(--accent);
  stroke-linecap: round;
  pointer-events: stroke;
  transition: stroke 140ms ease, opacity 140ms ease;
}

.route-segment--upcoming path {
  stroke: var(--muted);
  stroke-dasharray: 8 9;
  opacity: 0.72;
}

.route-segment--current path {
  stroke: var(--safety);
}

.route-segment:hover path,
.route-segment:focus path,
.route-segment--active path {
  stroke: var(--safety);
  opacity: 1;
}

.route-segment:focus {
  outline: none;
}

.route-tooltip {
  opacity: 0;
  pointer-events: none;
  transition: opacity 140ms ease;
}

.route-segment:hover .route-tooltip,
.route-segment:focus .route-tooltip {
  opacity: 1;
}

.route-tooltip rect {
  fill: var(--panel-2);
  stroke: var(--line-strong);
}

.route-tooltip text {
  fill: var(--text);
  font-size: 17px;
  font-weight: 700;
}

.route-station__dot {
  fill: var(--bg);
  stroke: var(--text);
  stroke-width: 3;
  pointer-events: all;
}

.route-station {
  cursor: pointer;
  pointer-events: bounding-box;
}

.route-station--completed .route-station__dot {
  stroke: var(--accent);
}

.route-station--upcoming .route-station__dot {
  stroke: var(--muted);
  stroke-dasharray: 3 3;
}

.route-station--current .route-station__dot,
.route-station--selected .route-station__dot {
  stroke: var(--safety);
}

.route-station--return .route-station__dot {
  fill: none;
  pointer-events: stroke;
}

.route-station__ring {
  fill: none;
  stroke: var(--safety);
  stroke-width: 2;
}

.route-station__pulse {
  fill: var(--safety);
  opacity: 0.35;
  animation: route-pulse 1.8s infinite;
}

.route-station__name {
  fill: var(--text);
  font-size: 26px;
  font-weight: 800;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-linejoin: round;
  stroke-width: 6px;
  pointer-events: all;
}

.route-station--upcoming .route-station__name {
  fill: var(--muted);
  font-weight: 600;
}

.route-station__now {
  fill: var(--safety);
  font-size: 19px;
  font-weight: 600;
}

.route-station__days {
  fill: var(--muted);
  font-size: 17px;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-linejoin: round;
  stroke-width: 4px;
  pointer-events: all;
}

.route-day-panel {
  min-width: 0;
  scroll-margin-top: 20px;
}

.route-day-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.route-day-tabs button {
  display: grid;
  min-width: 42px;
  min-height: 42px;
  place-items: center;
  flex: none;
  padding: 5px 8px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--text-2);
  font: inherit;
  font-size: var(--fs-caption);
  cursor: pointer;
}

.route-day-tabs button.active {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
  font-weight: 900;
}

.route-day-tabs button.today:not(.active) {
  border-color: var(--safety);
  color: var(--safety);
}

.route-day-tabs small {
  font-size: 0.55rem;
  line-height: 1;
}

.route-day-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.route-day-title p,
.route-day-title h3,
.route-day-title > span,
.route-day-goal {
  margin: 0;
}

.route-day-title p {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.route-day-title h3 {
  margin-top: 3px;
  color: var(--text);
  font-size: clamp(1.2rem, 4vw, 1.55rem);
}

.route-day-title > span,
.route-day-goal {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-day-goal {
  margin-top: 6px;
  color: var(--text-2);
}

.route-now {
  position: relative;
  height: 16px;
  margin-top: 12px;
  color: var(--safety);
  font-size: 0.64rem;
}

.route-now::before {
  position: absolute;
  top: 8px;
  right: 0;
  left: 0;
  height: 1px;
  background: var(--safety);
  content: '';
}

.route-now span {
  position: relative;
  z-index: 1;
  padding-right: 6px;
  background: var(--bg);
}

.route-timetable {
  margin-top: 16px;
  font-variant-numeric: tabular-nums;
}

.route-timetable__head,
.route-timetable li {
  display: grid;
  grid-template-columns: 48px 48px minmax(0, 1fr) minmax(74px, auto);
  gap: 8px;
}

.route-timetable__head {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.route-timetable__head span:last-child {
  text-align: right;
}

.route-timetable ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-timetable li {
  position: relative;
  min-height: 48px;
  align-items: start;
  color: var(--text-2);
}

.route-timetable li > time,
.route-stop__fare {
  padding-top: 13px;
  font-size: var(--fs-caption);
}

.route-stop__fare {
  color: var(--text-2);
  text-align: right;
}

.route-stop__name {
  position: relative;
  min-width: 0;
  padding: 10px 4px 10px 25px;
}

.route-stop__name::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 8px;
  width: 3px;
  background: var(--accent);
  content: '';
}

.route-stop__name::after {
  position: absolute;
  top: 14px;
  left: 3px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--text);
  border-radius: 50%;
  background: var(--bg);
  content: '';
}

.route-stop__name button {
  width: 100%;
  min-height: 44px;
  margin: -10px 0;
  padding: 10px 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.route-stop__name strong,
.route-stop__name small {
  display: block;
  overflow-wrap: anywhere;
}

.route-stop__name strong {
  color: var(--text);
  font-size: 0.86rem;
}

.route-stop__name small {
  margin-top: 3px;
  color: var(--muted);
  font-size: var(--fs-caption);
  line-height: 1.45;
}

.route-stop--meal .route-stop__name::after {
  border-color: var(--safety);
  background: linear-gradient(90deg, var(--safety) 50%, var(--bg) 50%);
}

.route-stop--move .route-stop__name {
  padding-top: 7px;
  padding-bottom: 7px;
}

.route-stop--move .route-stop__name::before {
  left: 6px;
  width: 7px;
}

.route-stop--move .route-stop__name::after,
.route-stop--branch .route-stop__name::after {
  display: none;
}

.route-stop--branch {
  min-height: 34px !important;
}

.route-stop--branch .route-stop__name {
  grid-column: 3 / 5;
  padding-top: 4px;
  padding-bottom: 4px;
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-stop--branch .route-stop__name::before {
  top: 13px;
  bottom: auto;
  width: 15px;
  height: 2px;
  background: var(--muted);
}

.route-timetable footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 11px;
  border-top: 1px solid var(--line);
  color: var(--text);
  font-weight: 800;
}

.route-timetable footer small {
  color: var(--muted);
  font-weight: 400;
}

.route-day-panel blockquote {
  margin: 15px 0 0;
  color: var(--text-2);
  font-style: italic;
}

.route-detail-backdrop {
  position: fixed;
  z-index: 80;
  inset: 0;
  background: rgb(0 0 0 / 46%);
}

.route-detail {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  max-height: 72vh;
  overflow: auto;
  padding: 15px 20px 28px;
  border: 1px solid var(--line-strong);
  border-bottom: 0;
  border-radius: 18px 18px 0 0;
  background: var(--panel);
  color: var(--text);
  box-shadow: 0 -18px 44px rgb(0 0 0 / 38%);
  outline: none;
}

.route-detail__grab {
  width: 38px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 2px;
  background: var(--line-strong);
}

.route-detail__close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.6rem;
  cursor: pointer;
}

.route-detail__eyebrow {
  margin: 0;
  color: var(--safety);
  font-size: var(--fs-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.route-detail h3 {
  margin: 4px 40px 2px 0;
  font-size: 1.35rem;
}

.route-detail__copy,
.route-detail__empty {
  color: var(--text-2);
}

.route-detail dl {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px 12px;
  margin: 18px 0;
}

.route-detail dt {
  color: var(--muted);
}

.route-detail dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.route-detail__primary {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--safety);
  color: #201a05;
  font-weight: 800;
}

.route-detail__photos {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.route-detail__photos figure {
  margin: 0;
}

.route-detail__photos img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 10px;
}

.route-detail__photos figcaption {
  margin-top: 5px;
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-detail__empty {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

@keyframes route-pulse {
  from { opacity: 0.45; r: 15; }
  to { opacity: 0; r: 31; }
}

@media (min-width: 900px) {
  .route-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  .route-map-panel {
    position: sticky;
    top: 18px;
  }

  .route-detail {
    top: 0;
    left: auto;
    width: 390px;
    max-height: none;
    padding: 76px 26px 28px;
    border-top: 0;
    border-right: 0;
    border-bottom: 0;
    border-radius: 0;
    box-shadow: -18px 0 44px rgb(0 0 0 / 38%);
  }

  .route-detail__grab {
    display: none;
  }

  .route-detail__close {
    top: 18px;
  }
}

@media (max-width: 560px) {
  .route-gauge p,
  .route-day-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .route-timetable__head,
  .route-timetable li {
    grid-template-columns: 42px 42px minmax(0, 1fr);
  }

  .route-timetable__head span:last-child,
  .route-stop__fare {
    display: none;
  }

  .route-stop--branch .route-stop__name {
    grid-column: 3;
  }

  .route-station__days {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .route-station__pulse {
    animation: none;
    opacity: 0.22;
    r: 20;
  }
}
</style>
