<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPracticeGame, getPracticeRound, nextPracticeRound } from '../games/practiceCatalog.js'
import { usePractice } from '../store/practice.js'

const route = useRoute()
const router = useRouter()
const practice = usePractice()
const requestedReturn = window.history.state?.from
const returnSurface = requestedReturn === '/today' || /^\/courses\/[^/]+$/.test(requestedReturn ?? '')
  ? requestedReturn
  : '/learn'
const returnLabel = window.history.state?.fromLabel
  ?? (returnSurface === '/today' ? '오늘' : '전체 연습')
const selected = ref('')
const selectedHypothesis = ref('')
const revealed = ref(false)
const completed = ref(false)
const episode = ref(1)

const game = computed(() => getPracticeGame(String(route.params.gameId)))
const round = computed(() => getPracticeRound(String(route.params.gameId), String(route.params.roundId ?? '')))
const progress = computed(() => `${Math.max(1, game.value?.rounds.findIndex((entry) => entry.id === round.value?.id) + 1)}/${game.value?.rounds.length ?? 0}`)
const selectedProbe = computed(() => round.value?.type === 'probe'
  ? round.value.probes.find((entry) => entry.key === selected.value) ?? null
  : null)
const probeVerdict = computed(() => round.value?.type === 'probe'
  ? round.value.hypotheses.find((entry) => entry.key === selectedHypothesis.value) ?? null
  : null)
const probeCorrect = computed(() => probeVerdict.value?.key === round.value?.answerKey)

watch(() => route.fullPath, () => {
  selected.value = ''
  selectedHypothesis.value = ''
  revealed.value = false
  completed.value = false
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
  if (round.value.type === 'probe') {
    if (!revealed.value && selectedProbe.value) {
      revealed.value = true
      return
    }
    if (!probeVerdict.value || completed.value) return
    completed.value = true
    practice.recordAttempt(game.value.id, round.value.id, `${selected.value}:${selectedHypothesis.value}`)
    return
  }
  revealed.value = true
  completed.value = true
  practice.recordAttempt(game.value.id, round.value.id, selected.value || 'read')
}

function move(mode) {
  if (!game.value || !round.value) return
  const target = nextPracticeRound(game.value, round.value.id, practice.completedIds(game.value.id), mode)
  if (target) router.push({
    path: `/games/practice/${game.value.id}/${target.id}`,
    state: { from: returnSurface, fromLabel: returnLabel },
  })
}

function restart() {
  if (!game.value?.rounds?.length) return
  practice.clearGame(game.value.id)
  router.push({
    path: `/games/practice/${game.value.id}/${game.value.rounds[0].id}`,
    state: { from: returnSurface, fromLabel: returnLabel },
  })
}

const resultText = computed(() => {
  if (!round.value) return ''
  if (round.value.type === 'swipe') return round.value.explain
  if (round.value.type === 'probe') return round.value.resolution
  if (round.value.type === 'boundary') return `${round.value.outcomes[selected.value]?.scenario ?? ''}\n\n${round.value.recommendNote}`
  if (round.value.type === 'choice') return `${round.value.choices.find((entry) => entry.key === selected.value)?.aftermath ?? ''}\n\n${round.value.explanation}`
  const forkResponse = round.value.fork?.choices?.find((entry) => entry.key === selected.value)?.response
  return forkResponse ? `${forkResponse}\n\n${round.value.explanation}` : (round.value.explanation ?? round.value.csLink ?? round.value.systemReading ?? '')
})
</script>

<template>
  <div v-if="game && round" class="practice-page">
    <header class="practice-head">
      <router-link :to="returnSurface">← {{ returnLabel }}</router-link>
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
        <div v-if="optionsFor(round).length && !(round.type === 'probe' && revealed)" class="options">
          <button v-for="option in optionsFor(round)" :key="option.key" :class="{ active: selected === option.key }" @click="selected = option.key">{{ option.label }}</button>
        </div>
        <button v-if="round.type !== 'probe' || !revealed" class="btn primary complete" :disabled="optionsFor(round).length && !selected" @click="answer">{{ round.type === 'probe' ? '관측 결과 보기' : optionsFor(round).length ? '선택하고 해설 보기' : '읽었어요' }}</button>

        <div v-if="round.type === 'probe' && revealed" class="probe-followup">
          <section class="observation card" aria-live="polite">
            <small>관측 결과</small>
            <h2>{{ selectedProbe.label }}</h2>
            <p>{{ selectedProbe.result }}</p>
          </section>
          <section class="hypothesis-panel" aria-labelledby="practice-hypothesis-title">
            <small>다음 행동</small>
            <h2 id="practice-hypothesis-title">가장 그럴듯한 가설은?</h2>
            <div class="hypotheses">
              <button
                v-for="hypothesis in round.hypotheses"
                :key="hypothesis.key"
                :class="{
                  active: selectedHypothesis === hypothesis.key,
                  eliminated: selectedProbe.eliminates.includes(hypothesis.key),
                }"
                :disabled="completed"
                @click="selectedHypothesis = hypothesis.key"
              >
                <span>{{ hypothesis.label }}</span>
                <small v-if="selectedProbe.eliminates.includes(hypothesis.key)">가능성 낮아짐</small>
              </button>
            </div>
            <button v-if="!completed" class="btn primary complete" :disabled="!selectedHypothesis" @click="answer">가설 지목하고 결말 보기</button>
          </section>
        </div>

        <section v-if="revealed && round.type !== 'probe'" class="result card" aria-live="polite">
          <strong>판 뒤집기</strong>
          <p class="preline">{{ resultText }}</p>
          <p v-if="round.type === 'swipe'">권장 판정: {{ round.correct }} · 근거: {{ round.correctToken }}</p>
        </section>
        <section v-if="round.type === 'probe' && completed" class="result card probe-resolution" aria-live="polite">
          <strong>{{ probeCorrect ? '가설 적중' : '가설 빗나감' }}</strong>
          <p v-if="!probeCorrect">가장 잘 설명하는 가설: {{ round.hypotheses.find((entry) => entry.key === round.answerKey)?.label }}</p>
          <h2>사건의 결말</h2>
          <p class="preline">{{ resultText }}</p>
          <p class="info-note">{{ selectedProbe.infoNote }}</p>
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
  <div v-else class="card">존재하지 않는 연습 판입니다. <router-link :to="returnSurface">{{ returnLabel }}으로 돌아가기</router-link></div>
