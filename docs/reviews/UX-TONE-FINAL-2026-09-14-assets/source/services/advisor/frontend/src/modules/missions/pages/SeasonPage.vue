<script setup>
import { computed, ref } from 'vue'
import { useMissions } from '../store/missions.js'

const props = defineProps({
  embedded: { type: Boolean, default: false },
  seasonId: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
})

const store = useMissions()
const overview = computed(() => store.seasonOverview(props.seasonId || undefined))
const pendingCount = computed(() => store.state.seasons.pendingGains.length)
const statsTitleId = computed(() => `season-stats-${props.seasonId || 'current'}`)
const endingTitleId = computed(() => `season-ending-${props.seasonId || 'current'}`)
const startFeedback = ref('')

const stats = [
  { key: 'vision', emoji: '👁', label: '안목', color: 'var(--accent-text)' },
  { key: 'voice', emoji: '🗣', label: '언어화', color: 'var(--line-d-text)' },
  { key: 'judgment', emoji: '🧭', label: '판단', color: 'var(--warn)' },
  { key: 'culture', emoji: '📚', label: '교양', color: 'var(--good)' },
]

const largestStat = computed(() => Math.max(
  1,
  ...stats.map((stat) => overview.value?.totals[stat.key] ?? 0),
))

function statMeta(key) {
  return stats.find((stat) => stat.key === key) ?? { emoji: '✦', label: key }
}

function sourceLabel(source) {
  const [kind, id] = String(source ?? '').split(':')
  const mission = id ? store.getMission(id) : null
  if (kind === 'mission-submit') return mission ? `미션 제출 · ${mission.title}` : '미션 제출'
  if (kind === 'explanation') return mission ? `설명 훈련 · ${mission.title}` : '설명 훈련'
  if (kind === 'ending-prediction') return mission ? `결말 예측 적중 · ${mission.title}` : '결말 예측 적중'
  if (kind === 'planner-agreement') return mission ? `기획자 합의문 · ${mission.title}` : '기획자 합의문'
  if (kind === 'routine-check') return '루틴 수동 체크'
  if (kind === 'probe-verdict') return '한 번만 물어본다면 · 가설 지목'
  if (kind === 'probe-best') return '한 번만 물어본다면 · 최선의 관측'
  if (kind === 'boundary-choice') return '경계선 한 칸 · 경계 선택'
  if (kind === 'boundary-recommended') return '경계선 한 칸 · 상황의 권장'
  return source || '이전 적립 기록'
}

function displayDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return '날짜 미상'
  return new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function beginSeason() {
  const result = store.startNewSeason()
  if (!result.ok) return
  startFeedback.value = result.retried
    ? `새 시즌을 시작하고 대기 중이던 적립 ${result.retried}건을 반영했습니다.`
    : '새 시즌을 시작했습니다.'
}
</script>

<template>
  <div class="season-page" :class="{ 'is-readonly': readonly }">
    <section v-if="!overview" class="season-empty" aria-label="이번 시즌 없음">
      <p v-if="pendingCount">아직 시즌을 시작하지 않아 적립 {{ pendingCount }}건이 기다리고 있습니다.</p>
      <p v-else>아직 시작한 시즌이 없습니다.</p>
      <button v-if="!readonly" class="season-start" type="button" @click="beginSeason">새 시즌 시작</button>
    </section>

    <template v-else>
      <section v-if="!embedded" class="hero">
        <div>
          <h1>{{ readonly ? '지난 시즌' : '이번 시즌' }}</h1>
          <p>{{ overview.seasonStart }} — {{ overview.endDate }}</p>
        </div>
        <div class="day-badge" :class="{ ended: overview.ended }">
          <strong>{{ overview.dDay }}</strong>
          <span>{{ overview.ended ? '시즌 완료' : `${overview.day}일차` }}</span>
        </div>
      </section>
      <div v-else class="season-inline-head">
        <span>{{ overview.seasonStart }} — {{ overview.endDate }}</span>
        <strong>{{ readonly ? '읽기 전용' : overview.ended ? '시즌 완료' : `${overview.day}일차 · ${overview.dDay}` }}</strong>
      </div>

      <div v-if="!readonly && pendingCount" class="gain-notice" role="status">
        <div>
          <strong>{{ overview.ended ? '시즌이 끝나 적립하지 못했습니다.' : '적립을 기다리고 있습니다.' }}</strong>
          <span>새 시즌을 시작하면 {{ pendingCount }}건을 첫 기록으로 다시 반영합니다.</span>
        </div>
        <button class="season-start" type="button" @click="beginSeason">새 시즌 시작</button>
      </div>

      <section class="stat-block" :aria-labelledby="statsTitleId">
        <div class="section-head">
          <h2 :id="statsTitleId">나의 4스탯</h2>
          <span>총 {{ overview.total }}</span>
        </div>
        <div class="stats">
          <div v-for="stat in stats" :key="stat.key" class="stat-row" :data-stat="stat.key">
            <div class="stat-label"><span>{{ stat.emoji }}</span>{{ stat.label }}</div>
            <div class="stat-track" :aria-label="`${stat.label} ${overview.totals[stat.key]}`">
              <div
                class="stat-fill"
                :style="{ width: `${(overview.totals[stat.key] / largestStat) * 100}%`, background: stat.color }"
              ></div>
            </div>
            <strong class="stat-value">{{ overview.totals[stat.key] }}</strong>
          </div>
        </div>
        <p class="perfect-days">모든 슬롯을 채운 날 {{ overview.perfectDays }}일</p>
      </section>

      <section class="log-block">
        <div class="section-head">
          <h2>최근 적립</h2>
          <span>최대 10건</span>
        </div>
        <div v-if="overview.recentGains.length" class="gain-list">
          <div v-for="(gain, index) in overview.recentGains" :key="`${gain.date}-${gain.source}-${index}`" class="gain">
            <span class="gain-icon">{{ statMeta(gain.stat).emoji }}</span>
            <span class="gain-body">
              <strong>{{ sourceLabel(gain.source) }}</strong>
              <small>{{ displayDate(gain.date) }} · {{ statMeta(gain.stat).label }}</small>
            </span>
            <strong class="gain-amount">+{{ gain.amount }}</strong>
          </div>
        </div>
        <p v-else class="empty">아직 적립 기록이 없습니다.</p>
      </section>

      <section v-if="overview.ended && overview.ending" class="ending" :aria-labelledby="endingTitleId">
        <div class="ending-mark">{{ overview.ending.emoji }}</div>
        <span>시즌 결말</span>
        <h2 :id="endingTitleId">{{ overview.ending.title }}</h2>
        <p class="epigraph">{{ overview.ending.epigraph }}</p>
        <p class="narrative">{{ overview.ending.narrative }}</p>
        <button
          v-if="!readonly && !pendingCount"
          class="season-start"
          type="button"
          @click="beginSeason"
        >새 시즌 시작</button>
      </section>
    </template>

    <p v-if="startFeedback" class="start-feedback" role="status">{{ startFeedback }}</p>
  </div>
