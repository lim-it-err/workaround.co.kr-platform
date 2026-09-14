<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { voyageStorageKey } from '../../data/voyageStorage.js'
import {
  downloadVoyageDayBackup,
  parseVoyageDayBackup,
  safeWriteJson
} from '../../staticWritingState.js'
import SiteLoopSymbol from '../tone/SiteLoopSymbol.vue'
import VoyagePreparationSheet from './VoyagePreparationSheet.vue'
import {
  ROUTE_VIEWBOX,
  advisorTransferHref,
  applyStopRecords,
  buildDayTimeline,
  buildRouteSegments,
  cityDayIndexes,
  currentCityId,
  effectiveDaySpendTotal,
  findTripDayIndex,
  isGoogleMapsUrl,
  projectCity,
  routeGauges,
  routeItemState,
  stopRecordFromEntry
} from './voyageRoute.js'

const props = defineProps({
  voyage: { type: Object, required: true },
  initialDayIndex: { type: Number, default: null },
  entryMode: { type: String, default: '' }
})

const emit = defineEmits(['back', 'exit', 'select-day'])

const todayIndex = computed(() => findTripDayIndex(props.voyage))
const selectedDayIndex = ref(resolveInitialDayIndex())
const detail = ref(null)
const detailDraft = ref(null)
const detailMessage = ref('')
const detailPanel = ref(null)
const photoInput = ref(null)
const restoreInput = ref(null)
const returnFocus = ref(null)
const mapExpanded = ref(typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches)
const dayStorageKey = voyageStorageKey(props.voyage.id, 'days')
const dayRecords = ref(readDayRecords())
const backupMessage = ref('')
const activeCityId = computed(() => currentCityId(props.voyage, todayIndex.value))
const isPreparation = computed(() => selectedDayIndex.value === -1)
const effectiveVoyage = computed(() => ({
  ...props.voyage,
  days: props.voyage.days.map((day, index) => {
    const entries = buildDayTimeline(props.voyage, index)
    const stops = dayRecords.value[day.date]?.stops || {}
    const total = effectiveDaySpendTotal(day, entries, stops)
    return {
      ...day,
      actual: {
        ...(day.actual || {}),
        spend: { ...(day.actual?.spend || day.spend || {}), total }
      }
    }
  })
}))
const selectedDay = computed(() => isPreparation.value ? null : effectiveVoyage.value.days[selectedDayIndex.value])
const selectedSession = computed(() => (
  selectedDay.value?.plan?.session
    || (props.voyage.daySessions || []).find((session) => session.dayIndex === selectedDayIndex.value)
    || null
))
const baselineTimeline = computed(() => isPreparation.value ? [] : buildDayTimeline(props.voyage, selectedDayIndex.value))
const timeline = computed(() => applyStopRecords(
  baselineTimeline.value,
  selectedDay.value ? dayRecords.value[selectedDay.value.date]?.stops || {} : {}
))
const segments = computed(() => buildRouteSegments(props.voyage, todayIndex.value, selectedDayIndex.value))
const gauges = computed(() => routeGauges(effectiveVoyage.value, todayIndex.value))
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
  const total = selectedDay.value?.actual?.spend?.total ?? selectedDay.value?.spend?.total
  return total ? formatWon(total) : '기록 없음'
})
const selectedDayLabel = computed(() => {
  const day = selectedDay.value
  if (!day) return '체크리스트 · 예산 · 결정 기록'
  return `${formatDate(day.date)} · ${day.city}`
})
const selectedDayState = computed(() => {
  if (isPreparation.value) return 'prep'
  return routeItemState(props.voyage, selectedDayIndex.value, todayIndex.value)
})
const selectedDayStateLabel = computed(() => ({
  prep: '출발 전',
  completed: '실제 기록',
  current: '오늘 · 계획과 기록',
  upcoming: '계획'
})[selectedDayState.value])
const selectedRecord = computed({
  get: () => selectedDay.value ? dayRecords.value[selectedDay.value.date]?.note || selectedDay.value.actual?.record || '' : '',
  set: (value) => updateSelectedRecord({ note: value })
})
const selectedStamped = computed(() => (
  selectedDay.value ? Boolean(dayRecords.value[selectedDay.value.date]?.stamped) : false
))
const detailPhotos = computed(() => {
  if (!detail.value) return []
  if (detail.value.type === 'city') {
    return detail.value.city.indexes.flatMap((index) => (
      props.voyage.days[index]?.actual?.photos || props.voyage.days[index]?.photos || []
    ))
  }
  const seed = detail.value.item.meal?.photo
  const photos = [...(detailDraft.value?.photos || []), seed].filter(Boolean).map(normalizePhoto)
  return photos.filter((photo, index) => photos.findIndex((candidate) => candidate.src === photo.src) === index)
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
  if (Number.isInteger(value)) selectedDayIndex.value = clampDayIndex(value)
})

