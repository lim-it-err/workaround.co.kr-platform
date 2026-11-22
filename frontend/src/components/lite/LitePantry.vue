<script setup>
import { computed, nextTick, ref } from 'vue'
import LiteScreen from './LiteScreen.vue'
import { useLiteKeys } from '../../composables/useLiteKeys.js'
import { buildQuestions, candidatesFor, describeSet, pickSet } from './litePantry.js'

// TKT-231: 질문 세 개를 하나씩 → 조건에 맞는 한 상 하나(무작위). 결과 화면에서 ↓ = 같은 조건의 다른 상.
const emit = defineEmits(['back'])

const questions = buildQuestions()
const step = ref(0) // 0..2 질문, 3 = 결과
const choice = ref([null, null, null]) // 질문별로 고른 옵션 index
const active = ref(0)
const seen = ref([])
const current = ref(null)
const listRef = ref(null)

const isResult = computed(() => step.value >= questions.length)
const question = computed(() => questions[step.value])
const answerTags = computed(() => choice.value.map((index, q) => (index == null ? null : questions[q].options[index].tag)))
const found = computed(() => (isResult.value ? candidatesFor(answerTags.value) : null))
const view = computed(() => (current.value ? describeSet(current.value) : null))
const keysText = computed(() => (isResult.value
  ? (found.value.exact && found.value.sets.length > 1 ? '↓ 다른 상 · Enter 처음부터 · Esc 앞 질문' : 'Enter 처음부터 · Esc 앞 질문')
  : '↑↓ 고르기 · Enter 다음 · Esc 앞 질문'))
const crumb = computed(() => (isResult.value ? '자취 밥상 › 오늘' : '자취 밥상'))

function optionId(index) {
  return `pantry-lite-opt-${index}`
}

function pick(index) {
  const n = question.value.options.length
  active.value = (index + n) % n
  nextTick(() => document.getElementById(optionId(active.value))?.scrollIntoView?.({ block: 'nearest' }))
}

function showNext() {
  const set = pickSet(found.value.sets, seen.value)
  current.value = set
  if (set) seen.value = [...seen.value, set.id]
}

function confirm(index = active.value) {
  if (isResult.value) return restart()
  choice.value = choice.value.map((value, q) => (q === step.value ? index : value))
  step.value += 1
  if (isResult.value) {
    seen.value = []
    showNext()
  } else {
    active.value = choice.value[step.value] ?? 0
  }
}

function restart() {
  step.value = 0
  choice.value = [null, null, null]
  seen.value = []
  current.value = null
  active.value = 0
}

function goBack() {
  if (step.value === 0) {
    emit('back')
    return
  }
  step.value -= 1
  current.value = null
  active.value = choice.value[step.value] ?? 0
}

function another() {
  if (isResult.value && found.value.exact && found.value.sets.length > 1) showNext()
}

const { armed, pointerPick } = useLiteKeys({
  onMove: (delta) => (isResult.value ? (delta > 0 ? another() : undefined) : pick(active.value + delta)),
  onEnter: () => { confirm() },
  onBack: goBack,
  onHandled: () => {
    if (listRef.value && document.activeElement !== listRef.value) listRef.value.focus({ preventScroll: true })
  }
})

function onClick(index) {
  pointerPick(index, { current: active.value, select: pick, enter: confirm })
  listRef.value?.focus({ preventScroll: true })
}

const message = computed(() => {
  if (isResult.value) return ''
  const label = question.value.options[active.value]?.label
  return armed.value ? `${label} 선택 · 한 번 더 누르면 다음` : `${label} 선택 · Enter 다음`
})
</script>

<template>
  <LiteScreen :crumb="crumb" :keys="keysText" @back="emit('back')">
    <div v-if="!isResult" class="pantry-q" data-pantry-question>
      <p class="pantry-step" data-pantry-step>{{ step + 1 }}/3</p>
      <p id="pantry-lite-q" class="pantry-ask">{{ question.text }}</p>
      <ul
        ref="listRef"
        class="pantry-sel"
        role="listbox"
        tabindex="0"
        aria-labelledby="pantry-lite-q"
        :aria-activedescendant="optionId(active)"
      >
        <li
          v-for="(option, index) in question.options"
          :id="optionId(index)"
          :key="option.label"
          role="option"
          :aria-selected="index === active"
          :data-pantry-option="option.label"
          @click="onClick(index)"
        >{{ option.label }}</li>
      </ul>
      <p class="pantry-msg" role="status" aria-live="polite">{{ message }}</p>
    </div>

    <div v-else class="pantry-result" data-pantry-result role="status" aria-live="polite">
      <template v-if="view">
        <p v-if="!found.exact" class="pantry-near" data-pantry-near>딱 맞는 상은 없어 가까운 것</p>
        <p class="pantry-title" data-pantry-title>{{ view.title }}</p>
        <p class="pantry-mood" data-pantry-mood>{{ view.mood }}</p>
        <p class="pantry-meta" data-pantry-meta>{{ view.meta }}</p>
        <dl class="pantry-kv">
          <dt>주메뉴</dt><dd data-pantry-main>{{ view.mainName }}</dd>
          <dt>한잔</dt><dd data-pantry-drink>{{ view.drink }}</dd>
          <dt>무알코올</dt><dd data-pantry-alt>{{ view.alt }}</dd>
        </dl>
        <p v-if="found.exact" class="pantry-count" data-pantry-count>후보 {{ found.sets.length }}개</p>
      </template>
      <p v-else class="pantry-title" data-pantry-empty>맞는 상이 없어요 — 조건을 하나 풀어 보세요</p>
    </div>
  </LiteScreen>
</template>

<style scoped>
.pantry-step {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.pantry-ask,
.pantry-title {
  margin: 4px 0 0;
  color: var(--safety);
  font-size: 1.1rem;
  font-weight: 700;
}

.pantry-sel {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.pantry-sel:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.pantry-sel li {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 8px;
  font-size: 1rem;
  cursor: pointer;
}

.pantry-sel li::before {
  content: '  ';
  white-space: pre;
  width: 2ch;
}

.pantry-sel li[aria-selected='true'] {
  background: var(--text);
  color: var(--bg);
  text-shadow: none;
}

.pantry-sel li[aria-selected='true']::before {
  content: '▶ ';
}

.pantry-msg {
  min-height: 1.6em;
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.pantry-near {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 0.85rem;
}

.pantry-mood {
  margin: 6px 0 0;
}

.pantry-meta {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.9rem;
}

.pantry-kv {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 4px 14px;
  margin: 14px 0 0;
}

.pantry-kv dt {
  color: var(--muted);
}

.pantry-kv dd {
  margin: 0;
}

.pantry-count {
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}
</style>
