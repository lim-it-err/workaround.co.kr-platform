<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import VoyageView from './components/VoyageView.vue'
import WritingStudio from './components/WritingStudio.vue'
import Pantry from './components/Pantry.vue'
import Ets2Live from './components/Ets2Live.vue'
import Ets2Dev from './components/Ets2Dev.vue'
import { SiteLoopSymbol } from './components/tone/index.js'
import { BLOG_LINE_OPEN, LINES } from './data/lines.js'
import SplashView from './components/pages/SplashView.vue'
import JunctionView from './components/pages/JunctionView.vue'
import SimHubView from './components/pages/SimHubView.vue'
import ElevatorView from './components/pages/ElevatorView.vue'
import TaxiView from './components/pages/TaxiView.vue'
import WorkView from './components/pages/WorkView.vue'
import RuntimeView from './components/pages/RuntimeView.vue'
import BlogHubView from './components/pages/BlogHubView.vue'
import BlogArchiveView from './components/pages/BlogArchiveView.vue'
import BlogPostView from './components/pages/BlogPostView.vue'
import { useSplash } from './composables/useSplash.js'
import { useElevatorSim } from './composables/useElevatorSim.js'
import { useTaxiSim } from './composables/useTaxiSim.js'
import { useWorkManager } from './composables/useWorkManager.js'
import { useBlogStore } from './composables/useBlogStore.js'
import { useTheme } from './composables/useTheme.js'
import { usePageRouting } from './composables/usePageRouting.js'
import { fallbackElevatorState, fallbackHealth, fallbackRuntime, fallbackWorkBoard } from './data/fallbacks.js'
import { VOYAGE } from './data/voyage.js'
import { migrateLegacyVoyageStorage, voyageStorageKey } from './data/voyageStorage.js'
import { normalizeBasePath, STATIC_UNAVAILABLE_LIVE_PAGES } from './staticRouting.js'

// 셸: 전역 전환(문 애니메이션)·상단바·페이지 스위치·모바일 빠른 환승만 맡는다(TKT-211).
// 화면·상태·타이머는 pages/*View.vue 와 composables/use*.js 가 소유한다.
const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL)
const ETS2_DEV_TEST_API = typeof window !== 'undefined'
  && ['127.0.0.1', 'localhost', '[::1]'].includes(window.location.hostname)
  ? String(window.__WORKAROUND_ETS2_DEV_TEST_API__ || '')
  : ''
const isStaticMode = !ETS2_DEV_TEST_API && (import.meta.env.VITE_STATIC_MODE === 'true' || APP_BASE_PATH !== '/')
const VOYAGE_ARCHIVE_STORAGE_KEY = voyageStorageKey(VOYAGE.id, 'archive')
const simHubLine = LINES.find((line) => line.page === 'simhub')
let fallbackEntityIdCounter = 0

const prefersReducedMotion = ref(false)
const simHubView = ref(null)
const { theme, toggleTheme } = useTheme()
// 페이지 전환·주소 동기화·문 전환·D-031 블로그 가드는 usePageRouting 이 소유한다.
// 블로그 저장소·스플래시·엘리베이터·격납고 화면은 아래에서 만들고 ctx() 로 나중에 건넨다(순환 의존).
const routing = usePageRouting({
  appBasePath: APP_BASE_PATH,
  isStaticMode,
  prefersReducedMotion,
  ctx: () => ({ blogStore, splash, elevator, simHubView })
})
const {
  page,
  doorTransition,
  staticModeMessage,
  blogClosedNotice,
  topbarLineClass,
  topbarLetter,
  pageTitle,
  openPage
} = routing
// 기지선(Work Manager·Runtime) 상태·인증 세션·타이머는 useWorkManager 가 소유한다(TKT-209).
const workManager = useWorkManager({
  fetchJson,
  fallbacks: { health: fallbackHealth, runtime: fallbackRuntime, workBoard: fallbackWorkBoard }
})
const { loadHealthState, loadRuntimeState, loadServicesState, loadWorkBoardState } = workManager
// 블로그 저장소(글 목록·활성 슬러그·Writing Studio 상태·자동저장)는 useBlogStore 가 소유한다(TKT-210).
const blogStore = useBlogStore({
  page,
  openPage,
  createEntityId,
  initialSlug: routing.initialBlogSlug,
  voyageArchiveStorageKey: VOYAGE_ARCHIVE_STORAGE_KEY
})
const {
  studioViewMode,
  studioState,
  studioLastSavedAt,
  studioSavePhase,
  writingBackupMessage,
  blogMessage,
  draftBlogPosts,
  archivedBlogPosts,
  studioPreviewHtml,
  initializeBlogWorkspace,
  createNewStudioPost,
  openStudioForPost,
  updateStudioField,
  publishStudioPost,
  archiveStudioPost,
  unpublishStudioPost,
  restoreArchivedPost,
  backupLocalWriting,
  openBlogArchive,
  setStudioViewMode,
  clearBlogMessage
} = blogStore
// 스플래시 상태·타이머는 useSplash 가 소유한다. 문 열기/페이지 전환은 라우팅이 한다.
const splash = useSplash({
  prefersReducedMotion,
  isActive: () => page.value === 'splash',
  onTransition: routing.handleSplashTransition
})
const { currentTicker, currentSplashPhrase, splashBoardCells, splashAutoTransitionLabel } = splash
// 엘리베이터·택시 시뮬 상태/타이머는 각 composable 이 소유한다(화면과 무관하게 계속 돌고, 환승 홀 카드도 읽는다).
const elevator = useElevatorSim({ fallbackState: fallbackElevatorState, fetchJson })
const { elevatorState, activateElevatorPage } = elevator
const taxi = useTaxiSim({ createEntityId })

