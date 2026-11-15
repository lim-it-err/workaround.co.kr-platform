import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BLOG_POST_STORAGE_KEY,
  downloadWritingBackup,
  safeWriteJson
} from '../staticWritingState.js'
import { normalizeStudioTables, renderMarkdownToHtml, slugify } from './blogMarkdown.js'

// TKT-210: App.vue 에서 떼어낸 블로그 저장소(글 목록·활성 슬러그·Writing Studio 상태·자동저장·보관 복원).
// 동작은 그대로다. 자동저장 타이머와 beforeunload 리스너는 onBeforeUnmount 에서 정리한다.
// D-031 주소 가드(BLOG_LINE_OPEN·닫힌 주소 토스트)는 라우팅이라 App.vue 에 남는다 — 이 저장소는 스위치를 모른다.
// 화면 이동(openPage)과 현재 페이지(page ref)는 App 이 넘겨 준다.

const BLOG_ACTIVE_SLUG_STORAGE_KEY = 'workaround-blog-active-slug'
const BLOG_STUDIO_VIEW_STORAGE_KEY = 'workaround-blog-studio-view'
const BLOG_STUDIO_POST_STORAGE_KEY = 'workaround-blog-studio-post'

function createSeedBlogPosts() {
  return [
    {
      id: 'post-001',
      slug: 'elevator-loop-after-midnight',
      title: '엘리베이터 루프를 밤에 다시 본 이유',
      summary: '숫자로는 멀쩡했지만 체감 이동이 불안정했던 이유를 프런트 폴링과 서비스 tick 관점에서 다시 정리했다.',
      bodyMarkdown: `## 왜 다시 봤는가

엘리베이터는 **도착 여부** 만 맞아도 되는 기능이 아니었습니다.
기다리는 사람에게는 이동의 *감각* 도 계약이었습니다.

> 한 층씩 오르는 것처럼 보여야 안심이 됩니다.

- 서비스 tick 간격
- 프런트 poll cadence
- 보간이 빠졌을 때 생기는 warp 체감

\`\`\`text
goal: floor warp를 줄이고도 live loop를 유지한다
\`\`\``,
      status: 'published',
      tags: ['elevator', 'frontend', 'ux'],
      createdAt: '2026-06-20T09:00:00.000Z',
      updatedAt: '2026-06-26T11:00:00.000Z',
      publishedAt: '2026-06-26T11:00:00.000Z'
    },
    {
      id: 'post-002',
      slug: 'why-blog-district-needs-its-own-rhythm',
      title: 'Blog District가 시뮬레이터와 다른 리듬이어야 하는 이유',
      summary: '긴 글 읽기 화면은 상태 배지와 운영 패널보다 폭, 줄간격, 조용한 대비가 먼저여야 한다.',
      bodyMarkdown: `## 읽기 화면은 다른 종류의 집중을 요구한다

시뮬레이터는 **조작과 상태 읽기** 가 중심입니다.
블로그는 **긴 호흡의 읽기와 쓰기** 가 중심입니다.

### 그래서 달라진 점

- 허브 카드는 남기되 장식은 줄인다.
- 본문 폭은 680px~760px 안에서 제한한다.
- Writing Studio는 편집과 preview를 분리한다.`,
      status: 'published',
      tags: ['blog', 'design'],
      createdAt: '2026-06-24T12:00:00.000Z',
      updatedAt: '2026-06-26T13:20:00.000Z',
      publishedAt: '2026-06-26T13:20:00.000Z'
    },
    {
      id: 'post-003',
      slug: 'draft-city-signal-notes',
      title: '도시 신호실 메모',
      summary: '아직 공개하지 않은 초안. 운영 레일과 공개 레일을 어떻게 분리할지 정리하는 중이다.',
      bodyMarkdown: `## Draft notes

아직 공개 전인 메모입니다.

- 공개 글은 archive에만 노출
- draft는 studio에서만 노출
- archived는 삭제가 아니라 보관`,
      status: 'draft',
      tags: ['draft', 'ops'],
      createdAt: '2026-06-26T15:00:00.000Z',
      updatedAt: '2026-06-26T18:10:00.000Z',
      publishedAt: ''
    }
  ]
}

function isBlogSeriesTag(tag) {
  return /^series\s*:\s*.+/i.test(String(tag || ''))
}

function visibleBlogTags(tags) {
  return (Array.isArray(tags) ? tags : []).filter((tag) => !isBlogSeriesTag(tag))
}

