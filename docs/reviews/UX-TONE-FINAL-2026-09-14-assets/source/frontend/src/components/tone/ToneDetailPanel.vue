<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  closeLabel: { type: String, default: '상세 닫기' }
})

const emit = defineEmits(['update:open', 'close'])
const panel = ref(null)
const closeButton = ref(null)
const titleId = `tone-detail-title-${useId()}`
let returnFocus = null

watch(
  () => props.open,
  async (isOpen) => {
    await nextTick()
    if (!panel.value) {
      return
    }
    if (isOpen && !panel.value.open) {
      returnFocus = document.activeElement
      panel.value.showModal()
      closeButton.value?.focus()
    } else if (!isOpen && panel.value.open) {
      panel.value.close()
      restoreFocus()
    }
  },
  { immediate: true }
)

function requestClose() {
  emit('update:open', false)
  emit('close')
}

function closeFromBackdrop(event) {
  if (event.target === panel.value) {
    requestClose()
  }
}

function restoreFocus() {
  if (returnFocus instanceof HTMLElement) {
    returnFocus.focus()
  }
  returnFocus = null
}

onBeforeUnmount(() => {
  if (panel.value?.open) {
    panel.value.close()
  }
  restoreFocus()
})
</script>

<template>
  <dialog
    ref="panel"
    class="tone-detail-panel"
    :aria-labelledby="titleId"
    @cancel.prevent="requestClose"
    @click="closeFromBackdrop"
  >
    <section class="tone-detail-panel__body">
      <header class="tone-detail-panel__header">
        <h2 :id="titleId">{{ title }}</h2>
        <button ref="closeButton" type="button" class="tone-detail-panel__close" @click="requestClose">
          {{ closeLabel }}
        </button>
      </header>
      <div class="tone-detail-panel__content"><slot></slot></div>
      <footer v-if="$slots.actions" class="tone-detail-panel__actions"><slot name="actions"></slot></footer>
    </section>
  </dialog>
</template>

<style scoped>
.tone-detail-panel {
  width: min(460px, 100%);
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0 0 0 auto;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--line-strong, rgba(255, 255, 255, 0.16));
  background: var(--bg, #0d131c);
  color: var(--text, #f3f6fb);
  box-shadow: -18px 0 48px rgba(2, 6, 12, 0.42);
}

.tone-detail-panel::backdrop {
  background: rgba(3, 7, 12, 0.64);
}

.tone-detail-panel__body {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.tone-detail-panel__header,
.tone-detail-panel__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.09));
}

.tone-detail-panel__header h2 {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: -0.035em;
}

.tone-detail-panel__close {
  flex: none;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--line-strong, rgba(255, 255, 255, 0.16));
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.tone-detail-panel__content {
  min-width: 0;
  overflow: auto;
  padding: 18px 20px 28px;
}

.tone-detail-panel__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  border-top: 1px solid var(--line, rgba(255, 255, 255, 0.09));
  border-bottom: 0;
}

@media (max-width: 700px) {
  .tone-detail-panel {
    width: 100%;
    height: auto;
    max-height: min(84dvh, 720px);
    margin: auto 0 0;
    border-top: 1px solid var(--line-strong, rgba(255, 255, 255, 0.16));
    border-left: 0;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -18px 48px rgba(2, 6, 12, 0.42);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .tone-detail-panel[open] {
    animation: tone-panel-in 180ms ease-out both;
  }

  @keyframes tone-panel-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
}

@media (max-width: 700px) and (prefers-reduced-motion: no-preference) {
  .tone-detail-panel[open] {
    animation-name: tone-sheet-in;
  }

  @keyframes tone-sheet-in {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
}
</style>
