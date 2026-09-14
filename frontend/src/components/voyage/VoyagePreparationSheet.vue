<script setup>
import { computed, ref, watch } from 'vue'
import { voyageStorageKey } from '../../data/voyageStorage.js'

const props = defineProps({
  voyage: { type: Object, required: true }
})

const checklistKey = voyageStorageKey(props.voyage.id, 'checklist')
const checklist = computed(() => props.voyage.checklist || [])
const validIds = computed(() => new Set(checklist.value.map((item) => item.id)))

function readCheckedIds() {
  const defaults = checklist.value.filter((item) => item.done).map((item) => item.id)
  if (typeof window === 'undefined') return defaults
  try {
    const parsed = JSON.parse(window.localStorage.getItem(checklistKey) || '[]')
    if (!Array.isArray(parsed)) return defaults
    return [...new Set(defaults.concat(parsed.filter((id) => validIds.value.has(id))))]
  } catch (error) {
    return defaults
  }
}

const checkedIds = ref(readCheckedIds())
const checkedSet = computed(() => new Set(checkedIds.value))
const completedCount = computed(() => checkedIds.value.length)
const progress = computed(() => checklist.value.length
  ? Math.round(completedCount.value / checklist.value.length * 100)
  : 0)
const budgetItems = computed(() => props.voyage.budget?.items || [])
const budgetTotal = computed(() => budgetItems.value.reduce((sum, item) => sum + (item.amount || 0), 0))
const decisions = computed(() => props.voyage.decisionTrail || [])

watch(checkedIds, (nextIds) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(checklistKey, JSON.stringify(nextIds))
  }
}, { deep: true })

function setChecklistItem(id, checked) {
  const next = new Set(checkedIds.value)
  checked ? next.add(id) : next.delete(id)
  checkedIds.value = [...next]
}
</script>

<template>
  <section class="prep-sheet" aria-labelledby="voyage-prep-title">
    <header class="prep-sheet__heading">
      <div>
        <p>DAY 0 · 출발 전</p>
        <h3 id="voyage-prep-title">여행 준비</h3>
      </div>
      <strong>{{ completedCount }}/{{ checklist.length }}</strong>
    </header>

    <div
      class="prep-progress"
      role="progressbar"
      aria-label="출발 준비 진행률"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="progress"
    ><i :style="{ width: `${progress}%` }"></i></div>

    <section class="prep-section" aria-labelledby="prep-checklist-title">
      <h4 id="prep-checklist-title">출발 체크</h4>
      <div v-if="checklist.length" class="prep-checklist">
        <label
          v-for="item in checklist"
          :key="item.id"
          :class="{ done: checkedSet.has(item.id) }"
        >
          <input
            type="checkbox"
            :checked="checkedSet.has(item.id)"
            @change="setChecklistItem(item.id, $event.target.checked)"
          >
          <span aria-hidden="true">{{ checkedSet.has(item.id) ? '✓' : '' }}</span>
          <b>{{ item.label }}</b>
        </label>
      </div>
      <p v-else class="prep-empty">등록된 준비 항목이 없습니다.</p>
    </section>

    <div class="prep-grid">
      <section class="prep-section" aria-labelledby="prep-prepaid-title">
        <h4 id="prep-prepaid-title">사전 결제</h4>
        <dl v-if="voyage.prepaid?.length" class="prep-list">
          <div v-for="item in voyage.prepaid" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.amount.toLocaleString('ko-KR') }}만원</dd>
          </div>
        </dl>
        <p v-else class="prep-empty">사전 결제 기록이 없습니다.</p>
      </section>

      <section class="prep-section" aria-labelledby="prep-budget-title">
        <h4 id="prep-budget-title">예산</h4>
        <dl v-if="budgetItems.length" class="prep-list">
          <div v-for="item in budgetItems" :key="item.label">
            <dt>{{ item.label }} <small v-if="item.fixed">확정</small></dt>
            <dd>{{ item.amount.toLocaleString('ko-KR') }}만원</dd>
          </div>
          <div class="prep-list__total">
            <dt>합계</dt>
            <dd>{{ budgetTotal.toLocaleString('ko-KR') }}만원</dd>
          </div>
        </dl>
        <p v-else class="prep-empty">예산안이 아직 없습니다.</p>
      </section>
    </div>

    <section class="prep-section" aria-labelledby="prep-decisions-title">
      <h4 id="prep-decisions-title">결정 기록</h4>
      <div v-if="decisions.length" class="prep-decisions">
        <details v-for="decision in decisions" :key="decision.id">
          <summary>
            <span>{{ decision.choice }}</span>
            <small>{{ decision.status === 'current' ? '현재 채택' : decision.status === 'superseded' ? '폐기 기록' : '비교안' }}</small>
          </summary>
          <p><b>{{ decision.problem }}</b></p>
          <p>{{ decision.why }}</p>
        </details>
      </div>
      <p v-else class="prep-empty">결정 기록이 아직 없습니다.</p>
    </section>
  </section>
</template>

<style scoped>
.prep-sheet,
.prep-sheet > * {
  min-width: 0;
}

.prep-sheet {
  display: grid;
  gap: 20px;
}

.prep-sheet__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.prep-sheet__heading p,
.prep-sheet__heading h3,
.prep-section h4,
.prep-empty {
  margin: 0;
}

.prep-sheet__heading p {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
  letter-spacing: 0.08em;
}

.prep-sheet__heading h3 {
  margin-top: 3px;
  color: var(--text);
  font-size: clamp(1.3rem, 4vw, 1.7rem);
}

.prep-sheet__heading > strong {
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}

.prep-progress {
  height: 3px;
  overflow: hidden;
  background: var(--line);
}

.prep-progress i {
  display: block;
  height: 100%;
  background: var(--accent);
}

.prep-section {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.prep-section h4 {
  color: var(--text);
  font-size: 0.92rem;
}

.prep-checklist {
  display: grid;
  gap: 7px;
}

.prep-checklist label {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 44px;
  align-items: center;
  padding: 9px 0;
  color: var(--text-2);
  cursor: pointer;
}

.prep-checklist input {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  opacity: 0;
}

.prep-checklist span {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: #fff;
  font-size: 0.72rem;
}

.prep-checklist label.done span {
  border-color: var(--accent);
  background: var(--accent);
}

.prep-checklist label.done b {
  color: var(--muted);
  text-decoration: line-through;
}

.prep-checklist b {
  overflow-wrap: anywhere;
  font-size: 0.84rem;
  font-weight: 650;
  line-height: 1.5;
}

.prep-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.prep-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.prep-list > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}

.prep-list dt {
  color: var(--text-2);
  overflow-wrap: anywhere;
}

.prep-list dt small {
  color: var(--accent-text);
}

.prep-list dd {
  margin: 0;
  color: var(--text);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  text-align: right;
}

.prep-list__total {
  border-bottom: 0 !important;
}

.prep-list__total dt,
.prep-list__total dd {
  font-weight: 900;
}

.prep-decisions {
  display: grid;
  gap: 6px;
}

.prep-decisions details {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.prep-decisions summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  color: var(--text);
  font-weight: 750;
  cursor: pointer;
}

.prep-decisions summary span,
.prep-decisions p {
  overflow-wrap: anywhere;
}

.prep-decisions summary small,
.prep-empty {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.prep-decisions p {
  margin: 9px 0 0;
  color: var(--text-2);
  font-size: 0.82rem;
  line-height: 1.55;
}

@media (max-width: 600px) {
  .prep-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
