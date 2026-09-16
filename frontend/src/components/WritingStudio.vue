<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
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
const imageInput = ref(null)
const pendingBodyRange = ref(null)
const previewReturnRange = ref(null)
const toolMessage = ref('')
const bodyInputs = new Map()
let blockSequence = 0
const preview = computed(() => props.viewMode === 'preview')
const studioTables = computed(() => Array.isArray(props.state.tables) ? props.state.tables : [])
const editorBlocks = ref(parseEditorBlocks(props.state.bodyMarkdown))
const drawerPosts = computed(() => [...props.posts].sort((a, b) =>
  String(b.updatedAt).localeCompare(String(a.updatedAt))))
const overlayTitle = computed(() => ({
  publish: '발행 설정', drawer: '초안 서랍', menu: '글 메뉴', help: '저장 안내',
  tools: '글 도구'
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

function createBlockId(prefix) {
  blockSequence += 1
  return `${prefix}-${blockSequence}`
}

function createTableId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `table-${globalThis.crypto.randomUUID()}`
  }
  return `table-${Date.now().toString(36)}`
}

function parseImageBlock(line) {
  if (line.length > 2_100_500) return null
  const match = line.match(/^!\[([^\]\r\n]*)\]\((data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/=]+)\)$/)
  return match ? { type: 'image', id: createBlockId('image'), alt: match[1], src: match[2] } : null
}

function parseEditorBlocks(markdown) {
  const blocks = []
  const textLines = []
  const flushText = () => {
    if (!textLines.length) return
    blocks.push({ type: 'text', id: createBlockId('text'), content: textLines.splice(0).join('\n') })
  }
  String(markdown || '').split('\n').forEach((line) => {
    const tableId = line.trim().match(/^\[\[studio-table:([a-z0-9-]+)\]\]$/i)?.[1]
    const image = parseImageBlock(line.trim())
    if (!tableId && !image) {
      textLines.push(line)
      return
    }
    flushText()
    blocks.push(tableId ? { type: 'table', id: createBlockId('table'), tableId } : image)
  })
  flushText()
  if (!blocks.some(block => block.type === 'text')) {
    blocks.push({ type: 'text', id: createBlockId('text'), content: '' })
  }
  return blocks
}

function serializeEditorBlocks(blocks = editorBlocks.value) {
  return blocks.map((block) => {
    if (block.type === 'table') return `[[studio-table:${block.tableId}]]`
    if (block.type === 'image') return `![${block.alt.replace(/[\]\r\n]/g, ' ')}](${block.src})`
    return block.content
  }).join('\n')
}

function emitBodyBlocks() {
  emit('update-field', 'bodyMarkdown', serializeEditorBlocks())
}

function setBodyInput(element, blockId) {
  if (element) bodyInputs.set(blockId, element)
  else bodyInputs.delete(blockId)
}

function firstTextBlock() {
  return editorBlocks.value.find(block => block.type === 'text')
}

function currentBodyRange() {
  const active = document.activeElement
  const activeBlock = editorBlocks.value.find(block => block.type === 'text' && bodyInputs.get(block.id) === active)
  const block = activeBlock || editorBlocks.value.find(item => item.id === pendingBodyRange.value?.blockId) || firstTextBlock()
  const input = block && bodyInputs.get(block.id)
  return block ? {
    blockId: block.id,
    start: input?.selectionStart ?? block.content.length,
    end: input?.selectionEnd ?? block.content.length
  } : null
}

function rememberBodyRange() {
  pendingBodyRange.value = currentBodyRange()
}

function resizeTextarea(element) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

async function focusBodyRange(range) {
  await nextTick()
  const input = range && bodyInputs.get(range.blockId)
  if (!input) return
  resizeTextarea(input)
  input.focus({ preventScroll: true })
  input.setSelectionRange(range.start, range.end)
}

function onTextInput(block, event) {
  block.content = event.target.value
  pendingBodyRange.value = { blockId: block.id, start: event.target.selectionStart, end: event.target.selectionEnd }
  resizeTextarea(event.target)
  emitBodyBlocks()
}

function onTextSelection(block, event) {
  pendingBodyRange.value = { blockId: block.id, start: event.target.selectionStart, end: event.target.selectionEnd }
}

function onTitleInput(event) {
  resizeTextarea(event.target)
  updateField('title', event)
}