onMounted(async () => {
  window.addEventListener('resize', handleViewportResize)
  handleViewportResize()
  await openRequestedTransferStop()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportResize)
})

function clampDayIndex(index) {
  if (Number(index) === -1) return -1
  return Math.min(Math.max(Number(index) || 0, 0), props.voyage.days.length - 1)
}

function resolveInitialDayIndex() {
  if (Number.isInteger(props.initialDayIndex)) return clampDayIndex(props.initialDayIndex)
  if (props.entryMode === 'prep' || props.voyage.status === 'planned' || todayIndex.value < 0) return -1
  if (props.entryMode === 'archive' || props.voyage.status === 'arrived' || todayIndex.value >= props.voyage.days.length) {
    return Math.max(0, props.voyage.days.length - 1)
  }
  return clampDayIndex(todayIndex.value)
}

function transferHref(item) {
  return advisorTransferHref(item?.missions?.[0], import.meta.env.BASE_URL)
}

async function openRequestedTransferStop() {
  const prefix = '#voyage-stop-'
  if (!window.location.hash.startsWith(prefix)) return
  let requestedId = ''
  try {
    requestedId = decodeURIComponent(window.location.hash.slice(prefix.length))
  } catch {
    return
  }
  for (let dayIndex = 0; dayIndex < props.voyage.days.length; dayIndex += 1) {
    const item = buildDayTimeline(props.voyage, dayIndex).find((entry) => entry.stationId === requestedId)
    if (!item) continue
    selectDay(dayIndex)
    await nextTick()
    const row = document.getElementById(`voyage-stop-${requestedId}`)
    row?.scrollIntoView({ block: 'center' })
    await openStop(item, { currentTarget: row?.querySelector('button') || null })
    return
  }
}

function selectDay(index) {
  selectedDayIndex.value = clampDayIndex(index)
  detail.value = null
  detailDraft.value = null
  emit('select-day', selectedDayIndex.value)
}

function dayTabState(index) {
  return routeItemState(props.voyage, index, todayIndex.value)
}

function readDayRecords() {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(dayStorageKey) || '{}')
    return sanitizeDayRecords(parsed?.records)
  } catch (error) {
    return {}
  }
}

function persistDayRecords() {
  if (typeof window === 'undefined') return false
  return safeWriteJson(window.localStorage, dayStorageKey, { records: dayRecords.value })
}

function updateSelectedRecord(patch) {
  const date = selectedDay.value?.date
  if (!date) return
  dayRecords.value = {
    ...dayRecords.value,
    [date]: {
      ...(dayRecords.value[date] || {}),
      ...patch
    }
  }
  if (!persistDayRecords()) backupMessage.value = '저장 공간이 부족합니다. 백업 후 사진 수를 줄여 주세요.'
}

function toggleSelectedStamp() {
  updateSelectedRecord({ stamped: !selectedStamped.value })
}

function backupRecords() {
  try {
    if (!persistDayRecords()) throw new Error('storage-full')
    downloadVoyageDayBackup(window.localStorage, dayStorageKey, props.voyage.id)
    backupMessage.value = '기록 백업을 내려받았습니다.'
  } catch (error) {
    backupMessage.value = '백업 파일을 만들지 못했습니다.'
  }
}

function requestRestore() {
  restoreInput.value?.click()
}

async function restoreRecords(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    if (file.size > 6 * 1024 * 1024) throw new Error('too-large')
    const records = sanitizeDayRecords(parseVoyageDayBackup(await file.text(), props.voyage.id))
    const previous = dayRecords.value
    dayRecords.value = records
    if (!persistDayRecords()) {
      dayRecords.value = previous
      throw new Error('storage-full')
    }
    backupMessage.value = '백업 기록을 이 브라우저에 복원했습니다.'
  } catch (error) {
    backupMessage.value = error.message === '다른 여행의 백업입니다.'
      ? error.message
      : '이 파일은 복원할 수 없습니다.'
  }
}

