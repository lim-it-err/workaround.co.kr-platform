import { computed, nextTick, ref } from 'vue'
import { BLOG_LINE_OPEN, LINES } from '../data/lines.js'
import { SPLASH_DOOR_OPENING_MS } from './useSplash.js'
import { buildLivePath, readLiveRoute, STATIC_UNAVAILABLE_LIVE_PAGES } from '../staticRouting.js'

// TKT-211: App.vue 에서 떼어낸 페이지 전환·주소 동기화·popstate·스크롤 복원·문 전환 애니메이션.
// D-031 블로그 주소 가드(BLOG_LINE_OPEN)와 닫힌 주소 토스트도 라우팅이라 여기에 있다.
//
// 경계: 이 composable 은 `page` 와 문 전환 상태를 소유한다. 블로그 저장소·스플래시·엘리베이터·격납고 화면은
// App 이 만들고 `ctx()` 로 나중에 건네준다(서로 순환하므로 호출 시점에 읽는다 — 원래 함수 호이스팅과 같은 시점).
// 마운트/언마운트는 App 이 `attach()`·`detach()` 로 부른다(기존 onMounted 순서 유지).

const FIRST_ROUTE_DOOR_TIMING = Object.freeze({ closeMs: 450, holdMs: 200, openMs: 350 })
const REPEAT_ROUTE_DOOR_TIMING = Object.freeze({ closeMs: 270, holdMs: 120, openMs: 210 })
const STATIC_UNAVAILABLE_PAGES = new Set(STATIC_UNAVAILABLE_LIVE_PAGES)
const STATIC_DIRECT_PREVIEW_PAGES = new Set(['ets2Dev'])
// 블로그 본선(D-031): lines.js 의 BLOG_LINE_OPEN 이 꺼져 있으면 이 화면들은 환승 홀로 돌려보낸다.
const BLOG_LINE_PAGES = new Set(['bloghub', 'blogArchive', 'blogPost', 'writingStudio'])
const BLOG_CLOSED_MESSAGE = '블로그 노선은 운행을 멈췄습니다'
const BLOG_CLOSED_NOTICE_MS = 2500
const LIVE_PAGES = [
  'junction',
  'simhub',
  'elevator',
  'taxi',
  'bloghub',
  'blogArchive',
  'blogPost',
  'writingStudio',
  'voyage',
  'pantry',
  'ets2',
  'ets2Dev',
  'work',
  'runtime'
]
const simHubLine = LINES.find((line) => line.page === 'simhub')
const TOPBAR_LINES = {
  junction: ['line-w', 'W'],
  simhub: [simHubLine.lineClass, simHubLine.code],
  elevator: ['line-e', 'E'],
  taxi: ['line-t', 'T'],
  bloghub: ['line-b', 'B'],
  blogArchive: ['line-b', 'B'],
  blogPost: ['line-b', 'B'],
  writingStudio: ['line-b', 'B'],
  voyage: ['line-v', 'V'],
  pantry: ['line-p', 'P'],
  ets2: ['line-s', 'S'],
  ets2Dev: ['line-s', 'S'],
  work: ['line-w', 'W'],
  runtime: ['line-r', 'R']
}
const PAGE_TITLES = {
  junction: '환승 홀',
  elevator: '멈춘 엘리베이터',
  simhub: simHubLine.nameKo,
  taxi: '심야 택시',
  bloghub: '글 보관소와 스튜디오',
  blogArchive: '공개 글 보관소',
  writingStudio: '초안·미리보기·발행',
  voyage: '여행 노선',
  pantry: '자취 밥상',
  ets2: '유로트럭 관제',
  ets2Dev: '유로트럭 개발자',
  work: '운영 노트'
}

function isBlogClosedPage(pageName) {
  return !BLOG_LINE_OPEN && BLOG_LINE_PAGES.has(pageName)
}

function normalizeLivePage(view) {
  return LIVE_PAGES.includes(view) && !isBlogClosedPage(view) ? view : 'junction'
}