export function formatBlogDate(value) {
  if (!value) {
    return '날짜 미정'
  }
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return value
  }
}

export function formatBlogLongDate(value) {
  if (!value) {
    return '날짜 미정'
  }
  try {
    return new Date(value).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return value
  }
}

export function blogCategory(post) {
  return visibleBlogTags(post?.tags)[0] || '기록'
}

function readStoredBlogPosts() {
  if (typeof window === 'undefined') {
    return createSeedBlogPosts()
  }
  try {
    const raw = window.localStorage.getItem(BLOG_POST_STORAGE_KEY)
    if (!raw) {
      return createSeedBlogPosts()
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createSeedBlogPosts()
  } catch (error) {
    return createSeedBlogPosts()
  }
}

function persistBlogPosts(posts) {
  if (typeof window === 'undefined') {
    return true
  }
  return safeWriteJson(window.localStorage, BLOG_POST_STORAGE_KEY, posts)
}

function readStoredBlogSlug() {
  if (typeof window === 'undefined') {
    return ''
  }
  try {
    return window.localStorage.getItem(BLOG_ACTIVE_SLUG_STORAGE_KEY) || ''
  } catch (error) {
    return ''
  }
}

function persistBlogSlug(slug) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    if (slug) {
      window.localStorage.setItem(BLOG_ACTIVE_SLUG_STORAGE_KEY, slug)
      return true
    }
    window.localStorage.removeItem(BLOG_ACTIVE_SLUG_STORAGE_KEY)
    return true
  } catch (error) {
    return false
  }
}

function readStoredStudioViewMode() {
  if (typeof window === 'undefined') {
    return 'edit'
  }
  try {
    return window.localStorage.getItem(BLOG_STUDIO_VIEW_STORAGE_KEY) === 'preview' ? 'preview' : 'edit'
  } catch (error) {
    return 'edit'
  }
}

function persistStudioViewMode(mode) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    window.localStorage.setItem(BLOG_STUDIO_VIEW_STORAGE_KEY, mode)
    return true
  } catch (error) {
    return false
  }
}

function readStoredStudioPostId() {
  if (typeof window === 'undefined') {
    return ''
  }
  try {
    return window.localStorage.getItem(BLOG_STUDIO_POST_STORAGE_KEY) || ''
  } catch (error) {
    return ''
  }
}

function persistStudioPostId(postId) {
  if (typeof window === 'undefined') {
    return true
  }
  try {
    if (postId) {
      window.localStorage.setItem(BLOG_STUDIO_POST_STORAGE_KEY, postId)
      return true
    }
    window.localStorage.removeItem(BLOG_STUDIO_POST_STORAGE_KEY)
    return true
  } catch (error) {
    return false
  }
}