function selectSegment(segment) {
  selectDay(segment.dayIndex)
  nextTick(() => document.querySelector('#voyage-route-day-title')?.scrollIntoView({ block: 'nearest' }))
}

async function openStop(item, event) {
  if (item.kind === 'move' || item.kind === 'branch') return
  returnFocus.value = event?.currentTarget || null
  detail.value = { type: 'stop', item }
  const stored = dayRecords.value[selectedDay.value.date]?.stops?.[item.id]
  detailDraft.value = stopRecordFromEntry(item, stored)
  detailMessage.value = ''
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
  detailDraft.value = null
  detailMessage.value = ''
  await nextTick()
  returnFocus.value?.focus?.()
  returnFocus.value = null
}

function saveStopDetail() {
  if (!detail.value?.item || !detailDraft.value || !selectedDay.value) return
  if (!isGoogleMapsUrl(detailDraft.value.mapUrl.trim())) {
    detailMessage.value = '구글 지도 HTTPS 링크만 입력할 수 있습니다.'
    return
  }
  if (!validOptionalAmount(detailDraft.value.localAmount) || !validOptionalAmount(detailDraft.value.krwAmount)) {
    detailMessage.value = '금액은 0 이상의 숫자로 입력해 주세요.'
    return
  }

  const date = selectedDay.value.date
  const record = sanitizeStopRecord(detailDraft.value)
  const previous = dayRecords.value
  dayRecords.value = {
    ...dayRecords.value,
    [date]: {
      ...(dayRecords.value[date] || {}),
      stops: {
        ...(dayRecords.value[date]?.stops || {}),
        [detail.value.item.id]: record
      }
    }
  }
  if (!persistDayRecords()) {
    dayRecords.value = previous
    detailMessage.value = '저장 공간이 부족합니다. 사진을 줄이거나 먼저 백업해 주세요.'
    return
  }
  detailDraft.value = { ...record, photos: [...record.photos] }
  detail.value = {
    ...detail.value,
    item: timeline.value.find((entry) => entry.id === detail.value.item.id) || detail.value.item
  }
  detailMessage.value = '이 브라우저에 저장했습니다.'
}

function choosePhoto() {
  photoInput.value?.click()
}

async function addPhoto(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !detailDraft.value) return
  if (!/^image\/(png|jpe?g|gif|webp|avif)$/.test(file.type) || file.size > 1.5 * 1024 * 1024) {
    detailMessage.value = '1.5MB 이하 PNG·JPG·GIF·WebP·AVIF 사진만 추가할 수 있습니다.'
    return
  }
  try {
    const src = await readFileAsDataUrl(file)
    detailDraft.value.photos = [
      ...detailDraft.value.photos,
      { src, caption: file.name.slice(0, 100) }
    ].slice(-4)
    detailMessage.value = '사진을 추가했습니다. 아래 저장 버튼을 눌러 주세요.'
  } catch (error) {
    detailMessage.value = '사진을 읽지 못했습니다.'
  }
}

function removePhoto(index) {
  detailDraft.value.photos = detailDraft.value.photos.filter((_, photoIndex) => photoIndex !== index)
  detailMessage.value = '사진을 목록에서 뺐습니다. 저장하면 반영됩니다.'
}

function handleDetailKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    closeDetail()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = [...detailPanel.value?.querySelectorAll([
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')) || []].filter(element => element.getClientRects().length > 0)
  if (!focusable.length) {
    event.preventDefault()
    detailPanel.value?.focus()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === detailPanel.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function handleViewportResize() {
  if (window.innerWidth >= 900) mapExpanded.value = true
}

function validOptionalAmount(value) {
  if (value === '' || value === null || value === undefined) return true
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), { once: true })
    reader.addEventListener('error', reject, { once: true })
    reader.readAsDataURL(file)
  })
}

function sanitizePhoto(photo) {
  if (!photo || typeof photo !== 'object') return null
  const src = String(photo.src || '')
  if (!/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(src)) return null
  return { src, caption: String(photo.caption || '현장 사진').slice(0, 100) }
}

