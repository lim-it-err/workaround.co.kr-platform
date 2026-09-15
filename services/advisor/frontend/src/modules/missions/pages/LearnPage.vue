<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import InsightCard from '../components/InsightCard.vue'
import cards from '../data/sampleCards.js'
import caseFileData from '../data/sampleCaseFiles.js'
import { practiceCatalog, standalonePracticeCatalog } from '../games/practiceCatalog.js'
import {
  ADVANCED_FILTER_GROUPS,
  LEARN_CODE_OPTIONS,
  LEARN_KIND_OPTIONS,
  LEARN_STATUS_OPTIONS,
  LEARN_TIME_OPTIONS,
  createLearnCatalog,
  filterLearnCatalog,
  summarizeLearnCatalog,
} from '../store/learnCatalog.js'
import { useMissions } from '../store/missions.js'
import { usePractice } from '../store/practice.js'

const route = useRoute()
const learner = useMissions()
const practice = usePractice()
const visibleLimit = ref(30)
const showAll = ref(false)
const filters = reactive({
  query: '',
  time: 'all',
  code: 'all',
  kind: 'all',
  status: 'all',
  difficulty: [],
  scope: [],
  missionType: [],
})

const catalog = computed(() => createLearnCatalog({
  missions: learner.state.missions,
  courses: learner.state.courses,
  caseFiles: caseFileData.caseFiles,
  projects: learner.state.projects,
  practiceGames: standalonePracticeCatalog,
  learnerState: learner.state,
  practiceState: practice.state,
}))
const summary = computed(() => summarizeLearnCatalog(catalog.value))
const filtered = computed(() => filterLearnCatalog(catalog.value, filters))
const visibleItems = computed(() => filtered.value.slice(0, visibleLimit.value))
const hiddenCount = computed(() => Math.max(0, filtered.value.length - visibleItems.value.length))
const activeAdvancedCount = computed(() => filters.difficulty.length + filters.scope.length + filters.missionType.length)
const courseItems = computed(() => catalog.value.filter((item) => item.kind === 'course'))
const hasActiveFilters = computed(() => Boolean(
  filters.query.trim()
  || filters.time !== 'all'
  || filters.code !== 'all'
  || filters.kind !== 'all'
  || filters.status !== 'all'
  || activeAdvancedCount.value,
))
const isCatalogVisible = computed(() => showAll.value || hasActiveFilters.value)

const lastPractice = computed(() => {
  const last = practice.state.last
  const game = practiceCatalog.find((entry) => entry.id === last?.gameId)
  const round = game?.rounds.find((entry) => entry.id === last?.roundId)
  return game && round ? { game, round, href: `/games/practice/${game.id}/${round.id}` } : null
})

const linkedCardId = computed(() => (typeof route.query.card === 'string' ? route.query.card : ''))
const linkedCard = computed(() => [...cards.readingCards, ...cards.cinemaCards]
  .find((card) => card.id === linkedCardId.value) ?? null)

function learnLink(path) {
  return { path, state: { from: '/learn', fromLabel: '배우기' } }
}

function toggleAdvanced(key, value) {
  const selected = filters[key]
  const index = selected.indexOf(value)
  if (index === -1) selected.push(value)
  else selected.splice(index, 1)
}

function advancedLabel(value) {
  return { Easy: '쉬움', Normal: '보통', Hard: '어려움' }[value] ?? value
}

function resetFilters() {
  Object.assign(filters, { query: '', time: 'all', code: 'all', kind: 'all', status: 'all' })
  filters.difficulty.splice(0)
  filters.scope.splice(0)
  filters.missionType.splice(0)
}

function applyHash(hash) {
  const hashKinds = { '#practice': 'practice', '#projects': 'project', '#courses': 'course' }
  if (hashKinds[hash]) filters.kind = hashKinds[hash]
  if (hash === '#learn') filters.kind = 'all'
}

watch(() => route.hash, applyHash, { immediate: true })
watch(filters, () => { visibleLimit.value = 30 }, { deep: true })
</script>

