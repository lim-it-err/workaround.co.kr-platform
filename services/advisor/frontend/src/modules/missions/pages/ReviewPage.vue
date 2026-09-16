<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMissions } from '../store/missions.js'
import { courseMissionTarget } from '../store/courseCatalog.js'
import sampleContent from '../data/sampleContent.js'
import { vienna1900CodingMissions } from '../data/courseVienna1900.js'
import { budapestBathsCodingMissions } from '../data/courseBudapestBaths.js'
import MarkdownBlock from '../components/MarkdownBlock.vue'

const route = useRoute()
const store = useMissions()
store.hydrateMissionContent(sampleContent, [...vienna1900CodingMissions, ...budapestBathsCodingMissions])
const requestedReturn = window.history.state?.from
const returnSurface = requestedReturn === '/today' || /^\/courses\/[^/]+$/.test(requestedReturn ?? '')
  ? requestedReturn
  : '/learn'
const returnName = window.history.state?.fromLabel
  ?? (returnSurface === '/today' ? '오늘' : '배우기')
const returnLabel = returnSurface.startsWith('/courses/') ? '코스로' : `${returnName}로`

const mission = computed(() => store.getMission(route.params.id))
const missionEditTarget = computed(() => ({
  path: `/missions/${route.params.id}`,
  state: { from: returnSurface, fromLabel: returnName },
}))

const courseContext = computed(() => {
  const courseId = returnSurface.match(/^\/courses\/([^/]+)$/)?.[1]
  const course = courseId ? store.getCourse(courseId) : null
  if (!course) return null
  const currentIndex = course.missions.findIndex((entry) => entry.id === route.params.id)
  return currentIndex >= 0 ? { course, currentIndex } : null
})
const nextCourseMission = computed(() => (
  courseContext.value?.course.missions[courseContext.value.currentIndex + 1] ?? null
))
const nextActionTarget = computed(() => {
  const context = courseContext.value
  const target = context && nextCourseMission.value
    ? courseMissionTarget(context.course.id, nextCourseMission.value)
    : null
  if (!target) return { path: '/learn' }
  return {
    ...target,
    state: {
      from: `/courses/${context.course.id}`,
      fromLabel: `${context.course.title} 코스`,
    },
  }
})
const nextActionLabel = computed(() => nextCourseMission.value ? '다음 미션' : '배우기로')

// 제출/리뷰 버전 — 실제 리뷰가 여러 번 쌓였을 수 있다(재제출). 기본은 최신(현재) 버전을 보여준다.
const submissionVersions = computed(() => store.state.submissions[route.params.id] ?? [])
const hasSubmission = computed(() => submissionVersions.value.length > 0)
const reviewVersions = computed(() => store.getReviews(route.params.id))

function requestedReviewIndex() {
  const version = Number.parseInt(String(route.query.version ?? ''), 10)
  return Number.isInteger(version) && version > 0 ? version - 1 : null
}

const selectedIndex = ref(requestedReviewIndex())
watch(
  [() => route.params.id, () => route.query.version],
  () => { selectedIndex.value = requestedReviewIndex() }, // 버전 미지정은 "최신"
)
const activeIndex = computed(() =>
  selectedIndex.value != null && reviewVersions.value[selectedIndex.value]
    ? selectedIndex.value
    : reviewVersions.value.length - 1,
)
const review = computed(() => reviewVersions.value[activeIndex.value] ?? null)

// 실제 결말이 공개되는 리뷰 시점에 예측 적중을 정산한다. store가 같은 날 같은 미션의 중복을 막는다.
watch(
  [() => route.params.id, () => review.value?.ending?.grade],
  ([missionId, actualGrade]) => store.settleEndingPrediction(missionId, actualGrade),
  { immediate: true },
)

const explainFeedback = computed(() => store.getExplainFeedback(route.params.id))
const reputation = computed(() => review.value?.reputation ?? null)
const explanation = computed(() => store.state.explanations[route.params.id])
const SEASON_STAT_LABELS = {
  vision: '구조를 보는 눈',
  voice: '설명하는 힘',
  judgment: '판단하는 힘',
  culture: '함께 일하는 힘',
}
const seasonGain = computed(() => store.seasonGain(`mission-submit:${route.params.id}`))

