<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { vienna1900Sims } from '../data/courseVienna1900.js'
import { budapestBathsSims } from '../data/courseBudapestBaths.js'
import { runEntryQueueScenario } from '../games/courseQueueSimulation.js'
import { useMissions } from '../store/missions.js'

const route = useRoute()
const store = useMissions()
const course = computed(() => store.getCourse(String(route.params.courseId)))
const courseSims = [...vienna1900Sims, ...budapestBathsSims]
const sim = computed(() => courseSims.find((entry) => entry.id === route.params.missionId) ?? null)
const hour = ref(sim.value?.arrivals?.[0]?.hour ?? '09')
const counters = ref(sim.value?.counters ?? 3)
const prebookedPercent = ref(Math.round((sim.value?.prebookedRatio ?? 0.35) * 100))
const result = ref(null)
const questions = computed(() => {
  const entries = sim.value?.reflect ?? sim.value?.questions
  return Array.isArray(entries) ? entries.filter((entry) => String(entry ?? '').trim()) : []
})
const reflectionNote = computed(() => sim.value?.reflectNote ?? sim.value?.note ?? '')
const conditionsChanged = computed(() => Boolean(result.value) && (
  result.value.hour !== hour.value
  || result.value.counters !== counters.value
  || Math.round(result.value.prebookedRatio * 100) !== prebookedPercent.value
))

function run() {
  result.value = runEntryQueueScenario(sim.value, {
    hour: hour.value,
    counters: counters.value,
    prebookedRatio: prebookedPercent.value / 100,
  })
}

function minutes(seconds) {
  return `${(seconds / 60).toFixed(1)}분`
}
</script>

<template>
  <div v-if="course && sim" class="sim-page">
    <router-link :to="`/courses/${course.id}`" class="back-link">← {{ course.title }} 코스</router-link>
    <header class="sim-hero">
      <span>시뮬 · 다중 창구 대기열</span>
      <h1>{{ sim.title }}</h1>
      <p>{{ sim.brief }}</p>
    </header>

    <section class="controls" aria-labelledby="sim-controls-title">
      <h2 id="sim-controls-title">한 시간 운영 조건</h2>
      <label>
        <span>입장 시간대</span>
        <select v-model="hour">
          <option v-for="entry in sim.arrivals" :key="entry.hour" :value="entry.hour">
            {{ entry.hour }}시 · 분당 {{ entry.perMin }}명
          </option>
        </select>
      </label>
      <label>
        <span>창구 {{ counters }}개</span>
        <input v-model.number="counters" type="range" min="1" max="6" />
      </label>
      <label>
        <span>사전 예약 {{ prebookedPercent }}%</span>
        <input v-model.number="prebookedPercent" type="range" min="0" max="80" step="5" />
      </label>
      <button class="btn primary run-button" @click="run">
        {{ conditionsChanged ? '바뀐 조건으로 다시 실행' : '대기열 돌려보기' }}
      </button>
    </section>

    <section v-if="result" class="result" :data-result-stale="conditionsChanged || undefined" aria-live="polite">
      <div v-if="conditionsChanged" class="stale-result" role="status">
        <strong>조건이 바뀌었습니다</strong>
        <span>현재 선택으로 다시 실행해 결과를 갱신하세요.</span>
      </div>
      <span>{{ result.hour }}시 전체 실행 결과</span>
      <h2>평균 대기 {{ minutes(result.averageWaitSeconds) }}</h2>
      <p class="run-conditions">
        실행 조건 · {{ result.hour }}시 · 창구 {{ result.counters }}개 · 사전 예약 {{ Math.round(result.prebookedRatio * 100) }}%
      </p>
      <dl>
        <div><dt>도착</dt><dd>{{ result.arrivals }}명</dd></div>
        <div><dt>시간 내 처리 시작</dt><dd>{{ result.completed }}명</dd></div>
        <div><dt>시간 내 미처리</dt><dd>{{ result.unprocessed }}명</dd></div>
        <div><dt>최장 대기</dt><dd>{{ minutes(result.maxWaitSeconds) }}</dd></div>
        <div><dt>혼합 처리시간</dt><dd>{{ result.serviceSeconds }}초</dd></div>
        <div><dt>이용률</dt><dd>{{ result.utilizationPercent }}%</dd></div>
      </dl>
      <p>같은 조건에서 같은 결과를 재현하는 고정 시드 확률 도착입니다. 도착 간격은 지수분포로 만들고, 표기 처리시간은 그대로 쓰며 이동·복귀 시간과 tick 올림은 없습니다.</p>
    </section>

    <details v-if="questions.length" class="questions">
      <summary>생각해 볼 질문</summary>
      <ol><li v-for="question in questions" :key="question">{{ question }}</li></ol>
      <p v-if="reflectionNote">{{ reflectionNote }}</p>
    </details>
  </div>

  <div v-else class="not-found">
    <h1>시뮬 미션을 찾지 못했습니다</h1>
    <router-link to="/learn#courses" class="btn primary">코스 목록으로</router-link>
  </div>
</template>

<style scoped>
.sim-page, .not-found { max-width: 760px; margin: 0 auto; min-width: 0; }
.back-link { display: inline-flex; min-height: 40px; align-items: center; color: var(--accent-text); text-decoration: none; }
.sim-hero { margin: 12px 0 26px; padding: 14px 0 22px 20px; border-left: 3px solid var(--accent); }
.sim-hero > span, .result > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.sim-hero h1 { margin: 6px 0 8px; font-size: clamp(24px, 4vw, 34px); }
.sim-hero p { margin: 0; color: var(--fg-dim); line-height: 1.7; }
.controls { display: grid; gap: 14px; }
.controls h2 { margin: 0 0 2px; font-size: 18px; }
.controls label { display: grid; grid-template-columns: minmax(130px, .35fr) minmax(0, 1fr); align-items: center; gap: 14px; min-height: 48px; padding-bottom: 10px; border-bottom: 1px solid var(--line); }
.controls label > span { font-weight: 650; }
.controls select, .controls input { width: 100%; min-height: 42px; accent-color: var(--accent); }
.controls select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); color: var(--fg); }
.run-button { min-height: 48px; margin-top: 4px; }
.result { margin-top: 28px; padding: 20px 0 4px 20px; border-left: 3px solid var(--good); }
.result h2 { margin: 5px 0 18px; }
.stale-result { display: grid; gap: 2px; margin: -6px 0 16px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--warn) 55%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--warn) 9%, transparent); }
.stale-result strong { color: var(--warn); }
.stale-result span { color: var(--fg-dim); font-size: 12px; }
.run-conditions { margin: -10px 0 14px; color: var(--fg-dim); font-size: 12px; }
.result dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); margin: 0; border-top: 1px solid var(--line); }
.result dl div { padding: 12px 8px 12px 0; border-bottom: 1px solid var(--line); }
.result dt { color: var(--fg-dim); font-size: 11px; }
.result dd { margin: 4px 0 0; font-weight: 750; font-variant-numeric: tabular-nums; }
.result p, .questions { color: var(--fg-dim); font-size: 13px; line-height: 1.65; }
.questions { margin-top: 24px; border-top: 1px solid var(--line); }
.questions summary { min-height: 44px; padding: 12px 0; color: var(--fg); font-weight: 750; cursor: pointer; }
@media (max-width: 560px) {
  .controls label { grid-template-columns: 1fr; gap: 4px; }
  .result dl { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
