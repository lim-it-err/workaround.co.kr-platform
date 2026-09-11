<script setup>
import { computed, ref } from 'vue'
import { VOYAGE } from '../../data/voyage.js'

const selectedCity = ref('')
const selectedBudget = ref('all')

const statusLabels = {
  current: '현재 채택',
  alternative: '유효 대안',
  superseded: '폐기 기록',
  reverify: '재확인'
}

const currentDecisions = computed(() => VOYAGE.decisionTrail.filter((item) => item.status === 'current'))
const alternativeDecisions = computed(() => VOYAGE.decisionTrail.filter((item) => ['alternative', 'reverify'].includes(item.status)))
const supersededDecisions = computed(() => VOYAGE.decisionTrail.filter((item) => item.status === 'superseded'))
const lodgingCities = computed(() => Array.from(new Set(VOYAGE.lodgingCandidates.map((item) => item.city))))
const cityCounts = computed(() => lodgingCities.value.map((city) => ({
  city,
  count: VOYAGE.lodgingCandidates.filter((item) => item.city === city).length,
  nights: VOYAGE.lodgingCandidates.find((item) => item.city === city)?.nights || 0
})))
const visibleCandidates = computed(() => {
  if (!selectedCity.value) return []
  return VOYAGE.lodgingCandidates.filter((item) => (
    item.city === selectedCity.value &&
    (selectedBudget.value === 'all' || item.tier === Number(selectedBudget.value))
  ))
})

function chooseCity(city) {
  selectedCity.value = city
}
</script>