function sanitizeStopRecord(record) {
  return {
    place: String(record.place || '').slice(0, 120),
    dish: String(record.dish || '').slice(0, 180),
    localAmount: String(record.localAmount ?? '').slice(0, 30),
    currency: String(record.currency || '').toUpperCase().slice(0, 8),
    krwAmount: String(record.krwAmount ?? '').slice(0, 30),
    note: String(record.note || '').slice(0, 1000),
    mapUrl: isGoogleMapsUrl(String(record.mapUrl || '').trim()) ? String(record.mapUrl || '').trim() : '',
    photos: (Array.isArray(record.photos) ? record.photos : []).map(sanitizePhoto).filter(Boolean).slice(0, 4)
  }
}

function sanitizeDayRecords(records) {
  if (!records || typeof records !== 'object' || Array.isArray(records)) return {}
  return Object.fromEntries(Object.entries(records).flatMap(([date, record]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !record || typeof record !== 'object') return []
    const stops = record.stops && typeof record.stops === 'object' && !Array.isArray(record.stops)
      ? Object.fromEntries(Object.entries(record.stops).flatMap(([id, stop]) => (
        /^((timeline|meal|branch)-\d+-\d+)$/.test(id) && stop && typeof stop === 'object'
          ? [[id, sanitizeStopRecord(stop)]]
          : []
      )))
      : {}
    return [[date, {
      note: String(record.note || '').slice(0, 5000),
      stamped: Boolean(record.stamped),
      stops
    }]]
  }))
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
  return `DAY ${segment.dayIndex + 1} · ${segment.fromCity.name}→${segment.toCity.name} · 운전 ${formatDrive(segment.driveMin)} · ${segment.km}km`
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
    <nav class="route-nav" aria-label="여행 이동">
      <button type="button" class="ghost-button" @click="$emit('back')">← 여행 목록</button>
      <button type="button" class="ghost-button" @click="$emit('exit')">홈으로</button>
    </nav>

    <header class="route-heading">
      <div class="route-heading__identity">
        <span class="route-heading__badge" aria-hidden="true">V</span>
        <div>
          <h2>{{ voyage.title }}</h2>
          <p>노선도</p>
        </div>
      </div>
      <span>{{ currentStatus }} · {{ selectedDayLabel }}</span>
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
      <div class="route-map-control">
        <button
          type="button"
          class="ghost-button"
          :aria-expanded="mapExpanded"
          aria-controls="voyage-route-map-panel"
          @click="mapExpanded = !mapExpanded"
        >{{ mapExpanded ? '노선도 접기' : '노선도 펼치기' }}</button>
      </div>

      <section
        v-show="mapExpanded"
        id="voyage-route-map-panel"
        class="route-map-panel"
        aria-labelledby="route-map-title"
      >
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

      <section
        class="route-day-panel"
        :class="`is-${selectedDayState}`"
        :id="`voyage-route-day-${selectedDayIndex + 1}`"
        :aria-labelledby="isPreparation ? 'voyage-prep-title' : 'voyage-route-day-title'"
      >
        <nav class="route-day-tabs" aria-label="일차 선택">
          <button
            type="button"
            class="prep"
            :class="{ active: isPreparation }"
            :aria-current="isPreparation ? 'step' : undefined"
            aria-label="DAY 0 출발 전 준비"
            @click="selectDay(-1)"
          >
            0<small>준비</small>
          </button>
          <button
            v-for="(day, index) in voyage.days"
            :key="day.date"
            type="button"
            :class="[`is-${dayTabState(index)}`, { active: index === selectedDayIndex, today: index === todayIndex }]"
            :aria-current="index === selectedDayIndex ? 'date' : undefined"
            :aria-label="`${index + 1}일차 ${day.city}`"
            @click="selectDay(index)"
          >
            {{ index + 1 }}<small v-if="index === todayIndex">오늘</small>
          </button>
        </nav>

        <VoyagePreparationSheet v-if="isPreparation" :voyage="voyage" />

        <template v-else>
          <header class="route-day-title" :class="`is-${selectedDayState}`">
            <div>
              <p>DAY {{ selectedDayIndex + 1 }} · {{ selectedDayStateLabel }}</p>
              <h3 id="voyage-route-day-title">{{ selectedSession?.title || selectedDay.city }}</h3>
            </div>
            <span>{{ selectedDayLabel }}</span>
          </header>
          <p class="route-day-goal">{{ selectedSession?.success || selectedDay.plan?.tip || selectedDay.tip }}</p>

          <div v-if="selectedDayIndex === todayIndex" class="route-now" role="status"><span>지금</span></div>

          <div class="route-timetable" role="table" :aria-label="`${selectedDayIndex + 1}일차 세로 시간표`">
            <div class="route-timetable__head" role="row">
              <span role="columnheader">도착</span>
              <span role="columnheader">출발</span>
              <span role="columnheader">{{ selectedDayState === 'completed' ? '실제 기록' : '계획' }}</span>
              <span role="columnheader">요금</span>
            </div>
            <ol role="rowgroup">
              <li
                v-for="entry in timeline"
                :key="entry.id"
                :id="entry.stationId ? `voyage-stop-${entry.stationId}` : undefined"
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
                  <a
                    v-if="transferHref(entry)"
                    class="route-transfer-link"
                    :href="transferHref(entry)"
                  ><SiteLoopSymbol aria-hidden="true" />이걸로 미션 만들기 →</a>
                </div>
                <span class="route-stop__fare" role="cell">{{ entryFare(entry) }}</span>
              </li>
            </ol>
            <footer>
              <span>이 날 지출<small v-if="selectedDay.actual?.spend?.pendingCount || selectedDay.spend?.pendingCount"> · 미확인 {{ selectedDay.actual?.spend?.pendingCount || selectedDay.spend.pendingCount }}건</small></span>
              <strong>{{ daySpendText }}</strong>
            </footer>
          </div>

          <blockquote v-if="selectedDay.plan?.tip || selectedDay.tip">{{ selectedDay.plan?.tip || selectedDay.tip }}</blockquote>

          <section v-if="selectedDayState !== 'upcoming'" class="route-record" aria-labelledby="voyage-route-record-title">
            <header>
              <div>
                <p>기록</p>
                <h4 id="voyage-route-record-title">이 날의 기록</h4>
              </div>
              <button
                type="button"
                class="route-record__stamp"
                :aria-pressed="selectedStamped"
                @click="toggleSelectedStamp"
              >{{ selectedStamped ? '✓ 다녀옴' : '다녀옴 표시' }}</button>
            </header>
            <label>
              <span>기억 메모</span>
              <textarea v-model="selectedRecord" rows="5" :placeholder="`${selectedDay.city}에서 남기고 싶은 것`"></textarea>
            </label>
            <footer>
              <div class="route-record__actions">
                <button type="button" class="ghost-button" @click="backupRecords">내 기록 백업</button>
                <button type="button" class="ghost-button" @click="requestRestore">백업 복원</button>
                <input ref="restoreInput" class="route-file-input" type="file" accept="application/json,.json" @change="restoreRecords" />
              </div>
              <small role="status" aria-live="polite">{{ backupMessage || '이 브라우저에 자동 저장됩니다.' }}</small>
            </footer>
          </section>
        </template>
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
        @keydown="handleDetailKeydown"
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
          <p class="route-detail__eyebrow">{{ selectedDayIndex + 1 }}일차 · {{ detail.item.arrival || detail.item.departure }}</p>
          <h3 id="route-stop-detail-title">{{ detail.item.title }}</h3>
          <p v-if="detail.item.detail" class="route-detail__copy">{{ detail.item.detail }}</p>
          <a
            v-if="transferHref(detail.item)"
            class="route-transfer-link route-transfer-link--detail"
            :href="transferHref(detail.item)"
          ><SiteLoopSymbol aria-hidden="true" />이걸로 미션 만들기 →</a>
          <form class="route-detail__form" @submit.prevent="saveStopDetail">
            <div class="route-detail__grid">
              <label>
                <span>식당명</span>
                <input v-model="detailDraft.place" name="place" maxlength="120" autocomplete="organization" placeholder="현장에서 들른 곳" />
              </label>
              <label>
                <span>먹은 것</span>
                <input v-model="detailDraft.dish" name="dish" maxlength="180" placeholder="메뉴나 주문한 것" />
              </label>
              <label>
                <span>현지 금액</span>
                <input v-model="detailDraft.localAmount" name="local-amount" type="number" inputmode="decimal" min="0" step="any" placeholder="0" />
              </label>
              <label>
                <span>통화</span>
                <input v-model="detailDraft.currency" name="currency" maxlength="8" autocapitalize="characters" placeholder="EUR" />
              </label>
              <label class="route-detail__wide">
                <span>원화 금액</span>
                <input v-model="detailDraft.krwAmount" name="krw-amount" type="number" inputmode="numeric" min="0" step="1" placeholder="원 단위" />
              </label>
              <label class="route-detail__wide">
                <span>메모</span>
                <textarea v-model="detailDraft.note" name="note" rows="3" maxlength="1000" placeholder="맛, 분위기, 다시 갈 이유"></textarea>
              </label>
              <label class="route-detail__wide">
                <span>구글 지도 링크</span>
                <input v-model="detailDraft.mapUrl" name="map-url" type="url" inputmode="url" placeholder="https://maps.google.com/…" />
              </label>
            </div>

            <a
              v-if="detailDraft.mapUrl && isGoogleMapsUrl(detailDraft.mapUrl)"
              class="route-detail__primary"
              :href="detailDraft.mapUrl"
              target="_blank"
              rel="noopener noreferrer"
            >구글 지도에서 열기 ↗</a>

            <section class="route-detail__photo-editor" aria-labelledby="route-photo-title">
              <div>
                <h4 id="route-photo-title">사진</h4>
                <button type="button" class="ghost-button" @click="choosePhoto">사진 첨부</button>
                <input ref="photoInput" class="route-file-input" type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" @change="addPhoto" />
              </div>
              <p>사진은 최대 4장, 장당 1.5MB까지 이 브라우저에 저장됩니다.</p>
              <div v-if="detailPhotos.length" class="route-detail__photos">
                <figure v-for="(photo, index) in detailPhotos" :key="`${photo.src.slice(0, 48)}-${index}`">
                  <img :src="photo.src" :alt="photo.caption || '현장 사진'" />
                  <figcaption>{{ photo.caption }}</figcaption>
                  <button
                    v-if="index < detailDraft.photos.length"
                    type="button"
                    class="ghost-button"
                    :aria-label="`${photo.caption || '사진'} 삭제`"
                    @click="removePhoto(index)"
                  >삭제</button>
                </figure>
              </div>
              <p v-else class="route-detail__empty">사진이 아직 없습니다.</p>
            </section>

            <div class="route-detail__save">
              <p role="status" aria-live="polite">{{ detailMessage || '저장 전에는 현재 화면에서만 보입니다.' }}</p>
              <button type="submit">정차역 저장</button>
            </div>
          </form>
        </template>

        <div v-if="detail.type === 'city' && detailPhotos.length" class="route-detail__photos">
          <figure v-for="photo in detailPhotos" :key="photo.src">
            <img :src="photo.src" :alt="photo.caption || '여행 사진'" />
            <figcaption>{{ photo.caption }}</figcaption>
          </figure>
        </div>
        <p v-else-if="detail.type === 'city'" class="route-detail__empty">사진이 아직 없습니다.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.voyage-route-map,