async function insertEditorBlock(block) {
  const range = pendingBodyRange.value || currentBodyRange()
  const index = editorBlocks.value.findIndex(item => item.id === range?.blockId && item.type === 'text')
  const targetIndex = index === -1 ? editorBlocks.value.length - 1 : index
  const target = editorBlocks.value[targetIndex]
  const start = Math.max(0, Math.min(range?.start ?? target?.content?.length ?? 0, target?.content?.length ?? 0))
  const end = Math.max(start, Math.min(range?.end ?? start, target?.content?.length ?? 0))
  const before = target?.type === 'text' ? target.content.slice(0, start) : ''
  const after = target?.type === 'text' ? target.content.slice(end) : ''
  const beforeBlock = target?.type === 'text' ? { ...target, content: before } : { type: 'text', id: createBlockId('text'), content: '' }
  const afterBlock = { type: 'text', id: createBlockId('text'), content: after }
  editorBlocks.value.splice(Math.max(0, targetIndex), target?.type === 'text' ? 1 : 0, beforeBlock, block, afterBlock)
  emitBodyBlocks()
  pendingBodyRange.value = null
  await nextTick()
  bodyInputs.forEach(resizeTextarea)
  await focusBodyRange({ blockId: afterBlock.id, start: 0, end: 0 })
}

async function openTools() {
  rememberBodyRange()
  await openOverlay('tools')
}

async function toggleHeading(level) {
  const range = (overlay.value === 'tools' && pendingBodyRange.value) || currentBodyRange()
  const block = editorBlocks.value.find(item => item.id === range?.blockId && item.type === 'text')
  if (!block) return
  const lineStart = block.content.lastIndexOf('\n', Math.max(0, range.start - 1)) + 1
  const nextBreak = block.content.indexOf('\n', range.end)
  const lineEnd = nextBreak === -1 ? block.content.length : nextBreak
  const lines = block.content.slice(lineStart, lineEnd).split('\n')
  const heading = `${'#'.repeat(level)} `
  const allActive = lines.every((line) => !line.trim() || line.startsWith(heading))
  const nextLines = lines.map((line) => {
    if (!line.trim()) return line
    const plain = line.replace(/^#{1,3}\s+/, '')
    return allActive ? plain : `${heading}${plain}`
  })
  const replacement = nextLines.join('\n')
  block.content = `${block.content.slice(0, lineStart)}${replacement}${block.content.slice(lineEnd)}`
  emitBodyBlocks()
  if (overlay.value === 'tools') closeOverlay()
  pendingBodyRange.value = null
  await focusBodyRange({ blockId: block.id, start: lineStart, end: lineStart + replacement.length })
  toolMessage.value = allActive ? `제목 ${level} 단계를 해제했습니다.` : `제목 ${level} 단계를 적용했습니다.`
}

function chooseImage() {
  if (!pendingBodyRange.value) rememberBodyRange()
  imageInput.value?.click()
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result || '')))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

async function insertImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'])
  if (!allowedTypes.has(file.type)) {
    pendingBodyRange.value = null
    toolMessage.value = 'PNG, JPG, GIF, WebP, AVIF 사진만 첨부할 수 있습니다.'
    return
  }
  if (file.size > 1_500_000) {
    pendingBodyRange.value = null
    toolMessage.value = '브라우저 저장용 사진은 1.5MB 이하만 첨부할 수 있습니다.'
    return
  }
  try {
    const dataUrl = await readImageFile(file)
    const alt = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]\r\n]/g, ' ').trim() || '첨부 사진'
    closeOverlay()
    await insertEditorBlock({ type: 'image', id: createBlockId('image'), alt, src: dataUrl })
    toolMessage.value = '사진을 본문에 첨부했습니다.'
  } catch (error) {
    pendingBodyRange.value = null
    toolMessage.value = '사진을 읽지 못했습니다. 다른 파일을 선택해 주세요.'
  }
}

async function insertTable() {
  if (!pendingBodyRange.value) rememberBodyRange()
  const id = createTableId()
  emit('update-field', 'tables', [...studioTables.value, {
    id,
    caption: `표 ${studioTables.value.length + 1}`,
    headers: ['열 1', '열 2'],
    rows: [['', ''], ['', '']]
  }])
  closeOverlay()
  await insertEditorBlock({ type: 'table', id: createBlockId('table'), tableId: id })
  toolMessage.value = '본문에 2×2 표를 삽입했습니다.'
}