<template>
  <section class="voyage-planning" aria-label="여행 설계 기록">
    <details class="section-block voyage-planning-section">
      <summary>
        <span>
          <small>ROUTE DECISIONS</small>
          <strong>왜 이 노선인가</strong>
        </span>
        <span aria-hidden="true">＋</span>
      </summary>

      <div class="planning-content">
        <p class="planning-lead">출국일 무운전과 동행 체력을 기준으로, 넓게 보되 회복 시간을 남겼습니다.</p>

        <div class="decision-grid">
          <article v-for="decision in currentDecisions" :key="decision.id" class="decision-card">
            <span class="status-chip" :class="`is-${decision.status}`">{{ statusLabels[decision.status] }}</span>
            <h4>{{ decision.choice }}</h4>
            <p>{{ decision.why }}</p>
          </article>
        </div>

        <section class="decision-alternatives" aria-labelledby="voyage-alternative-title">
          <h4 id="voyage-alternative-title">비교해 둔 선택</h4>
          <article v-for="decision in alternativeDecisions" :key="decision.id">
            <span class="status-chip" :class="`is-${decision.status}`">{{ statusLabels[decision.status] }}</span>
            <div>
              <strong>{{ decision.problem }}</strong>
              <p>{{ decision.choice }} {{ decision.why }}</p>
            </div>
          </article>
        </section>

        <details class="discarded-decisions">
          <summary>왜 버렸나 · {{ supersededDecisions.length }}개</summary>
          <div>
            <article v-for="decision in supersededDecisions" :key="decision.id">
              <strong>{{ decision.problem }}</strong>
              <p>{{ decision.why }}</p>
            </article>
          </div>
        </details>

        <div class="operation-strip" aria-label="현장 운영 판단">
          <article>
            <small>PACE</small>
            <strong>관광 1~2개</strong>
            <p>카페 휴식 60~90분</p>
          </article>
          <article>
            <small>DRIVE</small>
            <strong>2시간마다 정차</strong>
            <p>출국일은 운전 없음</p>
          </article>
          <article>
            <small>KEEP</small>
            <strong>크루즈·비엔나 카페</strong>
            <p>숙소→식비→입장료 순 절약</p>
          </article>
        </div>
      </div>
    </details>

    <details class="section-block voyage-planning-section">
      <summary>
        <span>
          <small>BUDGET OPTIONS</small>
          <strong>예산 4단계</strong>
        </span>
        <span aria-hidden="true">＋</span>
      </summary>

      <div class="planning-content">
        <p class="planning-lead">항공 340만 원 + 보험 포함 렌터카 110만 원을 고정비로 둔 2인 기준입니다.</p>
        <p class="source-warning"><b>{{ VOYAGE.sourceNote.label }}</b> · {{ VOYAGE.sourceNote.notice }}</p>

        <div class="budget-scenario-grid">
          <article
            v-for="scenario in VOYAGE.budgetScenarios"
            :key="scenario.id"
            :class="{ selected: scenario.total === VOYAGE.budget.plan, ceiling: scenario.total === VOYAGE.budget.ceiling }"
          >
            <div>
              <span>{{ scenario.total === VOYAGE.budget.ceiling ? '안전 상한' : `${scenario.total}안` }}</span>
              <span class="status-chip" :class="`is-${scenario.status}`">{{ statusLabels[scenario.status] }}</span>
            </div>
            <strong class="num">{{ scenario.total }}만원</strong>
            <dl>
              <div><dt>고정비</dt><dd>450</dd></div>
              <div><dt>숙소·주차</dt><dd>{{ scenario.lodgingParking }}</dd></div>
              <div><dt>변동비</dt><dd>{{ scenario.variable }}</dd></div>
              <div v-if="scenario.reserve"><dt>추가 예비</dt><dd>{{ scenario.reserve }}</dd></div>
            </dl>
            <p>{{ scenario.note }}</p>
          </article>
        </div>
      </div>
    </details>

    <details class="section-block voyage-planning-section">
      <summary>
        <span>
          <small>STAY SHORTLIST</small>
          <strong>도시별 숙소 후보</strong>
        </span>
        <span aria-hidden="true">＋</span>
      </summary>

      <div class="planning-content">
        <p class="planning-lead">확정 예약이 아닌 비교 보관함입니다. 도시를 고르면 후보 3개만 펼쳐집니다.</p>
        <p class="source-warning"><b>{{ VOYAGE.sourceNote.label }}</b> · 가격과 별점은 2026년 7월 추정이며 반드시 다시 확인하세요.</p>

        <div class="lodging-filters" aria-label="숙소 후보 필터">
          <label>
            <span>도시</span>
            <select v-model="selectedCity">
              <option value="">도시 선택</option>
              <option v-for="city in lodgingCities" :key="city" :value="city">{{ city }}</option>
            </select>
          </label>
          <label>
            <span>예산</span>
            <select v-model="selectedBudget">
              <option value="all">모든 예산</option>
              <option value="750">750안</option>
              <option value="800">800안</option>
              <option value="850">850안</option>
            </select>
          </label>
        </div>

        <div v-if="!selectedCity" class="lodging-city-grid">
          <button v-for="item in cityCounts" :key="item.city" type="button" @click="chooseCity(item.city)">
            <span>{{ item.city }}</span>
            <strong>{{ item.nights }}박 · {{ item.count }}개 후보</strong>
          </button>
        </div>

        <div v-else class="lodging-results">
          <div class="lodging-results-head">
            <div>
              <small>선택한 도시</small>
              <h4>{{ selectedCity }}</h4>
            </div>
            <button type="button" class="btn btn-ghost" @click="selectedCity = ''">도시 목록</button>
          </div>
          <article v-for="hotel in visibleCandidates" :key="hotel.id" class="lodging-card">
            <div class="lodging-card-head">
              <div>
                <span>{{ hotel.tier }}안 · {{ hotel.nights }}박</span>
                <h4>{{ hotel.name }}</h4>
              </div>
              <strong class="num">{{ hotel.priceRange }}</strong>
            </div>
            <p>{{ hotel.reason }}</p>
            <dl>
              <div><dt>주차</dt><dd>{{ hotel.parking }}</dd></div>
              <div><dt>엘리베이터</dt><dd>{{ hotel.elevator }}</dd></div>
              <div><dt>이동</dt><dd>{{ hotel.transit }}</dd></div>
              <div><dt>짐</dt><dd>{{ hotel.luggage }}</dd></div>
            </dl>
            <small class="lodging-caution">{{ hotel.caution }}</small>
          </article>
          <p v-if="!visibleCandidates.length" class="empty-result">이 조건의 후보는 없습니다.</p>
        </div>

        <a v-if="VOYAGE.sourceNote.url" class="source-link" :href="VOYAGE.sourceNote.url" target="_blank" rel="noreferrer">설계 대화 원문 보기</a>
      </div>
    </details>
  </section>
</template>

<style scoped>
.voyage-planning,
.planning-content,
.voyage-planning-section {
  min-width: 0;
}

.voyage-planning {
  display: grid;
  gap: 12px;
}

.voyage-planning-section {
  padding: 0;
  overflow: hidden;
}

.voyage-planning-section > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  list-style: none;
}

.voyage-planning-section > summary::-webkit-details-marker {
  display: none;
}

.voyage-planning-section > summary > span:first-child {
  display: grid;
  gap: 3px;
}

.voyage-planning-section > summary small,
.lodging-results-head small {
  color: var(--muted);
  font-size: var(--fs-caption);
  letter-spacing: 0.08em;
}

.voyage-planning-section > summary strong {
  color: var(--text);
  font-size: 1.08rem;
}

.voyage-planning-section > summary > span:last-child {
  color: var(--accent-text);
  font-size: 1.3rem;
  transition: transform 160ms ease;
}

.voyage-planning-section[open] > summary > span:last-child {
  transform: rotate(45deg);
}

