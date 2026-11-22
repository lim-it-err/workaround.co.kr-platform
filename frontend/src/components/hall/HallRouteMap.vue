<script setup>
import { HALL_LINES, HALL_MAP, HALL_ROWS } from '../../data/hallBoard.js'

// TKT-226: 환승 홀 노선도 — 안내판 위의 장식 겸 지름길. 키보드·스크린리더 경로는 안내판이다(역은 포커스 대상 아님).
defineProps({
  active: { type: String, default: '' },
  disabledPages: { type: Array, default: () => [] }
})
const emit = defineEmits(['hover', 'select'])

const { viewBox, hub, routes, stations } = HALL_MAP
const rows = HALL_ROWS.filter(row => stations[row.id])

function labelY(station) {
  return station.label === 'above' ? station.y - 16 : station.y + 25
}
</script>

<template>
  <div class="hall-map" data-hall-map>
    <svg
      :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
      role="img"
      aria-label="노선도: 환승 홀에서 기록선·배움선·놀이선·생활선·기지선이 뻗는다"
      @mouseleave="emit('hover', '')"
    >
      <g class="routes" fill="none" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
        <path
          v-for="(route, index) in routes"
          :key="index"
          :d="route.d"
          :class="[`m-${HALL_LINES[route.line].tone}`, route.planned ? 'route-planned' : 'route-draw']"
          :pathLength="route.planned ? undefined : 1"
          stroke="currentColor"
          :stroke-dasharray="route.planned ? '1 11' : undefined"
        />
      </g>

      <g
        v-for="row in rows"
        :key="row.id"
        class="station"
        :class="[`m-${HALL_LINES[row.line].tone}`, { 'is-active': active === row.id, 'is-planned': row.planned, 'is-go': !row.planned }]"
        :data-map-station="row.id"
        @mouseenter="emit('hover', row.id)"
        @click="emit('select', row)"
      >
        <circle class="hit" :cx="stations[row.id].x" :cy="stations[row.id].y" r="22" />
        <circle class="dot" :cx="stations[row.id].x" :cy="stations[row.id].y" :r="row.planned ? 6.5 : 8" />
        <text class="name" :x="stations[row.id].x" :y="labelY(stations[row.id])" text-anchor="middle">{{ row.destination }}</text>
      </g>

      <g class="hub" data-map-hub>
        <circle class="hub-ring" :cx="hub.x" :cy="hub.y" r="15" />
        <circle class="hub-core" :cx="hub.x" :cy="hub.y" r="6.5" />
        <text class="hub-name" :x="hub.x" :y="hub.y + 40" text-anchor="middle">{{ hub.label }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.hall-map {
  display: none;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  padding: 10px 14px 4px;
  border: 1px solid var(--line);
  border-bottom: 0;
  background: var(--bg);
}

@media (min-width: 900px) {
  .hall-map {
    display: block;
  }
}

svg {
  display: block;
  width: 100%;
  height: auto;
  font-family: var(--font-mono), "D2Coding", "Noto Sans Mono CJK KR", "Apple SD Gothic Neo", monospace;
  overflow: visible;
}

.m-rec { color: var(--line-b-text); }
.m-learn { color: var(--line-r-text); }
.m-play { color: var(--line-t-text); }
.m-life { color: var(--line-w-text); }
.m-base { color: var(--line-e-text); }

.route-draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: map-draw 0.6s ease-out both;
}

.route-planned {
  opacity: 0.8;
  animation: map-fade 0.6s ease-out both;
}

.station .dot {
  fill: var(--bg);
  stroke: currentColor;
  stroke-width: 3.5;
  transition: r 0.12s ease-out, fill 0.12s ease-out;
}

.station.is-planned .dot {
  stroke-width: 2.5;
  stroke-dasharray: 3 2.6;
}

.station .hit {
  fill: transparent;
  stroke: none;
}

.station .name {
  fill: var(--muted);
  font-size: 13px;
  paint-order: stroke;
  stroke: var(--bg);
  stroke-width: 4px;
  transition: fill 0.12s ease-out;
  pointer-events: none;
}

.station.is-go {
  cursor: pointer;
}

.station.is-active .dot {
  fill: currentColor;
  r: 10;
}

.station.is-active .name {
  fill: var(--text);
  font-weight: 700;
}

.hub-ring {
  fill: var(--bg);
  stroke: var(--text);
  stroke-width: 3.5;
  animation: map-pulse 6s ease-in-out infinite;
}

.hub-core {
  fill: var(--text);
}

.hub-name {
  fill: var(--text);
  font-size: 13px;
  font-weight: 700;
}

@keyframes map-draw {
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
}

@keyframes map-fade {
  from { opacity: 0; }
  to { opacity: 0.8; }
}

@keyframes map-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (prefers-reduced-motion: reduce) {
  .route-draw,
  .route-planned,
  .hub-ring {
    animation: none;
  }
}
</style>