function doorLineClassFor(pageName) {
  return (TOPBAR_LINES[pageName] || TOPBAR_LINES.junction)[0]
}

export function usePageRouting({ appBasePath, isStaticMode, prefersReducedMotion, ctx }) {
  // 첫 진입이 막힌 블로그 주소였으면 마운트 뒤 안내를 한 번 띄운다.
  let pendingBlogClosedNotice = false
  let blogClosedNoticeTimer
  let doorTransitionRunId = 0
  let doorTransitionTimers = []
  let completedRouteDoorTransitions = 0
  const pageScrollPositions = new Map()

  function readInitialPage() {
    if (typeof window === 'undefined') {
      return 'splash'
    }
    const route = readLiveRoute(window.location.pathname, appBasePath)
    if (route && isBlogClosedPage(route.page)) {
      pendingBlogClosedNotice = true
      return 'junction'
    }
    if (route && isStaticMode && STATIC_UNAVAILABLE_PAGES.has(route.page) && !STATIC_DIRECT_PREVIEW_PAGES.has(route.page)) {
      return 'junction'
    }
    return route?.page || 'splash'
  }

  function readInitialBlogSlug() {
    if (typeof window === 'undefined') {
      return ''
    }
    const route = readLiveRoute(window.location.pathname, appBasePath)
    return route && !isBlogClosedPage(route.page) ? route.slug || '' : ''
  }

  const page = ref(readInitialPage())
  const initialBlogSlug = readInitialBlogSlug()
  const staticModeMessage = ref('')
  const blogClosedNotice = ref('')
  const doorTransition = ref({
    active: false,
    phase: 'idle',
    durationMs: 0,
    lineClass: 'line-w',
    label: ''
  })

  const topbarLineClass = computed(() => (TOPBAR_LINES[page.value] || ['', 'W'])[0])
  const topbarLetter = computed(() => (TOPBAR_LINES[page.value] || ['', 'W'])[1])
  const pageTitle = computed(() => {
    if (page.value === 'blogPost') {
      return ctx().blogStore.activeBlogPost.value?.title || '글 읽기'
    }
    return PAGE_TITLES[page.value] || '정책과 실행환경'
  })

  // D-031: 내려간 블로그 주소로 들어오면 환승 홀에서 한 줄만 알린다(접근 토스트 패턴 재사용).
  function showBlogClosedNotice() {
    blogClosedNotice.value = BLOG_CLOSED_MESSAGE
    window.clearTimeout(blogClosedNoticeTimer)
    blogClosedNoticeTimer = window.setTimeout(() => {
      blogClosedNotice.value = ''
    }, BLOG_CLOSED_NOTICE_MS)
  }

  function openPage(nextPage) {
    const { blogStore, simHubView } = ctx()
    if (isBlogClosedPage(nextPage)) {
      showBlogClosedNotice()
      if (page.value === 'junction') {
        return
      }
      nextPage = 'junction'
    }
    if (isStaticMode && STATIC_UNAVAILABLE_PAGES.has(nextPage)) {
      staticModeMessage.value = '정적 공개본에서는 사용할 수 없음'
      if (page.value !== 'junction') {
        page.value = 'junction'
        syncLiveLocation()
      }
      return
    }
    simHubView.value?.clearNotice()
    staticModeMessage.value = ''
    if (page.value === 'writingStudio' && nextPage !== 'writingStudio' && !blogStore.prepareStudioTransition()) {
      return
    }
    if (nextPage === 'blogPost' && !blogStore.activeBlogSlug.value && blogStore.publishedBlogPosts.value.length > 0) {
      blogStore.activeBlogSlug.value = blogStore.publishedBlogPosts.value[0].slug
    }
    if (nextPage === 'writingStudio' && !blogStore.studioPostId.value) {
      blogStore.createNewStudioPost(false)
    }
    const normalizedNextPage = normalizeLivePage(nextPage)
    if (normalizedNextPage === page.value) {
      focusCurrentPageHeading()
      return
    }
    if (prefersReducedMotion.value) {
      applyPageChange(normalizedNextPage)
      focusCurrentPageHeading()
      return
    }
    startRouteDoorTransition(normalizedNextPage)
  }

  function applyPageChange(nextPage, { replace = false } = {}) {
    const currentScroller = document.querySelector('.page-scroller')
    if (currentScroller && page.value !== 'splash') {
      pageScrollPositions.set(page.value, currentScroller.scrollTop)
    }
    page.value = normalizeLivePage(nextPage)
    syncLiveLocation({ replace })
    if (page.value === 'elevator' && !isStaticMode) {
      void ctx().elevator.activateElevatorPage()
    }
    window.requestAnimationFrame(() => {
      const savedTop = pageScrollPositions.get(page.value) || 0
      document.querySelector('.page-scroller')?.scrollTo({ top: savedTop, behavior: 'auto' })
    })
  }

  function queueDoorTransition(callback, delayMs) {
    const timer = window.setTimeout(() => {
      doorTransitionTimers = doorTransitionTimers.filter((entry) => entry !== timer)
      callback()
    }, delayMs)
    doorTransitionTimers.push(timer)
  }

  function clearDoorTransitionTimers() {
    doorTransitionTimers.forEach((timer) => window.clearTimeout(timer))
    doorTransitionTimers = []
  }

  function resetDoorTransition() {
    doorTransition.value = {
      active: false,
      phase: 'idle',
      durationMs: 0,
      lineClass: 'line-w',
      label: ''
    }
  }

  function focusCurrentPageHeading() {
    nextTick(() => {
      document.querySelector('.station-topbar h2')?.focus({ preventScroll: true })
    })
  }

  function startRouteDoorTransition(nextPage) {
    if (doorTransition.value.active) {
      return
    }
    clearDoorTransitionTimers()
    doorTransitionRunId += 1
    const runId = doorTransitionRunId
    const timing = completedRouteDoorTransitions === 0
      ? FIRST_ROUTE_DOOR_TIMING
      : REPEAT_ROUTE_DOOR_TIMING
    doorTransition.value = {
      active: true,
      phase: 'primed',
      durationMs: timing.closeMs,
      lineClass: doorLineClassFor(nextPage),
      label: ''
    }

    nextTick(() => {
      if (runId !== doorTransitionRunId) return
      document.querySelector('.door-left')?.getBoundingClientRect()
      doorTransition.value = { ...doorTransition.value, phase: 'closing' }
      queueDoorTransition(() => {
        if (runId !== doorTransitionRunId) return
        doorTransition.value = {
          ...doorTransition.value,
          phase: 'closed',
          durationMs: 0,
          label: 'DOORS CLOSING'
        }
        queueDoorTransition(() => {
          if (runId !== doorTransitionRunId) return
          applyPageChange(nextPage)
          doorTransition.value = {
            ...doorTransition.value,
            phase: 'opening',
            durationMs: timing.openMs,
            label: ''
          }
          queueDoorTransition(() => {
            if (runId !== doorTransitionRunId) return
            completedRouteDoorTransitions += 1
            resetDoorTransition()
            focusCurrentPageHeading()
          }, timing.openMs)
        }, timing.holdMs)
      }, timing.closeMs)
    })
  }

  // 스플래시 자동 전환 시각이 되면 useSplash 가 부른다.
  function handleSplashTransition({ reducedMotion }) {
    if (reducedMotion) {
      applyPageChange('junction', { replace: true })
      focusCurrentPageHeading()
      return
    }
    startSplashDoorOpening()
  }

  function startSplashDoorOpening() {
    clearDoorTransitionTimers()
    doorTransitionRunId += 1
    const runId = doorTransitionRunId
    doorTransition.value = {
      active: true,
      phase: 'closed',
      durationMs: 0,
      lineClass: doorLineClassFor('junction'),
      label: ''
    }
    // TKT-201: 문이 닫힌 채로 먼저 환승 홀로 바꿔 두고, 다음 프레임에 문을 열어 환승 홀을 드러낸다.
    applyPageChange('junction', { replace: true })
    nextTick(() => {
      if (runId !== doorTransitionRunId) return
      document.querySelector('.door-left')?.getBoundingClientRect()
      doorTransition.value = {
        ...doorTransition.value,
        phase: 'opening',
        durationMs: SPLASH_DOOR_OPENING_MS
      }
      queueDoorTransition(() => {
        if (runId !== doorTransitionRunId) return
        resetDoorTransition()
        focusCurrentPageHeading()
      }, SPLASH_DOOR_OPENING_MS)
    })
  }

  function syncLiveLocation({ replace = false } = {}) {
    if (typeof window === 'undefined') {
      return
    }

    const activeBlogSlug = ctx().blogStore.activeBlogSlug
    const nextUrl = new URL(window.location.href)
    nextUrl.pathname = buildLivePath(page.value, activeBlogSlug.value, appBasePath)
    nextUrl.search = ''
    nextUrl.hash = ''

    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const state = { page: page.value, blogSlug: activeBlogSlug.value }
    if (replace || nextPath === currentPath) {
      window.history.replaceState(state, '', nextPath)
    } else {
      window.history.pushState(state, '', nextPath)
    }
  }

  function handleLocationPopState(event) {
    const { blogStore, splash, elevator } = ctx()
    if (page.value === 'writingStudio' && !blogStore.prepareStudioTransition()) {
      syncLiveLocation()
      return
    }

    splash.cancel()
    clearDoorTransitionTimers()
    doorTransitionRunId += 1
    resetDoorTransition()

    const liveRoute = readLiveRoute(window.location.pathname, appBasePath)
    if (liveRoute && isBlogClosedPage(liveRoute.page)) {
      page.value = 'junction'
      syncLiveLocation({ replace: true })
      showBlogClosedNotice()
    } else if (liveRoute) {
      blogStore.activeBlogSlug.value = liveRoute.slug
      page.value = isStaticMode && STATIC_UNAVAILABLE_PAGES.has(liveRoute.page) && !STATIC_DIRECT_PREVIEW_PAGES.has(liveRoute.page)
        ? 'junction'
        : liveRoute.page
    } else {
      const statePage = normalizeLivePage(event.state?.page)
      page.value = statePage === 'blogArchive' || statePage === 'blogPost' ? 'junction' : statePage
      if (page.value === 'blogPost') {
        blogStore.activeBlogSlug.value = event.state?.blogSlug || ''
      }
    }

    if (page.value === 'elevator' && !isStaticMode) {
      void elevator.activateElevatorPage()
    }
    window.requestAnimationFrame(() => {
      document.querySelector('.page-scroller')?.scrollTo({ top: 0 })
    })
  }

  // 마운트: popstate 구독 + (스플래시가 아니면) 주소 정리와 닫힌 블로그 안내. 스플래시 시작은 App 이 한다.
  function attach() {
    window.addEventListener('popstate', handleLocationPopState)
  }

  function syncInitialLocation() {
    syncLiveLocation({ replace: true })
    if (pendingBlogClosedNotice) {
      pendingBlogClosedNotice = false
      showBlogClosedNotice()
    }
  }

  function detach() {
    clearDoorTransitionTimers()
    window.clearTimeout(blogClosedNoticeTimer)
    window.removeEventListener('popstate', handleLocationPopState)
  }

  return {
    page,
    initialBlogSlug,
    doorTransition,
    staticModeMessage,
    blogClosedNotice,
    topbarLineClass,
    topbarLetter,
    pageTitle,
    openPage,
    handleSplashTransition,
    attach,
    syncInitialLocation,
    detach
  }
}
