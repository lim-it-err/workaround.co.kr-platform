<script setup>
import { reactive, toRefs } from 'vue'
import StationHeader from '../StationHeader.vue'
import { findTaxiZone } from '../../composables/useTaxiSim.js'

const props = defineProps({
  // useTaxiSim() 의 반환값(상태·함수 묶음).
  sim: { type: Object, required: true },
  isTestRoute: { type: Boolean, default: false },
  simHubName: { type: String, required: true }
})
const emit = defineEmits(['open-page'])

function openPage(page) {
  emit('open-page', page)
}

const {
  taxiState,
  taxiManualOrigin,
  taxiManualDestination,
  taxiManualPassengers,
  taxiMessage,
  taxiZones,
  taxiFleet,
  taxiCompletedRequests,
  taxiRewardSummary,
  taxiDashboardMetrics,
  taxiZoneCards,
  taxiRequestQueue,
  submitManualTaxiRequest,
  addTaxiFleetUnit
} = toRefs(reactive(props.sim))

function formatSignedValue(value) {
  const numeric = Number(value || 0)
  return `${numeric >= 0 ? '+' : ''}${numeric}`
}

function formatTaxiEvent(entry) {
  return String(entry || '')
    .replaceAll('reward', '보상')
    .replaceAll('penalty', '패널티')
    .replaceAll(' -> ', ' → ')
}

function taxiStatusLabel(status) {
  return {
    idle: '대기',
    pending: '배차 대기',
    assigned: '배차됨',
    pickup: '승객에게 이동',
    dropoff: '목적지로 이동'
  }[status] || status
}
</script>

