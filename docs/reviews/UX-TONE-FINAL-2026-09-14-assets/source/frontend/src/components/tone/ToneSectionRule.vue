<script setup>
defineProps({
  title: { type: String, required: true },
  headingLevel: {
    type: Number,
    default: 2,
    validator: (value) => [2, 3, 4].includes(value)
  }
})
</script>

<template>
  <section class="tone-section-rule">
    <header class="tone-section-rule__header">
      <span class="tone-section-rule__line" aria-hidden="true"></span>
      <component :is="`h${headingLevel}`">{{ title }}</component>
      <div v-if="$slots.actions" class="tone-section-rule__actions"><slot name="actions"></slot></div>
    </header>
    <div class="tone-section-rule__body"><slot></slot></div>
  </section>
</template>

<style scoped>
.tone-section-rule {
  min-width: 0;
}

.tone-section-rule__header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.09));
}

.tone-section-rule__line {
  width: 44px;
  height: 3px;
  background: var(--safety, #f3c544);
}

.tone-section-rule__header :is(h2, h3, h4) {
  margin: 0;
  color: var(--text, #f3f6fb);
  font-size: clamp(1.08rem, 2.5vw, 1.35rem);
  letter-spacing: -0.035em;
}

.tone-section-rule__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tone-section-rule__body {
  min-width: 0;
  padding-top: 6px;
}

@media (max-width: 480px) {
  .tone-section-rule__header {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .tone-section-rule__line {
    width: 30px;
  }

  .tone-section-rule__actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
