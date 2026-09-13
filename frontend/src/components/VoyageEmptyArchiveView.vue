<script setup>
import StationHeader from './StationHeader.vue'

defineProps({
  voyage: { type: Object, required: true }
})

defineEmits(['exit'])
</script>

<template>
  <section class="feature-shell line-v voyage-empty-archive">
    <StationHeader
      line-class="line-v"
      station-code="V03"
      :title="voyage.title"
      status="지난 여행"
      status-tone="ok"
      summary="여행 기록"
      @exit="$emit('exit')"
    />
    <section class="voyage-empty-archive__body" :aria-label="`${voyage.title} 여행 기록`">
      <p>아직 정리된 여행 기록이 없습니다.</p>
    </section>
  </section>
</template>

<style scoped>
.voyage-empty-archive__body {
  max-width: 760px;
  padding: clamp(24px, 6vw, 64px) 0;
  border-bottom: 1px solid var(--line);
}

.voyage-empty-archive__body p {
  margin: 0;
  color: var(--text-2);
}
</style>
