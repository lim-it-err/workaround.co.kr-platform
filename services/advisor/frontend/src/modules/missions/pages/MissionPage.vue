<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useMissions } from '../store/missions.js'
import sampleContent from '../data/sampleContent.js'
import { vienna1900CodingMissions } from '../data/courseVienna1900.js'
import { budapestBathsCodingMissions } from '../data/courseBudapestBaths.js'
import { clearDraftThrough, readDraft, writeDraft } from '../store/drafts.js'
import MarkdownBlock from '../components/MarkdownBlock.vue'
import CodeViewer from '../components/CodeViewer.vue'
import FileSubmitEditor from '../components/FileSubmitEditor.vue'
import FindingsBuilder from '../components/FindingsBuilder.vue'
import RubricList from '../components/RubricList.vue'
import ChatPanel from '../components/ChatPanel.vue'
import PlannerMeetingPanel from '../components/PlannerMeetingPanel.vue'
import PlannerReviewPanel from '../components/PlannerReviewPanel.vue'
import NicknamePrompt from '../components/NicknamePrompt.vue'
import { platformHomePath } from '../../../app/platformNavigation.js'

const route = useRoute()
const router = useRouter()
const store = useMissions()
store.hydrateMissionContent(sampleContent, [...vienna1900CodingMissions, ...budapestBathsCodingMissions])
const requestedReturn = window.history.state?.from
const returnSurface = requestedReturn === '/today' || /^\/courses\/[^/]+$/.test(requestedReturn ?? '')
  ? requestedReturn
  : '/learn'
const returnLabel = window.history.state?.fromLabel
  ?? (returnSurface === '/today' ? '오늘' : '배우기')

const VOYAGE_STOPS = {
  'v1900-f-belvedere-route': 'day-6-belvedere',
  'v1900-6-salt-mine': 'day-4-hallstatt',
}
const platformHome = platformHomePath(import.meta.env.BASE_URL)
const voyageStopHref = computed(() => {
  const stopId = VOYAGE_STOPS[String(route.params.id)]
  return platformHome && stopId ? `${platformHome}voyage#voyage-stop-${encodeURIComponent(stopId)}` : ''
})

const mission = computed(() => store.getMission(route.params.id))
const isDomainLogic = computed(() => mission.value?.missionType === '도메인 로직 구현')
// 코드 판독/설계 리뷰 — 실행 없이 읽고 판정만 하는 미션. 제출을 구조화 빌더(findings.md)로 유도한다.
const isNoCodeMission = computed(() => ['코드 판독', '설계 리뷰'].includes(mission.value?.missionType))
// 입력 원칙 — 선택 우선: 기본은 구조화 빌더, 원하면 자유 작성으로 전환 가능(둘 다 같은 제출로 이어짐).
const useBuilder = ref(true)

// 기획자 모드: mission.modes가 2개 이상일 때만 선택창 표시. 기본은 항상 개발자 모드.
const MODE_META = {
  developer: { label: '💻 개발자' },
  plannerMeeting: { label: '🤝 기획자 · 회의' },
  plannerReview: { label: '📋 기획자 · 검토' },
}
const DIFFICULTY_LABEL = { Easy: '쉬움', Normal: '보통', Hard: '어려움' }
const requestedMode = typeof route.query.mode === 'string' ? route.query.mode : ''
const mode = ref(mission.value?.modes?.includes(requestedMode) ? requestedMode : 'developer')

// 결말 분기 상태창 메타 (grade: calm | hotfix | dawn | hidden)
const ENDING_META = {
  calm: { icon: '☕' },
  hotfix: { icon: '🔧' },
  dawn: { icon: '🚨' },
  hidden: { icon: '🔒' },
}

// 입력 원칙 — 선택 우선: 결말 예측 투표. hidden은 애초에 잠겨 있으므로 투표 대상에서 뺀다(신비로움 유지).
const votableEndings = computed(() => (mission.value?.endings ?? []).filter((e) => e.grade !== 'hidden'))
const endingPrediction = computed(() => (mission.value ? store.getEndingPrediction(mission.value.id) : null))
function predictEnding(grade) {
  store.predictEnding(mission.value.id, grade)
}

