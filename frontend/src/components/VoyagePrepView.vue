<script setup>
import { computed, ref, watch } from 'vue'
import StationHeader from './StationHeader.vue'
import VoyagePlanningSections from './voyage/VoyagePlanningSections.vue'
import { VOYAGE } from '../data/voyage.js'

defineEmits(['exit', 'open-daily', 'open-archive'])

const CHECKLIST_STORAGE_KEY = `workaround-voyage-checklist:${VOYAGE.id}`
const validChecklistIds = new Set(VOYAGE.checklist.map((item) => item.id))

function readChecklistState() {
  const defaults = VOYAGE.checklist.filter((item) => item.done).map((item) => item.id)
  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHECKLIST_STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) {
      return defaults
    }
    return Array.from(new Set(defaults.concat(parsed.filter((id) => validChecklistIds.has(id)))))
  } catch (error) {
    return defaults
  }
}

function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    ...options
  }).format(new Date(`${value}T00:00:00`))
}

const checkedIds = ref(readChecklistState())
const checkedSet = computed(() => new Set(checkedIds.value))
const completedCount = computed(() => checkedIds.value.length)
const checklistProgress = computed(() => Math.round((completedCount.value / VOYAGE.checklist.length) * 100))
const cityChain = computed(() => VOYAGE.subtitle.split(' → '))
const budgetTotal = computed(() => VOYAGE.budget.items.reduce((sum, item) => sum + item.amount, 0))
const budgetHeadroom = computed(() => VOYAGE.budget.ceiling - budgetTotal.value)
const flights = computed(() => [
  { direction: '출국', ...VOYAGE.flights.outbound },
  { direction: '귀국', ...VOYAGE.flights.inbound }
])

watch(checkedIds, (nextIds) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(nextIds))
  }
}, { deep: true })

function setChecklistItem(id, checked) {
  const nextIds = new Set(checkedIds.value)
  if (checked) {
    nextIds.add(id)
  } else {
    nextIds.delete(id)
  }
  checkedIds.value = Array.from(nextIds)
}
</script>