export function useBlogStore({ page, openPage, createEntityId, initialSlug = '', voyageArchiveStorageKey }) {
  const blogPosts = ref(readStoredBlogPosts())
  const activeBlogSlug = ref(initialSlug || readStoredBlogSlug())
  const studioViewMode = ref(readStoredStudioViewMode())
  const studioPostId = ref(readStoredStudioPostId())
  const studioState = ref(createEmptyStudioState())
  const studioDirty = ref(false)
  const studioLastSavedAt = ref('')
  const studioSavePhase = ref('saved')
  const writingBackupMessage = ref('')
  const blogMessage = ref('')

  const publishedBlogPosts = computed(() =>
    [...blogPosts.value]
      .filter((post) => post.status === 'published')
      .sort((left, right) => String(right.publishedAt || '').localeCompare(String(left.publishedAt || '')))
  )
  const draftBlogPosts = computed(() =>
    [...blogPosts.value]
      .filter((post) => post.status === 'draft')
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
  )
  const archivedBlogPosts = computed(() =>
    [...blogPosts.value]
      .filter((post) => post.status === 'archived')
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
  )
  const activeBlogPost = computed(() => {
    if (!activeBlogSlug.value) {
      return null
    }
    return publishedBlogPosts.value.find((post) => post.slug === activeBlogSlug.value) || null
  })
  const latestPublishedBlogPost = computed(() => publishedBlogPosts.value[0] || null)
  const blogArchiveYears = computed(() => {
    const groups = new Map()
    publishedBlogPosts.value.forEach((post) => {
      const year = new Date(post.publishedAt).getFullYear()
      const label = Number.isFinite(year) ? year : '날짜 미정'
      if (!groups.has(label)) {
        groups.set(label, [])
      }
      groups.get(label).push(post)
    })
    return Array.from(groups, ([year, posts]) => ({ year, posts }))
  })
  const studioPreviewHtml = computed(() =>
    renderMarkdownToHtml(studioState.value.bodyMarkdown, studioState.value.tables)
  )

  let studioAutosaveTimer
  let studioSavedSnapshot = ''

  watch(blogPosts, (nextPosts) => {
    if (!persistBlogPosts(nextPosts) && page.value === 'writingStudio') {
      studioSavePhase.value = 'error'
    }
  }, { deep: true })

  watch(activeBlogSlug, (nextSlug) => {
    persistBlogSlug(nextSlug)
  })

  watch(studioViewMode, (nextMode) => {
    persistStudioViewMode(nextMode)
  })

  watch(studioPostId, (nextId) => {
    persistStudioPostId(nextId)
  })


  watch(
    () => studioState.value.title,
    (nextTitle) => {
      if (studioState.value.slugLocked && studioState.value.slug) {
        return
      }
      studioState.value.slug = slugify(nextTitle)
    }
  )

  watch(
    () => createStudioEditableSnapshot(studioState.value),
    (nextSnapshot) => {
      if (!studioSavedSnapshot) {
        studioSavedSnapshot = nextSnapshot
        return
      }
      studioDirty.value = nextSnapshot !== studioSavedSnapshot
      if (studioDirty.value) {
        scheduleStudioAutosave()
      }
    },
    { flush: 'post' }
  )


  onMounted(() => {
    window.addEventListener('beforeunload', handleStudioBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.clearTimeout(studioAutosaveTimer)
    window.removeEventListener('beforeunload', handleStudioBeforeUnload)
  })

  function initializeBlogWorkspace() {
    if (blogPosts.value.length === 0) {
      blogPosts.value = createSeedBlogPosts()
    }

    if (!activeBlogSlug.value && publishedBlogPosts.value.length > 0) {
      activeBlogSlug.value = publishedBlogPosts.value[0].slug
    }

    if (studioPostId.value) {
      const existing = blogPosts.value.find((post) => post.id === studioPostId.value)
      if (existing) {
        populateStudio(existing)
        return
      }
    }

    if (draftBlogPosts.value.length > 0) {
      populateStudio(draftBlogPosts.value[0])
      return
    }

    createNewStudioPost(false)
  }

  function openBlogArchive() {
    if (!activeBlogSlug.value && publishedBlogPosts.value.length > 0) {
      activeBlogSlug.value = publishedBlogPosts.value[0].slug
    }
    openPage('blogArchive')
  }

  function openBlogPost(slug) {
    activeBlogSlug.value = slug
    openPage('blogPost')
  }

  function createNewStudioPost(moveToStudio = true) {
    if (page.value === 'writingStudio' && !prepareStudioTransition()) {
      return
    }
    const blank = createEmptyStudioState()
    studioState.value = blank
    studioPostId.value = blank.id
    markStudioSaved('', blank)
    blogMessage.value = ''
    if (moveToStudio) {
      openPage('writingStudio')
    }
  }

  function openStudioForPost(postId) {
    const post = blogPosts.value.find((candidate) => candidate.id === postId)
    if (!post) {
      return
    }
    if (page.value === 'writingStudio' && postId !== studioPostId.value && !prepareStudioTransition()) {
      return
    }
    populateStudio(post)
    openPage('writingStudio')
  }

  function populateStudio(post) {
    const slugLocked =
      typeof post.slugLocked === 'boolean'
        ? post.slugLocked
        : Boolean(post.slug && post.slug !== slugify(post.title))
    studioState.value = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      bodyMarkdown: post.bodyMarkdown,
      status: post.status,
      tags: [...(post.tags || [])].join(', '),
      slugLocked,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      publishedAt: post.publishedAt || '',
      tables: normalizeStudioTables(post.tables)
    }
    studioPostId.value = post.id
    markStudioSaved(post.updatedAt || '', studioState.value)
  }

  function setStudioSlug(value) {
    studioState.value.slugLocked = true
    studioState.value.slug = slugify(value)
  }

  function updateStudioField(field, value) {
    blogMessage.value = ''
    if (field === 'slug') {
      setStudioSlug(value)
    } else if (['title', 'bodyMarkdown', 'summary', 'tags'].includes(field)) {
      studioState.value[field] = value
    } else if (field === 'tables' && Array.isArray(value)) {
      studioState.value.tables = normalizeStudioTables(value)
    }
  }

  function saveStudioDraft() {
    const saved = persistStudioPost(studioState.value.status || 'draft')
    if (!saved) {
      return
    }
    blogMessage.value = saved.status === 'published' ? '변경사항을 저장했습니다.' : '초안을 저장했습니다.'
  }

  function publishStudioPost() {
    const saved = persistStudioPost('published')
    if (!saved) {
      return
    }
    activeBlogSlug.value = saved.slug
    blogMessage.value = '글을 발행했고 공개 아카이브에 반영했습니다.'
    openPage('blogPost')
  }

  function archiveStudioPost() {
    const saved = persistStudioPost('archived')
    if (!saved) {
      return
    }
    blogMessage.value = '글을 보관 상태로 전환했습니다.'
    openPage('bloghub')
  }

  function restoreArchivedPost(postId, nextStatus) {
    const targetStatus = nextStatus === 'published' ? 'published' : 'draft'
    const postIndex = blogPosts.value.findIndex((post) => post.id === postId && post.status === 'archived')
    if (postIndex < 0) {
      return
    }

    const post = blogPosts.value[postIndex]
    if (
      targetStatus === 'published' &&
      (!String(post.summary || '').trim() || !String(post.bodyMarkdown || '').trim())
    ) {
      blogMessage.value = '공개 복원 전 요약과 본문이 필요합니다.'
      return
    }

    const restoredPost = {
      ...post,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
      publishedAt:
        targetStatus === 'published' ? post.publishedAt || new Date().toISOString() : post.publishedAt || ''
    }
    const nextPosts = [...blogPosts.value]
    nextPosts.splice(postIndex, 1, restoredPost)
    persistBlogPosts(nextPosts)
    blogPosts.value = nextPosts

    if (studioPostId.value === restoredPost.id) {
      populateStudio(restoredPost)
    }
    blogMessage.value =
      targetStatus === 'published' ? '보관 글을 다시 공개했습니다.' : '보관 글을 초안으로 복원했습니다.'
  }

  function unpublishStudioPost() {
    if (studioState.value.status !== 'published') {
      return
    }
    const saved = persistStudioPost('draft')
    if (saved) {
      blogMessage.value = '발행을 취소하고 초안으로 전환했습니다.'
    }
  }

  function persistStudioPost(nextStatus, options = {}) {
    studioSavePhase.value = 'saving'
    const nowIso = new Date().toISOString()
    const title = studioState.value.title.trim()
    const summary = studioState.value.summary.trim()
    const bodyMarkdown = studioState.value.bodyMarkdown.trim()
    const current = blogPosts.value.find((post) => post.id === studioState.value.id)
    const status = nextStatus || current?.status || studioState.value.status || 'draft'
    if (!title) {
      studioSavePhase.value = 'error'
      if (!options.silent) {
        blogMessage.value = '제목을 입력하면 저장할 수 있습니다.'
      }
      return null
    }
    if (status === 'published' && (!summary || !bodyMarkdown)) {
      studioSavePhase.value = 'error'
      if (!options.silent) {
        blogMessage.value = '발행하려면 요약과 본문을 입력해 주세요.'
      }
      return null
    }

    const createdAt = current?.createdAt || nowIso
    const slug = ensureUniqueSlug(
      studioState.value.slug || studioState.value.title,
      current?.id || studioState.value.id
    )
    const publishedAt =
      current?.publishedAt || studioState.value.publishedAt || (status === 'published' ? nowIso : '')

    const nextPost = {
      id: current?.id || studioState.value.id || createEntityId('post'),
      slug,
      title,
      summary,
      bodyMarkdown,
      status,
      slugLocked: Boolean(studioState.value.slugLocked || current?.slugLocked),
      tags: studioState.value.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      tables: normalizeStudioTables(studioState.value.tables),
      createdAt,
      updatedAt: nowIso,
      publishedAt
    }

    const existingIndex = blogPosts.value.findIndex((post) => post.id === nextPost.id)
    const nextPosts = [...blogPosts.value]
    if (existingIndex >= 0) {
      nextPosts.splice(existingIndex, 1, nextPost)
    } else {
      nextPosts.unshift(nextPost)
    }

    const postsSaved = persistBlogPosts(nextPosts)
    const targetSaved = persistStudioPostId(nextPost.id)
    if (!postsSaved || !targetSaved) {
      studioSavePhase.value = 'error'
      if (!options.silent) {
        blogMessage.value = '브라우저 저장 공간을 확인해 주세요.'
      }
      return null
    }
    blogPosts.value = nextPosts
    populateStudio(nextPost)
    return nextPost
  }

  function createStudioEditableSnapshot(state) {
    return JSON.stringify({
      id: state.id,
      title: state.title,
      slug: state.slug,
      slugLocked: Boolean(state.slugLocked),
      summary: state.summary,
      tags: state.tags,
      bodyMarkdown: state.bodyMarkdown,
      tables: normalizeStudioTables(state.tables),
      status: state.status,
      publishedAt: state.publishedAt
    })
  }

  function markStudioSaved(savedAt, state = studioState.value) {
    window.clearTimeout(studioAutosaveTimer)
    studioSavedSnapshot = createStudioEditableSnapshot(state)
    studioDirty.value = false
    studioLastSavedAt.value = savedAt
    studioSavePhase.value = 'saved'
  }

  function scheduleStudioAutosave() {
    if (typeof window === 'undefined') {
      return
    }
    window.clearTimeout(studioAutosaveTimer)
    studioSavePhase.value = 'saving'
    studioAutosaveTimer = window.setTimeout(() => {
      flushStudioAutosave()
    }, 800)
  }

  function flushStudioAutosave() {
    if (!studioDirty.value) {
      return true
    }
    window.clearTimeout(studioAutosaveTimer)
    const saved = persistStudioPost(studioState.value.status || 'draft', { silent: true })
    return Boolean(saved)
  }

  function backupLocalWriting() {
    writingBackupMessage.value = ''
    if (studioDirty.value && !flushStudioAutosave()) {
      writingBackupMessage.value = '저장 실패를 해결한 뒤 다시 시도해 주세요.'
      return
    }
    try {
      downloadWritingBackup(window.localStorage, voyageArchiveStorageKey)
      writingBackupMessage.value = '백업 파일을 내려받았습니다.'
    } catch (error) {
      writingBackupMessage.value = '백업 파일을 만들지 못했습니다.'
    }
  }

  function prepareStudioTransition() {
    if (!studioDirty.value || flushStudioAutosave()) {
      return true
    }
    window.clearTimeout(studioAutosaveTimer)
    return window.confirm('제목 없는 변경은 저장되지 않습니다. 이 화면을 나갈까요?')
  }

  function handleStudioBeforeUnload(event) {
    if (page.value !== 'writingStudio' || !studioDirty.value || flushStudioAutosave()) {
      return
    }
    event.preventDefault()
    event.returnValue = ''
  }

  function createEmptyStudioState() {
    const nowIso = new Date().toISOString()
    return {
      id: createEntityId('post'),
      title: '',
      slug: '',
      summary: '',
      bodyMarkdown: '## 새 글\n\n여기에서 본문을 시작합니다.',
      status: 'draft',
      slugLocked: false,
      tags: '',
      tables: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      publishedAt: ''
    }
  }

  function ensureUniqueSlug(candidate, currentId) {
    const base = slugify(candidate) || `post-${Date.now()}`
    let next = base
    let index = 1
    while (blogPosts.value.some((post) => post.slug === next && post.id !== currentId)) {
      index += 1
      next = `${base}-${index}`
    }
    return next
  }

  function setStudioViewMode(mode) {
    studioViewMode.value = mode
  }

  function clearBlogMessage() {
    blogMessage.value = ''
  }

  return {
    blogPosts,
    activeBlogSlug,
    studioViewMode,
    studioPostId,
    studioState,
    studioLastSavedAt,
    studioSavePhase,
    writingBackupMessage,
    blogMessage,
    publishedBlogPosts,
    draftBlogPosts,
    archivedBlogPosts,
    activeBlogPost,
    latestPublishedBlogPost,
    blogArchiveYears,
    studioPreviewHtml,
    initializeBlogWorkspace,
    openBlogArchive,
    openBlogPost,
    createNewStudioPost,
    openStudioForPost,
    updateStudioField,
    publishStudioPost,
    archiveStudioPost,
    unpublishStudioPost,
    restoreArchivedPost,
    backupLocalWriting,
    prepareStudioTransition,
    setStudioViewMode,
    clearBlogMessage
  }
}
