<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMissions } from '../store/missions.js'
import InsightCard from '../components/InsightCard.vue'
import cards from '../data/sampleCards.js'
import caseFileData from '../data/sampleCaseFiles.js'
import { practiceCatalog } from '../games/practiceCatalog.js'
import { usePractice } from '../store/practice.js'

const store = useMissions()
const route = useRoute()
const caseFiles = caseFileData.caseFiles
const practice = usePractice()
const catalogQuery = computed({
  get: () => practice.state.filters.query,
  set: (query) => practice.setFilters({ query }),
})
const onlyUnseen = computed({
  get: () => practice.state.filters.onlyUnseen,
  set: (onlyUnseen) => practice.setFilters({ onlyUnseen }),
})
const filteredCatalog = computed(() => {
  const query = catalogQuery.value.trim().toLowerCase()
  return practiceCatalog.filter((game) => {
    const unseen = game.rounds.length - practice.completedIds(game.id).length
    if (onlyUnseen.value && unseen === 0) return false
    return !query || `${game.title} ${game.description}`.toLowerCase().includes(query)
  })
})

const deck = ref('reading')
const linkedCardId = computed(() => (typeof route.query.card === 'string' ? route.query.card : ''))
const linkedDeck = computed(() => {
  if (cards.readingCards.some((card) => card.id === linkedCardId.value)) return 'reading'
  if (cards.cinemaCards.some((card) => card.id === linkedCardId.value)) return 'cinema'
  return null
})
const shownCards = computed(() => {
  const list = deck.value === 'reading' ? cards.readingCards : cards.cinemaCards
  const linkedIndex = list.findIndex((card) => card.id === linkedCardId.value)
  if (linkedIndex <= 0) return list
  return [list[linkedIndex], ...list.slice(0, linkedIndex), ...list.slice(linkedIndex + 1)]
})

watch(linkedDeck, (value) => {
  if (value) deck.value = value
}, { immediate: true })

// 코드를 안 쓰고 즉시 할 수 있는 미션 유형만 골라 스낵 목록으로.
const NO_CODE_TYPES = ['코드 판독', '배역극', '설계 리뷰']
const snackMissions = computed(() =>
  store.state.missions.filter((m) => NO_CODE_TYPES.includes(m.missionType)),
)

const upcoming = [
  { emoji: '📈', name: '시즌제 스탯', desc: '4주 시즌, 안목·언어화·판단·교양 — 준비 중' },
]
</script>

<template>
  <div class="games-page">
    <section class="hero">
      <h1>미니게임</h1>
      <p class="dim">데일리는 시즌 기록으로, 연습은 보상 없이 원하는 판을 몇 번이고.</p>
    </section>

    <section class="mode-note card">
      <strong>오늘의 훈련 ≠ 전체 게임 연습</strong>
      <p>아래 연습 기록은 별도 로컬 저장소에 남고 데일리 완료·연속 기록·시즌 보상을 바꾸지 않습니다.</p>
    </section>

    <section class="block catalog-block">
      <div class="catalog-title">
        <h2 class="sec">🧰 전체 게임 · 다시하기</h2>
        <router-link to="/inflight">기내 팩 →</router-link>
      </div>
      <div class="catalog-controls">
        <input v-model="catalogQuery" type="search" placeholder="게임 찾기" aria-label="게임 찾기" />
        <label><input v-model="onlyUnseen" type="checkbox" /> 미완료만</label>
      </div>
      <div class="catalog-grid">
        <article v-for="game in filteredCatalog" :key="game.id" class="catalog-card card">
          <div class="catalog-icon">{{ game.emoji }}</div>
          <div class="catalog-copy">
            <h3>{{ game.title }}</h3>
            <p>{{ game.description }}</p>
            <small>{{ game.rounds.length }}판 · 판당 약 {{ game.minutes }}분 · 미완료 {{ game.rounds.length - practice.completedIds(game.id).length }}</small>
          </div>
          <router-link :to="`/games/practice/${game.id}/${practice.state.last?.gameId === game.id ? practice.state.last.roundId : game.rounds[0]?.id}`" class="btn">{{ practice.state.last?.gameId === game.id ? '이어서' : '연습' }}</router-link>
          <button v-if="practice.completedIds(game.id).length" class="clear-practice" @click="practice.clearGame(game.id)">이 게임 기록 지우기</button>
        </article>
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🗂 카드 서랍 <span class="dim">— 읽는 데 3분, 꼬리 질문은 하루 종일</span></h2>
      <div class="deck-tabs">
        <button class="deck-tab" :class="{ active: deck === 'reading' }" @click="deck = 'reading'">📖 독서 ({{ cards.readingCards.length }})</button>
        <button class="deck-tab" :class="{ active: deck === 'cinema' }" @click="deck = 'cinema'">🎬 시사회 ({{ cards.cinemaCards.length }})</button>
      </div>
      <div class="card-list">
        <InsightCard
          v-for="c in shownCards"
          :key="c.id"
          :card="c"
          :fork="cards.cardForks[c.id]"
          :saved-fork-choice="store.state.cardForkChoices[c.id]"
          :initial-open="c.id === linkedCardId"
          @choose-fork="store.chooseCardFork(c.id, $event)"
        />
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🔍 노코드 스낵 <span class="dim">— 코드를 짜지 않고 읽고 판정하는 미션</span></h2>
      <div class="snack-list">
        <router-link v-for="m in snackMissions" :key="m.id" :to="`/missions/${m.id}`" class="snack card">
          <span class="snack-emoji">{{ m.emoji }}</span>
          <span class="snack-body">
            <span class="snack-type">{{ m.missionType }} · {{ m.difficulty }}</span>
            <span class="snack-title">{{ m.title }}</span>
          </span>
        </router-link>
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🎮 바로 플레이</h2>
      <div class="play-list">
        <router-link to="/games/boundary" class="snack game-live card">
          <span class="snack-emoji">✂️</span>
          <span class="snack-body">
            <span class="snack-title">경계선 한 칸</span>
            <span class="snack-type">트랜잭션 경계 1탭 + 결과 비교 · 하루 한 판</span>
          </span>
          <span class="play-arrow">경계 긋기 →</span>
        </router-link>
        <router-link to="/games/probe" class="snack game-live card">
          <span class="snack-emoji">🔬</span>
          <span class="snack-body">
            <span class="snack-title">한 번만 물어본다면</span>
            <span class="snack-type">관측 1탭 + 가설 지목 1탭 · 하루 한 판</span>
          </span>
          <span class="play-arrow">관측 →</span>
        </router-link>
        <router-link to="/routine/swipe" class="snack game-live card">
          <span class="snack-emoji">🃏</span>
          <span class="snack-body">
            <span class="snack-title">머지 or 반려</span>
            <span class="snack-type">코드 판정 1탭 + 근거 토큰 1탭 · 샘플 카드 5장</span>
          </span>
          <span class="play-arrow">플레이 →</span>
        </router-link>
        <router-link
          v-for="caseFile in caseFiles"
          :key="caseFile.id"
          :to="`/games/case/${caseFile.id}`"
          class="snack game-live card"
        >
          <span class="snack-emoji">{{ caseFile.emoji }}</span>
          <span class="snack-body">
            <span class="snack-title">{{ caseFile.title }}</span>
            <span class="snack-type">{{ caseFile.tagline }}</span>
          </span>
          <span class="play-arrow">수사 →</span>
        </router-link>
      </div>
    </section>

    <section class="block">
      <h2 class="sec">🎮 준비 중</h2>
      <div class="upcoming-list">
        <div v-for="u in upcoming" :key="u.name" class="upcoming card dim">
          <span class="snack-emoji">{{ u.emoji }}</span>
          <span class="snack-body">
            <span class="snack-title">{{ u.name }}</span>
            <span class="snack-type">{{ u.desc }}</span>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.games-page { max-width: 560px; margin: 0 auto; }