const TABS = ['도메인 브리핑', '미션', '제출', '설명 훈련']
const TAB_QUERY = { briefing: '도메인 브리핑', mission: '미션', submit: '제출', explain: '설명 훈련' }
const tab = ref(TAB_QUERY[route.query.tab] ?? '도메인 브리핑')

// 제출 상태 — submissions는 버전 배열(재제출 시 append). 최신 버전을 편집 초기값으로 쓴다.
const submissionVersions = computed(() => store.state.submissions[route.params.id] ?? [])
const latestSubmission = computed(() => submissionVersions.value[submissionVersions.value.length - 1] ?? null)
const files = ref(
  latestSubmission.value?.files?.map((f) => ({ ...f })) ?? [{ path: '', content: '' }],
)
const submitting = ref(false)

// 설명 입력도 같은 초안 스냅샷의 description으로 보존한다.
const explainText = ref(store.state.explanations[route.params.id]?.text ?? '')
const draftStatus = ref('')
const draftFailed = ref(false)
const draftDirty = ref(false)
let draftTimer = null
let applyingDraft = false
let savedSignature = ''

function draftPayload() {
  return {
    files: files.value.map((file) => ({ name: file.path, body: file.content })),
    description: explainText.value,
  }
}

function signature(payload = draftPayload()) {
  return JSON.stringify(payload)
}

function defaultPayload(targetMode) {
  if (targetMode !== 'developer') return { files: [{ name: '', body: '' }], description: '' }
  return {
    files: latestSubmission.value?.files?.map((file) => ({ name: file.path, body: file.content }))
      ?? [{ name: '', body: '' }],
    description: store.state.explanations[route.params.id]?.text ?? '',
  }
}

function applyPayload(payload) {
  applyingDraft = true
  files.value = (payload.files?.length ? payload.files : [{ name: '', body: '' }])
    .map((file) => ({ path: file.name, content: file.body }))
  explainText.value = payload.description ?? ''
  savedSignature = signature()
  draftDirty.value = false
  draftFailed.value = false
  applyingDraft = false
}

