<script setup>
import { SiteLoopSymbol } from '../tone/index.js'

defineProps({
  cells: { type: Array, required: true },
  phrase: { type: String, required: true },
  ticker: { type: String, default: '' },
  autoTransitionLabel: { type: String, required: true },
  prefersReducedMotion: { type: Boolean, default: false }
})
const emit = defineEmits(['replay'])
</script>

<template>
  <section class="splash-stage">
    <div class="splash-panel">
      <div class="splash-top">
        <SiteLoopSymbol size="large" />
        <div>
          <h1>workaround.co.kr</h1>
          <p class="splash-copy">곧 문이 열립니다</p>
        </div>
      </div>

      <div class="flap-board splash-flap-board" :class="{ 'reduced-motion': prefersReducedMotion }">
        <div class="flap-row splash-flap-row">
          <div class="flap-values" role="img" :aria-label="phrase">
            <span
              v-for="cell in cells"
              :key="cell.key"
              class="flap-cell line-w"
              :class="{ run: cell.isRunning && !prefersReducedMotion, settle: cell.isSettling }"
              :style="{ '--flap-duration': cell.durationMs }"
              aria-hidden="true"
            >
              <span class="flap-half flap-static flap-top"><b>{{ cell.topStatic }}</b></span>
              <span class="flap-half flap-static flap-bottom"><b>{{ cell.bottomStatic }}</b></span>
              <span class="flap-half flap-dynamic flap-top-flip"><b>{{ cell.topFlip }}</b></span>
              <span class="flap-half flap-dynamic flap-bottom-flip"><b>{{ cell.bottomFlip }}</b></span>
            </span>
          </div>
        </div>
      </div>

      <div class="ticker-strip splash-ticker-strip" aria-live="off">
        <span class="ticker-label">알림</span>
        <span class="ticker-copy">{{ ticker }}</span>
      </div>
    </div>

    <div class="splash-actions">
      <p>{{ autoTransitionLabel }}</p>
      <button type="button" class="ghost-button" @click="emit('replay')">다시 재생</button>
    </div>
  </section>
</template>
