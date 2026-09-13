<script setup>
import { computed } from 'vue'
import StationHeader from './StationHeader.vue'
import { ToneScheduleRow, ToneSectionRule } from './tone/index.js'

const props = defineProps({
  voyages: { type: Array, required: true }
})

defineEmits(['exit', 'open-voyage'])

const currentVoyage = computed(() => props.voyages.find((voyage) => voyage.status === 'boarding') || null)
const pastVoyages = computed(() => props.voyages.filter((voyage) => voyage.status === 'arrived'))
const plannedVoyages = computed(() => props.voyages.filter((voyage) => voyage.status === 'planned'))

function formatPeriod(voyage) {
  if (voyage.period.approximate) {
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' })
      .format(new Date(`${voyage.period.start}T00:00:00`))
  }
  const formatter = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' })
  return `${formatter.format(new Date(`${voyage.period.start}T00:00:00`))}–${formatter.format(new Date(`${voyage.period.end}T00:00:00`))}`
}

function cityCount(voyage) {
  return Array.isArray(voyage.cities) ? voyage.cities.length : 0
}
</script>

<template>
  <section class="feature-shell line-v voyage-index">
    <StationHeader
      line-class="line-v"
      station-code="V"
      title="여행 목록"
      status="운행 기록"
      status-tone="ok"
      summary="여행 3건"
      @exit="$emit('exit')"
    />

    <section v-if="currentVoyage" class="voyage-current" aria-labelledby="current-voyage-title">
      <p class="voyage-current__status">지금 여행 중</p>
      <h3 id="current-voyage-title">{{ currentVoyage.title }}</h3>
      <p>{{ currentVoyage.summary }}</p>
      <dl>
        <div>
          <dt>기간</dt>
          <dd>{{ formatPeriod(currentVoyage) }}</dd>
        </div>
        <div>
          <dt>도시</dt>
          <dd>{{ cityCount(currentVoyage) }}곳</dd>
        </div>
      </dl>
      <div class="voyage-current__actions">
        <button type="button" class="primary-button" @click="$emit('open-voyage', currentVoyage.id, 'daily')">
          오늘 운행 안내
        </button>
        <button type="button" class="ghost-button" @click="$emit('open-voyage', currentVoyage.id, 'archive')">
          여행 기록
        </button>
      </div>
    </section>

    <ToneSectionRule title="지난 여행" class="voyage-list-section">
      <ToneScheduleRow
        v-for="voyage in pastVoyages"
        :key="voyage.id"
        :label="formatPeriod(voyage)"
        :value="voyage.title"
        :meta="`${cityCount(voyage)}개 도시 · 기록 보기`"
        interactive
        @select="$emit('open-voyage', voyage.id, 'archive')"
      />
    </ToneSectionRule>

    <ToneSectionRule v-if="plannedVoyages.length" title="예정된 여행" class="voyage-list-section is-muted">
      <ToneScheduleRow
        v-for="voyage in plannedVoyages"
        :key="voyage.id"
        :label="formatPeriod(voyage)"
        :value="voyage.title"
        :meta="`${cityCount(voyage)}개 도시 · 준비 중`"
        disabled
      />
    </ToneSectionRule>
  </section>
</template>

<style scoped>
.voyage-index {
  display: grid;
  gap: clamp(28px, 5vw, 52px);
}

.voyage-current {
  max-width: 840px;
  padding: 8px 0 8px clamp(20px, 3vw, 32px);
  border-left: 3px solid var(--accent, var(--line-v));
}

.voyage-current__status {
  margin: 0 0 8px;
  color: var(--accent-text, var(--line-v-text));
  font-size: 0.78rem;
  font-weight: 800;
}

.voyage-current h3 {
  margin: 0;
  font-size: clamp(1.8rem, 5vw, 3.4rem);
  letter-spacing: -0.055em;
}

.voyage-current > p:not(.voyage-current__status) {
  margin: 8px 0 22px;
  color: var(--text-2);
}

.voyage-current dl {
  max-width: 620px;
  margin: 0;
}

.voyage-current dl div {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 18px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

.voyage-current dt {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.voyage-current dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  text-align: right;
}

.voyage-current__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.voyage-list-section {
  max-width: 840px;
}

.voyage-list-section.is-muted {
  opacity: 0.58;
}

@media (max-width: 480px) {
  .voyage-current {
    padding-left: 18px;
  }

  .voyage-current dl div {
    grid-template-columns: 4rem minmax(0, 1fr);
  }

  .voyage-current__actions > * {
    flex: 1 1 100%;
  }
}
</style>