const staticUnavailablePages = isStaticMode ? [...STATIC_UNAVAILABLE_LIVE_PAGES] : []

let portalRefreshTimer
let reducedMotionMediaQuery
let reducedMotionMediaListener

onMounted(async () => {
  migrateLegacyVoyageStorage(window.localStorage)
  routing.attach()
  if (typeof window.matchMedia === 'function') {
    reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = reducedMotionMediaQuery.matches
    reducedMotionMediaListener = (event) => {
      prefersReducedMotion.value = event.matches
      splash.restartForMotionChange()
    }
    if (typeof reducedMotionMediaQuery.addEventListener === 'function') {
      reducedMotionMediaQuery.addEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.addListener === 'function') {
      reducedMotionMediaQuery.addListener(reducedMotionMediaListener)
    }
  }

  if (page.value === 'splash') {
    splash.start()
  } else {
    routing.syncInitialLocation()
  }

  initializeBlogWorkspace()
  if (!isStaticMode) {
    await loadPortalData()
    if (page.value === 'elevator') {
      await activateElevatorPage()
    }
    portalRefreshTimer = window.setInterval(() => {
      loadPortalData({ refreshElevator: false })
    }, 8000)
    elevator.startPolling()
  }
  taxi.start()
})

onBeforeUnmount(() => {
  routing.detach()
  window.clearInterval(portalRefreshTimer)
  if (reducedMotionMediaQuery && reducedMotionMediaListener) {
    if (typeof reducedMotionMediaQuery.removeEventListener === 'function') {
      reducedMotionMediaQuery.removeEventListener('change', reducedMotionMediaListener)
    } else if (typeof reducedMotionMediaQuery.removeListener === 'function') {
      reducedMotionMediaQuery.removeListener(reducedMotionMediaListener)
    }
  }
})

async function loadPortalData(options = { refreshElevator: true }) {
  await Promise.allSettled([
    loadHealthState(),
    loadRuntimeState(),
    loadServicesState(),
    loadWorkBoardState(),
    options.refreshElevator ? elevator.loadElevatorState() : Promise.resolve()
  ])
}

function createEntityId(prefix) {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`
  }
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const randomValues = globalThis.crypto.getRandomValues(new Uint32Array(2))
    return `${prefix}-${Array.from(randomValues, (value) => value.toString(36)).join('-')}`
  }
  fallbackEntityIdCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${fallbackEntityIdCounter.toString(36)}`
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options)
  const text = await response.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch (error) {
    data = {}
  }
  if (!response.ok) {
    const requestError = new Error(data.message || data.error || response.statusText || 'Request failed')
    requestError.status = response.status
    throw requestError
  }
  return data
}
</script>