// 입력 원칙 — 선택 우선: 결말 예측 투표 결과를 실제 결말과 대조.
const prediction = computed(() => store.getEndingPrediction(route.params.id))

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleString('ko-KR') : ''
}

const ENDING_ICONS = { calm: '☕', hotfix: '🔧', dawn: '🚨', hidden: '🔓' }

function scoreColor(score) {
  if (score >= 80) return 'var(--good)'
  if (score >= 60) return 'var(--warn)'
  return 'var(--bad)'
}

// 항목 점수는 배점(weight) 대비 획득 점수 — 색상은 비율 기준
function itemWeight(rubricName) {
  return mission.value?.rubric.find((r) => r.name === rubricName)?.weight ?? 100
}

function itemColor(item) {
  return scoreColor((item.score / itemWeight(item.rubricName)) * 100)
}

const firstFix = computed(() => (review.value?.items ?? []).reduce((largest, item) => {
  const deficit = Math.max(0, itemWeight(item.rubricName) - Number(item.score ?? 0))
  if (!largest || deficit > largest.deficit) return { ...item, deficit }
  return largest
}, null))

const firstFixSummary = computed(() => {
  const feedback = String(firstFix.value?.feedback ?? '').trim()
  return feedback.split(/(?<=[.!?])\s+/)[0] || feedback
})
</script>