<template>
  <div class="learn-page">
    <section class="surface-hero">
      <span>배우기</span>
      <h1>한 서가에서, 지금 맞는 배움을 고르세요</h1>
      <p>코스부터 한 판 연습까지 시간·방식·진행 상태로 바로 좁힐 수 있습니다.</p>
    </section>

    <section v-if="linkedCard" class="linked-card" aria-labelledby="linked-card-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow">오늘의 카드</span>
          <h2 id="linked-card-title">이어 읽기</h2>
        </div>
        <router-link :to="learnLink(`/games/practice/${cards.readingCards.includes(linkedCard) ? 'reading' : 'cinema'}/${linkedCard.id}`)">연습 화면으로 →</router-link>
      </div>
      <InsightCard
        :card="linkedCard"
        :fork="cards.cardForks[linkedCard.id]"
        :saved-fork-choice="learner.state.cardForkChoices[linkedCard.id]"
        initial-open
        @choose-fork="learner.chooseCardFork(linkedCard.id, $event)"
      />
    </section>

    <section v-if="!isCatalogVisible" class="course-preview" aria-labelledby="featured-courses-title">
      <div class="index-heading">
        <h2 id="featured-courses-title">코스</h2>
        <p>{{ courseItems.length }}개</p>
      </div>
      <div class="index-list">
        <router-link
          v-for="item in courseItems"
          :key="item.id"
          :to="learnLink(item.href)"
          class="index-row"
          data-course-preview
          :data-course-id="item.sourceId"
        >
          <span class="row-emoji" aria-hidden="true">{{ item.emoji }}</span>
          <span class="row-copy">
            <span class="row-kicker">{{ item.kindLabel }} · {{ item.statusLabel }}</span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.context }}</small>
          </span>
          <span class="row-meta">
            <span>{{ item.minutes }}분</span>
            <span>{{ item.writesCode ? '코드 작성' : '코드 없음' }}</span>
          </span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </router-link>
      </div>
    </section>

    <aside v-if="lastPractice" class="resume-row" aria-label="이어 하던 것">
      <span aria-hidden="true">↗</span>
      <div>
        <strong>이어 하던 것</strong>
        <small>{{ lastPractice.game.title }} · {{ lastPractice.round.title ?? lastPractice.round.question }}</small>
      </div>
      <router-link :to="learnLink(lastPractice.href)">이어서</router-link>
    </aside>

    <section class="catalog-controls" aria-label="배울 거리 필터">
      <div class="search-row">
        <label class="search-field">
          <span>검색</span>
          <input v-model="filters.query" type="search" placeholder="제목·도메인으로 찾기" />
        </label>
        <button class="reset-button" type="button" @click="resetFilters">필터 초기화</button>
      </div>

      <div class="filter-grid" aria-label="배우기 필터">
        <label>
          <span>시간</span>
          <select v-model="filters.time" aria-label="시간">
            <option v-for="option in LEARN_TIME_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>코드 작성</span>
          <select v-model="filters.code" aria-label="코드 작성">
            <option v-for="option in LEARN_CODE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>형식</span>
          <select v-model="filters.kind" aria-label="형식">
            <option v-for="option in LEARN_KIND_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>완료</span>
          <select v-model="filters.status" aria-label="완료">
            <option v-for="option in LEARN_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </div>

      <details class="advanced-filters">
        <summary>고급 필터 <span v-if="activeAdvancedCount">{{ activeAdvancedCount }}</span></summary>
        <div v-for="group in ADVANCED_FILTER_GROUPS" :key="group.key" class="advanced-group">
          <strong>{{ group.label }}</strong>
          <div class="chip-row">
            <button
              v-for="value in group.values"
              :key="value"
              type="button"
              class="chip-toggle"
              :aria-pressed="filters[group.key].includes(value)"
              @click="toggleAdvanced(group.key, value)"
            >{{ advancedLabel(value) }}</button>
          </div>
        </div>
      </details>
    </section>

    <button
      v-if="!hasActiveFilters"
      type="button"
      class="catalog-disclosure"
      aria-controls="learn"
      :aria-expanded="showAll"
      @click="showAll = !showAll"
    >
      <span>{{ showAll ? '전체 목록 접기' : `전체 ${catalog.length}개 보기` }}</span>
      <span aria-hidden="true">{{ showAll ? '↑' : '↓' }}</span>
    </button>

    <section v-if="isCatalogVisible" id="learn" class="content-index" data-content-index aria-labelledby="learn-index-title">
      <div class="index-heading">
        <div>
          <span class="eyebrow">통합 인덱스</span>
          <h2 id="learn-index-title">배울 거리</h2>
        </div>
        <p aria-live="polite">{{ filtered.length }}개</p>
      </div>
      <p class="type-summary">
        <template v-for="(entry, index) in summary" :key="entry.kind">
          <span>{{ entry.label }} {{ entry.count }}</span><span v-if="index < summary.length - 1" aria-hidden="true"> · </span>
        </template>
      </p>

      <div class="index-list">
        <router-link
          v-for="item in visibleItems"
          :key="item.id"
          :to="learnLink(item.href)"
          class="index-row"
          :class="{ 'mission-card': item.kind === 'mission' }"
          :data-content-kind="item.kind"
          :data-course-id="item.kind === 'course' ? item.sourceId : undefined"
        >
          <span class="row-emoji" aria-hidden="true">{{ item.emoji }}</span>
          <span class="row-copy">
            <span class="row-kicker">{{ item.kindLabel }} · {{ item.statusLabel }}</span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.context }}</small>
          </span>
          <span class="row-meta">
            <span>{{ item.minutes }}분</span>
            <span>{{ item.writesCode ? '코드 작성' : '코드 없음' }}</span>
          </span>
          <span class="row-arrow" aria-hidden="true">→</span>
        </router-link>
      </div>

      <p v-if="!filtered.length" class="empty-state">맞는 항목이 없습니다. 필터를 하나씩 풀어 보세요.</p>
      <button v-if="hiddenCount" type="button" class="show-more" @click="visibleLimit += 30">
        더 보기 · {{ Math.min(30, hiddenCount) }}개
      </button>
    </section>
  </div>
