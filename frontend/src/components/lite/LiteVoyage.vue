<script setup>
import { computed, nextTick, ref } from 'vue'
import LiteScreen from './LiteScreen.vue'
import { useLiteKeys } from '../../composables/useLiteKeys.js'
import { VOYAGES } from '../../data/voyage.js'
import { EMPTY_RECORD, routeRows, voyageYear } from './liteVoyage.js'

// TKT-229: lite 여행 — 여행 목록 → 노선 한 줄(고른 줄만 펼침) → 결산. Esc = 한 단계 위.
const emit = defineEmits(['back'])

const stage = ref('list') // 'list' | 'route'
const tripIndex = ref(0)
const active = ref(0)
const trip = computed(() => VOYAGES[tripIndex.value])
const rows = computed(() => (stage.value === 'route' ? routeRows(trip.value) : []))
const hasDays = computed(() => (trip.value?.days || []).length > 0)
const count = computed(() => (stage.value === 'list' ? VOYAGES.length : rows.value.length))

const crumb = computed(() => (stage.value === 'list' ? '여행' : `여행 › ${trip.value.title}`))
const keys = computed(() => (stage.value === 'list'
  ? '↑↓ 고르기 · Enter 노선 보기 · Esc 뒤로'
  : '↑↓ 역 따라가기 · Esc 여행 목록'))

function pick(index) {
  active.value = Math.max(0, Math.min(count.value - 1, index))
  nextTick(() => document.getElementById(`lite-voyage-opt-${active.value}`)?.scrollIntoView?.({ block: 'nearest' }))
}

function enter(index = active.value) {
  if (stage.value !== 'list') return false
  tripIndex.value = index
  stage.value = 'route'
  active.value = 0
}

function up() {
  if (stage.value === 'route') {
    stage.value = 'list'
    active.value = tripIndex.value
  } else {
    emit('back')
  }
}

const { armed, pointerPick } = useLiteKeys({
  onMove: delta => pick(active.value + delta),
  onHome: () => pick(0),
  onEnd: () => pick(count.value - 1),
  onEnter: () => (stage.value === 'list' ? enter() : false),
  onBack: up
})

function onClick(index) {
  if (stage.value === 'list') pointerPick(index, { current: active.value, select: pick, enter })
  else pick(index)
}
</script>

<template>
  <LiteScreen :crumb="crumb" :keys="keys" @back="up">
    <template v-if="stage === 'list'">
      <p class="lv-ttl">여행 — 기록선</p>
      <ul class="lv-sel" role="listbox" aria-label="여행 목록" data-lite-voyage-list>
        <li
          v-for="(voyage, index) in VOYAGES"
          :id="`lite-voyage-opt-${index}`"
          :key="voyage.id"
          role="option"
          :aria-selected="index === active"
          :data-voyage="voyage.id"
          @click="onClick(index)"
        >
          <span class="lv-name">{{ voyage.title }}</span>
          <span class="lv-r">{{ voyageYear(voyage) }}</span>
        </li>
      </ul>
      <p class="lv-sub" role="status" aria-live="polite">{{ armed ? '한 번 더 누르면 노선을 봅니다' : `${VOYAGES[active].title} 선택 · Enter 노선 보기` }}</p>
    </template>
    <template v-else>
      <p class="lv-ttl">{{ trip.title }} {{ voyageYear(trip) }}</p>
      <p v-if="!hasDays" class="lv-sub" data-lite-voyage-empty>{{ EMPTY_RECORD }}</p>
      <ol class="lv-route" aria-label="노선" data-lite-voyage-route>
        <li
          v-for="(row, index) in rows"
          :id="`lite-voyage-opt-${index}`"
          :key="row.key"
          :class="{ on: index === active, settle: row.key === 'settlement' }"
          :aria-current="index === active ? 'true' : undefined"
          :data-row="row.key"
          @click="onClick(index)"
        >
          <div class="lv-line">
            <span class="lv-d">{{ row.label }}</span>
            <span v-if="row.key !== 'settlement'" class="lv-s" aria-hidden="true">┃</span>
            <span v-if="row.city" class="lv-city" :title="row.city">{{ row.city }}</span>
            <span class="lv-sum" :class="{ 'lv-clamp': index !== active && row.key !== 'settlement', 'lv-clamp2': index === active && row.key !== 'settlement' }">{{ row.summary }}</span>
          </div>
          <div v-if="index === active && row.extra.length" class="lv-extra">
            <p v-for="(line, k) in row.extra" :key="k" class="lv-clamp2">{{ line }}</p>
          </div>
        </li>
      </ol>
    </template>
  </LiteScreen>
</template>

<style scoped>
.lv-ttl {
  margin: 0 0 8px;
  color: var(--safety);
  font-weight: 700;
}

.lv-sub {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.lv-sel,
.lv-route {
  margin: 0;
  padding: 0;
  list-style: none;
}

.lv-sel li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-height: 48px;
  padding: 10px 8px;
  border-bottom: 1px dashed var(--line);
  cursor: pointer;
}

.lv-sel li::before {
  content: '  ';
  white-space: pre;
}

.lv-r {
  margin-left: auto;
  color: var(--muted);
  font-size: 0.85rem;
}

.lv-sel li[aria-selected='true'] {
  background: var(--text);
  color: var(--bg);
  text-shadow: none;
}

.lv-sel li[aria-selected='true']::before {
  content: '▶ ';
}

.lv-sel li[aria-selected='true'] .lv-r {
  color: var(--bg);
}

.lv-route li {
  min-height: 44px;
  padding: 6px 8px;
  cursor: pointer;
}

.lv-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  min-height: 32px;
}

.lv-d {
  flex: none;
  width: 5.2em;
  color: var(--muted);
}

.lv-s {
  flex: none;
  color: var(--muted);
}

.lv-city {
  flex: none;
  max-width: 9em;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lv-clamp2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

/* 넓은 화면: DAY | ┃ | 도시 | 요약 고정 그리드 — 모든 줄이 같은 규칙. */
@media (min-width: 481px) {
  .lv-line {
    display: grid;
    grid-template-columns: 5.2em 1ch 14em minmax(0, 1fr);
    column-gap: 8px;
    align-items: baseline;
  }

  .lv-city {
    max-width: none;
  }

  .lv-sum {
    grid-column: 4;
  }

  .lv-route li.settle .lv-line {
    display: flex;
  }
}

.lv-sum {
  min-width: 0;
  flex: 1;
  color: var(--muted);
  font-size: 0.85rem;
}

.lv-clamp {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.lv-route li.on {
  background: var(--text);
  color: var(--bg);
  text-shadow: none;
}

.lv-route li.on .lv-d,
.lv-route li.on .lv-s,
.lv-route li.on .lv-sum {
  color: var(--bg);
}

.lv-route li.settle .lv-sum {
  margin-left: auto;
  text-align: right;
  flex: none;
  color: var(--safety);
  font-size: 1rem;
  font-weight: 700;
}

.lv-route li.settle.on .lv-sum {
  color: var(--bg);
}

.lv-extra {
  padding: 2px 0 6px calc(5.2em + 8px + 1ch + 8px);
  font-size: 0.85rem;
}

.lv-extra p {
  margin: 0;
}

@media (max-width: 480px) {
  .lv-line {
    flex-wrap: wrap;
  }

  .lv-sum {
    flex-basis: 100%;
    padding-left: calc(5.2em + 8px + 1ch + 8px);
  }

  .lv-route li.settle .lv-sum {
    flex-basis: auto;
    margin-left: auto;
    padding-left: 0;
  }

  .lv-extra {
    padding-left: 0;
  }
}
</style>
