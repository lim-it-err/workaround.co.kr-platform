<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPracticeGame, getPracticeRound, nextPracticeRound } from '../games/practiceCatalog.js'
import { usePractice } from '../store/practice.js'

const route = useRoute()
const router = useRouter()
const practice = usePractice()
const selected = ref('')
const revealed = ref(false)
const episode = ref(1)

const game = computed(() => getPracticeGame(String(route.params.gameId)))
const round = computed(() => getPracticeRound(String(route.params.gameId), String(route.params.roundId ?? '')))
const progress = computed(() => `${Math.max(1, game.value?.rounds.findIndex((entry) => entry.id === round.value?.id) + 1)}/${game.value?.rounds.length ?? 0}`)

watch(() => route.fullPath, () => {
  selected.value = ''
  revealed.value = false
  episode.value = 1
  if (game.value && round.value) practice.remember(game.value.id, round.value.id)
}, { immediate: true })

function optionsFor(entry) {
  if (!entry) return []
  if ((entry.type === 'reading' || entry.type === 'cinema') && entry.fork?.choices) return entry.fork.choices
  if (entry.type === 'swipe') return [
    { key: 'merge', label: '머지' }, { key: 'reject', label: '반려' }, { key: 'question', label: '질문 먼저' },
  ]
  if (entry.type === 'probe') return entry.probes.map((item) => ({ key: item.key, label: item.label }))
  if (entry.type === 'boundary') return entry.boundaries.map((item) => ({ key: item.key, label: item.label }))
  if (entry.type === 'choice') return entry.choices
  return []
}

function answer() {
  if (!game.value || !round.value) return
  revealed.value = true
  practice.recordAttempt(game.value.id, round.value.id, selected.value || 'read')
}

function move(mode) {
  if (!game.value || !round.value) return
  const target = nextPracticeRound(game.value, round.value.id, practice.completedIds(game.value.id), mode)
  if (target) router.push(`/games/practice/${game.value.id}/${target.id}`)
}

function restart() {
  if (!game.value?.rounds?.length) return
  practice.clearGame(game.value.id)
  router.push(`/games/practice/${game.value.id}/${game.value.rounds[0].id}`)
}

const resultText = computed(() => {
  if (!round.value) return ''
  if (round.value.type === 'swipe') return round.value.explain
  if (round.value.type === 'probe') return `${round.value.probes.find((entry) => entry.key === selected.value)?.result ?? ''}\n\n${round.value.resolution}`
  if (round.value.type === 'boundary') return `${round.value.outcomes[selected.value]?.scenario ?? ''}\n\n${round.value.recommendNote}`
  if (round.value.type === 'choice') return `${round.value.choices.find((entry) => entry.key === selected.value)?.aftermath ?? ''}\n\n${round.value.explanation}`
  const forkResponse = round.value.fork?.choices?.find((entry) => entry.key === selected.value)?.response
  return forkResponse ? `${forkResponse}\n\n${round.value.explanation}` : (round.value.explanation ?? round.value.csLink ?? round.value.systemReading ?? '')
})
</script>

<template>
  <div v-if="game && round" class="practice-page">
    <header class="practice-head">
      <router-link to="/games">← 전체 게임</router-link>
      <span>{{ game.emoji }} {{ game.title }} · {{ progress }}</span>
    </header>

    <article class="card round-card">
      <span class="practice-chip">연습 모드 · 보상/연속 기록 없음</span>
      <h1>{{ round.title }}</h1>
      <p v-if="round.situation" class="situation">{{ round.situation }}</p>
      <pre v-if="round.code" class="code"><code>{{ round.code }}</code></pre>

      <template v-if="round.type === 'case'">
        <p>{{ round.intro }}</p>
        <div class="episode-tabs" role="tablist" aria-label="사건 파일 에피소드">
          <button v-for="day in round.days" :key="day.day" :class="{ active: episode === day.day }" @click="episode = day.day">{{ day.day }}일차</button>
        </div>
        <section class="episode card">
          <small>{{ round.days[episode - 1].kind }}</small>
          <h2>{{ round.days[episode - 1].title }}</h2>
          <p class="preline">{{ round.days[episode - 1].content }}</p>
        </section>
        <details class="spoiler"><summary>결말과 해설 보기 (스포일러)</summary><h3>{{ round.finale.question }}</h3><ul><li v-for="option in round.finale.options" :key="option.key">{{ option.label }}</li></ul><p>{{ round.finale.explanation }}</p><p>{{ round.finale.epilogue }}</p></details>
        <button class="btn primary complete" @click="answer">사건 파일 연습 완료</button>
      </template>

      <template v-else>
        <p v-if="round.question || round.prompt" class="prompt">{{ round.question ?? round.prompt }}</p>
        <div v-if="optionsFor(round).length" class="options">
          <button v-for="option in optionsFor(round)" :key="option.key" :class="{ active: selected === option.key }" @click="selected = option.key">{{ option.label }}</button>
        </div>
        <button class="btn primary complete" :disabled="optionsFor(round).length && !selected" @click="answer">{{ optionsFor(round).length ? '선택하고 해설 보기' : '읽었어요' }}</button>
        <section v-if="revealed" class="result card" aria-live="polite">
          <strong>판 뒤집기</strong>
          <p class="preline">{{ resultText }}</p>
          <p v-if="round.type === 'swipe'">권장 판정: {{ round.correct }} · 근거: {{ round.correctToken }}</p>
        </section>
      </template>
    </article>

    <nav class="round-nav" aria-label="연습 판 이동">
      <button class="btn" @click="restart">처음부터 다시</button>
      <button class="btn" @click="move('next')">다음 판</button>
      <button class="btn" @click="move('random')">무작위</button>
      <button class="btn" @click="move('unseen')">안 본 판</button>
      <button class="btn danger" @click="practice.clearGame(game.id)">이 게임 연습 기록만 지우기</button>
    </nav>
  </div>
  <div v-else class="card">존재하지 않는 연습 판입니다. <router-link to="/games">전체 게임으로 돌아가기</router-link></div>
</template>

<style scoped>
.practice-page { max-width: 720px; margin: 0 auto; }.practice-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; color: var(--fg-dim); font-size: 13px; }.practice-head a { text-decoration: none; }.round-card h1 { margin: 10px 0; font-size: 23px; }.practice-chip { color: var(--good); background: rgba(158,206,106,.1); border-radius: 99px; padding: 4px 9px; font-size: 11px; font-weight: 700; }.situation,.prompt { color: var(--fg-dim); }.code { overflow-x: auto; background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }.options { display: grid; gap: 8px; margin: 16px 0; }.options button,.episode-tabs button { text-align: left; border: 1px solid var(--border); background: var(--bg-soft); color: var(--fg); border-radius: 9px; padding: 11px 13px; min-height: 44px; }.options button.active,.episode-tabs button.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }.complete { margin-top: 12px; }.result { margin-top: 16px; border-color: rgba(122,162,247,.45); }.preline { white-space: pre-line; }.episode-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 14px 0; }.episode-tabs button { text-align: center; }.episode { padding: 16px; }.episode h2 { margin: 3px 0; font-size: 17px; }.episode small { color: var(--accent); }.spoiler { margin-top: 14px; border: 1px dashed var(--border); border-radius: 10px; padding: 12px; }.spoiler summary { cursor: pointer; font-weight: 700; }.round-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }.danger { color: var(--bad); margin-left: auto; }
@media (max-width: 600px) { .practice-head { flex-direction: column; gap: 4px; }.round-card { padding: 16px; }.round-nav .danger { margin-left: 0; width: 100%; } }
</style>
