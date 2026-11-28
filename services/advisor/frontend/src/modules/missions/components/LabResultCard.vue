<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchLabResult, relativeTime } from '../store/labResult.js'

const props = defineProps({
  missionId: { type: String, required: true },
})

const data = ref(null)
const loading = ref(false)
let seq = 0

async function load(bust = false) {
  const my = ++seq
  loading.value = true
  const out = await fetchLabResult(props.missionId, { bust })
  if (my !== seq) return
  // 다시 불러오기가 실패해도 이미 보이던 결과는 지우지 않는다.
  if (out || !bust) data.value = out
  loading.value = false
}

onMounted(() => load())
watch(() => props.missionId, () => { data.value = null; load() })

const result = computed(() => data.value?.result ?? null)
const failedCases = computed(() => (result.value?.cases ?? []).filter((c) => c.status && c.status !== 'passed' && c.status !== 'skipped').slice(0, 5))
const summary = computed(() => {
  const r = result.value
  if (!r) return ''
  const parts = ['☁ 온라인 채점']
  parts.push(r.compiled === false ? '컴파일 실패' : `${r.passed}/${r.tests} 통과`)
  const when = relativeTime(r.gradedAt)
  if (when) parts.push(when)
  if (r.commit) parts.push(`커밋 ${String(r.commit).slice(0, 7)}`)
  return parts.join(' · ')
})
</script>

<template>
  <section v-if="result" class="lab-card" data-testid="lab-result" aria-label="온라인 채점 결과">
    <div class="lab-head">
      <strong class="lab-summary" :class="{ bad: result.compiled === false || result.passed < result.tests }">{{ summary }}</strong>
      <button class="btn lab-reload" type="button" :disabled="loading" @click="load(true)">다시 불러오기</button>
    </div>
    <ul v-if="failedCases.length" class="lab-fails">
      <li v-for="(c, i) in failedCases" :key="i">
        <span class="lab-case">{{ c.name }}</span>
        <span v-if="c.message" class="lab-msg dim">{{ String(c.message).split('\n')[0] }}</span>
      </li>
    </ul>
    <details v-if="result.compiled === false && result.buildTail" class="lab-more">
      <summary>빌드 로그 끝부분</summary>
      <pre>{{ result.buildTail }}</pre>
    </details>
    <details v-if="data.review" class="lab-more">
      <summary>Claude 리뷰 보기</summary>
      <pre class="lab-review">{{ data.review }}</pre>
    </details>
  </section>
</template>

<style scoped>
.lab-card { margin: 0 0 12px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-soft); }
.lab-head { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
.lab-summary { font-size: 14px; }
.lab-summary.bad { color: var(--bad); }
.lab-reload { min-height: 44px; }
.lab-fails { margin: 8px 0 0; padding-left: 18px; font-size: 13.5px; }
.lab-case { font-family: ui-monospace, monospace; margin-right: 8px; overflow-wrap: anywhere; }
.lab-msg { overflow-wrap: anywhere; }
.lab-more { margin-top: 8px; }
.lab-more summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; }
.lab-more pre { margin: 0; max-height: 320px; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12.5px; }
@media (max-width: 520px) { .lab-reload { width: 100%; } }
</style>
