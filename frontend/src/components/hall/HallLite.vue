<script setup>
import { computed, nextTick, ref } from 'vue'
import { HALL_LITE_ITEMS, LITE_HINT, resolveHallTarget, takeBootLog } from '../../data/hallBoard.js'
import { withBasePath } from '../../staticRouting.js'

// TKT-219 (D-036): lite 보기의 환승 홀 — 역 이름 6개만, 글자 입력 칸 없음.
// 화살표로 고르고 Enter 로 들어간다. 탭/클릭은 한 번 = 선택, 선택된 줄 다시 = 진입.
const props = defineProps({
  disabledPages: { type: Array, default: () => [] }
})

const emit = defineEmits(['open', 'notice'])

// lite 로 처음 열어도 부팅 로그는 이번 방문에서 쓴 것으로 친다(나중에 기본으로 바꿔도 로그가 갑자기 흐르지 않는다).
takeBootLog({ reducedMotion: true })

const items = HALL_LITE_ITEMS
const active = ref(-1) // 화면을 처음 열 땐 선택 없음 — Tab 으로 들어오면 첫 항목이 선택된다.
const listRef = ref(null)
let pointerFocus = false

const activeId = computed(() => (active.value >= 0 ? optionId(active.value) : undefined))
const message = computed(() => (
  active.value >= 0 ? `${items[active.value].label} 선택 · 한 번 더 누르면 들어갑니다` : LITE_HINT
))

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

function onFocus() {
  if (pointerFocus) return // 눌러서 들어온 포커스는 아래 클릭 처리가 선택한다
  if (active.value < 0) active.value = 0
}

function onKeydown(event) {
  if (event.key === 'ArrowDown') pick(active.value + 1)
  else if (event.key === 'ArrowUp') pick(active.value < 0 ? items.length - 1 : active.value - 1)
  else if (event.key === 'Home') pick(0)
  else if (event.key === 'End') pick(items.length - 1)
  else if (event.key === 'Enter') enter()
  else return
  event.preventDefault()
}

function onClick(index) {
  pointerFocus = false
  if (index === active.value) enter(index)
  else pick(index)
  listRef.value?.focus({ preventScroll: true })
}
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
        @focus="onFocus"
        @keydown="onKeydown"
        @pointerdown="pointerFocus = true"
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