<template>
  <section class="feature-shell line-v voyage-prep">
    <StationHeader
      line-class="line-v"
      station-code="V01"
      title="여행 준비"
      title-en="VOYAGE"
      status="개찰구 앞"
      status-tone="ok"
      summary="체크리스트 · 일정 · 예산"
      @exit="$emit('exit')"
    >
      <template #actions>
        <button type="button" class="btn btn-ghost" @click="$emit('open-daily')">일일 안내</button>
        <button type="button" class="btn btn-ghost" @click="$emit('open-archive')">여행 기록</button>
      </template>
    </StationHeader>

    <section class="section-block voyage-overview" aria-labelledby="voyage-overview-title">
      <div class="voyage-title-row">
        <div>
          <p class="eyebrow">{{ VOYAGE.status }}</p>
          <h3 id="voyage-overview-title">{{ VOYAGE.title }}</h3>
        </div>
        <span class="voyage-period">
          {{ formatDate(VOYAGE.period.start, { year: 'numeric' }) }}–{{ formatDate(VOYAGE.period.end) }}
        </span>
      </div>

      <div class="voyage-metrics" aria-label="여정 요약">
        <article>
          <span>일정</span>
          <strong class="num">{{ VOYAGE.period.days }}일</strong>
          <small>{{ VOYAGE.period.nights }}박</small>
        </article>
        <article>
          <span>도시</span>
          <strong class="num">{{ cityChain.length }}</strong>
          <small>순환 여정</small>
        </article>
        <article>
          <span>준비</span>
          <strong class="num">{{ completedCount }}/{{ VOYAGE.checklist.length }}</strong>
          <small>{{ checklistProgress }}% 완료</small>
        </article>
        <article>
          <span>예산</span>
          <strong class="num">{{ budgetTotal }}만원</strong>
          <small>상한 {{ VOYAGE.budget.ceiling }}만원</small>
        </article>
      </div>

      <ol class="voyage-city-chain" aria-label="도시 순서">
        <li v-for="(city, index) in cityChain" :key="`${city}-${index}`">
          <span class="voyage-city-dot" aria-hidden="true"></span>
          <span>{{ city }}</span>
        </li>
      </ol>

      <div class="voyage-flight-grid">
        <article v-for="flight in flights" :key="flight.code" class="voyage-flight-card">
          <div class="voyage-flight-head">
            <span>{{ flight.direction }}</span>
            <strong>{{ flight.code }}</strong>
          </div>
          <p class="voyage-flight-route">
            <b>{{ flight.from }}</b>
            <span aria-hidden="true">→</span>
            <b>{{ flight.to }}</b>
          </p>
          <dl>
            <div>
              <dt>출발</dt>
              <dd>{{ formatDate(flight.date) }} {{ flight.dep }}</dd>
            </div>
            <div>
              <dt>도착</dt>
              <dd>{{ flight.arr }}</dd>
            </div>
          </dl>
          <small>{{ flight.note }}</small>
        </article>
      </div>
      <p class="voyage-rationale">{{ VOYAGE.flights.rationale }}</p>
    </section>

    <VoyagePlanningSections />

    <section class="section-block voyage-checklist" aria-labelledby="voyage-checklist-title">
      <div class="section-head voyage-section-head">
        <div>
          <p class="eyebrow">Before Boarding</p>
          <h3 id="voyage-checklist-title">출발 체크</h3>
        </div>
        <strong class="num">{{ completedCount }}/{{ VOYAGE.checklist.length }}</strong>
      </div>

      <div
        class="voyage-progress"
        role="progressbar"
        aria-label="출발 준비 진행률"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="checklistProgress"
      >
        <i :style="{ width: `${checklistProgress}%` }"></i>
      </div>

      <div class="voyage-checklist-list">
        <label
          v-for="item in VOYAGE.checklist"
          :key="item.id"
          class="voyage-check-item"
          :class="{ done: checkedSet.has(item.id) }"
        >
          <input
            type="checkbox"
            :checked="checkedSet.has(item.id)"
            @change="setChecklistItem(item.id, $event.target.checked)"
          >
          <span class="voyage-check-mark" aria-hidden="true"></span>
          <span>{{ item.label }}</span>
        </label>
      </div>
    </section>

    <section class="voyage-lower-grid">
      <section class="section-block voyage-budget" aria-labelledby="voyage-budget-title">
        <div class="section-head voyage-section-head">
          <div>
            <p class="eyebrow">Budget</p>
            <h3 id="voyage-budget-title">예산</h3>
          </div>
          <span>{{ VOYAGE.budget.unit }}</span>
        </div>

        <dl class="voyage-budget-list">
          <div v-for="item in VOYAGE.budget.items" :key="item.label">
            <dt>
              {{ item.label }}
              <small v-if="item.fixed">확정</small>
            </dt>
            <dd class="num">{{ item.amount }}</dd>
          </div>
        </dl>

        <div class="voyage-budget-summary">
          <div>
            <span>합계</span>
            <strong class="num">{{ budgetTotal }}만원</strong>
          </div>
          <div>
            <span>계획</span>
            <strong class="num">{{ VOYAGE.budget.plan }}만원</strong>
          </div>
          <div>
            <span>상한 여유</span>
            <strong class="num">{{ budgetHeadroom }}만원</strong>
          </div>
        </div>
        <p class="voyage-budget-note">{{ VOYAGE.budget.note }}</p>
      </section>

      <section class="section-block voyage-principles" aria-labelledby="voyage-principles-title">
        <div class="section-head voyage-section-head">
          <div>
            <p class="eyebrow">Operating Rules</p>
            <h3 id="voyage-principles-title">운영 원칙</h3>
          </div>
          <span>{{ VOYAGE.principles.length }}개</span>
        </div>

        <div class="voyage-principle-list">
          <article v-for="(principle, index) in VOYAGE.principles" :key="principle.key">
            <span class="num">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ principle.label }}</strong>
              <p>{{ principle.text }}</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  </section>
</template>

<style scoped>
.voyage-prep {
  min-width: 0;
}

.voyage-overview {
  display: grid;
  gap: 18px;
  box-shadow: inset 0 4px 0 var(--accent);
}

