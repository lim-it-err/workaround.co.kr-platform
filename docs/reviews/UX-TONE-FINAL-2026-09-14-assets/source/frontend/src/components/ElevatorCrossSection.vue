<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  cars: { type: Array, default: () => [] },
  floors: { type: Array, default: () => [] },
  minFloor: { type: Number, default: 1 },
  maxFloor: { type: Number, default: 23 }
})

const emit = defineEmits(['add-passenger'])
const floorPulses = ref({})
const boardingAbsorptions = ref([])
const pulseTimers = new Map()
const absorptionTimers = new Map()
let hasOnboardSnapshot = false
let seenOnboardPassengerIds = new Set()

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function positionPercent(position) {
  const span = Math.max(props.maxFloor - props.minFloor, 1)
  const normalized = (props.maxFloor - Number(position ?? props.minFloor)) / span
  return 2 + clamp(normalized, 0, 1) * 96
}

function floorPercent(floor) {
  return positionPercent(floor)
}

function waitingCount(row) {
  return Number(row.up || 0) + Number(row.down || 0)
}

function directionGlyph(direction) {
  if (direction === 'up') return '▲'
  if (direction === 'down') return '▼'
  return ''
}

function isDesktopLabel(floor) {
  return floor === props.maxFloor || floor === props.minFloor || (floor - props.minFloor) % 4 === 0
}

function isMobileLabel(floor) {
  return floor === props.maxFloor || floor === props.minFloor || (floor - props.minFloor) % 6 === 0
}

function addPassenger(floor) {
  const midpoint = (props.minFloor + props.maxFloor) / 2
  const direction = floor >= props.maxFloor ? 'down' : floor <= props.minFloor ? 'up' : floor > midpoint ? 'down' : 'up'

  floorPulses.value = { ...floorPulses.value, [floor]: true }
  window.clearTimeout(pulseTimers.get(floor))
  pulseTimers.set(floor, window.setTimeout(() => {
    const nextPulses = { ...floorPulses.value }
    delete nextPulses[floor]
    floorPulses.value = nextPulses
    pulseTimers.delete(floor)
  }, 650))

  emit('add-passenger', { floor, direction })
}

function passengerKey(passenger, carId, index) {
  return String(passenger.id || `${carId}-${passenger.originFloor}-${passenger.destinationFloor}-${passenger.boardedAtTick}-${index}`)
}

function showBoardingAbsorption(passenger, carIndex, carCount, passengerId) {
  const floor = Number(passenger.originFloor)
  if (!Number.isFinite(floor)) return

  const id = `${passengerId}-${carIndex}`
  const targetPercent = ((carIndex + 0.5) / Math.max(carCount, 1)) * 100
  boardingAbsorptions.value = [
    ...boardingAbsorptions.value.filter((entry) => entry.id !== id),
    { id, floor, targetPercent }
  ]

  window.clearTimeout(absorptionTimers.get(id))
  absorptionTimers.set(id, window.setTimeout(() => {
    boardingAbsorptions.value = boardingAbsorptions.value.filter((entry) => entry.id !== id)
    absorptionTimers.delete(id)
  }, 120))
}

watch(
  () => props.cars,
  (cars) => {
    const currentPassengerIds = new Set()
    cars.forEach((car, carIndex) => {
      const passengers = car.passengers || []
      passengers.forEach((passenger, passengerIndex) => {
        const id = passengerKey(passenger, car.id, passengerIndex)
        currentPassengerIds.add(id)
        if (hasOnboardSnapshot && !seenOnboardPassengerIds.has(id)) {
          showBoardingAbsorption(passenger, carIndex, cars.length, id)
        }
      })
    })

    seenOnboardPassengerIds = currentPassengerIds
    hasOnboardSnapshot = true
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  pulseTimers.forEach((timer) => window.clearTimeout(timer))
  pulseTimers.clear()
  absorptionTimers.forEach((timer) => window.clearTimeout(timer))
  absorptionTimers.clear()
})
</script>

<template>
  <section class="elevator-cross-section" aria-label="23층 엘리베이터 수직 단면">
    <div
      class="elevator-cross-section__headers"
      :style="{ gridTemplateColumns: `var(--floor-label) var(--queue-width) repeat(${Math.max(cars.length, 1)}, minmax(0, 1fr))` }"
    >
      <span>층</span>
      <span>대기</span>
      <strong v-for="car in cars" :key="`${car.id}-label`">{{ car.id }}</strong>
    </div>

    <div class="elevator-cross-section__stage">
      <button
        v-for="row in floors"
        :key="row.floor"
        type="button"
        class="elevator-floor-target"
        :class="{ hotspot: waitingCount(row) >= 8 }"
        :style="{
          top: `${floorPercent(row.floor)}%`,
          gridTemplateColumns: `var(--floor-label) var(--queue-width) minmax(0, 1fr)`
        }"
        :aria-label="`${row.floor}층에 승객 1명 추가`"
        @click="addPassenger(row.floor)"
      >
        <span class="elevator-floor-label floor-label-desktop" :class="{ visible: isDesktopLabel(row.floor) }">{{ row.floor }}F</span>
        <span class="elevator-floor-label floor-label-mobile" :class="{ visible: isMobileLabel(row.floor) }">{{ row.floor }}F</span>
        <span class="elevator-waiting-dots" :aria-label="`대기 ${waitingCount(row)}명`">
          <i v-for="index in Math.min(waitingCount(row), 5)" :key="`${row.floor}-waiting-${index}`"></i>
          <i v-if="floorPulses[row.floor]" class="is-new"></i>
          <small v-if="waitingCount(row) > 5">+{{ waitingCount(row) - 5 }}</small>
        </span>
        <span class="elevator-floor-line"></span>
      </button>

      <div class="elevator-boarding-layer" aria-hidden="true">
        <i
          v-for="absorption in boardingAbsorptions"
          :key="absorption.id"
          class="elevator-boarding-dot"
          :style="{
            top: `${floorPercent(absorption.floor)}%`,
            '--absorb-target': `${absorption.targetPercent}%`
          }"
        ></i>
      </div>

      <div
        class="elevator-shaft-grid"
        :style="{ gridTemplateColumns: `repeat(${Math.max(cars.length, 1)}, minmax(0, 1fr))` }"
        aria-hidden="true"
      >
        <div v-for="car in cars" :key="car.id" class="elevator-shaft">
          <div class="elevator-car" :class="{ moving: car.status === 'moving' }" :style="{ top: `${positionPercent(car.position ?? car.currentFloor)}%` }">
            <span class="elevator-car-direction">{{ directionGlyph(car.status === 'idle' ? 'idle' : car.direction) }}</span>
            <strong class="num">{{ car.currentLoad || 0 }}</strong>
            <small>{{ car.id }}</small>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.elevator-cross-section {
  --floor-label: 54px;
  --queue-width: 92px;
  display: grid;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--panel);
  overflow: hidden;
}