.voyage-route-map > * {
  min-width: 0;
}

.route-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.route-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.route-heading__identity,
.route-heading__identity > div {
  min-width: 0;
}

.route-heading__identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.route-heading__badge {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  flex: none;
  border: 2px solid var(--accent);
  border-radius: 50%;
  color: var(--accent-text);
  font-size: 0.72rem;
  font-weight: 900;
}

.route-heading h2,
.route-heading p,
.route-heading > span {
  margin: 0;
}

.route-heading h2 {
  color: var(--text);
  font-size: 1.05rem;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.route-heading p,
.route-heading > span {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-heading p {
  color: var(--accent-text);
  font-weight: 700;
}

.route-heading > span {
  max-width: 44%;
  text-align: right;
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

.route-map-control {
  display: flex;
  justify-content: stretch;
}

.route-map-control button {
  width: 100%;
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
  transition: stroke 140ms ease, opacity 140ms ease, filter 140ms ease;
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

.route-segment:focus-visible path {
  filter: drop-shadow(0 0 4px var(--safety));
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

.route-station:focus {
  outline: none;
}

.route-station:focus-visible .route-station__dot {
  stroke: var(--safety);
  stroke-width: 6;
  filter: drop-shadow(0 0 4px var(--safety));
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

.route-day-tabs button.is-upcoming:not(.active) {
  opacity: 0.5;
}

.route-day-tabs button.prep {
  min-width: 54px;
  border-style: dashed;
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

.route-day-panel.is-upcoming .route-day-goal,
.route-day-panel.is-upcoming .route-timetable,
.route-day-panel.is-upcoming blockquote {
  opacity: 0.56;
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

.route-transfer-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
  text-decoration: none;
}

.route-transfer-link :deep(.site-loop-symbol-sm) {
  width: 18px;
}

.route-transfer-link:hover,
.route-transfer-link:focus-visible {
  color: var(--safety);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.route-transfer-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
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

.route-record {
  display: grid;
  gap: 14px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.route-record > header,
.route-record > footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.route-record h4,
.route-record p {
  margin: 0;
}

.route-record p {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.route-record h4 {
  margin-top: 3px;
  color: var(--text);
  font-size: 1rem;
}

.route-record__stamp {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px dashed var(--accent);
  border-radius: 999px;
  background: transparent;
  color: var(--accent-text);
  font: inherit;
  font-size: var(--fs-caption);
  font-weight: 800;
  cursor: pointer;
}

.route-record__stamp[aria-pressed='true'] {
  border-style: solid;
  background: var(--accent);
  color: #fff;
}

.route-record label {
  display: grid;
  gap: 7px;
  color: var(--text-2);
  font-size: var(--fs-caption);
  font-weight: 800;
}

.route-record textarea {
  width: 100%;
  min-width: 0;
  resize: vertical;
  padding: 12px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: var(--panel-2);
  color: var(--text);
  font: inherit;
  line-height: 1.55;
}

.route-record textarea:focus {
  border-color: var(--accent);
  outline: 2px solid color-mix(in srgb, var(--accent) 22%, transparent);
  outline-offset: 1px;
}

.route-record > footer small {
  color: var(--muted);
  text-align: right;
}

.route-record__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.route-file-input {
  position: fixed;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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
  max-height: min(86vh, 86dvh);
  overflow: auto;
  padding: 15px 20px 0;
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

.route-transfer-link--detail {
  margin-top: 4px;
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

.route-detail__form {
  display: grid;
  gap: 18px;
  margin-top: 20px;
}

.route-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(92px, 0.45fr);
  gap: 13px 10px;
}

.route-detail__grid label {
  display: grid;
  gap: 6px;
  min-width: 0;
  color: var(--text-2);
  font-size: var(--fs-caption);
  font-weight: 800;
}

.route-detail__grid label:nth-child(1),
.route-detail__grid label:nth-child(2),
.route-detail__wide {
  grid-column: 1 / -1;
}

.route-detail__grid input,
.route-detail__grid textarea {
  width: 100%;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: var(--panel-2);
  color: var(--text);
  font: inherit;
  line-height: 1.45;
}

.route-detail__grid textarea {
  resize: vertical;
}

.route-detail__grid input:focus,
.route-detail__grid textarea:focus {
  border-color: var(--accent);
  outline: 2px solid color-mix(in srgb, var(--accent) 22%, transparent);
  outline-offset: 1px;
}

.route-detail__photo-editor {
  display: grid;
  gap: 9px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.route-detail__photo-editor > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.route-detail__photo-editor h4,
.route-detail__photo-editor p,
.route-detail__save p {
  margin: 0;
}

.route-detail__photo-editor > p,
.route-detail__save p {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.route-detail__photos {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.route-detail__photos figure {
  position: relative;
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

.route-detail__photos figure > button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: color-mix(in srgb, var(--panel) 90%, transparent);
}

.route-detail__empty {
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.route-detail__save {
  position: sticky;
  z-index: 2;
  bottom: 0;
  display: grid;
  gap: 8px;
  margin: 0 -20px;
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--line-strong);
  background: color-mix(in srgb, var(--panel) 96%, transparent);
  backdrop-filter: blur(10px);
}

.route-detail__save button {
  min-height: 48px;
  border: 0;
  border-radius: 9px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
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

  .route-map-control {
    display: none;
  }

  .route-detail {
    top: 0;
    left: auto;
    width: 390px;
    max-height: none;
    padding: 76px 26px 0;
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

  .route-detail__save {
    margin-right: -26px;
    margin-left: -26px;
    padding-right: 26px;
    padding-left: 26px;
  }
}

@media (max-width: 899px) {
  .route-day-panel {
    order: 1;
  }

  .route-map-control {
    order: 2;
  }

  .route-map-panel {
    order: 3;
  }
}

@media (max-width: 560px) {
  .route-heading {
    gap: 12px;
  }

  .route-heading > span {
    max-width: 48%;
    text-align: right;
  }

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

  .route-record > header,
  .route-record > footer {
    align-items: stretch;
    flex-direction: column;
  }

  .route-record > footer small {
    text-align: left;
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
