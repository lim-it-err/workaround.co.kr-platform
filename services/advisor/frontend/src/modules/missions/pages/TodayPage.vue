<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMissions } from '../store/missions.js'
import InflightPage from './InflightPage.vue'

const route = useRoute()
const store = useMissions()
const routine = computed(() => store.routineToday())
const caseBanner = computed(() => store.ongoingCaseBanner())

const currentBandIndex = computed(() => {
  const hour = new Date().getHours()
  const count = routine.value.slots.length
  if (count <= 1) return 0
  if (count === 2) return hour < 14 ? 0 : 1
  if (hour < 11) return 0
  if (hour < 17) return 1
  return 2
})

const nextStep = computed(() => {
  if (caseBanner.value) {
    return {
      title: `${caseBanner.value.title} · ${caseBanner.value.day}일차`,
      meta: '진행 중인 사건 파일',
      linkTo: caseBanner.value.linkTo,
      action: '이어서 하기',
    }
  }
  const slots = routine.value.slots
  const selected = slots[currentBandIndex.value]?.linkTo
    ? slots[currentBandIndex.value]
    : slots.find((slot) => !slot.done && slot.linkTo) ?? slots.find((slot) => slot.linkTo)
  return {
    title: selected?.title ?? '새 미션을 골라 시작하세요',
    meta: selected ? `${selected.time} · ${selected.label}` : '오늘의 추천',
    linkTo: selected?.linkTo ?? '/learn',
    action: '오늘의 첫 판 시작',
  }
})

function surfaceLink(path) {
  return { path, state: { from: '/today' } }
}

function check(slot) {
  if (slot.checkIndex != null) store.checkRoutineSlot(slot.checkIndex)
}
</script>

<template>
  <div class="today-page">
    <section class="surface-hero">
      <span class="eyebrow">오늘의 다음 한 걸음</span>
      <h1>{{ nextStep.title }}</h1>
      <p>{{ nextStep.meta }}</p>
      <router-link :to="surfaceLink(nextStep.linkTo)" class="btn primary next-action">
        {{ nextStep.action }}
      </router-link>
    </section>

    <details class="secondary-block">
      <summary>오늘 전체 보기 <span>{{ routine.slots.filter((slot) => slot.done).length }}/{{ routine.slots.length }}</span></summary>
      <div class="routine-list">
        <div
          v-for="(slot, index) in routine.slots"
          :key="`${slot.kind}-${index}`"
          class="routine-row"
        >
          <span class="routine-mark">{{ slot.done ? '✓' : slot.emoji }}</span>
          <router-link :to="surfaceLink(slot.linkTo ?? '/learn')" class="routine-link">
            <small>{{ slot.time }} · {{ slot.label }}</small><strong>{{ slot.title }}</strong>
          </router-link>
          <button
            v-if="slot.manualCheckable && !slot.done"
            type="button"
            class="check-action"
            @click="check(slot)"
          >{{ slot.checkLabel }}</button>
          <span v-else aria-hidden="true">→</span>
        </div>
        <p v-if="routine.streak" class="streak">{{ routine.streak }}일 연속으로 한 걸음을 남겼습니다.</p>
      </div>
    </details>

    <details id="offline" class="secondary-block" :open="route.hash === '#offline'">
      <summary>오프라인 세션 만들기 <span>비행 중에도 이어서</span></summary>
      <InflightPage embedded />
    </details>
  </div>
</template>

<style scoped>
.today-page { max-width: 760px; margin: 0 auto; }
.surface-hero { padding: clamp(20px, 5vw, 42px) 0 clamp(26px, 6vw, 50px) clamp(18px, 3vw, 32px); border-left: 3px solid var(--accent); }
.eyebrow { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.surface-hero h1 { max-width: 25ch; margin: 8px 0 6px; font-size: clamp(25px, 5vw, 38px); line-height: 1.25; overflow-wrap: anywhere; }
.surface-hero p { margin: 0; color: var(--fg-dim); }
.next-action { margin-top: 22px; min-width: 170px; text-align: center; }
.secondary-block { border-bottom: 1px solid var(--line); }
.secondary-block > summary { display: flex; justify-content: space-between; gap: 16px; min-height: 52px; padding: 14px 2px; cursor: pointer; font-weight: 700; }
.secondary-block > summary span { color: var(--fg-dim); font-size: 12px; font-weight: 500; }
.routine-list { padding: 2px 0 18px; }
.routine-row { display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 56px; padding: 8px 10px; color: var(--fg); border-top: 1px solid var(--line); }
.routine-row:hover { background: var(--panel-soft); }
.routine-link { min-width: 0; color: var(--fg); text-decoration: none; }
.routine-link small, .routine-link strong { display: block; overflow-wrap: anywhere; }
.routine-row small { color: var(--fg-dim); font-size: 11px; }
.routine-row strong { font-size: 14px; }
.routine-mark { text-align: center; color: var(--accent-text); }
.check-action { border: 0; background: transparent; color: var(--accent-text); font-size: 12px; font-weight: 700; }
.streak { margin: 12px 10px 0; color: var(--fg-dim); font-size: 13px; }
@media (max-width: 480px) {
  .surface-hero { padding-top: 18px; }
  .next-action { width: 100%; }
}
</style>