.elevator-cross-section__headers {
  display: grid;
  align-items: center;
  gap: 0;
  min-height: 28px;
  color: var(--muted);
  font-size: var(--fs-caption);
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.elevator-cross-section__headers strong {
  color: var(--line-e-text);
}

.elevator-cross-section__stage {
  position: relative;
  height: min(70vh, 700px);
  min-height: 510px;
}

.elevator-floor-target {
  position: absolute;
  z-index: 1;
  left: 0;
  width: 100%;
  height: 28px;
  padding: 0;
  border: 0;
  color: var(--text-2);
  background: transparent;
  display: grid;
  align-items: center;
  transform: translateY(-50%);
  cursor: pointer;
}

.elevator-floor-target:hover .elevator-floor-line,
.elevator-floor-target:focus-visible .elevator-floor-line {
  border-color: color-mix(in srgb, var(--line-e) 70%, transparent);
}

.elevator-floor-target.hotspot .elevator-floor-line {
  border-color: color-mix(in srgb, var(--safety) 68%, transparent);
}

.elevator-floor-label {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  opacity: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.elevator-floor-label.visible {
  opacity: 1;
}

.floor-label-mobile {
  display: none;
}

.elevator-waiting-dots {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  min-width: 0;
}

.elevator-waiting-dots i {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--text-2);
}

.elevator-floor-target.hotspot .elevator-waiting-dots i {
  background: var(--safety);
}

.elevator-waiting-dots i.is-new {
  background: var(--line-e);
  animation: passenger-arrives 0.6s ease-out;
}

.elevator-waiting-dots small {
  color: var(--safety);
  font-family: var(--font-mono);
  font-size: 0.68rem;
}

.elevator-floor-line {
  grid-column: 3;
  width: 100%;
  border-top: 1px solid var(--line);
}

.elevator-boarding-layer {
  position: absolute;
  z-index: 3;
  inset: 0 0 0 calc(var(--floor-label) + var(--queue-width));
  overflow: visible;
  pointer-events: none;
}

.elevator-boarding-dot {
  position: absolute;
  left: -10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--line-e);
  transform: translate(-50%, -50%);
  animation: passenger-boards 80ms ease-in forwards;
}

.elevator-shaft-grid {
  position: absolute;
  z-index: 2;
  inset: 0 0 0 calc(var(--floor-label) + var(--queue-width));
  display: grid;
  pointer-events: none;
}

.elevator-shaft {
  position: relative;
  min-width: 0;
  border-left: 1px solid var(--line-strong);
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--line-e) 4%, transparent), transparent);
}

.elevator-shaft:last-child {
  border-right: 1px solid var(--line-strong);
}

.elevator-car {
  position: absolute;
  left: 50%;
  width: min(54px, calc(100% - 10px));
  min-width: 34px;
  height: 42px;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr auto;
  align-items: center;
  justify-items: center;
  padding: 4px;
  border: 2px solid var(--line-e);
  border-radius: 12px;
  color: var(--text);
  background: var(--panel-2);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--line-e) 12%, transparent), 0 6px 16px rgba(0, 0, 0, 0.24);
  transform: translate(-50%, -50%);
}

.elevator-car.moving {
  background: color-mix(in srgb, var(--line-e) 16%, var(--panel-2));
}

.elevator-car-direction {
  color: var(--line-e-text);
  font-size: 0.7rem;
}

.elevator-car strong {
  font-size: 1rem;
}

.elevator-car small {
  grid-column: 1 / -1;
  color: var(--muted);
  font-size: 0.58rem;
  line-height: 1;
}

@keyframes passenger-arrives {
  from { opacity: 0; transform: translateX(-14px) scale(0.4); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes passenger-boards {
  from {
    left: -10px;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    left: var(--absorb-target);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.35);
  }
}

@media (max-width: 760px) {
  .elevator-cross-section {
    --floor-label: 40px;
    --queue-width: 64px;
    padding: 10px;
  }

  .elevator-cross-section__stage {
    height: 60vh;
    min-height: 430px;
  }

  .floor-label-desktop {
    display: none;
  }

  .floor-label-mobile {
    display: inline;
  }

  .elevator-waiting-dots {
    gap: 2px;
  }

  .elevator-waiting-dots i {
    width: 5px;
    height: 5px;
  }

  .elevator-car {
    width: min(44px, calc(100% - 6px));
    min-width: 28px;
    height: 36px;
    border-radius: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .elevator-waiting-dots i.is-new {
    animation: none;
  }

  .elevator-boarding-dot {
    animation: none;
    opacity: 0;
  }
}
</style>
