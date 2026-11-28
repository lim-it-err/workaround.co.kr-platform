<script setup>
// 로컬 IDE에서 작성한 파일을 붙여넣거나 올려서 제출하는 에디터.
import { ref } from 'vue'
const props = defineProps({
  modelValue: { type: Array, required: true }, // [{ path, content }]
})
const emit = defineEmits(['update:modelValue'])

function update(i, key, value) {
  const next = props.modelValue.map((f, idx) => (idx === i ? { ...f, [key]: value } : f))
  emit('update:modelValue', next)
}

function addFile() {
  emit('update:modelValue', [...props.modelValue, { path: '', content: '' }])
}

const TEXT_EXT = ['java', 'kt', 'xml', 'gradle', 'kts', 'properties', 'yml', 'yaml', 'md', 'txt', 'json', 'sql']
const IGNORED_DIRS = ['target', 'build', '.git', '.idea', 'node_modules']
const MAX_BYTES = 200 * 1024
const MAX_FILES = 50

const notice = ref('')
const dragging = ref(false)

function uploadPath(file) {
  return (file.webkitRelativePath || file.name || '').replace(/\\/g, '/')
}

async function ingest(fileList) {
  const notes = []
  const picked = []
  let ignored = 0
  let wrongType = 0
  let tooBig = 0
  for (const file of Array.from(fileList || [])) {
    const path = uploadPath(file)
    const segs = path.split('/')
    if (segs.slice(0, -1).some((s) => IGNORED_DIRS.includes(s))) { ignored++; continue }
    const ext = (segs[segs.length - 1].split('.').pop() || '').toLowerCase()
    if (!TEXT_EXT.includes(ext) || !segs[segs.length - 1].includes('.')) { wrongType++; continue }
    if (file.size > MAX_BYTES) { tooBig++; continue }
    picked.push({ path, file })
  }
  if (ignored) notes.push(`target·build·.git·.idea·node_modules 아래 ${ignored}개는 건너뛰었습니다.`)
  if (wrongType) notes.push(`텍스트 코드 파일이 아닌 ${wrongType}개는 건너뛰었습니다.`)
  if (tooBig) notes.push(`200KB 를 넘는 ${tooBig}개는 건너뛰었습니다.`)

  // 올린 파일이 모두 같은 최상위 폴더를 공유하면 그 한 단계를 뗀다(프로젝트 폴더명 제거).
  const firsts = new Set(picked.map((x) => x.path.split('/')[0]))
  if (picked.length && firsts.size === 1 && picked.every((x) => x.path.includes('/'))) {
    for (const x of picked) x.path = x.path.slice(x.path.indexOf('/') + 1)
  }

  const loaded = []
  for (const { path, file } of picked) loaded.push({ path, content: await file.text() })

  const hasOnlyEmpty = props.modelValue.length === 1 && !props.modelValue[0].path && !props.modelValue[0].content
  let next = hasOnlyEmpty ? [] : [...props.modelValue]
  let overLimit = 0
  for (const f of loaded) {
    const idx = next.findIndex((x) => x.path === f.path)
    if (idx >= 0) next[idx] = f
    else if (next.length >= MAX_FILES) overLimit++
    else next.push(f)
  }
  if (overLimit) notes.push(`파일은 최대 ${MAX_FILES}개까지라 ${overLimit}개는 건너뛰었습니다.`)
  if (loaded.length) emit('update:modelValue', next)
  notice.value = notes.join(' ')
}

async function onPick(e) {
  const input = e.target
  await ingest(input.files)
  input.value = ''
}

// 폴더를 끌어다 놓으면 디렉터리 항목을 재귀로 펼친다.
async function entryFiles(entry, prefix) {
  if (entry.isFile) {
    const f = await new Promise((res, rej) => entry.file(res, rej))
    Object.defineProperty(f, 'webkitRelativePath', { value: prefix + f.name })
    return [f]
  }
  const reader = entry.createReader()
  const kids = []
  for (;;) {
    const batch = await new Promise((res, rej) => reader.readEntries(res, rej))
    if (!batch.length) break
    kids.push(...batch)
  }
  const out = []
  for (const k of kids) out.push(...(await entryFiles(k, `${prefix}${entry.name}/`)))
  return out
}

async function onDrop(e) {
  dragging.value = false
  const items = Array.from(e.dataTransfer?.items || [])
  const entries = items.map((it) => it.webkitGetAsEntry?.()).filter(Boolean)
  if (entries.length) {
    const all = []
    for (const en of entries) all.push(...(await entryFiles(en, '')))
    await ingest(all)
  } else {
    await ingest(e.dataTransfer?.files)
  }
}

function removeFile(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>

<template>
  <div class="editor">
    <div
      class="upload"
      :class="{ drag: dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <label class="btn upload-btn">
        파일 올리기
        <input type="file" multiple class="sr-only" aria-label="파일 올리기" @change="onPick" />
      </label>
      <label class="btn upload-btn">
        폴더 올리기
        <input type="file" webkitdirectory class="sr-only" aria-label="폴더 올리기" @change="onPick" />
      </label>
      <span class="dim upload-hint">여기로 끌어다 놓아도 됩니다</span>
    </div>
    <p v-if="notice" class="upload-notice" role="status">{{ notice }}</p>
    <div v-for="(f, i) in modelValue" :key="i" class="file card">
      <div class="file-head">
        <input
          class="path mono"
          :value="f.path"
          :aria-label="`파일 ${i + 1} 경로`"
          placeholder="예: src/main/java/wine/WineRecommender.java"
          @input="update(i, 'path', $event.target.value)"
        />
        <button class="remove" title="파일 제거" @click="removeFile(i)">✕</button>
      </div>
      <textarea
        class="content mono"
        :value="f.content"
        :aria-label="`파일 ${i + 1} 내용`"
        rows="14"
        placeholder="IntelliJ에서 작성한 코드를 여기에 붙여넣으세요"
        @input="update(i, 'content', $event.target.value)"
      ></textarea>
    </div>
    <button class="btn" @click="addFile">+ 파일 추가</button>
  </div>
</template>

<style scoped>
.upload { width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 8px; border: 1px dashed var(--border); border-radius: 10px; }
.upload.drag { border-color: var(--accent); }
.upload-btn { min-height: 40px; display: inline-flex; align-items: center; cursor: pointer; }
.upload-hint { font-size: 12.5px; }
.upload-notice { margin: 0; font-size: 13px; color: var(--fg-dim); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); opacity: 0; }
.upload-btn { position: relative; }
.editor { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
.file { width: 100%; padding: 12px; }
.file-head { display: flex; gap: 8px; margin-bottom: 8px; }
.path {
  flex: 1;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  padding: 7px 10px;
  font-size: 13px;
}
.remove {
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg-dim);
  width: 40px;
  min-height: 40px;
  flex: 0 0 40px;
}
.remove:hover { color: var(--bad); border-color: var(--bad); }
.content {
  width: 100%;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--code-text);
  padding: 12px;
  font-size: 13px;
  line-height: 1.55;
  resize: vertical;
}
.path:focus, .content:focus { outline: none; border-color: var(--accent); }
</style>