.hero h1 { font-size: 22px; margin: 0 0 6px; }
.hero p { margin: 0; font-size: 13.5px; }
.block { margin-top: 24px; }
.sec { font-size: 16px; margin: 0 0 12px; }
.sec .dim { font-size: 12.5px; font-weight: 400; }

.deck-tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.deck-tab {
  flex: 1;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--fg-dim);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.deck-tab.active { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }

.card-list, .snack-list, .play-list, .upcoming-list { display: flex; flex-direction: column; gap: 10px; }

.snack, .upcoming {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: var(--fg);
}
.snack:hover { border-color: var(--accent); }
.game-live { border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
.play-arrow { margin-left: auto; color: var(--accent); font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.snack-emoji { font-size: 24px; flex-shrink: 0; }
.snack-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.snack-type { font-size: 11.5px; color: var(--fg-dim); font-weight: 600; }
.snack-title { font-size: 14.5px; font-weight: 700; line-height: 1.4; }
.dim { color: var(--fg-dim); }
.mode-note { margin-top: 18px; border-color: color-mix(in srgb, var(--good) 35%, transparent); }.mode-note p { margin: 4px 0 0; color: var(--fg-dim); font-size: 12.5px; }
.catalog-title { display: flex; justify-content: space-between; align-items: baseline; }.catalog-title a { font-size: 13px; text-decoration: none; }
.catalog-controls { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; }.catalog-controls input[type="search"] { min-width: 0; flex: 1; min-height: 42px; border: 1px solid var(--border); border-radius: 9px; background: var(--bg-soft); color: var(--fg); padding: 8px 11px; }.catalog-controls label { color: var(--fg-dim); font-size: 12px; white-space: nowrap; }
.catalog-grid { display: grid; gap: 10px; }.catalog-card { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 15px; }.catalog-icon { font-size: 25px; }.catalog-copy { min-width: 0; }.catalog-copy h3 { margin: 0; font-size: 15px; }.catalog-copy p { margin: 2px 0; color: var(--fg-dim); font-size: 12px; }.catalog-copy small { color: var(--accent); font-size: 11px; }.clear-practice { grid-column: 2 / -1; justify-self: end; border: 0; background: transparent; color: var(--bad); font-size: 11px; }
@media (max-width: 520px) { .catalog-card { grid-template-columns: auto 1fr; }.catalog-card > .btn { grid-column: 1 / -1; text-align: center; }.clear-practice { grid-column: 1 / -1; }.catalog-controls { align-items: flex-start; flex-direction: column; }.catalog-controls input[type="search"] { width: 100%; } }
</style>