<template>
  <section class="feature-shell sim-tone-page taxi-tone-page">
    <StationHeader
      line-class="line-t"
      station-code="T01"
      title="심야 택시"
      status="실시간 운행"
      status-tone="live"
      summary="9구역 · 보상/패널티 누적"
      :prev-label="isTestRoute ? '← 환승 홀' : `← ${simHubName}`"
      :exit-label="isTestRoute ? '환승 홀로 나가기' : `${simHubName}으로 돌아가기`"
      @exit="openPage(isTestRoute ? 'junction' : 'simhub')"
    />
    <section class="station-lead taxi-timetable" aria-label="택시 실시간 지표">
      <div class="banner-stats">
        <article v-for="metric in taxiDashboardMetrics" :key="metric.label">
          <span>{{ metric.label }}</span>
          <strong class="num">{{ metric.value }}</strong>
        </article>
      </div>
    </section>

    <section class="section-block split-layout">
      <article class="surface-panel taxi-map-panel">
        <div class="section-head">
          <div>
            <h3>구역별 수요 지도</h3>
          </div>
          <span>9구역 흐름을 한눈에 관찰합니다.</span>
        </div>

        <div class="district-grid" aria-label="9구역 수요 시뮬레이션 캔버스">
          <article
            v-for="zone in taxiZoneCards"
            :key="zone.id"
            class="district-card"
            :class="zone.accent"
          >
            <div class="district-top">
              <strong>{{ zone.name }}</strong>
              <span>호출 {{ zone.pending }}</span>
            </div>
            <p>{{ zone.demandLabel }}</p>
            <small>인근 차량 {{ zone.nearbyFleet }} · 연결 구역 {{ zone.neighbors.length }}</small>
          </article>
        </div>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <h3>수동 호출 입력</h3>
          </div>
        </div>

        <div class="control-grid">
          <label class="input-block">
            <span>출발지</span>
            <select v-model="taxiManualOrigin" class="select-input">
              <option v-for="zone in taxiZones" :key="`${zone.id}-origin`" :value="zone.id">
                {{ zone.name }}
              </option>
            </select>
          </label>

          <label class="input-block">
            <span>도착지</span>
            <select v-model="taxiManualDestination" class="select-input">
              <option v-for="zone in taxiZones" :key="`${zone.id}-destination`" :value="zone.id">
                {{ zone.name }}
              </option>
            </select>
          </label>

          <label class="input-block">
            <span>인원수 {{ taxiManualPassengers }}</span>
            <input
              v-model="taxiManualPassengers"
              class="range-input"
              type="range"
              min="1"
              max="4"
            />
          </label>
        </div>

        <div class="queue-buttons">
          <button type="button" class="primary-button" @click="submitManualTaxiRequest">수동 호출 추가</button>
          <button type="button" class="ghost-button" @click="addTaxiFleetUnit">차량 1대 추가</button>
        </div>

        <div class="reward-grid">
          <article class="reward-card">
            <span>보상</span>
            <strong>{{ formatSignedValue(taxiRewardSummary.reward) }}</strong>
            <p>빠른 배차 = 보상</p>
          </article>
          <article class="reward-card">
            <span>패널티</span>
            <strong>{{ formatSignedValue(-taxiRewardSummary.penalty) }}</strong>
            <p>차량 추가 = 패널티</p>
          </article>
          <article class="reward-card">
            <span>순점수</span>
            <strong>{{ formatSignedValue(taxiRewardSummary.net) }}</strong>
            <p>보상 − 패널티 = 순점수</p>
          </article>
        </div>

        <p v-if="taxiMessage" class="status-copy ok">{{ taxiMessage }}</p>
      </article>
    </section>

    <section class="section-block split-layout">
      <article class="surface-panel">
        <div class="section-head">
          <div>
            <h3>차량 상태</h3>
          </div>
        </div>

        <div class="fleet-grid">
          <article v-for="cab in taxiFleet" :key="cab.id" class="fleet-card">
            <div class="fleet-top">
              <strong>{{ cab.id }}</strong>
              <span class="taxi-state-token" :data-label="taxiStatusLabel(cab.status)">{{ cab.status }}</span>
            </div>
            <p>{{ findTaxiZone(cab.zoneId)?.name }} → {{ findTaxiZone(cab.targetZoneId)?.name }}</p>
            <small>승객 {{ cab.passengerCount }} / {{ cab.seats }}명 · 남은 구간 {{ cab.route.length }}</small>
            <strong class="fleet-reward">{{ cab.assignedRequestId || '배차 대기' }}</strong>
          </article>
        </div>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <h3>진행 중 호출</h3>
          </div>
        </div>

        <div class="prototype-rule-list">
          <article v-for="request in taxiRequestQueue" :key="request.id" class="prototype-rule-card">
            <strong>
              {{ request.id }} ·
              <span class="taxi-state-token" :data-label="taxiStatusLabel(request.status)">{{ request.status }}</span>
            </strong>
            <p>
              {{ findTaxiZone(request.originId)?.name }} → {{ findTaxiZone(request.destinationId)?.name }}
              · {{ request.passengers }}명 · {{ request.assignedTaxiId || '배차 대기' }}
            </p>
          </article>
        </div>
      </article>
    </section>

    <section class="section-block split-layout">
      <article class="surface-panel">
        <div class="section-head">
          <div>
            <h3>최근 완료 호출</h3>
          </div>
        </div>

        <div class="prototype-rule-list">
          <article v-for="request in taxiCompletedRequests" :key="request.id" class="prototype-rule-card">
            <strong>{{ request.id }} · 보상 {{ formatSignedValue(request.reward) }}</strong>
            <p>
              대기 {{ request.waitSeconds }}초 · 운행 {{ request.tripSeconds }}초 ·
              {{ findTaxiZone(request.originId)?.name }} → {{ findTaxiZone(request.destinationId)?.name }}
            </p>
          </article>
        </div>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <h3>이벤트 로그</h3>
          </div>
        </div>

        <div class="arrival-log">
          <article v-for="entry in taxiState.eventLog" :key="entry">{{ formatTaxiEvent(entry) }}</article>
        </div>
      </article>
    </section>
  </section>
</template>