function tableFor(tableId) {
  return studioTables.value.find(table => table.id === tableId)
}

function replaceTable(tableId, mutate) {
  const source = tableFor(tableId)
  if (!source) return
  const next = {
    ...source,
    headers: [...source.headers],
    rows: source.rows.map(row => [...row])
  }
  mutate(next)
  emit('update-field', 'tables', studioTables.value.map(table => table.id === tableId ? next : table))
}

function updateTableCaption(tableId, value) {
  replaceTable(tableId, table => { table.caption = value })
}

function updateTableHeader(tableId, columnIndex, value) {
  replaceTable(tableId, table => { table.headers[columnIndex] = value })
}

function updateTableCell(tableId, rowIndex, columnIndex, value) {
  replaceTable(tableId, table => { table.rows[rowIndex][columnIndex] = value })
}

function addTableRow(tableId) {
  replaceTable(tableId, table => { table.rows.push(table.headers.map(() => '')) })
}

function addTableColumn(tableId) {
  replaceTable(tableId, table => {
    table.headers.push(`열 ${table.headers.length + 1}`)
    table.rows.forEach(row => row.push(''))
  })
}

function removeTableRow(tableId, rowIndex) {
  replaceTable(tableId, table => {
    if (table.rows.length > 1) table.rows.splice(rowIndex, 1)
  })
}

function removeTableColumn(tableId, columnIndex) {
  replaceTable(tableId, table => {
    if (table.headers.length <= 1) return
    table.headers.splice(columnIndex, 1)
    table.rows.forEach(row => row.splice(columnIndex, 1))
  })
}

function removeEditorBlock(blockIndex) {
  const block = editorBlocks.value[blockIndex]
  if (block?.type === 'table') {
    emit('update-field', 'tables', studioTables.value.filter(table => table.id !== block.tableId))
  }
  editorBlocks.value.splice(blockIndex, 1)
  const left = editorBlocks.value[blockIndex - 1]
  const right = editorBlocks.value[blockIndex]
  if (left?.type === 'text' && right?.type === 'text') {
    left.content = `${left.content}\n${right.content}`
    editorBlocks.value.splice(blockIndex, 1)
  }
  if (!editorBlocks.value.some(item => item.type === 'text')) {
    editorBlocks.value.push({ type: 'text', id: createBlockId('text'), content: '' })
  }
  emitBodyBlocks()
}

function updateImageAlt(block, value) {
  block.alt = value.replace(/[\]\r\n]/g, ' ')
  emitBodyBlocks()
}

async function moveToNextTableCell(event, tableId) {
  const cells = [...document.querySelectorAll('.writer-table-cell-input')]
    .filter(element => element.closest('.writer-inline-table')?.dataset.tableId === tableId)
  const index = cells.indexOf(event.target)
  const next = cells[index + (event.shiftKey ? -1 : 1)]
  if (!next) return
  event.preventDefault()
  next.focus()
  next.select()
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
  if (!preview.value) previewReturnRange.value = currentBodyRange()
  emit('update-view', preview.value ? 'edit' : 'preview')
  await nextTick()
  if (preview.value) await focusBodyRange(previewReturnRange.value)
}

watch(() => props.state.id, async () => {
  emit('update-view', 'edit')
  bodyInputs.clear()
  editorBlocks.value = parseEditorBlocks(props.state.bodyMarkdown)
  pendingBodyRange.value = null
  previewReturnRange.value = null
  toolMessage.value = ''
  await nextTick()
  resizeTextarea(titleInput.value)
  bodyInputs.forEach(resizeTextarea)
  if (!overlay.value) titleInput.value?.focus({ preventScroll: true })
})

watch(() => props.state.bodyMarkdown, (markdown) => {
  if (String(markdown || '') === serializeEditorBlocks()) return
  bodyInputs.clear()
  editorBlocks.value = parseEditorBlocks(markdown)
  nextTick(() => bodyInputs.forEach(resizeTextarea))
})

onMounted(() => {
  resizeTextarea(titleInput.value)
  bodyInputs.forEach(resizeTextarea)
})

function formatModified(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('ko-KR')
}
</script>

