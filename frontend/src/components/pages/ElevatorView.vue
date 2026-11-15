<script setup>
import { reactive, toRefs } from 'vue'
import StationHeader from '../StationHeader.vue'
import ElevatorCrossSection from '../ElevatorCrossSection.vue'

const props = defineProps({
  // useElevatorSim() 의 반환값(상태·함수 묶음).
  sim: { type: Object, required: true },
  isStaticMode: { type: Boolean, default: false },
  isTestRoute: { type: Boolean, default: false },
  simHubName: { type: String, required: true }
})
const emit = defineEmits(['open-page'])

function openPage(page) {
  emit('open-page', page)
}

const {
  elevatorSummary,
  elevatorDemand,
  elevatorCars,
  elevatorBuilding,
  elevatorFloorRows,
  elevatorAverageWaitSeconds,
  elevatorEvents,
  elevatorCarCount,
  elevatorTickerOpen,
  demandPreset,
  demandIntensity,
  applyDemandPreset,
  updateDemandIntensity,
  updateElevatorCarCount,
  addPassengerAtFloor,
  resetElevator
} = toRefs(reactive(props.sim))
</script>

<template>
  <section class="feature-shell sim-tone-page elevator-tone-page">
    <p v-if="isStaticMode" class="static-preview-hairline" role="status">
      정적 공개본 — 서버 시뮬은 준비 중, 화면만 봅니다
    </p>
    <StationHeader
      line-class="line-e"
      station-code="E01"
      title="멈춘 엘리베이터"
      :status="isStaticMode ? '화면 미리보기' : '실시간 운행'"
      :status-tone="isStaticMode ? 'warn' : 'live'"
      :summary="isStaticMode ? `23층 · 승강기 ${elevatorCars.length}대 · 정지 상태 미리보기` : `23층 · 승강기 ${elevatorCars.length}대 · 정원 20명`"
      :prev-label="isTestRoute ? '← 환승 홀' : `← ${simHubName}`"
      :exit-label="isTestRoute ? '환승 홀로 나가기' : `${simHubName}으로 돌아가기`"
      @exit="openPage(isTestRoute ? 'junction' : 'simhub')"
    />

    <section
      class="section-block elevator-live-layout line-e"
      :class="{ 'static-sim-preview': isStaticMode }"
      :inert="isStaticMode ? '' : null"
      :aria-disabled="isStaticMode ? 'true' : undefined"
    >
      <ElevatorCrossSection
        :cars="elevatorCars"
        :floors="elevatorFloorRows"
        :min-floor="elevatorBuilding.minFloor"
        :max-floor="elevatorBuilding.maxFloor"
        @add-passenger="addPassengerAtFloor"
      />

      <aside class="elevator-control-panel">
        <div class="elevator-metrics" aria-label="엘리베이터 실시간 지표">
          <article>
            <span>대기</span>
            <strong class="num">{{ elevatorSummary.waitingPassengers }}</strong>
          </article>
          <article>
            <span>탑승</span>
            <strong class="num">{{ elevatorSummary.onboardPassengers }}</strong>
          </article>
          <article>
            <span>이동 중</span>
            <strong class="num">{{ elevatorSummary.movingElevators }}</strong>
          </article>
          <article>
            <span>평균 대기</span>
            <strong class="num">{{ elevatorAverageWaitSeconds }}초</strong>
          </article>
        </div>

        <section class="elevator-demand-panel">
          <div class="section-head compact">
            <h3>수요</h3>
            <span>{{ elevatorDemand.presetLabel }}</span>
          </div>
          <div class="preset-row elevator-presets">
            <button
              v-for="preset in [
                { id: 'quiet', label: '한산' },
                { id: 'normal', label: '보통' },
                { id: 'busy', label: '혼잡' }
              ]"
              :key="preset.id"
              type="button"
              class="chip-button"
              :class="{ active: demandPreset === preset.id }"
              @click="applyDemandPreset(preset.id)"
            >
              {{ preset.label }}
            </button>
          </div>
        </section>

        <details class="elevator-advanced">
          <summary>고급 설정</summary>
          <div class="control-grid">
            <label class="input-block">
              <span>강도 {{ demandIntensity }}</span>
              <input
                class="range-input"
                type="range"
                min="0"
                max="100"
                :value="demandIntensity"
                @change="updateDemandIntensity($event.target.value)"
              />
            </label>
            <label class="input-block">
              <span>승강기 수 {{ elevatorCarCount }}</span>
              <input
                class="range-input"
                type="range"
                min="2"
                max="6"
                :value="elevatorCarCount"
                @change="updateElevatorCarCount($event.target.value)"
              />
            </label>
            <button type="button" class="ghost-button" @click="resetElevator">초기화</button>
          </div>
        </details>

        <details
          class="elevator-event-panel"
          :open="elevatorTickerOpen"
          @toggle="elevatorTickerOpen = $event.target.open"
        >
          <summary>최근 운행 <span>최대 8건</span></summary>
          <div class="elevator-event-list">
            <article v-for="(entry, index) in elevatorEvents" :key="`${entry}-${index}`">
              <span class="live-dot" aria-hidden="true"></span>
              {{ entry }}
            </article>
          </div>
        </details>
      </aside>
    </section>
  </section>
</template>