.planning-content {
  display: grid;
  gap: 18px;
  padding: 0 20px 20px;
  border-top: 1px solid var(--line);
}

.planning-lead,
.source-warning {
  margin: 18px 0 0;
  color: var(--text-2);
  line-height: 1.65;
}

.source-warning {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--safety) 13%, var(--panel-2));
  font-size: 0.82rem;
}

.decision-grid,
.budget-scenario-grid,
.lodging-city-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.decision-card,
.budget-scenario-grid > article,
.lodging-card {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
}

.decision-card h4,
.lodging-card h4,
.lodging-results-head h4 {
  margin: 8px 0 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.decision-card p,
.decision-alternatives p,
.discarded-decisions p,
.operation-strip p,
.budget-scenario-grid p,
.lodging-card p {
  margin: 6px 0 0;
  color: var(--text-2);
  font-size: 0.84rem;
  line-height: 1.55;
}

.status-chip {
  display: inline-flex;
  width: fit-content;
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--panel);
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.status-chip.is-current { color: var(--accent-text); }
.status-chip.is-reverify { color: var(--safety); }

.decision-alternatives {
  display: grid;
  gap: 8px;
}

.decision-alternatives > h4 {
  margin: 0;
  color: var(--text);
}

.decision-alternatives > article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}

.decision-alternatives strong,
.discarded-decisions strong,
.operation-strip strong {
  color: var(--text);
}

.discarded-decisions {
  padding: 12px 14px;
  border: 1px dashed var(--line-strong);
  border-radius: 12px;
}

.discarded-decisions > summary {
  color: var(--text-2);
  font-weight: 800;
  cursor: pointer;
}

.discarded-decisions > div {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.operation-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.operation-strip article {
  padding: 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 9%, var(--panel-2));
}

.operation-strip small,
.budget-scenario-grid article > div > span:first-child,
.lodging-card-head span {
  color: var(--accent-text);
  font-size: var(--fs-caption);
  font-weight: 800;
}

.operation-strip strong {
  display: block;
  margin-top: 4px;
}

.budget-scenario-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.budget-scenario-grid > article.selected {
  border-color: var(--accent);
  box-shadow: inset 0 3px 0 var(--accent);
}

.budget-scenario-grid > article.ceiling {
  border-style: dashed;
}

.budget-scenario-grid article > div,
.lodging-card-head,
.lodging-results-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.budget-scenario-grid article > strong {
  display: block;
  margin: 12px 0;
  color: var(--text);
  font-size: 1.25rem;
}

.budget-scenario-grid dl,
.lodging-card dl {
  display: grid;
  gap: 7px;
  margin: 0;
}

.budget-scenario-grid dl > div,
.lodging-card dl > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.budget-scenario-grid dt,
.lodging-card dt {
  color: var(--muted);
}

.budget-scenario-grid dd,
.lodging-card dd {
  margin: 0;
  color: var(--text-2);
  text-align: right;
}

.lodging-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.lodging-filters label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: var(--fs-caption);
}

.lodging-filters select {
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  background: var(--panel-2);
  color: var(--text);
}

.lodging-city-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.lodging-city-grid button {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel-2);
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.lodging-city-grid button strong {
  color: var(--muted);
  font-size: 0.78rem;
}

.lodging-results {
  display: grid;
  gap: 10px;
}

.lodging-results-head h4 {
  font-size: 1.1rem;
}

.lodging-card-head > strong {
  max-width: 42%;
  color: var(--text);
  font-size: 0.86rem;
  text-align: right;
}

.lodging-card dl {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
  font-size: 0.8rem;
}

.lodging-caution,
.empty-result {
  display: block;
  margin-top: 12px;
  color: var(--safety);
}

.source-link {
  width: fit-content;
  color: var(--accent-text);
  font-size: 0.82rem;
  font-weight: 800;
}

@media (max-width: 760px) {
  .voyage-planning-section > summary,
  .planning-content {
    padding-right: 14px;
    padding-left: 14px;
  }

  .decision-grid,
  .budget-scenario-grid,
  .lodging-city-grid,
  .operation-strip,
  .lodging-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .decision-alternatives > article {
    grid-template-columns: minmax(0, 1fr);
  }

  .lodging-card-head {
    display: grid;
  }

  .lodging-card-head > strong {
    max-width: none;
    text-align: left;
  }

  .lodging-card dl > div {
    grid-template-columns: minmax(82px, 0.36fr) minmax(0, 1fr);
  }

  .lodging-card dd {
    overflow-wrap: anywhere;
  }
}

@media (prefers-reduced-motion: reduce) {
  .voyage-planning-section > summary > span:last-child {
    transition: none;
  }
}
</style>