<template>
  <section class="writing-room line-b" aria-label="글쓰기 스튜디오">
    <header class="writer-bar">
      <button type="button" class="ghost-button writer-exit" aria-label="블로그" @click="emit('exit')">←<span> 블로그</span></button>
      <span class="writer-document" :title="state.title || '새 초안'">{{ state.title || '새 초안' }}</span>
      <span class="writer-save" :class="savePhase" role="status" aria-live="polite">{{ saveLabel }}</span>
      <button type="button" class="ghost-button" :aria-pressed="preview" @click="togglePreview">{{ preview ? '편집' : '미리보기' }}</button>
      <button type="button" :class="overlay ? 'ghost-button' : 'primary-button'" @click="openOverlay('publish')">발행</button>
      <button type="button" class="ghost-button writer-tool-trigger" aria-label="글 도구" aria-haspopup="dialog" @click="openTools">＋</button>
      <button type="button" class="ghost-button writer-more" aria-label="글 메뉴" aria-haspopup="dialog" :aria-expanded="Boolean(overlay)" @click="openOverlay('menu')">⋯</button>
    </header>

    <input ref="imageInput" hidden type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif" @change="insertImage" />

    <div class="writer-storage">
      <span>{{ LOCAL_WRITING_NOTICE }}</span>
      <button type="button" aria-label="저장 안내와 백업" @click="openOverlay('help')">?</button>
    </div>

    <div class="writer-workspace">
      <div class="writer-page">
        <div v-show="!preview" class="writer-editor">
          <textarea ref="titleInput" :value="state.title" class="writer-title" rows="1" aria-label="제목" placeholder="제목" @input="onTitleInput"></textarea>
          <div class="writer-blocks" aria-label="본문 편집 영역">
            <template v-for="(block, blockIndex) in editorBlocks" :key="block.id">
              <textarea
                v-if="block.type === 'text'"
                :ref="element => setBodyInput(element, block.id)"
                :value="block.content"
                :class="['writer-body', { 'writer-body-primary': editorBlocks.length === 1 }]"
                :aria-label="editorBlocks.filter(item => item.type === 'text').findIndex(item => item.id === block.id) === 0 ? '본문' : `본문 이어쓰기 ${blockIndex + 1}`"
                :placeholder="blockIndex === 0 ? '여기에 글을 쓰세요…' : '계속 쓰기…'"
                rows="1"
                @focus="onTextSelection(block, $event)"
                @click="onTextSelection(block, $event)"
                @select="onTextSelection(block, $event)"
                @keyup="onTextSelection(block, $event)"
                @input="onTextInput(block, $event)"
              ></textarea>

              <figure v-else-if="block.type === 'image'" class="writer-image-block">
                <img :src="block.src" :alt="block.alt" />
                <figcaption>
                  <label>
                    <span>사진 설명</span>
                    <input :value="block.alt" type="text" @input="updateImageAlt(block, $event.target.value)" />
                  </label>
                  <button type="button" class="ghost-button writer-block-remove" @click="removeEditorBlock(blockIndex)">사진 삭제</button>
                </figcaption>
              </figure>

              <figure v-else-if="block.type === 'table'" class="writer-inline-table" :data-table-id="block.tableId">
                <template v-if="tableFor(block.tableId)">
                  <header class="writer-inline-table-head">
                    <label>
                      <span>표 이름</span>
                      <input :value="tableFor(block.tableId).caption" type="text" @input="updateTableCaption(block.tableId, $event.target.value)" />
                    </label>
                    <span class="writer-table-scroll-hint">넓은 표는 좌우로 밀어 보세요</span>
                    <button type="button" class="ghost-button writer-block-remove" @click="removeEditorBlock(blockIndex)">표 삭제</button>
                  </header>
                  <div class="writer-inline-table-scroll" tabindex="0" :aria-label="`${tableFor(block.tableId).caption || '표'} 가로 이동 영역`">
                    <table>
                      <thead>
                        <tr>
                          <th v-for="(header, columnIndex) in tableFor(block.tableId).headers" :key="`head-${columnIndex}`">
                            <input
                              :value="header"
                              class="writer-table-cell-input"
                              type="text"
                              :aria-label="`열 ${columnIndex + 1} 제목`"
                              @input="updateTableHeader(block.tableId, columnIndex, $event.target.value)"
                              @keydown.tab="moveToNextTableCell($event, block.tableId)"
                            />
                            <details class="writer-cell-actions">
                              <summary :aria-label="`${columnIndex + 1}열 메뉴`">⋯</summary>
                              <div>
                                <button type="button" :disabled="tableFor(block.tableId).headers.length <= 1" @click="removeTableColumn(block.tableId, columnIndex)">열 삭제</button>
                              </div>
                            </details>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, rowIndex) in tableFor(block.tableId).rows" :key="`row-${rowIndex}`">
                          <td v-for="(_, columnIndex) in tableFor(block.tableId).headers" :key="`cell-${rowIndex}-${columnIndex}`">
                            <input
                              :value="row[columnIndex]"
                              class="writer-table-cell-input"
                              type="text"
                              :aria-label="`${rowIndex + 1}행 ${columnIndex + 1}열`"
                              @input="updateTableCell(block.tableId, rowIndex, columnIndex, $event.target.value)"
                              @keydown.tab="moveToNextTableCell($event, block.tableId)"
                            />
                            <details class="writer-cell-actions">
                              <summary :aria-label="`${rowIndex + 1}행 ${columnIndex + 1}열 메뉴`">⋯</summary>
                              <div>
                                <button type="button" :disabled="tableFor(block.tableId).rows.length <= 1" @click="removeTableRow(block.tableId, rowIndex)">행 삭제</button>
                                <button type="button" :disabled="tableFor(block.tableId).headers.length <= 1" @click="removeTableColumn(block.tableId, columnIndex)">열 삭제</button>
                              </div>
                            </details>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button type="button" class="writer-table-add writer-table-add-column" @click="addTableColumn(block.tableId)">＋ 열</button>
                  <button type="button" class="writer-table-add writer-table-add-row" @click="addTableRow(block.tableId)">＋ 행</button>
                </template>
                <div v-else class="writer-missing-table">
                  <p>표 데이터를 찾지 못했습니다.</p>
                  <button type="button" class="ghost-button" @click="removeEditorBlock(blockIndex)">이 블록 지우기</button>
                </div>
              </figure>
            </template>
          </div>
        </div>
        <article v-show="preview" class="writer-preview" aria-label="글 미리보기">
          <h1>{{ state.title || '새 초안' }}</h1>
          <p v-if="state.summary" class="post-summary">{{ state.summary }}</p>
          <div class="markdown-body" v-html="previewHtml"></div>
        </article>
        <p v-if="toolMessage" class="writer-tool-message" role="status">{{ toolMessage }}</p>
        <p v-if="message && !overlay" class="writer-message" role="status">{{ message }}</p>
      </div>

      <aside v-show="!preview" class="writer-tools" aria-label="글 도구">
        <strong>글 도구</strong>
        <button type="button" @click="chooseImage">사진</button>
        <button type="button" @click="toggleHeading(1)">H1</button>
        <button type="button" @click="toggleHeading(2)">H2</button>
        <button type="button" @click="toggleHeading(3)">H3</button>
        <button type="button" @click="insertTable">표 삽입</button>
      </aside>
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

        <div v-else-if="overlay === 'tools'" class="writer-tool-menu">
          <button type="button" class="ghost-button" autofocus @click="chooseImage">사진 첨부</button>
          <div class="writer-heading-tools" role="group" aria-label="제목 단계">
            <button type="button" class="ghost-button" @click="toggleHeading(1)">H1</button>
            <button type="button" class="ghost-button" @click="toggleHeading(2)">H2</button>
            <button type="button" class="ghost-button" @click="toggleHeading(3)">H3</button>
          </div>
          <button type="button" class="ghost-button" @click="insertTable">표 삽입</button>
          <p v-if="toolMessage" class="writer-tool-message" role="status">{{ toolMessage }}</p>
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
.writer-bar button { flex: none; min-width: 40px; min-height: 40px; padding: 8px 12px; font-size: .85rem; }
.writer-document { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: .9rem; }
.writer-save { min-width: 0; margin-left: auto; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--text-2); font-size: .78rem; font-variant-numeric: tabular-nums; }
.writer-save.saving { color: var(--safety); }
.writer-save.error { color: var(--danger); }
.writer-bar .writer-more { font-size: 1.3rem; padding: 4px 10px; }
.writer-bar .writer-tool-trigger { font-size: 1.15rem; padding: 4px 10px; }
.writer-storage { display: flex; align-items: center; gap: 8px; width: min(100%, 720px); margin-inline: auto; padding: 8px 0; color: var(--text-2); font-size: .75rem; line-height: 1.5; }
.writer-storage span { word-break: keep-all; }
.writer-storage button { border: 1px solid var(--line-strong); border-radius: 50%; background: transparent; color: var(--text-2); width: 40px; height: 40px; flex: none; cursor: pointer; }
.writer-workspace { position: relative; display: flex; flex: 1; min-width: 0; }
.writer-page { display: flex; flex: 1; flex-direction: column; width: min(100%, 720px); max-width: 720px; margin: 20px auto 0; min-width: 0; }
.writer-editor { display: flex; flex: 1; flex-direction: column; gap: 24px; min-width: 0; }
.writer-title, .writer-body { display: block; width: 100%; border: 0; border-radius: 0; background: transparent; color: var(--text); font: inherit; padding: 0; }
.writer-title { min-height: 1.35em; overflow: hidden; resize: none; font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 750; line-height: 1.25; letter-spacing: -.03em; overflow-wrap: anywhere; }
.writer-title::placeholder, .writer-body::placeholder { color: var(--muted); opacity: 1; }
.writer-title:focus, .writer-body:focus { outline: 1px solid var(--accent-text); outline-offset: 4px; }
.writer-blocks { display: grid; align-content: start; gap: 18px; min-width: 0; }
.writer-body { min-height: 88px; overflow: hidden; resize: none; line-height: 1.85; font-size: 1rem; }
.writer-body-primary { min-height: 320px; }
.writer-preview { padding: 8px; min-height: 380px; overflow-wrap: anywhere; }
.writer-preview h1 { font-size: clamp(1.6rem, 3vw, 2.4rem); margin: 0 0 24px; }
.writer-message { color: var(--text); line-height: 1.6; font-size: .9rem; }
.writer-tool-message { margin: 12px 8px 0; color: var(--text-2); font-size: .82rem; line-height: 1.5; }
.writer-tools { display: none; position: absolute; top: 20px; left: calc(50% + 380px); width: 150px; gap: 6px; padding-left: 16px; border-left: 1px solid var(--line); }
.writer-tools strong { margin: 0 0 4px; color: var(--text-2); font-size: .72rem; }
.writer-tools button { min-height: 40px; border: 0; border-left: 2px solid var(--line); background: transparent; color: var(--text-2); text-align: left; padding: 8px 10px; cursor: pointer; }
.writer-tools button:hover, .writer-tools button:focus-visible { border-left-color: var(--line-b); color: var(--text); outline: none; }
.writer-image-block, .writer-inline-table { min-width: 0; margin: 4px 8px; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--panel-2); }
.writer-image-block { overflow: hidden; }
.writer-image-block img { display: block; width: 100%; height: clamp(160px, 24vw, 280px); object-fit: contain; background: var(--bg); }
.writer-image-block figcaption { display: flex; align-items: end; gap: 10px; padding: 12px; }
.writer-image-block label, .writer-inline-table-head label { display: grid; flex: 1; gap: 5px; min-width: 0; color: var(--text-2); font-size: .72rem; }
.writer-image-block input, .writer-inline-table-head input { width: 100%; min-height: 40px; border: 1px solid var(--line); border-radius: 7px; background: var(--panel); color: var(--text); padding: 8px 10px; font: inherit; }
.writer-block-remove { min-height: 40px; flex: none; }
.writer-inline-table { position: relative; padding: 12px 52px 52px 12px; }
.writer-inline-table-head { display: flex; align-items: end; gap: 10px; margin-bottom: 10px; }
.writer-inline-table-head label { max-width: 280px; }
.writer-table-scroll-hint { margin-left: auto; color: var(--muted); font-size: .68rem; white-space: nowrap; }
.writer-inline-table-scroll { position: relative; max-width: 100%; overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: linear-gradient(90deg, transparent calc(100% - 22px), color-mix(in srgb, var(--line-b) 20%, transparent)); scrollbar-color: var(--line-strong) transparent; }
.writer-inline-table-scroll:focus-visible { outline: 2px solid var(--accent-text); outline-offset: 2px; }
.writer-inline-table table { width: 100%; min-width: 320px; border-collapse: collapse; table-layout: fixed; }
.writer-inline-table th, .writer-inline-table td { position: relative; min-width: 150px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 0; background: var(--panel); }
.writer-inline-table th { background: var(--panel-2); }
.writer-inline-table tr:last-child td { border-bottom: 0; }
.writer-inline-table th:last-child, .writer-inline-table td:last-child { border-right: 0; }
.writer-table-cell-input { width: 100%; min-width: 150px; min-height: 44px; border: 0; background: transparent; color: var(--text); padding: 9px 42px 9px 10px; font: inherit; }
.writer-table-cell-input:focus { outline: 2px solid var(--accent-text); outline-offset: -2px; }
.writer-cell-actions { position: absolute; z-index: 2; top: 2px; right: 2px; }
.writer-cell-actions summary { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 6px; color: var(--text-2); cursor: pointer; list-style: none; opacity: 0; }
.writer-cell-actions summary::-webkit-details-marker { display: none; }
.writer-inline-table th:hover summary, .writer-inline-table td:hover summary, .writer-cell-actions[open] summary, .writer-cell-actions summary:focus-visible { opacity: 1; background: var(--panel-2); }
.writer-cell-actions > div { position: absolute; top: 42px; right: 0; display: grid; min-width: 112px; padding: 6px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--panel); box-shadow: var(--shadow); }
.writer-cell-actions button { min-height: 40px; border: 0; background: transparent; color: var(--text); text-align: left; cursor: pointer; }
.writer-cell-actions button:disabled { color: var(--muted); cursor: not-allowed; }
.writer-table-add { position: absolute; min-width: 40px; min-height: 40px; border: 1px solid var(--line-strong); border-radius: 8px; background: var(--panel); color: var(--text); cursor: pointer; }
.writer-table-add:hover, .writer-table-add:focus-visible { border-color: var(--line-b); outline: none; }
.writer-table-add-column { top: 50%; right: 6px; transform: translateY(-25%); }
.writer-table-add-row { bottom: 6px; left: 50%; transform: translateX(-50%); }
.writer-missing-table { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.writer-missing-table p { margin: 0; color: var(--text-2); }
.writer-dialog { color: var(--text); background: var(--panel); border: 1px solid var(--line-strong); border-radius: 16px; padding: 0; width: min(540px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); overflow: auto; box-shadow: var(--shadow); }
.writer-dialog::backdrop { background: rgb(0 0 0 / .6); }
.writer-dialog-content { padding: 24px; }
.writer-dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
.writer-dialog-head h2 { margin: 0; font-size: 1.25rem; }
.writer-dialog-head button { min-width: 40px; min-height: 40px; padding: 4px; font-size: 1.3rem; }
.writer-menu, .writer-publish-form, .writer-drawer, .writer-help, .writer-tool-menu { display: grid; gap: 18px; }
.writer-menu button { text-align: left; }
.writer-heading-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.writer-heading-tools button, .writer-tool-menu > button { min-width: 0; min-height: 44px; }
.writer-dialog input, .writer-dialog textarea { font-size: 1rem; }
.writer-publish-status { display: flex; align-items: center; gap: 8px; font-size: .82rem; color: var(--text-2); }
.writer-local-publish { margin: 0; font-size: .8rem; color: var(--text-2); }
.writer-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
.writer-dialog[data-panel='menu'] { width: min(320px, calc(100vw - 32px)); }
.writer-dialog[data-panel='tools'] { width: min(360px, calc(100vw - 32px)); }
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
@media (min-width: 1100px) {
  .writer-tools { display: grid; }
  .writer-tool-trigger { display: none; }
}
@media (max-width: 760px) {
  .writing-room { min-height: calc(100dvh - 180px); }
  .writer-bar { gap: 4px; }
  .writer-bar button { padding: 8px; font-size: .78rem; }
  .writer-document { display: none; }
  .writer-bar .writer-exit { min-width: 40px; font-size: .72rem; }
  .writer-save { flex: 1; text-align: right; padding-right: 4px; font-size: .68rem; }
  .writer-page { margin-top: 16px; }
  .writer-editor { gap: 16px; }
  .writer-dialog-content { padding: 20px; }
  .writer-dialog[data-panel='tools'] { margin: auto 0 0; width: 100%; max-width: 100%; max-height: calc(100dvh - 16px); border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); }
  .writer-dialog[data-panel='publish'] { margin: auto 0 0; width: 100%; max-width: 100%; max-height: calc(100dvh - 16px); border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); }
  .writer-image-block figcaption, .writer-inline-table-head { align-items: stretch; flex-direction: column; }
  .writer-inline-table { margin-inline: 0; padding-left: 8px; }
  .writer-table-scroll-hint { order: 3; margin: 0; white-space: normal; }
  .writer-inline-table-head label { max-width: none; }
}
@media (hover: none) {
  .writer-cell-actions summary { opacity: 1; }
}
</style>