function restoreDraft(targetMode = mode.value) {
  try {
    const restored = readDraft(route.params.id, targetMode)
    applyPayload(restored ?? defaultPayload(targetMode))
    draftStatus.value = restored?.updatedAt
      ? `저장됨 ${new Date(restored.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
      : ''
  } catch {
    applyPayload(defaultPayload(targetMode))
    draftStatus.value = '저장소를 읽지 못했습니다'
  }
}

function saveDraftNow(targetMode = mode.value) {
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = null
  const payload = draftPayload()
  const currentSignature = signature(payload)
  if (!draftDirty.value && currentSignature === savedSignature) return true

  try {
    const saved = writeDraft({
      missionId: route.params.id,
      mode: targetMode,
      files: payload.files,
      description: payload.description,
    })
    savedSignature = currentSignature
    draftDirty.value = false
    draftFailed.value = false
    draftStatus.value = `저장됨 ${new Date(saved.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
    return true
  } catch {
    draftDirty.value = true
    draftFailed.value = true
    draftStatus.value = '저장 실패'
    return false
  }
}

function scheduleDraftSave() {
  if (applyingDraft) return
  draftDirty.value = signature() !== savedSignature
  if (!draftDirty.value) {
    draftFailed.value = false
    return
  }
  if (draftTimer) clearTimeout(draftTimer)
  draftTimer = setTimeout(() => saveDraftNow(), 400)
}

watch(files, scheduleDraftSave, { deep: true })
watch(explainText, scheduleDraftSave)
watch(mode, (nextMode, previousMode) => {
  if (draftDirty.value) saveDraftNow(previousMode)
  restoreDraft(nextMode)
})

restoreDraft()

function retryDraftSave() {
  draftDirty.value = true
  saveDraftNow()
}

function beforeUnload(event) {
  if (draftDirty.value) saveDraftNow()
  if (!draftFailed.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => {
  if (draftTimer) clearTimeout(draftTimer)
  window.removeEventListener('beforeunload', beforeUnload)
})

onBeforeRouteLeave(() => {
  if (draftDirty.value) saveDraftNow()
  if (!draftFailed.value) return true
  return window.confirm('초안을 저장하지 못했습니다. 저장하지 않고 이동할까요?')
})

// 닉네임 게이트: 제출 액션 전, 닉네임이 없으면 프롬프트를 띄우고 확인 시에만 이어간다.
const showNicknamePrompt = ref(false)
let pendingAction = null

function requireNickname(action) {
  if (store.state.learner.nickname) {
    action()
  } else {
    pendingAction = action
    showNicknamePrompt.value = true
  }
}

function onNicknameConfirmed() {
  showNicknamePrompt.value = false
  const action = pendingAction
  pendingAction = null
  if (action) action()
}

function onNicknameCancelled() {
  showNicknamePrompt.value = false
  pendingAction = null
}

async function doSubmit() {
  submitting.value = true
  const missionId = mission.value.id
  saveDraftNow()
  const submittedAt = new Date()
  const submittedSignature = signature()
  const gotReview = await store.submitCode(missionId, files.value)
  // 백엔드가 리뷰를 만들지 못했을 때만(=대기 시간이 없었을 때만) 짧은 가짜 지연을 준다 —
  // 실제 리뷰를 기다렸다면 이미 충분히 기다린 것이므로 추가 지연은 없다.
  if (!gotReview) {
    await new Promise((r) => setTimeout(r, 900))
  } else {
    try {
      const cleared = clearDraftThrough(missionId, mode.value, submittedAt)
      if (cleared && signature() === submittedSignature) {
        savedSignature = submittedSignature
        draftDirty.value = false
        draftFailed.value = false
        draftStatus.value = '제출한 초안을 비웠습니다'
      }
    } catch {
      draftFailed.value = true
      draftStatus.value = '저장 실패'
    }
  }
  submitting.value = false
  router.push({
    path: `/missions/${missionId}/review`,
    state: { from: returnSurface, fromLabel: returnLabel },
  })
}

function submit() {
  requireNickname(doSubmit)
}

// 입력 원칙 — 선택 우선: 시작 뼈대 칩. 탭하면 템플릿이 삽입되고 채워 넣기만 하면 된다. 칩마다 1회.
const EXPLAIN_CHIPS = computed(() => {
  const audience = mission.value?.explainTask?.audience || '청자'
  return [
    { label: '비유로 시작', template: '비유로 말하면, 이건 마치 "…"와 같습니다. 왜냐하면 …이기 때문입니다.' },
    { label: '결론부터', template: '결론부터 말하면, ○○입니다. 그 이유는 다음과 같습니다.\n1. …\n2. …' },
    { label: '청자의 언어로', template: `${audience}가 알아야 할 건 이겁니다: …\n전문 용어 대신 이렇게 표현하면: …` },
  ]
})
const usedExplainChips = ref([])
function insertExplainTemplate(i, template) {
  if (usedExplainChips.value.includes(i)) return
  explainText.value = explainText.value.trim() ? `${explainText.value}\n\n${template}` : template
  usedExplainChips.value.push(i)
  store.chooseExplainStarter(mission.value.id, i)
}

function doSubmitExplanation() {
  saveDraftNow()
  const submittedAt = new Date()
  const submittedSignature = signature()
  store.submitExplanation(mission.value.id, explainText.value)
  try {
    const cleared = clearDraftThrough(mission.value.id, mode.value, submittedAt)
    if (cleared && signature() === submittedSignature) {
      savedSignature = submittedSignature
      draftDirty.value = false
      draftStatus.value = '제출한 초안을 비웠습니다'
    }
  } catch {
    draftFailed.value = true
    draftStatus.value = '저장 실패'
  }
  router.push({
    path: `/missions/${mission.value.id}/review`,
    query: { focus: 'explain' },
    state: { from: returnSurface },
  })
}

function submitExplanation() {
  requireNickname(doSubmitExplanation)
}
</script>

<template>
  <div v-if="mission">
    <router-link :to="returnSurface" class="back">← {{ returnLabel }}</router-link>

    <div class="head">
      <div class="head-meta">
        <span class="chip">S{{ mission.stage }} · {{ mission.stageTitle }}</span>
        <span class="chip neutral">{{ mission.missionType }}</span>
        <span
          v-if="mission.difficulty"
          class="chip"
          :class="'diff-' + String(mission.difficulty).toLowerCase()"
        >{{ DIFFICULTY_LABEL[mission.difficulty] ?? mission.difficulty }}</span>
        <span v-if="mission.scope" class="chip neutral">📐 {{ mission.scope }}</span>
        <span class="chip neutral">{{ mission.domainEmoji }} {{ mission.domain }}</span>
      </div>
      <h1>{{ mission.title }}</h1>
      <a v-if="voyageStopHref" class="voyage-return" :href="voyageStopHref">
        <svg
          aria-hidden="true"
          class="voyage-return__loop"
          focusable="false"
          viewBox="0 0 96 96"
        >
          <path d="M58 18.55 A33 33 0 1 1 38 18.55" />
          <circle cx="48" cy="16" r="4" />
        </svg>
        이 미션의 정류장 ←
      </a>
    </div>

    <!-- 기획자 모드: 같은 문제, 다른 의자 -->
    <div v-if="mission.modes?.length > 1" class="mode-select">
      <button
        v-for="m in mission.modes"
        :key="m"
        class="mode-btn"
        :class="{ active: mode === m }"
        @click="mode = m"
      >{{ MODE_META[m]?.label ?? m }}</button>
    </div>

    <PlannerMeetingPanel
      v-if="mode === 'plannerMeeting' && mission.plannerMeeting"
      :mission-id="mission.id"
      :planner-meeting="mission.plannerMeeting"
    />
    <PlannerReviewPanel
      v-else-if="mode === 'plannerReview' && mission.plannerReview"
      :mission-id="mission.id"
      :planner-review="mission.plannerReview"
    />

    <template v-else>
    <nav class="tabs">
      <button
        v-for="t in TABS"
        :key="t"
        class="tab"
        :class="{ active: tab === t }"
        @click="tab = t"
      >{{ t }}</button>
    </nav>
    <div class="draft-state" :class="{ failed: draftFailed }" aria-live="polite">
      <span>{{ draftStatus }}</span>
      <button v-if="draftFailed" type="button" @click="retryDraftSave">다시 시도</button>
    </div>

    <!-- 도메인 브리핑: 코드 전에 세상 먼저 -->
    <section v-if="tab === '도메인 브리핑'" id="mission-briefing" class="panel card">
      <h2 class="panel-title">{{ mission.briefing.title }}</h2>
      <MarkdownBlock :source="mission.briefing.content" />
      <div class="panel-next">
        <button class="btn primary" @click="tab = '미션'">브리핑 읽었어요 → 미션 보기</button>
      </div>
    </section>

    <!-- 미션: 시나리오 + 레거시 + 요구사항 -->
    <section v-if="tab === '미션'" class="panel">
      <div class="card block">
        <h2 class="panel-title">상황</h2>
        <MarkdownBlock :source="mission.scenario" />
      </div>

      <!-- 결말 분기: 이 코드의 가능한 미래들 (게임 상태창) -->
      <div v-if="mission.endings?.length" id="ending-prediction" class="card block endings">
        <h2 class="panel-title">🎮 결말 분기 <span class="endings-sub">— 이 코드의 가능한 미래들. 리뷰의 시나리오가 도달한 결말을 알려줍니다.</span></h2>
        <div class="ending-rows">
          <div
            v-for="e in mission.endings"
            :key="e.grade"
            class="ending"
            :class="[e.grade]"
          >
            <span class="ending-icon">{{ ENDING_META[e.grade]?.icon ?? '❓' }}</span>
            <span class="ending-title">{{ e.title }}</span>
            <span class="ending-teaser">{{ e.teaser }}</span>
          </div>
        </div>

        <!-- 입력 원칙 — 선택 우선: 결말 예측 투표. 원탭, 타이핑 0. -->
        <div v-if="endingPrediction" class="predict-done">
          예측 완료: {{ ENDING_META[endingPrediction]?.icon }} — 리뷰에서 실제 결말과 대조합니다.
        </div>
        <div v-else class="predict-vote">
          <div class="predict-q">당신은 어느 결말에 도달할 것 같습니까?</div>
          <div class="predict-buttons">
            <button
              v-for="e in votableEndings"
              :key="e.grade"
              class="predict-btn"
              @click="predictEnding(e.grade)"
            >{{ ENDING_META[e.grade]?.icon }} {{ e.title }}</button>
          </div>
        </div>
      </div>

      <div v-if="mission.providedFiles?.length" class="card block engine">
        <h2 class="panel-title">⚙️ 제공 코드 — 엔진</h2>
        <p class="dim">
          이미 구현되어 있습니다. 그대로 사용하세요 — 내부를 다시 구현하거나 수정할 필요가 없습니다.
          당신의 연습은 이 엔진의 구현이 아니라, 이 엔진을 <strong>어떤 인터페이스 뒤에 둘 것인가</strong>입니다.
        </p>
        <CodeViewer :files="mission.providedFiles" />
      </div>

      <div class="card block">
        <h2 class="panel-title">{{ isDomainLogic ? '구현할 뼈대' : '물려받은 코드' }}</h2>
        <p class="dim">
          {{ isDomainLogic
            ? '이 뼈대를 로컬 IDE로 옮겨서 채워 넣으세요. 계층과 인터페이스 경계는 스스로 결정합니다.'
            : '이 코드를 로컬 IDE로 옮겨서 작업하세요. 동작은 보존해야 합니다.' }}
        </p>
        <CodeViewer :files="mission.legacyFiles" />
      </div>

      <div class="two-col">
        <div class="card block">
          <h2 class="panel-title">요구사항</h2>
          <ol class="req">
            <li v-for="r in mission.requirements" :key="r">{{ r }}</li>
          </ol>
        </div>
        <div class="card block">
          <h2 class="panel-title">제약</h2>
          <ul class="req">
            <li v-for="c in mission.constraints" :key="c">{{ c }}</li>
          </ul>
          <h2 class="panel-title" style="margin-top: 18px">학습 목표</h2>
          <ul class="req">
            <li v-for="g in mission.learningGoals" :key="g">{{ g }}</li>
          </ul>
        </div>
      </div>

      <div class="card block">
        <h2 class="panel-title">평가 기준 (공개분)</h2>
        <RubricList :rubric="mission.rubric" />
        <p v-if="mission.hiddenCases?.length" class="hidden-cases">
          🕵️ 이 미션에는 요구사항에 없는 <strong>히든 케이스 {{ mission.hiddenCases.length }}개</strong>가 숨어 있습니다.
          현실의 입력은 명세를 읽지 않으니까요. 리뷰에서 공개됩니다.
        </p>
      </div>

      <details class="card block hints">
        <summary>힌트 보기 (막혔을 때만)</summary>
        <ol>
          <li v-for="h in mission.hints" :key="h">{{ h }}</li>
        </ol>
      </details>
    </section>

    <!-- 제출 -->
    <section v-if="tab === '제출'" class="panel">
      <template v-if="isNoCodeMission">
        <div class="submit-mode-row">
          <p class="dim submit-mode-hint">
            이 미션은 실행 없이 읽고 판정하는 훈련입니다. 카드로 쌓으면 findings.md가 자동으로 조립됩니다.
          </p>
          <button class="btn mode-switch" @click="useBuilder = !useBuilder">
            {{ useBuilder ? '자유 작성으로 전환' : '구조화 빌더로 전환' }}
          </button>
        </div>
        <FindingsBuilder v-if="useBuilder" :mission-id="mission.id" v-model="files" />
        <FileSubmitEditor v-else v-model="files" />
      </template>
      <template v-else>
        <p class="dim">
          로컬에서 작업한 결과 파일들을 붙여넣으세요. 파일 여러 개 제출 가능합니다.
          제출하면 리뷰 에이전트가 평가 기준에 따라 검토합니다.
        </p>
        <FileSubmitEditor v-model="files" />
      </template>
      <div class="submit-row">
        <button class="btn primary" :disabled="submitting" @click="submit">
          {{ submitting ? '리뷰 요청 중…' : '제출하고 리뷰 받기' }}
        </button>
        <span v-if="latestSubmission" class="dim">
          이전 제출: {{ submissionVersions.length }}차 ({{ new Date(latestSubmission.submittedAt).toLocaleString('ko-KR') }})
        </span>
      </div>
      <p v-if="submitting" class="dim submit-progress">
        Reviewer가 코드를 읽는 중… 30초~1분 걸립니다
      </p>
    </section>

    <!-- 설명 훈련 -->
    <section v-if="tab === '설명 훈련'" class="panel">
      <div class="card block explain-brief">
        <h2 class="panel-title">🎙 설명 과제</h2>
        <p><strong>청자:</strong> {{ mission.explainTask.audience }}</p>
        <MarkdownBlock :source="mission.explainTask.prompt" />
      </div>
      <div id="explain-starters" class="chip-row">
        <button
          v-for="(c, i) in EXPLAIN_CHIPS"
          :key="i"
          class="starter-chip"
          :class="{ used: usedExplainChips.includes(i) }"
          :disabled="usedExplainChips.includes(i)"
          @click="insertExplainTemplate(i, c.template)"
        >{{ c.label }}</button>
      </div>
      <textarea
        v-model="explainText"
        class="explain-input mono"
        rows="12"
        aria-label="설명 훈련 답변"
        placeholder="말하듯이 써보세요. 에이전트가 논리 구조, 용어 선택, 비유의 적절성을 피드백합니다."
      ></textarea>
      <div class="submit-row">
        <button class="btn primary" :disabled="!explainText.trim()" @click="submitExplanation">
          설명 제출하고 피드백 받기
        </button>
      </div>
    </section>
    </template>
    <ChatPanel v-if="mode === 'developer'" :mission-id="mission.id" />
    <NicknamePrompt
      v-if="showNicknamePrompt"
      @confirmed="onNicknameConfirmed"
      @cancelled="onNicknameCancelled"
    />
  </div>
  <p v-else>존재하지 않는 미션입니다.</p>
</template>

<style scoped>
.back { display: inline-flex; min-width: 40px; min-height: 40px; align-items: center; font-size: 13px; text-decoration: none; color: var(--fg-dim); }
.endings-sub { color: var(--fg-dim); font-size: 12.5px; font-weight: 400; }
.ending-rows { display: flex; flex-direction: column; gap: 8px; }
.ending {
  display: grid;
  grid-template-columns: 28px minmax(96px, auto) 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-soft);
  font-size: 13.5px;
}
.ending-title { font-weight: 700; }
.ending-teaser { color: var(--fg-dim); }
.ending.calm { border-color: color-mix(in srgb, var(--good) 30%, transparent); }
.ending.hotfix { border-color: color-mix(in srgb, var(--warn) 30%, transparent); }
.ending.dawn { border-color: color-mix(in srgb, var(--bad) 30%, transparent); }
.ending.hidden { opacity: 0.6; border-style: dashed; }
.hidden-cases {
  margin: 12px 0 0;
  padding: 10px 14px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  color: var(--fg-dim);
  font-size: 13.5px;
}
.predict-vote { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); }
.predict-q { font-weight: 600; font-size: 14px; margin-bottom: 10px; }
.predict-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
.predict-btn {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--fg);
  font-size: 13.5px;
  font-weight: 600;
  padding: 10px 16px;
  min-height: 44px;
}
.predict-btn:hover { border-color: var(--accent); color: var(--accent); }
.predict-done {
  margin-top: 16px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  color: var(--accent);
  font-size: 13.5px;
  font-weight: 600;
}
.submit-mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.submit-mode-hint { margin: 0; flex: 1 1 240px; }
.mode-switch { font-size: 12.5px; padding: 8px 14px; flex-shrink: 0; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.starter-chip {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--fg-dim);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  min-height: 36px;
}
.starter-chip:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.starter-chip:disabled { opacity: 0.4; cursor: default; }
.starter-chip.used { opacity: 0.4; }
.chip.diff-easy { background: color-mix(in srgb, var(--good) 15%, transparent); color: var(--good); }
.chip.diff-normal { background: var(--accent-soft); color: var(--accent); }
.chip.diff-hard { background: color-mix(in srgb, var(--bad) 15%, transparent); color: var(--bad); }
.engine { border-color: color-mix(in srgb, var(--good) 35%, transparent); }
.back:hover { color: var(--accent); }
.head { margin: 14px 0 18px; }
.head-meta { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
h1 { font-size: 22px; margin: 0; }
.voyage-return {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  color: var(--accent-text);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.voyage-return:hover, .voyage-return:focus-visible { text-decoration: underline; text-underline-offset: 4px; }
.voyage-return:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.voyage-return__loop {
  width: 16px;
  height: 16px;
  flex: none;
  overflow: visible;
}
.voyage-return__loop path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-width: 5;
}
.voyage-return__loop circle {
  fill: currentColor;
}
.mode-select {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  margin-bottom: 18px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.mode-btn {
  background: none;
  border: none;
  border-radius: 7px;
  color: var(--fg-dim);
  font-size: 13.5px;
  padding: 8px 14px;
  white-space: nowrap;
}
.mode-btn.active { background: var(--accent); color: var(--accent-ink); font-weight: 700; }
.tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  background: none;
  border: none;
  color: var(--fg-dim);
  font-size: 14px;
  padding: 10px 16px;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 40px;
}
.tab.active { color: var(--fg); border-bottom-color: var(--accent); font-weight: 600; }
.panel-title { font-size: 16px; margin: 0 0 10px; }
.draft-state { min-height: 22px; margin: -12px 0 14px; color: var(--fg-dim); font-size: 12px; text-align: right; }
.draft-state.failed { color: var(--bad); }
.draft-state button { min-height: 40px; margin-left: 8px; border: 0; background: transparent; color: inherit; text-decoration: underline; }
.block { margin-bottom: 16px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 800px) { .two-col { grid-template-columns: 1fr; } }
.req { margin: 0; padding-left: 20px; }
.req li { margin: 7px 0; font-size: 14px; }
.dim { color: var(--fg-dim); font-size: 13.5px; }
.hints summary { cursor: pointer; color: var(--warn); font-size: 14px; }
.hints ol { margin: 10px 0 0; }
.hints li { margin: 6px 0; font-size: 14px; }
.panel-next { margin-top: 20px; }
.submit-row { display: flex; align-items: center; gap: 14px; margin-top: 16px; }
.submit-progress { margin-top: 10px; }
.explain-brief { margin-bottom: 14px; }
.explain-input {
  width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--fg);
  padding: 14px;
  font-size: 14px;
  line-height: 1.7;
  font-family: inherit;
  resize: vertical;
}
.explain-input:focus { outline: none; border-color: var(--accent); }

@media (max-width: 700px) {
  h1 { font-size: 19px; }
  .head-meta { row-gap: 8px; }
  .card, .panel > .card { padding: 14px; }
  .mode-select { flex-wrap: wrap; width: 100%; }
  .mode-btn { flex: 1 1 auto; text-align: center; min-height: 40px; }
  .ending {
    grid-template-columns: 28px 1fr;
    grid-template-areas:
      "icon title"
      "teaser teaser";
    row-gap: 4px;
  }
  .ending-icon { grid-area: icon; }
  .ending-title { grid-area: title; }
  .ending-teaser { grid-area: teaser; font-size: 12.5px; }
  .hidden-cases { font-size: 12.5px; padding: 8px 12px; }
  .submit-row { flex-wrap: wrap; margin-bottom: 64px; }
  .btn.primary { min-height: 40px; }
  .predict-btn { flex: 1 1 100%; }
  .submit-mode-row { flex-direction: column; align-items: stretch; }
  .mode-switch { width: 100%; min-height: 44px; }
  .starter-chip { flex: 1 1 auto; text-align: center; }
}
</style>