</template>

<style scoped>
.practice-page { max-width: 720px; margin: 0 auto; }.practice-head { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 12px; color: var(--fg-dim); font-size: 13px; }.practice-head a { display: inline-flex; min-width: 40px; min-height: 40px; align-items: center; text-decoration: none; }.round-card h1 { margin: 10px 0; font-size: 23px; }.practice-chip { color: var(--good); background: color-mix(in srgb, var(--good) 10%, transparent); border-radius: 99px; padding: 4px 9px; font-size: 11px; font-weight: 700; }.situation,.prompt { color: var(--fg-dim); }.code { overflow-x: auto; background: var(--code-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }.options { display: grid; gap: 8px; margin: 16px 0; }.options button,.episode-tabs button,.hypotheses button { text-align: left; border: 1px solid var(--border); background: var(--bg-soft); color: var(--fg); border-radius: 9px; padding: 11px 13px; min-height: 44px; }.options button.active,.episode-tabs button.active,.hypotheses button.active { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }.complete { margin-top: 12px; }.result { margin-top: 16px; border-color: color-mix(in srgb, var(--accent) 45%, transparent); }.preline { white-space: pre-line; }.episode-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 14px 0; }.episode-tabs button { text-align: center; }.episode { padding: 16px; }.episode h2 { margin: 3px 0; font-size: 17px; }.episode small { color: var(--accent); }.spoiler { margin-top: 14px; border: 1px dashed var(--border); border-radius: 10px; padding: 12px; }.spoiler summary { cursor: pointer; font-weight: 700; }.probe-followup { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 14px; align-items: start; margin-top: 16px; }.observation { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }.observation small,.hypothesis-panel > small { color: var(--accent); font-weight: 750; }.observation h2,.hypothesis-panel h2,.probe-resolution h2 { margin: 5px 0 9px; font-size: 16px; }.observation p { margin: 0; line-height: 1.65; }.hypotheses { display: grid; gap: 8px; }.hypotheses button { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.hypotheses button small { color: var(--fg-dim); text-align: right; }.hypotheses button.eliminated { opacity: .45; }.hypotheses button:disabled { cursor: default; }.probe-resolution > strong { color: var(--accent); }.probe-resolution .info-note { color: var(--fg-dim); border-top: 1px solid var(--border); padding-top: 12px; }.round-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }.danger { color: var(--bad); margin-left: auto; }
@media (max-width: 600px) { .practice-head { flex-direction: column; gap: 4px; }.round-card { padding: 16px; }.probe-followup { grid-template-columns: 1fr; }.hypotheses button { align-items: flex-start; flex-direction: column; }.hypotheses button small { text-align: left; }.round-nav .danger { margin-left: 0; width: 100%; } }
</style>