.voyage-title-row,
.voyage-flight-head,
.voyage-budget-summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.voyage-title-row h3 {
  margin: 0;
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.voyage-period {
  color: var(--accent-text);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.voyage-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.voyage-metrics article {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel-2);
}

.voyage-metrics span,
.voyage-metrics small,
.voyage-flight-card small,
.voyage-flight-card dt,
.voyage-budget-summary span {
  color: var(--muted);
  font-size: var(--fs-caption);
}

.voyage-metrics strong {
  color: var(--text);
  font-size: clamp(1.2rem, 2.5vw, 1.7rem);
}

.voyage-city-chain {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 0;
  padding: 13px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--accent) 8%, var(--panel-2));
  list-style: none;
}

.voyage-city-chain li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-2);
  font-size: 0.84rem;
}

.voyage-city-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border: 2px solid var(--accent);
  border-radius: 50%;
  background: var(--panel);
}

.voyage-flight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.voyage-flight-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel-2);
}

.voyage-flight-head span {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
}

.voyage-flight-route {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: var(--text);
  font-size: 1.15rem;
}

.voyage-flight-route span {
  color: var(--accent-text);
}

.voyage-flight-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.voyage-flight-card dl div {
  display: grid;
  gap: 2px;
}

.voyage-flight-card dd {
  margin: 0;
  color: var(--text);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}

.voyage-rationale,
.voyage-budget-note {
  margin: 0;
  color: var(--text-2);
  font-size: 0.86rem;
}

.voyage-section-head {
  align-items: center;
}

.voyage-section-head strong {
  color: var(--accent-text);
  font-size: 1.15rem;
}

.voyage-progress {
  height: 6px;
  overflow: hidden;
  margin-bottom: 14px;
  border-radius: 999px;
  background: var(--panel-2);
}

.voyage-progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 180ms ease;
}

.voyage-checklist-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.voyage-check-item {
  position: relative;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
  color: var(--text-2);
  cursor: pointer;
}

.voyage-check-item input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.voyage-check-mark {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  background: var(--panel);
}

.voyage-check-item input:focus-visible + .voyage-check-mark {
  outline: 2px solid var(--safety);
  outline-offset: 2px;
}

.voyage-check-item.done {
  border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
  background: color-mix(in srgb, var(--accent) 10%, var(--panel-2));
  color: var(--muted);
}

.voyage-check-item.done .voyage-check-mark {
  border-color: var(--accent);
  background: var(--accent);
}

.voyage-check-item.done .voyage-check-mark::after {
  content: '✓';
  color: #fff;
  font-size: 0.78rem;
  font-weight: 900;
}

.voyage-check-item.done > span:last-child {
  text-decoration: line-through;
  text-decoration-thickness: 1px;
}

.voyage-lower-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
  min-width: 0;
}

.voyage-budget-list {
  display: grid;
  gap: 0;
  margin: 0;
}

.voyage-budget-list > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
}

.voyage-budget-list dt {
  color: var(--text-2);
}

.voyage-budget-list dt small {
  margin-left: 6px;
  color: var(--accent-text);
  font-size: 0.68rem;
}

.voyage-budget-list dd {
  margin: 0;
  color: var(--text);
  font-weight: 800;
}

.voyage-budget-summary {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 10%, var(--panel-2));
}

.voyage-budget-summary strong {
  color: var(--text);
}

.voyage-budget-note {
  margin-top: 12px;
}

.voyage-principle-list {
  display: grid;
  gap: 8px;
}

.voyage-principle-list article {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}

.voyage-principle-list article:last-child {
  border-bottom: 0;
}

.voyage-principle-list article > span {
  color: var(--accent-text);
  font-weight: 800;
}

.voyage-principle-list strong {
  color: var(--text);
}

.voyage-principle-list p {
  margin: 4px 0 0;
  color: var(--text-2);
  font-size: 0.86rem;
}

@media (max-width: 760px) {
  .voyage-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .voyage-metrics,
  .voyage-flight-grid,
  .voyage-checklist-list,
  .voyage-lower-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .voyage-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .voyage-city-chain {
    gap: 6px 12px;
    padding: 12px;
  }

  .voyage-check-item {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .voyage-progress i {
    transition: none;
  }
}
</style>
