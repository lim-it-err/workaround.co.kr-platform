<script setup>
import JunctionMap from '../JunctionMap.vue'

// TKT-211: App.vue 에서 떼어낸 환승 홀 섹션(노선도 + 정적 공개본 안내 + 닫힌 블로그 안내 토스트).
// 상태는 App 이 소유하고 props 로만 받는다. 페이지 이동은 open 이벤트로 올린다.
defineProps({
  disabledPages: { type: Array, default: () => [] },
  staticMode: { type: Boolean, default: false },
  staticModeMessage: { type: String, default: '' },
  blogClosedNotice: { type: String, default: '' }
})

defineEmits(['open'])
</script>

<template>
  <section class="junction-shell">
    <JunctionMap
      :disabled-pages="disabledPages"
      :static-mode="staticMode"
      @open="$emit('open', $event)"
    />

    <p v-if="staticModeMessage" class="junction-note static-mode-note" role="status">{{ staticModeMessage }}</p>

    <p
      v-if="blogClosedNotice"
      class="junction-access-toast"
      :style="{ '--toast-x': '50%', '--toast-y': 'calc(100vh - 84px)' }"
      data-blog-closed-notice
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >{{ blogClosedNotice }}</p>
  </section>
</template>
