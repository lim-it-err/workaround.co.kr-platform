<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import StationHeader from './StationHeader.vue'
import { VOYAGE } from '../data/voyage.js'
import {
  LOCAL_WRITING_HELP,
  LOCAL_WRITING_NOTICE,
  downloadWritingBackup
} from '../staticWritingState.js'
import {
  buildVoyageStops,
  readVoyageArchiveState,
  writeVoyageArchiveState
} from './voyageArchiveState.js'

defineEmits(['exit', 'open-daily', 'open-prep'])

const ARCHIVE_STORAGE_KEY = `workaround-voyage-archive:${VOYAGE.id}`

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${value}T00:00:00`))
}

const stops = buildVoyageStops(VOYAGE, localDateKey())
const validStopIds = new Set(stops.map((stop) => stop.id))
const initialState = typeof window === 'undefined'
  ? { stamps: [], notes: {} }
  : readVoyageArchiveState(window.localStorage, ARCHIVE_STORAGE_KEY, validStopIds)
const stampedIds = ref(initialState.stamps)
const notes = ref(initialState.notes)
const savePhase = ref('saved')
const backupMessage = ref('')
const stampedSet = computed(() => new Set(stampedIds.value))
const stampedCount = computed(() => stampedIds.value.length)
const recordedCount = computed(() => Object.values(notes.value).filter((note) => note.trim()).length)
const saveStatus = computed(() => ({
  saving: '저장 중',
  saved: '저장됨',
  error: '저장 실패'
})[savePhase.value])
let saveTimer

watch([stampedIds, notes], ([nextStamps, nextNotes]) => {
  if (typeof window !== 'undefined') {
    savePhase.value = 'saving'
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => persistArchive(nextStamps, nextNotes), 450)
  }
}, { deep: true })

onBeforeUnmount(() => {
  if (savePhase.value === 'saving') {
    persistArchive(stampedIds.value, notes.value)
  }
  window.clearTimeout(saveTimer)
})

function persistArchive(nextStamps = stampedIds.value, nextNotes = notes.value) {
  window.clearTimeout(saveTimer)
  const saved = writeVoyageArchiveState(window.localStorage, ARCHIVE_STORAGE_KEY, {
    stamps: nextStamps,
    notes: nextNotes
  })
  savePhase.value = saved ? 'saved' : 'error'
  return saved
}

function backupWriting() {
  if (savePhase.value === 'saving' && !persistArchive()) {
    backupMessage.value = '저장 실패를 해결한 뒤 다시 시도해 주세요.'
    return
  }
  try {
    downloadWritingBackup(window.localStorage, ARCHIVE_STORAGE_KEY)
    backupMessage.value = '백업 파일을 내려받았습니다.'
  } catch (error) {
    backupMessage.value = '백업 파일을 만들지 못했습니다.'
  }
}

function toggleStamp(stop) {
  if (!stop.visited) {
    return
  }
  const next = new Set(stampedIds.value)
  if (next.has(stop.id)) {
    next.delete(stop.id)
  } else {
    next.add(stop.id)
  }
  stampedIds.value = Array.from(next)
}
</script>

<template>
  <section class="feature-shell line-v voyage-archive">
    <StationHeader
      line-class="line-v"
      station-code="V03"
      title="도시 기록"
      title-en="VOYAGE ARCHIVE"
      status="기록 보관함"
      status-tone="ok"
      summary="스탬프 · 메모 · 글"
      @exit="$emit('exit')"
    >
      <template #actions>
        <button type="button" class="btn btn-ghost" @click="$emit('open-prep')">여행 준비</button>
        <button type="button" class="btn btn-ghost" @click="$emit('open-daily')">일일 안내</button>
      </template>
    </StationHeader>

    <section class="section-block local-writing-card" aria-labelledby="voyage-local-writing-title">
      <div>
        <p class="eyebrow">LOCAL NOTES</p>
        <h3 id="voyage-local-writing-title">{{ LOCAL_WRITING_NOTICE }}</h3>
        <p>{{ LOCAL_WRITING_HELP }}</p>
      </div>
      <div class="local-writing-actions">
        <span class="local-save-status" :data-phase="savePhase" role="status" aria-live="polite">{{ saveStatus }}</span>
        <button type="button" class="btn btn-ghost" @click="backupWriting">내 기록 백업</button>
        <small v-if="backupMessage" role="status" aria-live="polite">{{ backupMessage }}</small>
      </div>
    </section>

    <section class="section-block voyage-archive-overview" aria-labelledby="voyage-archive-title">
      <div>
        <p class="eyebrow">CITY STAMPS</p>
        <h3 id="voyage-archive-title">{{ VOYAGE.title }}</h3>
        <p>{{ stampedCount }}개 스탬프 · {{ recordedCount }}개 기록</p>
      </div>
      <div class="voyage-archive-count" aria-label="스탬프 진행률">
        <strong class="num">{{ stampedCount }}/{{ stops.length }}</strong>
        <span>방문 기록</span>
      </div>

      <ol class="voyage-stamp-line" aria-label="도시 스탬프 노선">
        <li
          v-for="stop in stops"
          :key="stop.id"
          :class="{ visited: stop.visited, stamped: stampedSet.has(stop.id) }"
          :aria-label="`${stop.order}번째 ${stop.city}, ${formatDate(stop.date)}`"
        >
          <span aria-hidden="true">{{ stampedSet.has(stop.id) ? '✓' : '' }}</span>
          <small>{{ stop.order }}</small>
        </li>
      </ol>
    </section>

    <section class="voyage-stop-grid" aria-label="도시별 기록">
      <article
        v-for="stop in stops"
        :id="`voyage-${stop.id}`"
        :key="stop.id"
        class="section-block voyage-stop-card"
        :class="{ visited: stop.visited, stamped: stampedSet.has(stop.id) }"
      >
        <div class="voyage-stop-head">
          <div>
            <p class="eyebrow">V{{ String(stop.order).padStart(2, '0') }}</p>
            <h3>{{ stop.city }}</h3>
            <span>{{ formatDate(stop.date) }} · {{ stop.dow }}요일</span>
          </div>
          <button
            type="button"
            class="voyage-stamp"
            :disabled="!stop.visited"
            :aria-pressed="stampedSet.has(stop.id)"
            :aria-label="stampedSet.has(stop.id) ? `${stop.city} 스탬프 취소` : `${stop.city} 스탬프 찍기`"
            @click="toggleStamp(stop)"
          >
            <span>{{ stampedSet.has(stop.id) ? 'VISITED' : stop.visited ? 'STAMP' : 'LOCKED' }}</span>
            <strong>{{ stampedSet.has(stop.id) ? '✓' : stop.order }}</strong>
          </button>
        </div>

        <label class="voyage-note" :for="`voyage-note-${stop.id}`">
          <span>기록 초안</span>
          <textarea
            :id="`voyage-note-${stop.id}`"
            v-model="notes[stop.id]"
            rows="4"
            :placeholder="`${stop.city}의 기억`"
          ></textarea>
        </label>

        <div class="voyage-stop-footer">
          <span>{{ stop.visited ? '스탬프 사용 가능' : `${formatDate(stop.date)} 이후` }}</span>
          <span class="voyage-blog-slot">블로그 글 연결 예정</span>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.voyage-archive,
.voyage-archive > * {
  min-width: 0;
}

.voyage-archive-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  box-shadow: inset 0 4px 0 var(--accent);
}

.local-writing-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
}

.local-writing-card h3 {
  margin: 0;
  color: var(--text);
  font-size: 1rem;
}

.local-writing-card p:not(.eyebrow) {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.55;
}

.local-writing-actions {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.local-writing-actions small {
  max-width: 220px;
  color: var(--muted);
  text-align: right;
}

.local-save-status {
  color: var(--accent-text);
  font-size: 0.78rem;
  font-weight: 800;
}

.local-save-status[data-phase='error'] {
  color: var(--danger, #e35d6a);
}

.voyage-archive-overview h3,
.voyage-stop-head h3 {
  margin: 0;
  color: var(--text);
}

.voyage-archive-overview h3 {
  font-size: clamp(1.45rem, 4vw, 2rem);
}

.voyage-archive-overview > div:first-child > p:last-child,
.voyage-stop-head span {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.voyage-archive-count {
  display: grid;
  justify-items: end;
}

.voyage-archive-count strong {
  color: var(--accent-text);
  font-size: 1.45rem;
}

.voyage-archive-count span {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.voyage-stamp-line {
  position: relative;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 2px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.voyage-stamp-line::before {
  content: '';
  position: absolute;
  top: 11px;
  right: 5%;
  left: 5%;
  height: 2px;
  background: var(--line);
}

.voyage-stamp-line li {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--muted);
}

.voyage-stamp-line li > span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 2px solid var(--line-strong);
  border-radius: 50%;
  background: var(--panel);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 900;
}

.voyage-stamp-line li.visited > span {
  border-color: var(--accent);
}

.voyage-stamp-line li.stamped > span {
  border-color: var(--accent);
  background: var(--accent);
}

.voyage-stop-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}

.voyage-stop-card {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.voyage-stop-card.stamped {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
  background: color-mix(in srgb, var(--accent) 7%, var(--panel));
}

.voyage-stop-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: start;
}

.voyage-stop-head h3 {
  font-size: 1.2rem;
  overflow-wrap: anywhere;
}

.voyage-stamp {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border: 2px dashed var(--accent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  color: var(--accent-text);
  cursor: pointer;
  transform: rotate(-7deg);
}

.voyage-stamp:disabled {
  border-color: var(--line-strong);
  color: var(--muted);
  cursor: not-allowed;
  opacity: 0.5;
}

.voyage-stamp[aria-pressed='true'] {
  border-style: solid;
  background: var(--accent);
  color: #fff;
}

.voyage-stamp span {
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.voyage-stamp strong {
  font-size: 1.2rem;
}

.voyage-note {
  display: grid;
  gap: 7px;
  color: var(--text-2);
  font-size: 0.8rem;
  font-weight: 700;
}

.voyage-note textarea {
  width: 100%;
  min-width: 0;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: var(--panel-2);
  color: var(--text);
  font: inherit;
  line-height: 1.55;
}

.voyage-note textarea:focus {
  border-color: var(--accent);
  outline: 2px solid color-mix(in srgb, var(--accent) 25%, transparent);
  outline-offset: 1px;
}

.voyage-stop-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: var(--fs-caption);
}

.voyage-blog-slot {
  padding: 4px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
}

@media (max-width: 760px) {
  .local-writing-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .local-writing-actions {
    justify-items: stretch;
  }

  .local-writing-actions small {
    max-width: none;
    text-align: left;
  }

  .voyage-archive-overview {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }

  .voyage-stop-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .voyage-stop-head {
    gap: 10px;
  }

  .voyage-stamp {
    width: 64px;
    height: 64px;
  }

  .voyage-stop-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
