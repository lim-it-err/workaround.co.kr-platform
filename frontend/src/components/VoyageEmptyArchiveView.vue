<script setup>
defineProps({
  voyage: { type: Object, required: true }
})

defineEmits(['back', 'exit'])
</script>

<template>
  <section class="feature-shell line-v voyage-empty-archive">
    <nav class="voyage-empty-archive__nav" aria-label="여행 이동">
      <button type="button" class="ghost-button" @click="$emit('back')">← 여행 목록</button>
      <button type="button" class="ghost-button" @click="$emit('exit')">홈으로</button>
    </nav>
    <header>
      <p>지난 여행</p>
      <h2>{{ voyage.title }}</h2>
    </header>
    <section class="voyage-empty-archive__body" :aria-label="`${voyage.title} 여행 기록`">
      <p>아직 정리된 여행 기록이 없습니다.</p>
    </section>
  </section>
</template>

<style scoped>
.voyage-empty-archive__nav {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.voyage-empty-archive > header {
  padding: clamp(28px, 6vw, 58px) 0 18px;
}

.voyage-empty-archive > header p,
.voyage-empty-archive > header h2 {
  margin: 0;
}

.voyage-empty-archive > header p {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
}

.voyage-empty-archive > header h2 {
  margin-top: 6px;
  color: var(--text);
  font-size: clamp(2rem, 7vw, 4rem);
  letter-spacing: -0.055em;
}

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