<template>
  <div
    class="app-shell"
    :class="{ 'door-transitioning': doorTransition.active }"
    :data-theme="theme"
    :aria-busy="doorTransition.active ? 'true' : undefined"
  >
    <div
      v-if="doorTransition.active"
      class="door-transition"
      :class="[doorTransition.phase, doorTransition.lineClass]"
      :style="{ '--door-duration': `${doorTransition.durationMs}ms` }"
      :data-phase="doorTransition.phase"
    >
      <span class="door-panel door-left" aria-hidden="true"></span>
      <span class="door-panel door-right" aria-hidden="true"></span>
      <span v-if="doorTransition.label" class="door-flap-label" role="status">{{ doorTransition.label }}</span>
    </div>

      <SplashView
        v-if="page === 'splash'"
        :cells="splashBoardCells"
        :phrase="currentSplashPhrase"
        :ticker="currentTicker"
        :auto-transition-label="splashAutoTransitionLabel"
        :prefers-reduced-motion="prefersReducedMotion"
        @replay="splash.replay"
      />

      <main v-else class="portal-stage" :class="{ 'writing-stage': page === 'writingStudio' }">
        <header class="station-topbar" :class="topbarLineClass">
          <SiteLoopSymbol v-if="page === 'junction'" />
          <span v-else class="roundel" :class="topbarLineClass">{{ topbarLetter }}</span>
          <h2 tabindex="-1">{{ page === 'writingStudio' ? '글쓰기' : pageTitle }}</h2>
          <div class="topbar-actions">
            <button
              v-if="page !== 'junction'"
              type="button"
              class="ghost-button"
              @click="openPage('junction')"
            >
              환승 홀
            </button>
            <button type="button" class="ghost-button" @click="toggleTheme" :aria-label="theme === 'dark' ? '라이트 모드' : '다크 모드'">
              {{ theme === 'dark' ? '☀' : '☾' }}
            </button>
          </div>
        </header>

        <div class="page-scroller">
          <JunctionView
            v-if="page === 'junction'"
            :disabled-pages="staticUnavailablePages"
            :static-mode="isStaticMode"
            :static-mode-message="staticModeMessage"
            :blog-closed-notice="blogClosedNotice"
            @open="openPage"
          />

          <SimHubView
            v-else-if="page === 'simhub'"
            ref="simHubView"
            :is-static-mode="isStaticMode"
            :elevator-live="elevatorState.mode === 'live-traffic-loop'"
            @open-page="openPage"
          />

          <VoyageView v-else-if="page === 'voyage'" @exit="openPage('junction')" />

          <Pantry v-else-if="page === 'pantry'" />

          <Ets2Live v-else-if="page === 'ets2'" />

          <Ets2Dev v-else-if="page === 'ets2Dev'" :static-mode="isStaticMode" />

          <ElevatorView
            v-else-if="page === 'elevator'"
            :sim="elevator"
            :is-static-mode="isStaticMode"
            :sim-hub-name="simHubLine.nameKo"
            @open-page="openPage"
          />

          <TaxiView
            v-else-if="page === 'taxi'"
            :sim="taxi"
            :sim-hub-name="simHubLine.nameKo"
            @open-page="openPage"
          />

          <BlogHubView v-else-if="page === 'bloghub'" :store="blogStore" @open-page="openPage" />

          <BlogArchiveView v-else-if="page === 'blogArchive'" :store="blogStore" />

          <BlogPostView v-else-if="page === 'blogPost'" :store="blogStore" />

          <WritingStudio
            v-else-if="page === 'writingStudio'"
            :state="studioState"
            :posts="[...draftBlogPosts, ...archivedBlogPosts]"
            :preview-html="studioPreviewHtml"
            :view-mode="studioViewMode"
            :save-phase="studioSavePhase"
            :saved-at="studioLastSavedAt"
            :message="blogMessage"
            :backup-message="writingBackupMessage"
            @update-field="updateStudioField"
            @update-view="setStudioViewMode"
            @exit="openPage('bloghub')"
            @publish="publishStudioPost"
            @archive="archiveStudioPost"
            @unpublish="unpublishStudioPost"
            @new-post="createNewStudioPost(false)"
            @open-post="openStudioForPost"
            @restore="restoreArchivedPost"
            @backup="backupLocalWriting"
            @clear-message="clearBlogMessage"
          />

          <WorkView v-else-if="page === 'work'" :manager="workManager" :is-static-mode="isStaticMode" />

          <RuntimeView v-else :manager="workManager" @refresh="loadPortalData" />

          <nav
            class="mobile-quick-nav"
            :class="{ 'mobile-quick-nav--blog-closed': !BLOG_LINE_OPEN }"
            aria-label="빠른 환승"
          >
            <button type="button" :class="{ active: page === 'junction' }" @click="openPage('junction')">노선도</button>
            <button
              v-if="BLOG_LINE_OPEN"
              type="button"
              :class="{ active: ['bloghub', 'blogArchive', 'blogPost', 'writingStudio'].includes(page) }"
              @click="openBlogArchive"
            >
              아카이브
            </button>
            <button
              type="button"
              :class="{ active: ['simhub', 'elevator', 'taxi', 'ets2', 'ets2Dev'].includes(page) }"
              @click="openPage('simhub')"
            >
              승강장
            </button>
          </nav>
        </div>
      </main>
  </div>
</template>
