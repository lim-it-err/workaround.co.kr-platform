<script setup>
import { computed } from 'vue'
import { practiceCatalog } from '../games/practiceCatalog.js'
import { usePractice } from '../store/practice.js'

const practice = usePractice()
const prefs = computed(() => practice.state.inflight)
const tastes = [
  { id: 'operations', label: '운영', games: ['probe', 'boundary', 'case', 'bulkheads'] },
  { id: 'design', label: '설계', games: ['boundary', 'swipe', 'bulkheads'] },
  { id: 'concurrency', label: '동시성', games: ['concurrency-sequencing', 'swipe'] },
  { id: 'domain', label: '도메인 여행', games: ['reading', 'cinema', 'case'] },
  { id: 'random', label: '랜덤' },
]
const durations = [3, 10, 30, 60]
const durationLabels = { 3: '3분 한 판', 10: '10분 세 판', 30: '30분 사건', 60: '60분 혼합 코스' }
const courseSizes = { 3: 1, 10: 3, 30: 1, 60: 10 }

const entries = computed(() => {
  const selectedTaste = tastes.find((taste) => taste.id === prefs.value.taste)
  const allowed = selectedTaste?.games
  return practiceCatalog.flatMap((game) => game.rounds.map((round) => ({ game, round })))
    .filter(({ game, round }) => !allowed || allowed.includes(game.id))
    .filter(({ game, round }) => prefs.value.duration === 30 ? game.id === 'case' : (round.minutes ?? game.minutes) <= prefs.value.duration)
    .filter(({ game, round }) => prefs.value.retryOnly ? practice.isCompleted(game.id, round.id) : (prefs.value.showSeen || !practice.isCompleted(game.id, round.id)))
})

const recommended = computed(() => entries.value.slice(0, courseSizes[prefs.value.duration] ?? 3))
const remaining = computed(() => practiceCatalog.reduce((sum, game) => sum + game.rounds.filter((round) => !practice.isCompleted(game.id, round.id)).length, 0))
const resume = computed(() => {
  const last = practice.state.last
  if (!last) return null
  const game = practiceCatalog.find((entry) => entry.id === last.gameId)
  const round = game?.rounds.find((entry) => entry.id === last.roundId)
  return game && round ? { game, round } : null
})

function update(key, value) {
  practice.setInflight({ [key]: value })
}
</script>

<template>
  <div class="inflight" :style="{ '--flight-font': prefs.fontScale, '--flight-line': prefs.lineHeight }">
    <section class="flight-hero card">
      <div>
        <span class="eyebrow">✈️ OFFLINE MODE</span>
        <h1>기내 훈련 팩</h1>
        <p>네트워크 없이 읽고 판단합니다. 진행 기록은 이 기기에만 저장됩니다.</p>
      </div>
      <span class="remaining">미열람 {{ remaining }}개</span>
    </section>

    <router-link v-if="resume" :to="`/games/practice/${resume.game.id}/${resume.round.id}`" class="resume card">
      <span>이어서 하기</span>
      <strong>{{ resume.game.emoji }} {{ resume.round.title }}</strong>
      <span>→</span>
    </router-link>

    <section class="controls card" aria-label="기내 콘텐츠 설정">
      <div class="control-row">
        <span class="label">시간</span>
        <button v-for="duration in durations" :key="duration" class="pill" :class="{ active: prefs.duration === duration }" :aria-pressed="prefs.duration === duration" @click="update('duration', duration)">{{ durationLabels[duration] }}</button>
      </div>
      <div class="control-row">
        <span class="label">취향</span>
        <button v-for="taste in tastes" :key="taste.id" class="pill" :class="{ active: prefs.taste === taste.id }" :aria-pressed="prefs.taste === taste.id" @click="update('taste', taste.id)">{{ taste.label }}</button>
      </div>
      <div class="control-row compact">
        <label><input :checked="prefs.showSeen" type="checkbox" @change="update('showSeen', $event.target.checked)" /> 본 콘텐츠 포함</label>
        <label><input :checked="prefs.retryOnly" type="checkbox" @change="update('retryOnly', $event.target.checked)" /> 다시 볼 것만</label>
      </div>
      <div class="control-row compact settings">
        <label>글자 크기 <input :value="prefs.fontScale" type="range" min="0.9" max="1.3" step="0.1" @input="update('fontScale', Number($event.target.value))" /></label>
        <label>줄 간격 <input :value="prefs.lineHeight" type="range" min="1.4" max="2" step="0.1" @input="update('lineHeight', Number($event.target.value))" /></label>
      </div>
    </section>

    <section class="pack">
      <div class="section-title"><h2>이번 비행 추천</h2><span>{{ entries.length }}개 선택 가능</span></div>
      <div v-if="recommended.length" class="flight-list">
        <router-link v-for="({ game, round }) in recommended" :key="`${game.id}:${round.id}`" :to="`/games/practice/${game.id}/${round.id}`" class="flight-card card">
          <span class="icon">{{ game.emoji }}</span>
          <span class="body"><small>{{ game.title }} · {{ round.minutes ?? game.minutes }}분</small><strong>{{ round.title }}</strong></span>
          <span aria-hidden="true">→</span>
        </router-link>
      </div>
      <p v-else class="empty card">조건에 맞는 미열람 콘텐츠가 없습니다. ‘본 콘텐츠 포함’을 켜 보세요.</p>
    </section>

    <section class="landing card">
      <strong>착륙 후 온라인 기능</strong>
      <p>AI 채팅·서버 동기화는 기내 팩에서 호출하지 않습니다. 연결이 돌아오면 기존 미션 화면에서 이용하세요.</p>
    </section>
  </div>
