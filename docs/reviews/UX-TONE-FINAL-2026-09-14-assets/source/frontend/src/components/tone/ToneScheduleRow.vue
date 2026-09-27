<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, default: '' },
  meta: { type: String, default: '' },
  interactive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['select'])

function selectRow() {
  if (props.interactive && !props.disabled) {
    emit('select')
  }
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="tone-schedule-row"
    :class="{ 'is-interactive': interactive }"
    :type="interactive ? 'button' : undefined"
    :disabled="interactive ? disabled : undefined"
    @click="selectRow"
  >
    <span class="tone-schedule-row__label"><slot name="label">{{ label }}</slot></span>
    <span class="tone-schedule-row__value">
      <slot>{{ value }}</slot>
      <small v-if="meta">{{ meta }}</small>
    </span>
  </component>
</template>

<style scoped>
.tone-schedule-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(7rem, 0.42fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
  padding: 13px 0;
  border: 0;
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.09));
  border-radius: 0;
  background: transparent;
  color: var(--text, #f3f6fb);
  text-align: left;
}

.tone-schedule-row__label {
  color: var(--muted, #7c8aa0);
  font-size: 0.78rem;
  font-weight: 700;
}

.tone-schedule-row__value {
  min-width: 0;
  display: grid;
  justify-items: end;
  color: var(--text, #f3f6fb);
  font-weight: 750;
  overflow-wrap: anywhere;
  text-align: right;
}

.tone-schedule-row__value small {
  color: var(--muted, #7c8aa0);
  font-size: 0.72rem;
  font-weight: 500;
}

.tone-schedule-row.is-interactive {
  cursor: pointer;
}

.tone-schedule-row.is-interactive:hover,
.tone-schedule-row.is-interactive:focus-visible {
  border-bottom-color: var(--safety, #f3c544);
}

.tone-schedule-row:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

@media (max-width: 480px) {
  .tone-schedule-row {
    grid-template-columns: minmax(5.5rem, 0.38fr) minmax(0, 1fr);
    gap: 12px;
  }
}
</style>
