<script setup>
// TKT-228: lite 화면 공용 틀 — 위 한 줄(workaround lite · crumb · ‹ 뒤로), 가운데 스크롤(slot), 아래 키 안내 줄.
// 색·글꼴은 .app-shell[data-view='lite'] 토큰만 쓴다.
defineProps({
  crumb: { type: String, required: true },
  keys: { type: String, default: 'Esc 뒤로' }
})
const emit = defineEmits(['back'])
</script>

<template>
  <section class="junction-overview lite-screen" :aria-label="crumb" data-lite-screen>
    <div class="lite-frame">
      <div class="lite-bar">
        <span class="lite-brand">workaround lite</span>
        <span class="lite-crumb" data-lite-crumb>{{ crumb }}</span>
        <button type="button" class="lite-back" data-lite-back @click="emit('back')">‹ 뒤로</button>
      </div>
      <div class="lite-scr" data-lite-scroll><slot /></div>
      <div class="lite-keys" data-lite-keys>{{ keys }}</div>
    </div>
  </section>
</template>

<style scoped>
.lite-screen {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  width: min(100%, 720px);
}

.lite-frame {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
  min-height: min(560px, 70vh);
  border: 1px solid var(--line);
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono), "D2Coding", "Noto Sans Mono CJK KR", "Apple SD Gothic Neo", monospace;
  line-height: 1.7;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.lite-bar {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px 10px;
  min-height: 44px;
  padding: 0 12px 0 16px;
  border-bottom: 1px dashed var(--line);
  color: var(--muted);
  font-size: 0.85rem;
}

.lite-brand {
  flex: none;
  white-space: nowrap;
}

.lite-crumb {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  line-height: 44px;
  color: var(--safety);
}

/* 375 폭: 윗줄은 crumb 한 줄만 남기고 「‹ 뒤로」는 같은 줄 오른쪽에 둔다 (TKT-234). */
@media (max-width: 559px) {
  .lite-brand {
    display: none;
  }
}

.lite-back {
  flex: none;
  min-height: 44px;
  min-width: 44px;
  margin-left: auto;
  padding: 0 12px;
  border: 1px solid var(--line);
  background: none;
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

.lite-back:hover,
.lite-back:focus-visible {
  color: var(--text);
  outline: 2px solid var(--text);
  outline-offset: 1px;
}

.lite-scr {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px;
}

.lite-keys {
  min-height: 36px;
  padding: 8px 16px;
  border-top: 1px dashed var(--line);
  color: var(--muted);
  font-size: 0.8rem;
}
</style>