<template>
  <div v-if="mission">
    <router-link :to="{ path: `/missions/${mission.id}`, state: { from: returnSurface, fromLabel: returnName } }" class="back">← 미션으로</router-link>
    <h1>리뷰 — {{ mission.title }}</h1>
    <section v-if="review" :id="`review-v${activeIndex + 1}`" class="review-lead" aria-label="리뷰 핵심">
      <div class="score-line">
        <strong :style="{ color: scoreColor(review.overall) }">{{ review.overall }}점</strong>
        <span>종합 점수</span>
      </div>
      <div v-if="firstFix" class="first-fix">
        <span>먼저 고칠 것 1개</span>
        <strong>{{ firstFix.rubricName }}</strong>
        <small>{{ firstFix.score }} / {{ itemWeight(firstFix.rubricName) }}점 · {{ firstFix.deficit }}점 회복 여지</small>
        <p>{{ firstFixSummary }}</p>
      </div>
      <router-link :to="missionEditTarget" class="btn primary retry-action">코드 고쳐서 재제출</router-link>
    </section>

    <section v-else-if="hasSubmission" class="review-state">
      <h2>리뷰를 아직 받지 못했습니다</h2>
      <p>리뷰 엔진이 연결되면 제출한 코드를 분석합니다. 코드는 그대로 남아 있습니다.</p>
      <router-link :to="missionEditTarget" class="btn primary">코드 고쳐서 재제출</router-link>
    </section>

    <section v-else class="review-state" aria-label="미제출 안내">
      <h2>아직 제출한 코드가 없습니다</h2>
      <p>미션 편집 화면에서 코드를 작성하고 제출하면 이곳에 리뷰가 생깁니다.</p>
      <router-link :to="missionEditTarget" class="btn primary">제출하러 가기</router-link>
    </section>

    <p v-if="review && !review.reviewedAt" class="proto-note">
      ⚠️ 이 미션은 아직 실제 백엔드 리뷰 샘플이 없어 <strong>미리 생성된 샘플 리뷰</strong>를 보여줍니다.
      백엔드가 연결되면 방금 제출한 코드를 리뷰 에이전트가 직접 분석합니다.
    </p>
    <p v-else-if="review" class="proto-note real">
      ✅ 실시간 리뷰 — {{ formatDate(review.reviewedAt) }}에 리뷰 에이전트가 생성했습니다.
    </p>

    <div v-if="reviewVersions.length > 1" class="version-pills" aria-label="리뷰 버전">
      <button
        v-for="(v, i) in reviewVersions"
        :key="i"
        class="version-pill"
        :class="{ active: i === activeIndex }"
        @click="selectedIndex = i"
      >v{{ i + 1 }}<template v-if="i === reviewVersions.length - 1"> · 현재</template></button>
    </div>

    <div v-if="review" class="review-disclosures">
      <details class="review-disclosure">
        <summary>
          <span>항목별 피드백</span>
          <small>{{ review.items?.length ?? 0 }}개 항목</small>
        </summary>
        <div class="disclosure-body">
          <p class="overall-summary">{{ review.summary }}</p>
          <div class="items">
            <section v-for="item in review.items" :key="item.rubricName" class="item">
              <div class="item-head">
                <h2 class="item-name">{{ item.rubricName }}</h2>
                <span class="item-score" :style="{ color: itemColor(item) }">{{ item.score }} / {{ itemWeight(item.rubricName) }}점</span>
              </div>
              <blockquote class="evidence mono">{{ item.evidence }}</blockquote>
              <p class="feedback">{{ item.feedback }}</p>
            </section>
          </div>
          <template v-if="review.nextSteps?.length">
            <h2 class="sec">다음 단계</h2>
            <ul><li v-for="s in review.nextSteps" :key="s">{{ s }}</li></ul>
          </template>
          <template v-if="review.followUpQuestions?.length">
            <h2 class="sec">꼬리 질문 <span class="dim">(인터뷰 모드의 씨앗)</span></h2>
            <ol><li v-for="q in review.followUpQuestions" :key="q">{{ q }}</li></ol>
          </template>
        </div>
      </details>

      <details v-if="review.hiddenCases?.length || review.hiddenQuest" class="review-disclosure">
        <summary>
          <span>히든 케이스와 퀘스트</span>
          <small>{{ review.hiddenCases?.length ?? 0 }}개 케이스</small>
        </summary>
        <div class="disclosure-body">
          <div v-if="review.hiddenCases?.length" class="hc-list">
            <section v-for="hc in review.hiddenCases" :key="hc.title" class="hc" :class="{ pass: hc.passed }">
              <div class="hc-head">
                <span class="hc-mark">{{ hc.passed ? '✅ 방어함' : '💥 뚫림' }}</span>
                <h2 class="hc-title">{{ hc.title }}</h2>
              </div>
              <p class="hc-note">{{ hc.note }}</p>
              <p v-if="hc.warStory" class="hc-story">📜 {{ hc.warStory }}</p>
            </section>
          </div>
          <section v-if="review.hiddenQuest" class="quest" :class="{ found: review.hiddenQuest.found }">
            <h2>{{ review.hiddenQuest.found ? '🏅 히든 퀘스트 발견' : '🌫 히든 퀘스트를 스쳐 지나감' }}</h2>
            <p class="quest-text">{{ review.hiddenQuest.text }}</p>
          </section>
        </div>
      </details>

      <details v-if="reputation" class="review-disclosure">
        <summary>
          <span>평판</span>
          <small>질문 창 소통 평가</small>
        </summary>
        <div class="disclosure-body">
          <div class="rep-level">
            <strong>{{ reputation.level }}</strong>
            <p class="rep-summary">{{ reputation.summary }}</p>
          </div>
          <div class="rep-grid">
            <section class="rep-col">
              <h2 class="rep-label good-label">잘한 소통</h2>
              <ul><li v-for="s in reputation.strengths" :key="s">{{ s }}</li></ul>
            </section>
            <section class="rep-col">
              <h2 class="rep-label warn-label">아쉬운 소통</h2>
              <ul><li v-for="s in reputation.improvements" :key="s">{{ s }}</li></ul>
            </section>
          </div>
        </div>
      </details>

      <details v-if="review.scenario" class="review-disclosure">
        <summary>
          <span>시나리오</span>
          <small>당신의 코드가 배포된 후</small>
        </summary>
        <div class="disclosure-body">
          <div v-if="review.ending" class="ending-stamp" :class="review.ending.grade">
            <span class="stamp-label">도달한 결말</span>
            <strong class="stamp-title">{{ ENDING_ICONS[review.ending.grade] ?? '❓' }} {{ review.ending.title }}</strong>
            <span v-if="review.ending.grade === 'hidden'" class="stamp-unlock">🎉 히든 결말 해금!</span>
          </div>
          <div
            v-if="prediction && review.ending"
            class="predict-result"
            :class="{ hit: prediction === review.ending.grade }"
          >
            예측 {{ ENDING_ICONS[prediction] ?? '❓' }} vs 실제 {{ ENDING_ICONS[review.ending.grade] ?? '❓' }} —
            {{ prediction === review.ending.grade
              ? '예측 적중 — 자기 객관화도 실력입니다'
              : '예측은 빗나갔습니다. 시스템은 늘 우리 예상보다 한 수 위입니다.' }}
          </div>
          <MarkdownBlock :source="review.scenario" />
        </div>
      </details>

      <details v-if="explainFeedback" class="review-disclosure">
        <summary>
          <span>설명 훈련 피드백</span>
          <small>내 설명 다듬기</small>
        </summary>
        <div class="disclosure-body">
          <h2 class="sub-h">내가 쓴 설명</h2>
          <blockquote class="transcript">{{ explanation?.text || explainFeedback.transcript }}</blockquote>
          <div class="fb-grid">
            <section class="fb">
              <h2 class="fb-label">논리 구조</h2>
              <p>{{ explainFeedback.feedback.structure }}</p>
            </section>
            <section class="fb">
              <h2 class="fb-label">명료성 · 용어</h2>
              <p>{{ explainFeedback.feedback.clarity }}</p>
            </section>
            <section class="fb">
              <h2 class="fb-label">비유</h2>
              <p>{{ explainFeedback.feedback.analogy }}</p>
            </section>
          </div>
          <h2 class="sub-h">이렇게 말하면 더 조리 있습니다</h2>
          <div class="improved"><MarkdownBlock :source="explainFeedback.feedback.improved" /></div>
        </div>
      </details>
    </div>

    <section v-if="hasSubmission" class="completion-summary" aria-label="완료 요약">
      <div>
        <strong>기록에 저장됨</strong>
        <span v-if="seasonGain">이번 시즌 · {{ SEASON_STAT_LABELS[seasonGain.stat] ?? seasonGain.stat }} +{{ seasonGain.amount }}</span>
      </div>
      <router-link to="/history" class="btn primary">내 기록 보기</router-link>
    </section>

    <nav v-if="hasSubmission" class="actions" aria-label="리뷰 다음 이동">
      <router-link :to="nextActionTarget" class="btn">{{ nextActionLabel }}</router-link>
    </nav>
  </div>
