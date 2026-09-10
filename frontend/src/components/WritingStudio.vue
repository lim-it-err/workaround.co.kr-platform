<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import StatusBadge from './StatusBadge.vue'
import { LOCAL_WRITING_HELP, LOCAL_WRITING_NOTICE } from '../staticWritingState.js'

const props = defineProps({
  state: { type: Object, required: true },
  posts: { type: Array, required: true },
  previewHtml: { type: String, default: '' },
  viewMode: { type: String, default: 'edit' },
  savePhase: { type: String, default: 'saved' },
  savedAt: { type: String, default: '' },
  message: { type: String, default: '' },
  backupMessage: { type: String, default: '' }
})
const emit = defineEmits([
  'update-field', 'update-view', 'exit', 'publish', 'archive', 'unpublish',
  'new-post', 'open-post', 'restore', 'backup', 'clear-message'
])
const dialog = ref(null)
const overlay = ref('')
const titleInput = ref(null)
const bodyInput = ref(null)
const preview = computed(() => props.viewMode === 'preview')
const drawerPosts = computed(() => [...props.posts].sort((a, b) =>
  String(b.updatedAt).localeCompare(String(a.updatedAt))))
const overlayTitle = computed(() => ({
  publish: '발행 설정', drawer: '초안 서랍', menu: '글 메뉴', help: '저장 안내'
})[overlay.value])
const saveLabel = computed(() => {
  if (props.savePhase === 'saving') return '저장 중…'
  if (props.savePhase === 'error') return '저장 실패'
  const time = props.savedAt && new Date(props.savedAt)
  return time && !Number.isNaN(time.getTime())
    ? `저장됨 ${time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}`
    : '저장됨'
})

function updateField(field, event) {
  emit('update-field', field, event.target.value)
}

async function openOverlay(name) {
  emit('clear-message')
  overlay.value = name
  await nextTick()
  if (!dialog.value.open) dialog.value.showModal()
  else dialog.value.querySelector('[autofocus]')?.focus()
}

function closeOverlay() {
  dialog.value?.close()
  overlay.value = ''
}

