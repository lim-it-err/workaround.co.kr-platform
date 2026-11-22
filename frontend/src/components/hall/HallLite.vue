<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { HALL_LITE_ITEMS, LITE_HINT, resolveHallTarget, takeBootLog } from '../../data/hallBoard.js'
import { withBasePath } from '../../staticRouting.js'

// TKT-219 (D-036): lite 보기의 환승 홀 — 역 이름 6개만, 글자 입력 칸 없음.
// 화살표로 고르고 Enter 로 들어간다. 탭/클릭은 한 번 = 선택, 선택된 줄 다시 = 진입. (TKT-227: 포커스 무관 전역 키 처리)
const props = defineProps({
  disabledPages: { type: Array, default: () => [] }
})

const emit = defineEmits(['open', 'notice'])

// lite 로 처음 열어도 부팅 로그는 이번 방문에서 쓴 것으로 친다(나중에 기본으로 바꿔도 로그가 갑자기 흐르지 않는다).
takeBootLog({ reducedMotion: true })

const items = HALL_LITE_ITEMS
const active = ref(0) // TKT-227: 들어오면 첫 항목이 이미 선택돼 있다.
const armed = ref(false) // 마우스·터치로 고른 줄만 true — 이때만 같은 줄을 다시 누르면 진입
const listRef = ref(null)

const activeId = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))
const message = computed(() => {
  if (active.value < 0) return LITE_HINT
  return armed.value
    ? `${items[active.value].label} 선택 · 한 번 더 누르면 들어갑니다`
    : `${items[active.value].label} 선택 · Enter 들어가기`
})

function optionId(index) {
  return `hall-lite-opt-${index}`
}

function pick(index) {
  active.value = (index + items.length) % items.length
  nextTick(() => document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' }))
}

function enter(index = active.value) {
  const item = items[index]
  if (!item) return
  const action = resolveHallTarget({ ...item, destination: item.label }, props.disabledPages)
  if (action.type === 'notice') emit('notice', action.message)
  else if (action.type === 'link') window.location.assign(withBasePath(item.entryPath, import.meta.env.BASE_URL))
  else emit('open', action.page)
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'))
}

// 전역 keydown — 포커스가 제목·보기 전환 버튼·body 어디에 있든 목록이 움직인다. 마운트된 동안만 등록.
function onKeydown(event) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
  if (isTypingTarget(event.target)) return
  const key = event.key
  if (key === 'Enter') {
    // 버튼·링크에 포커스가 있으면 원래 동작. 목록·제목·body 에서만 진입.
    if (event.target instanceof Element && event.target.closest('button, a[href], summary')) return
    if (active.value < 0) return
    enter()
  } else if (key === 'ArrowDown') {
    armed.value = false
    pick(active.value < 0 ? 0 : active.value + 1)
  } else if (key === 'ArrowUp') {
    armed.value = false
    pick(active.value < 0 ? items.length - 1 : active.value - 1)
  } else if (key === 'Home') {
    armed.value = false
    pick(0)
  } else if (key === 'End') {
    armed.value = false
    pick(items.length - 1)
  } else return
  event.preventDefault()
  if (document.activeElement !== listRef.value) listRef.value?.focus({ preventScroll: true })
}

function onClick(index) {
  if (index === active.value && armed.value) {
    enter(index)
  } else {
    pick(index)
    armed.value = true
  }
  listRef.value?.focus({ preventScroll: true })
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <section class="junction-overview hall" aria-label="환승 홀" data-hall="lite">
    <div class="hall-lite">
      <div id="hall-lite-title" class="hall-lite-title">환승 홀</div>
      <ul
        ref="listRef"
        class="hall-sel"
        role="listbox"
        tabindex="0"
        aria-labelledby="hall-lite-title"
        :aria-activedescendant="activeId"
      >
        <li
          v-for="(item, index) in items"
          :id="optionId(index)"
          :key="item.id"
          role="option"
          :aria-selected="index === active"
          :data-hall-item="item.id"
          @click="onClick(index)"
        >{{ item.label }}</li>
      </ul>
      <p class="hall-lite-msg" role="status" aria-live="polite">{{ message }}</p>
    </div>
  </section>
</template>

<style scoped>
.hall {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  width: min(100%, 560px);
}

.hall-lite {
  min-width: 0;
  max-width: 100%;
  padding: 14px;
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono), "D2Coding", "Noto Sans Mono CJK KR", "Apple SD Gothic Neo", monospace;
  line-height: 1.6;
}

.hall-lite-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--safety);
}

.hall-sel {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.hall-sel:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.hall-sel li {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 8px;
  font-size: 1rem;
  cursor: pointer;
}

.hall-sel li::before {
  content: '  ';
  white-space: pre;
  width: 2ch;
}

.hall-sel li[aria-selected='true'] {
  background: var(--text);
  color: var(--bg);
  text-shadow: none;
}

.hall-sel li[aria-selected='true']::before {
  content: '▶ ';
}

.hall-lite-msg {
  min-height: 1.6em;
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
