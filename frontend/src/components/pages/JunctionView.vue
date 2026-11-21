<script setup>
import { onBeforeUnmount, ref } from 'vue'
import HallBoard from '../hall/HallBoard.vue'
import HallLite from '../hall/HallLite.vue'

// TKT-211: App.vue 에서 떼어낸 환승 홀 섹션(정적 공개본 안내 + 닫힌 블로그 안내 토스트).
// TKT-219 (D-036): 노선도 대신 보기에 따라 출발 안내판(기본) 또는 화살표 선택 목록(lite).
// 상태는 App 이 소유하고 props 로만 받는다. 페이지 이동은 open 이벤트로 올린다.
defineProps({
  disabledPages: { type: Array, default: () => [] },
  staticMode: { type: Boolean, default: false },
  staticModeMessage: { type: String, default: '' },
  blogClosedNotice: { type: String, default: '' },
  view: { type: String, default: 'base' }
})

defineEmits(['open'])

// 「개통 준비」 행 같은 이동 불가 안내 — 기존 접근 토스트(2.5초)와 같은 모양.
const hallNotice = ref('')
let hallNoticeTimer

function showNotice(message) {
  hallNotice.value = message
  window.clearTimeout(hallNoticeTimer)
  hallNoticeTimer = window.setTimeout(() => {
    hallNotice.value = ''
  }, 2500)
}

onBeforeUnmount(() => window.clearTimeout(hallNoticeTimer))
</script>

<template>
  <section class="junction-shell">
    <HallLite
      v-if="view === 'lite'"
      :disabled-pages="disabledPages"
      @open="$emit('open', $event)"
      @notice="showNotice"
    />
    <HallBoard
      v-else
      :disabled-pages="disabledPages"
      @open="$emit('open', $event)"
      @notice="showNotice"
    />

    <p v-if="staticModeMessage" class="junction-note static-mode-note" role="status">{{ staticModeMessage }}</p>

    <p
      v-if="blogClosedNotice || hallNotice"
      class="junction-access-toast"
      :style="{ '--toast-x': '50%', '--toast-y': 'calc(100vh - 84px)' }"
      :data-blog-closed-notice="blogClosedNotice ? '' : undefined"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >{{ blogClosedNotice || hallNotice }}</p>
  </section>
</template>