function keepDialogFocus(event) {
  const controls = [...dialog.value.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')]
    .filter(element => element.getClientRects().length > 0)
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

function runAction(action, ...args) {
  closeOverlay()
  emit(action, ...args)
}

async function togglePreview() {
  emit('update-view', preview.value ? 'edit' : 'preview')
  await nextTick()
  // v-show keeps the textarea selection and scroll position across preview.
  if (!preview.value) bodyInput.value?.focus({ preventScroll: true })
}

watch(() => props.state.id, async () => {
  emit('update-view', 'edit')
  await nextTick()
  if (!overlay.value) titleInput.value?.focus({ preventScroll: true })
})

function formatModified(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ko-KR')
}
</script>

<template>
  <section class="writing-room line-b" aria-label="글쓰기 스튜디오">
    <header class="writer-bar">
      <button type="button" class="ghost-button writer-exit" aria-label="나가기" @click="emit('exit')">←<span> 나가기</span></button>
      <span class="writer-document" :title="state.title || '새 초안'">{{ state.title || '새 초안' }}</span>
      <span class="writer-save" :class="savePhase" role="status" aria-live="polite">{{ saveLabel }}</span>
      <button type="button" class="ghost-button" :aria-pressed="preview" @click="togglePreview">{{ preview ? '편집' : '미리보기' }}</button>
      <button type="button" :class="overlay ? 'ghost-button' : 'primary-button'" @click="openOverlay('publish')">발행</button>
      <button type="button" class="ghost-button writer-more" aria-label="글 메뉴" aria-haspopup="dialog" :aria-expanded="Boolean(overlay)" @click="openOverlay('menu')">⋯</button>
    </header>

    <div class="writer-storage">
      <span>{{ LOCAL_WRITING_NOTICE }}</span>
      <button type="button" aria-label="저장 안내와 백업" @click="openOverlay('help')">?</button>
    </div>

    <div class="writer-page">
      <div v-show="!preview" class="writer-editor">
        <input ref="titleInput" :value="state.title" class="writer-title" type="text" aria-label="제목" placeholder="제목" @input="updateField('title', $event)" />
        <textarea ref="bodyInput" :value="state.bodyMarkdown" class="writer-body" aria-label="본문" placeholder="여기에 글을 쓰세요…" @input="updateField('bodyMarkdown', $event)"></textarea>
      </div>
      <article v-show="preview" class="writer-preview" aria-label="글 미리보기">
        <h1>{{ state.title || '새 초안' }}</h1>
        <p v-if="state.summary" class="post-summary">{{ state.summary }}</p>
        <div class="markdown-body" v-html="previewHtml"></div>
      </article>
      <p v-if="message && !overlay" class="writer-message" role="status">{{ message }}</p>
    </div>

    <dialog ref="dialog" class="writer-dialog" :data-panel="overlay" aria-labelledby="writer-dialog-title" @cancel.prevent="closeOverlay" @keydown.tab="keepDialogFocus" @click="($event.target === dialog) && closeOverlay()">
      <div class="writer-dialog-content">
        <header class="writer-dialog-head">
          <h2 id="writer-dialog-title">{{ overlayTitle }}</h2>
          <button type="button" class="ghost-button" aria-label="닫기" @click="closeOverlay">×</button>
        </header>

        <div v-if="overlay === 'menu'" class="writer-menu">
          <button type="button" class="ghost-button" autofocus @click="openOverlay('drawer')">초안 서랍</button>
          <button type="button" class="ghost-button" @click="runAction('new-post')">새 초안</button>
          <button v-if="state.status !== 'archived'" type="button" class="ghost-button" @click="runAction('archive')">보관</button>
          <button v-if="state.status === 'published'" type="button" class="ghost-button" @click="runAction('unpublish')">발행 취소</button>
          <button type="button" class="ghost-button" @click="openOverlay('help')">저장 안내·백업</button>
        </div>

        <form v-else-if="overlay === 'publish'" class="writer-publish-form" @submit.prevent="emit('publish')">
          <label class="input-block">
            <span>글 주소</span>
            <input :value="state.slug" type="text" class="text-input" placeholder="예: prague-day-1" autofocus @input="updateField('slug', $event)" />
          </label>
          <label class="input-block">
            <span>요약</span>
            <textarea :value="state.summary" class="textarea-input" rows="3" placeholder="짧은 요약" @input="updateField('summary', $event)"></textarea>
          </label>
          <label class="input-block">
            <span>태그</span>
            <input :value="state.tags" type="text" class="text-input" placeholder="여행, 기록" @input="updateField('tags', $event)" />
          </label>
          <div class="writer-publish-status">
            <span>현재 글</span><StatusBadge :status="state.status" />
            <span>{{ state.status === 'archived' ? '보관 중' : '보관하지 않음' }}</span>
          </div>
          <p class="writer-local-publish">발행한 글도 이 브라우저에만 저장됩니다.</p>
          <p v-if="message" class="writer-message" role="alert">{{ message }}</p>
          <footer class="writer-dialog-actions">
            <button type="button" class="ghost-button" @click="closeOverlay">계속 쓰기</button>
            <button type="submit" class="primary-button">발행 확정</button>
          </footer>
        </form>

        <div v-else-if="overlay === 'drawer'" class="writer-drawer">
          <button type="button" class="ghost-button" autofocus @click="runAction('new-post')">새 초안</button>
          <p v-if="drawerPosts.length === 0">초안과 보관 글이 없습니다.</p>
          <ul v-else class="writer-posts">
            <li v-for="post in drawerPosts" :key="post.id" :aria-current="post.id === state.id ? 'true' : undefined">
              <button type="button" class="writer-post-open" @click="runAction('open-post', post.id)">
                <strong>{{ post.title }}</strong>
                <span><StatusBadge :status="post.status" /><time>{{ formatModified(post.updatedAt) }}</time><small v-if="post.id === state.id">편집 중</small></span>
              </button>
              <div v-if="post.status === 'archived'" class="writer-restore">
                <button type="button" class="ghost-button" @click="emit('restore', post.id, 'draft')">초안으로 복원</button>
                <button type="button" class="ghost-button" @click="emit('restore', post.id, 'published')">공개로 복원</button>
              </div>
            </li>
          </ul>
          <p v-if="message" class="writer-message" role="status">{{ message }}</p>
        </div>

        <div v-else-if="overlay === 'help'" class="writer-help">
          <p>{{ LOCAL_WRITING_HELP }}</p>
          <button type="button" class="ghost-button" autofocus @click="emit('backup')">내 기록 백업</button>
          <p v-if="backupMessage" role="status">{{ backupMessage }}</p>
        </div>
      </div>
    </dialog>
  </section>
</template>

<style scoped>
.writing-room { display: flex; flex-direction: column; min-width: 0; min-height: calc(100dvh - 180px); }
.writer-bar { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.writer-bar button { flex: none; min-height: 40px; padding: 8px 12px; font-size: .85rem; }
.writer-document { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: .9rem; }
.writer-save { margin-left: auto; white-space: nowrap; color: var(--text-2); font-size: .78rem; font-variant-numeric: tabular-nums; }
.writer-save.saving { color: var(--safety); }
.writer-save.error { color: var(--danger); }
.writer-bar .writer-more { font-size: 1.3rem; padding: 4px 10px; }
.writer-storage { display: flex; align-items: center; gap: 8px; padding: 8px 0; color: var(--text-2); font-size: .75rem; line-height: 1.5; }
.writer-storage span { word-break: keep-all; }
.writer-storage button { border: 1px solid var(--line-strong); border-radius: 50%; background: transparent; color: var(--text-2); width: 28px; height: 28px; flex: none; cursor: pointer; }
.writer-page { display: flex; flex: 1; flex-direction: column; width: min(100%, 780px); margin: 20px auto 0; min-width: 0; }
.writer-editor { display: flex; flex: 1; flex-direction: column; gap: 24px; }
.writer-title, .writer-body { display: block; width: 100%; border: 0; border-radius: 0; background: transparent; color: var(--text); font: inherit; padding: 8px; }
.writer-title { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 750; letter-spacing: -.03em; }
.writer-title::placeholder, .writer-body::placeholder { color: var(--muted); opacity: 1; }
.writer-title:focus, .writer-body:focus { outline: 1px solid var(--accent-text); outline-offset: 3px; }
.writer-body { flex: 1; min-height: 320px; resize: vertical; line-height: 1.85; font-size: 1rem; }
.writer-preview { padding: 8px; min-height: 380px; overflow-wrap: anywhere; }
.writer-preview h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); margin: 0 0 24px; }
.writer-message { color: var(--text); line-height: 1.6; font-size: .9rem; }
.writer-dialog { color: var(--text); background: var(--panel); border: 1px solid var(--line-strong); border-radius: 16px; padding: 0; width: min(540px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); overflow: auto; box-shadow: var(--shadow); }
.writer-dialog::backdrop { background: rgb(0 0 0 / .6); }
.writer-dialog-content { padding: 24px; }
.writer-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
.writer-dialog-head h2 { margin: 0; font-size: 1.25rem; }
.writer-dialog-head button { min-width: 40px; min-height: 40px; padding: 4px; font-size: 1.3rem; }
.writer-menu, .writer-publish-form, .writer-drawer, .writer-help { display: grid; gap: 18px; }
.writer-menu button { text-align: left; }
.writer-dialog input, .writer-dialog textarea { font-size: 1rem; }
.writer-publish-status { display: flex; align-items: center; gap: 8px; font-size: .82rem; color: var(--text-2); }
.writer-local-publish { margin: 0; font-size: .8rem; color: var(--text-2); }
.writer-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
.writer-dialog[data-panel='menu'] { width: min(320px, calc(100vw - 32px)); }
.writer-dialog[data-panel='drawer'] { margin-right: 0; margin-block: 0; height: 100dvh; max-height: 100dvh; border-radius: 16px 0 0 16px; }
.writer-posts { padding: 0; margin: 0; list-style: none; }
.writer-posts li { border-bottom: 1px solid var(--line); padding: 18px 0; }
.writer-posts li[aria-current] { border-left: 3px solid var(--accent); padding-left: 12px; }
.writer-post-open { display: grid; gap: 12px; background: none; border: 0; color: var(--text); text-align: left; padding: 4px 0; width: 100%; cursor: pointer; }
.writer-post-open strong { overflow-wrap: anywhere; font-size: 1rem; }
.writer-post-open > span { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; color: var(--text-2); font-size: .8rem; }
.writer-restore { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.writer-restore button { font-size: .8rem; padding: 8px 12px; }
.writer-help p { margin: 0; color: var(--text-2); line-height: 1.7; }
@media (max-width: 760px) {
  .writing-room { min-height: calc(100dvh - 180px); }
  .writer-bar { gap: 4px; }
  .writer-bar button { padding: 8px; font-size: .78rem; }
  .writer-document, .writer-exit span { display: none; }
  .writer-bar .writer-exit { min-width: 32px; font-size: 1rem; }
  .writer-save { flex: 1; text-align: right; padding-right: 4px; font-size: .68rem; }
  .writer-page { margin-top: 16px; }
  .writer-editor { gap: 16px; }
  .writer-dialog-content { padding: 20px; }
  .writer-dialog[data-panel='publish'] { margin: auto 0 0; width: 100%; max-width: 100%; max-height: calc(100dvh - 16px); border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); }
}
</style>