</template>

<style scoped>
.season-page { width: 100%; max-width: 680px; min-width: 0; margin: 0 auto; }
.hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
.hero h1 { margin: 0 0 5px; font-size: 25px; }
.hero p { margin: 0; color: var(--fg-dim); font-size: 13px; }
.day-badge { flex: 0 0 auto; min-width: 84px; padding: 8px 0 10px 14px; border-left: 1px solid var(--line); text-align: right; }
.day-badge strong, .day-badge span { display: block; }
.day-badge strong { color: var(--accent-text); font-size: 18px; }
.day-badge span { margin-top: 2px; color: var(--fg-dim); font-size: 11.5px; }
.season-inline-head { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 14px; color: var(--fg-dim); font-size: 13px; }
.season-inline-head strong { color: var(--accent-text); }
.season-empty { display: flex; min-height: 88px; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-block: 1px solid var(--line); }
.season-empty p { margin: 0; color: var(--fg-dim); font-size: 13.5px; }
.season-start { min-height: 44px; padding: 0 18px; border: 1px solid var(--accent); border-radius: 10px; background: var(--accent); color: var(--accent-ink); font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
.season-start:hover { filter: brightness(1.08); }
.season-start:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.gain-notice { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin: 14px 0 20px; padding: 14px 0; border-block: 1px solid var(--warn); }
.gain-notice div { display: grid; gap: 4px; }
.gain-notice strong { color: var(--warn); font-size: 13.5px; }
.gain-notice span { color: var(--fg-dim); font-size: 12px; line-height: 1.5; }
.stat-block { padding: 18px 0; border-block: 1px solid var(--line); }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.section-head h2 { margin: 0; font-size: 16px; }
.section-head span { color: var(--fg-dim); font-size: 12px; }
.stats { display: flex; flex-direction: column; }
.stat-row { display: grid; grid-template-columns: 90px minmax(0, 1fr) 28px; align-items: center; gap: 10px; min-height: 42px; border-top: 1px solid var(--line); }
.stat-row:first-child { border-top: 0; }
.stat-label { font-size: 13.5px; font-weight: 700; }
.stat-label span { margin-right: 6px; }
.stat-track { height: 4px; overflow: hidden; background: var(--line); }
.stat-fill { min-width: 0; height: 100%; transition: width 0.2s ease; }
.stat-value { text-align: right; font-size: 14px; }
.perfect-days { margin: 12px 0 0; padding-top: 12px; border-top: 1px solid var(--line); color: var(--fg-dim); font-size: 12.5px; }
.log-block { margin-top: 26px; }
.gain-list { border-top: 1px solid var(--line); }
.gain { display: flex; min-height: 58px; align-items: center; gap: 11px; border-bottom: 1px solid var(--line); }
.gain-icon { font-size: 19px; }
.gain-body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.gain-body strong { overflow: hidden; font-size: 13.5px; text-overflow: ellipsis; white-space: nowrap; }
.gain-body small { color: var(--fg-dim); font-size: 11.5px; }
.gain-amount { color: var(--good); font-size: 15px; }
.empty { margin: 0; padding: 18px 0; border-block: 1px solid var(--line); color: var(--fg-dim); font-size: 13.5px; }
.ending { margin-top: 28px; padding: 24px 0 0 20px; border-top: 1px solid var(--line); border-left: 3px solid var(--accent); }
.ending-mark { font-size: 34px; }
.ending > span { display: block; margin-top: 6px; color: var(--accent-text); font-size: 12px; font-weight: 800; }
.ending h2 { margin: 6px 0; font-size: 21px; }
.epigraph { margin: 0; color: var(--accent-text); font-size: 13px; font-weight: 700; }
.narrative { margin: 16px 0 18px; font-size: 14px; line-height: 1.8; }
.start-feedback { margin: 18px 0 0; color: var(--good); font-size: 13px; font-weight: 700; }

@media (max-width: 480px) {
  .season-inline-head, .season-empty, .gain-notice { align-items: flex-start; flex-direction: column; }
  .hero h1 { font-size: 22px; }
  .day-badge { min-width: 70px; }
  .season-empty .season-start, .gain-notice .season-start { width: 100%; }
  .stat-row { grid-template-columns: 74px minmax(0, 1fr) 24px; gap: 8px; }
  .stat-label { font-size: 12.5px; }
  .gain-body strong { font-size: 12.5px; }
  .ending { padding-left: 14px; }
}
</style>
