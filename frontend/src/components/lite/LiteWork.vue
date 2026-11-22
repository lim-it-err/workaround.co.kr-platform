<script setup>
import { computed, nextTick, ref } from 'vue'
import LiteScreen from './LiteScreen.vue'
import { useLiteKeys } from '../../composables/useLiteKeys.js'
import { OPERATING_NOTES, OPERATING_NOTES_UPDATED } from '../../data/workNotes/operatingModel.js'

// TKT-232: lite 운영 노트 — 목차(1단계) → 한 절씩 읽기(2단계).
// 목차: ↑↓ 고르기 · Enter 읽기 · Esc 뒤로(환승 홀). 읽기: ←→ 앞뒤 절 · ↑↓ 본문 스크롤 · Esc 목차(고르던 줄 유지).
const emit = defineEmits(['back'])

const notes = OPERATING_NOTES
const STATUS_CLASS = { 확정: 'is-confirmed', 제안: 'is-proposed', '할 일': 'is-todo' }

const view = ref('toc') // 'toc' | 'read'
const active = ref(0) // 고른 줄 = 읽는 절 번호. 첫 줄이 이미 선택돼 있다.
const listRef = ref(null)
const readRef = ref(null)

const note = computed(() => notes[active.value])
const keysText = computed(() =>
  view.value === 'toc' ? '↑↓ 고르기 · Enter 읽기 · Esc 뒤로' : '←→ 앞뒤 절 · ↑↓ 본문 · Esc 목차'
)
const tocMessage = computed(() => `${notes[active.value].title} 선택 · Enter 읽기`)

function optionId(index) {
  return `work-note-opt-${index}`
}

function scrollBox() {
  return readRef.value?.closest('[data-lite-scroll]') ?? null
}

function resetScroll() {
  nextTick(() => scrollBox()?.scrollTo?.({ top: 0 }))
}

function pick(index) {
  active.value = (index + notes.length) % notes.length
  nextTick(() => document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' }))
}

function open(index = active.value) {
  if (!notes[index]) return
  active.value = index
  view.value = 'read'
  resetScroll()
}

function toToc() {
  view.value = 'toc'
  nextTick(() => {
    document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' })
    listRef.value?.focus({ preventScroll: true })
  })
}

function moveNote(delta) {
  active.value = (active.value + delta + notes.length) % notes.length
  resetScroll()
}

function scrollBody(delta) {
  scrollBox()?.scrollBy?.({ top: delta * 48 })
}

// Esc 와 ‹ 뒤로 버튼은 같은 뜻: 읽는 중이면 목차, 목차면 환승 홀(App 이 처리).
function onBack() {
  if (view.value === 'read') toToc()
  else emit('back')
}

const { armed, pointerPick } = useLiteKeys({
  onMove: (delta) => {
    if (view.value === 'toc') {
      armed.value = false
      pick(active.value + delta)
    } else {
      scrollBody(delta)
    }
  },
  onSide: (delta) => {
    if (view.value === 'read') moveNote(delta)
  },
  onHome: () => {
    if (view.value === 'toc') pick(0)
  },
  onEnd: () => {
    if (view.value === 'toc') pick(notes.length - 1)
  },
  onEnter: () => (view.value === 'toc' ? (open(), true) : false),
  onBack,
  onHandled: () => {
    if (view.value === 'toc' && document.activeElement !== listRef.value) {
      listRef.value?.focus({ preventScroll: true })
    }
  }
})

function onClick(index) {
  pointerPick(index, { current: active.value, select: pick, enter: open })
  listRef.value?.focus({ preventScroll: true })
}
</script>

<template>
  <LiteScreen crumb="운영 노트" :keys="keysText" @back="onBack">
    <div v-if="view === 'toc'" class="nt-toc-wrap" data-work-toc>
      <p class="nt-title">운영 노트 — 기지선</p>
      <p class="nt-updated">갱신 {{ OPERATING_NOTES_UPDATED }}</p>
      <ul
        ref="listRef"
        class="nt-list"
        role="listbox"
        tabindex="0"
        aria-label="운영 노트 목차"
        :aria-activedescendant="optionId(active)"
      >
        <li
          v-for="(item, index) in notes"
          :id="optionId(index)"
          :key="item.id"
          role="option"
          :aria-selected="index === active"
          :data-note-index="index"
          :data-note-id="item.id"
          @click="onClick(index)"
        >
          <span class="nt-no" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="nt-name">{{ item.title }}</span>
          <span class="nt-badge" :class="STATUS_CLASS[item.status]">{{ item.status }}</span>
        </li>
      </ul>
      <p class="nt-msg" role="status" aria-live="polite">{{ tocMessage }}</p>
    </div>

    <article v-else ref="readRef" class="nt-read" data-work-read :data-note-id="note.id">
      <p class="nt-step">{{ active + 1 }}/{{ notes.length }}</p>
      <h2 class="nt-read-title">
        {{ note.title }}
        <span class="nt-badge" :class="STATUS_CLASS[note.status]">{{ note.status }}</span>
      </h2>
      <p v-if="note.lead" class="nt-lead">{{ note.lead }}</p>
      <p v-if="note.flow?.length" class="nt-flow">{{ note.flow.join(' → ') }}</p>
      <ul v-if="note.points?.length" class="nt-points">
        <li v-for="point in note.points" :key="point">{{ point }}</li>
      </ul>
    </article>
  </LiteScreen>
</template>

<style scoped>
.nt-toc-wrap,
.nt-read {
  min-width: 0;
  color: var(--text);
  font-family: var(--font-mono), "D2Coding", "Noto Sans Mono CJK KR", "Apple SD Gothic Neo", monospace;
}

.nt-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--safety);
}

.nt-updated,
.nt-msg,
.nt-step {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.nt-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.nt-list:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.nt-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 8px;
  cursor: pointer;
}

.nt-list li::before {
  content: '  ';
  white-space: pre;
}

.nt-list li[aria-selected='true'] {
  background: var(--text);
  color: var(--bg);
}

.nt-list li[aria-selected='true']::before {
  content: '▶ ';
}

.nt-no {
  flex: none;
  color: var(--muted);
  font-size: 0.85rem;
}

.nt-list li[aria-selected='true'] .nt-no {
  color: inherit;
}

.nt-name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.nt-badge {
  flex: none;
  padding: 0 6px;
  border: 1px solid currentColor;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--muted);
}

.nt-badge.is-confirmed {
  color: var(--text);
}

/* 선택 줄은 반전 배경(글자색 = --bg)이라 배지도 같은 색으로 따라간다 (TKT-234). */
.nt-list li[aria-selected='true'] .nt-badge {
  color: var(--bg);
  border-color: var(--bg);
}

.nt-badge.is-proposed {
  color: var(--safety);
}

.nt-badge.is-todo {
  color: var(--muted);
  border-style: dashed;
}

.nt-read-title {
  margin: 8px 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--safety);
}

.nt-read-title .nt-badge {
  margin-left: 8px;
  vertical-align: middle;
}

.nt-lead {
  margin: 12px 0 0;
  color: var(--text);
}

.nt-flow {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.nt-points {
  margin: 12px 0 0;
  padding: 0 0 0 1.2em;
}

.nt-points li {
  margin: 0 0 8px;
  color: var(--text);
}
</style>