</template>

<style scoped>
.learn-page { max-width: 920px; margin: 0 auto; }
.surface-hero { margin-bottom: 30px; padding: 12px 0 24px 22px; border-left: 3px solid var(--accent); }
.surface-hero > span, .eyebrow { color: var(--accent-text); font-size: 12px; font-weight: 800; letter-spacing: .04em; }
.surface-hero h1 { margin: 7px 0 5px; font-size: clamp(24px, 4vw, 34px); }
.surface-hero p, .type-summary { margin: 0; color: var(--fg-dim); }
.linked-card { margin: 0 0 26px; }
.course-preview { margin: 0 0 24px; }
.section-heading, .index-heading, .resume-row, .search-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.section-heading h2, .index-heading h2 { margin: 3px 0 0; font-size: 20px; }
.section-heading a { min-height: 42px; display: inline-flex; align-items: center; color: var(--accent-text); font-size: 13px; text-decoration: none; }
.resume-row { margin: 0 0 24px; padding: 12px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.resume-row > span { color: var(--accent-text); font-size: 20px; }
.resume-row div { flex: 1; display: grid; gap: 2px; }
.resume-row small { color: var(--fg-dim); }
.resume-row a { min-height: 42px; padding: 0 14px; display: inline-flex; align-items: center; border: 1px solid var(--accent); border-radius: 8px; color: var(--accent-text); text-decoration: none; font-weight: 700; }
.catalog-controls { padding: 21px 0 18px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.search-field, .filter-grid label { display: grid; gap: 6px; color: var(--fg-dim); font-size: 12px; font-weight: 700; }
.search-field { flex: 1; }
input, select { box-sizing: border-box; min-height: 42px; width: 100%; padding: 0 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); color: var(--fg); font: inherit; }
.reset-button, .show-more, .chip-toggle { min-height: 42px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); color: var(--fg); font: inherit; font-weight: 700; cursor: pointer; }
.reset-button { align-self: end; padding: 0 15px; }
.filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 14px; }
.advanced-filters { margin-top: 14px; }
.advanced-filters summary { min-height: 42px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 750; }
.advanced-filters summary span { display: grid; place-items: center; min-width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: white; font-size: 11px; }
.advanced-group { display: grid; grid-template-columns: 90px 1fr; gap: 12px; align-items: start; margin-top: 12px; }
.advanced-group > strong { padding-top: 11px; color: var(--fg-dim); font-size: 12px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-toggle { min-height: 40px; padding: 0 13px; }
.chip-toggle[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-text); }
.catalog-disclosure { width: 100%; min-height: 50px; padding: 0 2px; display: flex; align-items: center; justify-content: space-between; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: var(--fg); font: inherit; font-weight: 800; cursor: pointer; }
.catalog-disclosure:hover { color: var(--accent-text); }
.content-index { padding-top: 28px; scroll-margin-top: 80px; }
.index-heading p { margin: 0; color: var(--fg-dim); font-variant-numeric: tabular-nums; }
.type-summary { margin-top: 10px; font-size: 13px; }
.index-list { margin-top: 15px; border-top: 1px solid var(--line); }
.index-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto 20px; gap: 12px; align-items: center; min-height: 78px; padding: 10px 2px; border-bottom: 1px solid var(--line); color: var(--fg); text-decoration: none; }
.index-row:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }
.row-emoji { font-size: 21px; text-align: center; }
.row-copy { min-width: 0; display: grid; gap: 2px; }
.row-kicker { color: var(--accent-text); font-size: 11px; font-weight: 750; }
.row-copy strong { overflow-wrap: anywhere; line-height: 1.35; }
.row-copy small { color: var(--fg-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-meta { display: grid; gap: 3px; color: var(--fg-dim); font-size: 11px; text-align: right; white-space: nowrap; }
.row-arrow { color: var(--accent-text); }
.empty-state { padding: 40px 0; color: var(--fg-dim); text-align: center; }
.show-more { width: 100%; margin-top: 18px; }

@media (max-width: 720px) {
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .surface-hero { padding-left: 15px; }
  .search-row { align-items: stretch; flex-direction: column; }
  .reset-button { align-self: stretch; }
  .advanced-group { grid-template-columns: 1fr; gap: 2px; }
  .index-row { grid-template-columns: 30px minmax(0, 1fr) 16px; gap: 9px; min-height: 82px; }
  .row-meta { grid-column: 2; grid-row: 2; display: flex; gap: 8px; }
  .row-arrow { grid-column: 3; grid-row: 1 / span 2; }
  .resume-row { align-items: flex-start; }
  .resume-row a { align-self: center; }
  .type-summary { line-height: 1.8; }
}
</style>