</template>

<style scoped>
.inflight { max-width: 760px; margin: 0 auto; font-size: calc(1rem * var(--flight-font)); line-height: var(--flight-line); }
.flight-hero { display: flex; justify-content: space-between; gap: 20px; background: linear-gradient(135deg, var(--accent-soft), transparent), var(--bg-card); }
.flight-hero h1 { margin: 4px 0; font-size: 26px; }.flight-hero p { margin: 0; color: var(--fg-dim); }.eyebrow { color: var(--accent); font-size: 11px; font-weight: 800; letter-spacing: .12em; }
.remaining { align-self: flex-start; white-space: nowrap; background: var(--accent-soft); color: var(--accent); border-radius: 99px; padding: 6px 11px; font-size: 12px; }
.resume { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; margin-top: 12px; text-decoration: none; color: var(--fg); align-items: center; }.resume span:first-child { color: var(--good); font-size: 12px; font-weight: 700; }
.controls { margin-top: 16px; display: grid; gap: 12px; }.control-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }.label { width: 44px; color: var(--fg-dim); font-size: 12px; font-weight: 700; }
.pill { min-height: 38px; border: 1px solid var(--border); border-radius: 99px; background: var(--bg-soft); color: var(--fg-dim); padding: 6px 14px; }.pill.active { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
.compact { color: var(--fg-dim); font-size: 13px; gap: 18px; padding-left: 52px; }.compact label { display: inline-flex; align-items: center; gap: 6px; }.settings { border-top: 1px solid var(--border); padding-top: 12px; }
.pack { margin-top: 24px; }.section-title { display: flex; justify-content: space-between; align-items: baseline; }.section-title h2 { margin: 0 0 10px; font-size: 18px; }.section-title span { color: var(--fg-dim); font-size: 12px; }
.flight-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }.flight-card { display: flex; gap: 12px; align-items: center; text-decoration: none; color: var(--fg); padding: 15px; min-width: 0; }.flight-card:hover { border-color: var(--accent); }.icon { font-size: 24px; }.body { display: flex; flex-direction: column; min-width: 0; flex: 1; }.body small { color: var(--fg-dim); }.body strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.landing { margin-top: 22px; border-style: dashed; }.landing p { margin: 4px 0 0; color: var(--fg-dim); font-size: 13px; }.empty { color: var(--fg-dim); }
@media (max-width: 600px) { .flight-hero { flex-direction: column; }.flight-list { grid-template-columns: 1fr; }.compact { padding-left: 0; }.settings { align-items: flex-start; flex-direction: column; }.body strong { white-space: normal; } }
</style>