</template>

<style scoped>
.back { font-size: 13px; text-decoration: none; color: var(--fg-dim); }
h1 { font-size: 22px; margin: 12px 0 8px; }
.proto-note {
  color: var(--warn);
  font-size: 13px;
  background: color-mix(in srgb, var(--warn) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
  border-radius: 8px;
  padding: 8px 12px;
}
.proto-note.real {
  color: var(--good);
  background: color-mix(in srgb, var(--good) 8%, transparent);
  border-color: color-mix(in srgb, var(--good) 30%, transparent);
}
.version-pills { display: flex; gap: 6px; flex-wrap: wrap; margin: 12px 0; }
.version-pill {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--fg-dim);
  font-size: 12.5px;
  font-weight: 600;
  padding: 5px 12px;
}
.version-pill.active { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
.block { margin-bottom: 18px; }
.overall { display: flex; gap: 20px; align-items: center; margin-bottom: 20px; }
.overall-score { font-size: 46px; font-weight: 800; }
.overall-label { color: var(--fg-dim); font-size: 13px; }
.overall-summary { margin: 4px 0 0; font-size: 14.5px; }
.items { display: flex; flex-direction: column; gap: 14px; }
.item { border: 1px solid var(--border); border-radius: 10px; padding: 14px; background: var(--bg-soft); }
.item-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
.item-name { font-weight: 600; }
.item-score { font-weight: 700; }
.evidence {
  margin: 0 0 8px;
  padding: 10px 12px;
  background: var(--bg-soft);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  font-size: 12.5px;
  white-space: pre-wrap;
  color: var(--fg-dim);
}
.feedback { margin: 0; font-size: 14px; }
.sec { font-size: 16px; margin: 22px 0 8px; }
.sub-h { font-size: 14px; color: var(--fg-dim); margin: 14px 0 6px; }
.dim { color: var(--fg-dim); font-weight: 400; font-size: 13px; }
.transcript {
  margin: 0;
  padding: 12px 14px;
  background: var(--bg-soft);
  border-left: 3px solid var(--fg-dim);
  border-radius: 0 8px 8px 0;
  font-size: 14px;
  white-space: pre-wrap;
}
.fb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0; }
@media (max-width: 800px) { .fb-grid { grid-template-columns: 1fr; } }
.fb { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
.fb-label { font-weight: 700; font-size: 13px; color: var(--accent); margin-bottom: 6px; }
.fb p { margin: 0; font-size: 13.5px; }
.improved {
  background: color-mix(in srgb, var(--good) 7%, transparent);
  border: 1px solid color-mix(in srgb, var(--good) 25%, transparent);
  border-radius: 10px;
  padding: 4px 16px;
}
.completion-summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 8px; padding: 14px 16px; border: 1px solid color-mix(in srgb, var(--good) 35%, transparent); border-radius: 12px; background: color-mix(in srgb, var(--good) 7%, transparent); }
.completion-summary div { display: grid; gap: 3px; }
.completion-summary strong { color: var(--good); font-size: 13.5px; }
.completion-summary span { color: var(--fg-dim); font-size: 12.5px; }
.actions { display: flex; gap: 10px; margin-top: 10px; }
.ending-stamp {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  margin: 4px 0 14px;
  background: var(--bg-soft);
}
.stamp-label { color: var(--fg-dim); font-size: 12px; white-space: nowrap; }
.stamp-title { font-weight: 800; font-size: 15px; }
.stamp-unlock { color: var(--accent); font-size: 13px; font-weight: 700; }
.ending-stamp.calm { border-color: color-mix(in srgb, var(--good) 40%, transparent); }
.ending-stamp.hotfix { border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
.ending-stamp.dawn { border-color: color-mix(in srgb, var(--bad) 40%, transparent); }
.ending-stamp.hidden { border-color: var(--accent); }
.predict-result {
  font-size: 13px;
  color: var(--fg-dim);
  margin: 0 0 14px;
  padding: 8px 12px;
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.predict-result.hit {
  color: var(--good);
  border-color: color-mix(in srgb, var(--good) 40%, transparent);
  border-style: solid;
}
.scenario {
  border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 5%, transparent), transparent 40%), var(--bg-card);
}
.quest {
  border: 1px dashed var(--fg-dim);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--bg-soft);
  font-style: italic;
}
.quest.found { border-color: var(--accent); background: var(--accent-soft); font-style: normal; }
.quest-mark { font-weight: 800; font-size: 13px; margin-bottom: 6px; }
.quest-text { margin: 0; font-size: 14px; line-height: 1.7; }
.hc-list { display: flex; flex-direction: column; gap: 10px; }
.hc {
  border: 1px solid color-mix(in srgb, var(--bad) 35%, transparent);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-soft);
}
.hc.pass { border-color: color-mix(in srgb, var(--good) 35%, transparent); }
.hc-head { display: flex; gap: 10px; align-items: center; }
.hc-mark { font-size: 13px; font-weight: 700; white-space: nowrap; }
.hc-title { font-weight: 600; font-size: 14px; }
.hc-note { margin: 6px 0 0; font-size: 13.5px; }
.hc-story { margin: 8px 0 0; font-size: 13px; color: var(--fg-dim); font-style: italic; }
.rep-level { display: flex; align-items: center; gap: 14px; margin: 12px 0; }
.rep-badge {
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}
.rep-summary { margin: 0; font-size: 14px; }
.rep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 800px) { .rep-grid { grid-template-columns: 1fr; } }
.rep-col { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; }
.rep-col ul { margin: 6px 0 0; padding-left: 18px; }
.rep-col li { font-size: 13.5px; margin: 5px 0; }
.rep-label { font-weight: 700; font-size: 13px; }
.good-label { color: var(--good); }
.warn-label { color: var(--warn); }

