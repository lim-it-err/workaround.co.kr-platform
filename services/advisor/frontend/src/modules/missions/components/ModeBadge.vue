<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { advisorMode, startModePolling, LOCAL_COMMAND } from '../store/advisorMode.js'

const open = ref(false)
let stop = null
onMounted(() => { stop = startModePolling() })
onBeforeUnmount(() => stop?.())

function description() {
  if (advisorMode.llm) return `내 맥의 백엔드가 ${advisorMode.profile === 'ollama' ? 'Ollama' : 'Claude'}로 리뷰합니다.`
  if (advisorMode.local) return '내 맥의 백엔드에 붙었지만 LLM은 꺼져 있어 연습 리뷰입니다.'
  return '이 화면은 브라우저 안 연습 리뷰입니다. 진짜 LLM 리뷰는 내 맥에서 실행하세요.'
}
</script>

<template>
  <div class="mode-badge" :class="{ llm: advisorMode.llm }">
    <button
      type="button"
      class="mode-badge__btn"
      :aria-expanded="open"
      aria-controls="mode-badge-detail"
      data-testid="mode-badge"
      @click="open = !open"
    >
      <span class="mode-badge__dot" aria-hidden="true"></span>{{ advisorMode.label }}
    </button>
    <div v-if="open" id="mode-badge-detail" class="mode-badge__detail" role="status">
      <p>{{ description() }}</p>
      <template v-if="!advisorMode.llm">
        <p>LLM 리뷰로 실행</p>
        <code class="mode-badge__cmd">{{ LOCAL_COMMAND }}</code>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mode-badge { position: relative; display: flex; justify-content: flex-end; margin-bottom: 6px; }
.mode-badge__btn {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px;
  border: 1px solid var(--line-strong); border-radius: 999px; background: var(--bg-soft);
  color: var(--fg-dim, var(--muted)); font: inherit; font-size: .875rem; cursor: pointer;
}
.mode-badge__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--muted); }
.llm .mode-badge__dot { background: var(--exit); }
.mode-badge__detail {
  position: absolute; top: 44px; right: 0; z-index: 5; width: min(320px, calc(100vw - 32px));
  padding: 12px 14px; border: 1px solid var(--line-strong); border-radius: var(--radius);
  word-break: keep-all;
  background: var(--panel); box-shadow: var(--shadow); font-size: .875rem;
}
.mode-badge__detail p { margin: 0 0 6px; }
.mode-badge__cmd {
  display: block; padding: 8px 10px; border-radius: 8px; background: var(--code-bg);
  color: var(--code-text); font-family: var(--font-mono); user-select: all; overflow-wrap: anywhere;
}
</style>
