<script setup>
import { computed, getCurrentInstance, ref } from 'vue'
import { downloadMissionZip } from '../utils/zip.js'

const props = defineProps({
  mission: { type: Object, required: true },
})

const CODESPACES_URL = 'https://codespaces.new/lim-it-err/workaround.co.kr-platform?quickstart=1&devcontainer_path=.devcontainer%2Fadvisor-lab%2Fdevcontainer.json'

const hasStarterTests = computed(() => (props.mission?.starterTests?.length ?? 0) > 0)
const command = computed(() => `tools/advisor-lab.sh ${props.mission.id} ${hasStarterTests.value ? 'easy' : 'hard'}`)
const guideId = `codespaces-guide-${getCurrentInstance()?.uid ?? 0}`
const open = ref(false)
const copyState = ref('')
const cmdEl = ref(null)

async function copyCommand() {
  try {
    await navigator.clipboard.writeText(command.value)
    copyState.value = '복사했어요'
  } catch {
    // clipboard 실패 — 텍스트를 선택해 직접 복사하도록 한다.
    const el = cmdEl.value
    if (el) {
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
    copyState.value = '선택했어요 — 복사하세요'
  }
}
</script>

<template>
  <div class="transfer-bar" data-testid="transfer-bar">
    <div class="transfer-row">
      <div v-if="hasStarterTests" class="transfer-levels">
        <button class="btn primary transfer-btn" @click="downloadMissionZip(mission, 'easy')">⬇ 이지 — 테스트 포함</button>
        <button class="btn transfer-btn" @click="downloadMissionZip(mission, 'hard')">⬇ 하드 — 테스트 직접</button>
      </div>
      <button v-else class="btn transfer-btn" @click="downloadMissionZip(mission)">⬇ 코드 전체 받기 (.zip)</button>
      <a
        class="btn transfer-btn transfer-link"
        :href="CODESPACES_URL"
        target="_blank"
        rel="noopener"
        :aria-expanded="open"
        :aria-controls="guideId"
        @click="open = true"
      >☁ Codespaces 에서 열기</a>
    </div>
    <div v-if="open" :id="guideId" class="transfer-guide" role="region" aria-label="Codespaces 안내">
      <p>Codespace 가 열리면 터미널에서</p>
      <div class="transfer-cmd">
        <code ref="cmdEl">{{ command }}</code>
        <button class="btn transfer-copy" type="button" @click="copyCommand">복사</button>
      </div>
      <p>구현 → <code>git push</code> 하면 Actions 가 채점합니다.</p>
      <p v-if="copyState" class="dim" role="status">{{ copyState }}</p>
    </div>
  </div>
</template>

<style scoped>
.transfer-bar { margin: 0 0 12px; }
.transfer-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
.transfer-levels { display: flex; gap: 8px; flex-wrap: wrap; }
.transfer-btn { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
.transfer-guide { margin-top: 8px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); font-size: 13.5px; }
.transfer-guide p { margin: 4px 0; }
.transfer-cmd { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 6px 0; }
.transfer-cmd code { padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; word-break: break-all; user-select: all; }
.transfer-copy { min-height: 44px; }
@media (max-width: 520px) {
  .transfer-row, .transfer-levels { flex-direction: column; width: 100%; }
  .transfer-btn { width: 100%; }
}
</style>