@media (max-width: 700px) {
  h1 { font-size: 19px; }
  .card { padding: 14px; }
  .overall { flex-wrap: wrap; gap: 12px; }
  .overall-score { font-size: 34px; }
  .ending-stamp { flex-wrap: wrap; row-gap: 6px; }
  .hc { padding: 10px 12px; }
  .completion-summary { align-items: stretch; flex-direction: column; }
  .completion-summary .btn { min-height: 40px; text-align: center; }
  .actions { flex-wrap: wrap; }
  .actions .btn { flex: 1 1 auto; text-align: center; min-height: 40px; }
}

.review-lead {
  display: grid;
  gap: 14px;
  margin: 14px 0 16px;
  padding: 16px 0 18px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}
.score-line { display: flex; align-items: baseline; gap: 10px; }
.score-line strong { font-size: 34px; font-weight: 850; letter-spacing: -.04em; }
.score-line span { color: var(--fg-dim); font-size: 13px; }
.first-fix { display: grid; gap: 4px; padding-left: 13px; border-left: 3px solid var(--accent); }
.first-fix > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.first-fix > strong { font-size: 17px; }
.first-fix > small { color: var(--fg-dim); font-size: 12px; }
.first-fix > p { max-width: 720px; margin: 4px 0 0; font-size: 14px; line-height: 1.55; }
.retry-action { justify-self: start; }
.review-state { margin: 16px 0; padding: 18px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.review-state h2 { margin: 0 0 6px; font-size: 18px; }
.review-state p { max-width: 620px; margin: 0 0 14px; color: var(--fg-dim); line-height: 1.65; }
.proto-note { margin: 12px 0; line-height: 1.55; }
.review-disclosures { margin-top: 14px; border-top: 1px solid var(--line); }
.review-disclosure { border-bottom: 1px solid var(--line); }
.review-disclosure > summary {
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  list-style: none;
}
.review-disclosure > summary::-webkit-details-marker { display: none; }
.review-disclosure > summary::after { content: '＋'; color: var(--accent-text); font-weight: 700; }
.review-disclosure[open] > summary::after { content: '−'; }
.review-disclosure > summary span { flex: 1; font-weight: 750; }
.review-disclosure > summary small { color: var(--fg-dim); font-size: 12px; }
.disclosure-body { padding: 2px 0 22px; }
.overall-summary { max-width: 760px; margin: 0 0 18px; line-height: 1.7; }
.items { gap: 0; border-top: 1px solid var(--line); }
.item { padding: 16px 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; }
.item-head { align-items: baseline; gap: 12px; }
.item-name { margin: 0; font-size: 15px; }
.evidence { background: transparent; }
.hc-list { gap: 0; border-top: 1px solid var(--line); }
.hc { padding: 14px 0 14px 12px; border: 0; border-bottom: 1px solid var(--line); border-left: 3px solid color-mix(in srgb, var(--bad) 55%, transparent); border-radius: 0; background: transparent; }
.hc.pass { border-color: var(--line); border-left-color: color-mix(in srgb, var(--good) 55%, transparent); }
.hc-title { margin: 0; }
.quest { margin-top: 16px; padding: 14px 0 0 12px; border: 0; border-left: 3px dashed var(--fg-dim); border-radius: 0; background: transparent; }
.quest.found { border-color: var(--accent); background: transparent; }
.quest h2 { margin: 0 0 6px; font-size: 14px; }
.rep-level { align-items: flex-start; margin-top: 0; padding-left: 12px; border-left: 3px solid var(--accent); }
.rep-level > strong { color: var(--accent-text); white-space: nowrap; }
.rep-grid { gap: 0; border-top: 1px solid var(--line); }
.rep-col { padding: 14px 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; }
.rep-col:first-child { padding-right: 16px; }
.rep-col:last-child { padding-left: 16px; }
.rep-label, .fb-label { margin: 0 0 6px; }
.fb-grid { gap: 0; border-top: 1px solid var(--line); }
.fb { padding: 14px 0; border: 0; border-bottom: 1px solid var(--line); border-radius: 0; background: transparent; }
.improved { padding: 0 0 0 12px; border: 0; border-left: 3px solid color-mix(in srgb, var(--good) 50%, transparent); border-radius: 0; background: transparent; }
.ending-stamp { border-radius: 0; background: transparent; }
.actions { justify-content: flex-end; margin: 10px 0 0; }

@media (max-width: 700px) {
  .review-lead { gap: 12px; padding-top: 13px; }
  .score-line strong { font-size: 30px; }
  .first-fix > p { font-size: 13.5px; }
  .retry-action { width: 100%; text-align: center; }
  .review-disclosure > summary small { max-width: 120px; text-align: right; }
  .rep-level { display: grid; gap: 5px; }
  .rep-col:first-child, .rep-col:last-child { padding: 14px 0; }
  .completion-summary { align-items: stretch; }
}
</style>
