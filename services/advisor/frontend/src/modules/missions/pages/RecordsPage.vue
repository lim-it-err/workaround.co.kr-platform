<script setup>
import { computed, ref } from 'vue'
import { useMissions } from '../store/missions.js'
import HistoryPage from './HistoryPage.vue'
import SeasonPage from './SeasonPage.vue'

const store = useMissions()
const selectedSeasonId = ref('')
const lifetime = computed(() => store.lifetimeSeasonTotals())
const lifetimeTotal = computed(() => Object.values(lifetime.value).reduce((sum, value) => sum + value, 0))
const pastSeasons = computed(() => store.pastSeasonOverviews())
const statRows = [
  { key: 'vision', label: '안목' },
  { key: 'voice', label: '언어화' },
  { key: 'judgment', label: '판단' },
  { key: 'culture', label: '교양' },
]

function shortDate(date) {
  return String(date).slice(5).replace('-', '.')
}

function selectSeason(id) {
  selectedSeasonId.value = selectedSeasonId.value === id ? '' : id
}
</script>

<template>
  <div class="records-page">
    <section class="surface-hero">
      <span>기록</span>
      <h1>배운 흔적을 돌아봅니다</h1>
      <p>제출과 리뷰, 시즌마다 달라진 방향을 함께 남깁니다.</p>
    </section>

    <section class="lifetime" aria-labelledby="lifetime-title">
      <div class="section-title">
        <h2 id="lifetime-title">누적 스탯</h2>
        <strong>총 {{ lifetimeTotal }}</strong>
      </div>
      <dl>
        <div v-for="stat in statRows" :key="stat.key">
          <dt>{{ stat.label }}</dt>
          <dd>{{ lifetime[stat.key] }}</dd>
        </div>
      </dl>
    </section>

    <HistoryPage embedded />

    <section id="season" class="season-embed" aria-labelledby="season-title">
      <h2 id="season-title">이번 시즌</h2>
      <SeasonPage embedded />
    </section>

    <section class="past-seasons" aria-labelledby="past-season-title">
      <div class="section-title">
        <h2 id="past-season-title">지난 시즌</h2>
        <span>{{ pastSeasons.length }}개</span>
      </div>
      <div v-if="pastSeasons.length" class="past-season-list">
        <template v-for="season in pastSeasons" :key="season.id">
          <button
            class="past-season-row"
            type="button"
            :aria-expanded="selectedSeasonId === season.id"
            :aria-controls="`past-season-${season.id}`"
            @click="selectSeason(season.id)"
          >
            <span>
              <strong>시즌</strong>
              <small>{{ season.seasonStart }} → {{ shortDate(season.endDate) }}</small>
            </span>
            <span>
              <small>합계 {{ season.total }}</small>
              <strong>{{ season.ending?.title ?? '결말 없음' }}</strong>
            </span>
          </button>
          <div
            v-if="selectedSeasonId === season.id"
            :id="`past-season-${season.id}`"
            class="past-season-detail"
          >
            <SeasonPage :season-id="season.id" embedded readonly />
          </div>
        </template>
      </div>
      <p v-else class="past-empty">닫힌 시즌이 아직 없습니다.</p>
    </section>
  </div>
</template>

<style scoped>
.records-page { width: 100%; max-width: 900px; min-width: 0; margin: 0 auto; }
.surface-hero { margin-bottom: 28px; padding: 12px 0 24px 22px; border-left: 3px solid var(--accent); }
.surface-hero > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.surface-hero h1 { margin: 7px 0 5px; font-size: clamp(24px, 4vw, 34px); }
.surface-hero p { margin: 0; color: var(--fg-dim); }
.section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.section-title h2 { margin: 0; font-size: 20px; }
.section-title > strong { color: var(--accent-text); font-size: 14px; }
.section-title > span { color: var(--fg-dim); font-size: 12px; }
.lifetime { margin-bottom: 34px; padding-block: 18px; border-block: 1px solid var(--line); }
.lifetime dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 14px 0 0; border-top: 1px solid var(--line); }
.lifetime dl > div { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 8px; min-height: 46px; padding-inline: 14px; border-right: 1px solid var(--line); }
.lifetime dl > div:first-child { padding-left: 0; }
.lifetime dl > div:last-child { padding-right: 0; border-right: 0; }
.lifetime dt { color: var(--fg-dim); font-size: 12px; }
.lifetime dd { margin: 0; font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
.season-embed, .past-seasons { margin-top: 38px; padding-top: 26px; border-top: 1px solid var(--line); }
.season-embed > h2 { margin: 0 0 18px; font-size: 20px; }
.past-season-list { margin-top: 14px; border-top: 1px solid var(--line); }
.past-season-row { display: grid; width: 100%; min-height: 64px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 20px; padding: 10px 0; border: 0; border-bottom: 1px solid var(--line); background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.past-season-row > span { display: flex; min-width: 0; justify-content: space-between; gap: 12px; }
.past-season-row > span:last-child { text-align: right; }
.past-season-row strong { overflow: hidden; font-size: 13.5px; text-overflow: ellipsis; white-space: nowrap; }
.past-season-row small { color: var(--fg-dim); font-size: 12px; font-variant-numeric: tabular-nums; }
.past-season-row:hover { color: var(--accent-text); }
.past-season-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.past-season-detail { padding: 22px 0 28px; border-bottom: 1px solid var(--line); }
.past-empty { margin: 14px 0 0; padding: 18px 0; border-block: 1px solid var(--line); color: var(--fg-dim); font-size: 13.5px; }

@media (max-width: 600px) {
  .lifetime dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lifetime dl > div { border-bottom: 1px solid var(--line); }
  .lifetime dl > div:nth-child(2) { border-right: 0; }
  .lifetime dl > div:nth-child(3), .lifetime dl > div:nth-child(4) { border-bottom: 0; }
  .lifetime dl > div:nth-child(3) { padding-left: 0; }
  .past-season-row { grid-template-columns: 1fr; gap: 5px; }
  .past-season-row > span:last-child { text-align: left; }
}
</style>
