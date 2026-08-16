<script setup>
// 환승 홀 노선도 (스펙 §3.3 / TKT-072·S2, 시안 C 이식)
// 블로그 = 굵은 본선, 기능 = 지선, 노란 링은 현재 위치(환승 홀)에만.
// SVG 는 시각 요약이고, 아래 .route-rows 목록이 접근성·모바일 폴백이자 실제 이동 링크다.
import { JUNCTION, LINES } from '../data/lines.js'

// lineStates: { [code]: { status, summary } } — 동적 상태는 부모(App)가 주입
const props = defineProps({
  lineStates: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['open'])

const trunk = LINES.find((l) => l.kind === 'trunk')
const branches = LINES.filter((l) => l.kind === 'branch')
const rows = [trunk, ...branches]

function stateOf(line) {
  if (line.upcoming) return { status: `예정 · ${line.targetVersion}`, summary: '' }
  return props.lineStates[line.code] ?? { status: '', summary: '' }
}

function go(line) {
  if (!line.upcoming && line.page) emit('open', line.page)
}
</script>

<template>
  <section class="map-panel" aria-label="환승 홀 노선도">
    <svg class="route-map" viewBox="0 0 1000 460" role="img" aria-hidden="true">
      <!-- 지선 -->
      <path
        v-for="line in branches"
        :key="`p-${line.code}`"
        class="rl"
        :class="{ upcoming: line.upcoming }"
        :d="line.path"
        :style="{ stroke: `var(--${line.lineClass})` }"
      />
      <!-- 본선 (굵게, 지선 위) -->
      <path class="rl rl-b" :d="trunk.path" :style="{ stroke: `var(--${trunk.lineClass})` }" />
      <path class="rl rl-b" :d="trunk.cap" :style="{ stroke: `var(--${trunk.lineClass})` }" />

      <!-- 본선 정차역 -->
      <g v-for="stop in trunk.stops" :key="stop.label">
        <circle
          class="stn"
          :class="{ term: stop.terminus }"
          :cx="stop.x"
          :cy="stop.y"
          :r="stop.terminus ? 11 : 7.5"
          :style="{ stroke: `var(--${trunk.lineClass})` }"
        />
        <circle v-if="stop.terminus" :cx="stop.x" :cy="stop.y" r="4" :style="{ fill: `var(--${trunk.lineClass})` }" />
        <text class="name name-c" :x="stop.x" :y="stop.y + 38">{{ stop.label }}</text>
      </g>

      <!-- 지선 종점 문자 배지 + 라벨 -->
      <g v-for="line in branches" :key="`c-${line.code}`" :class="{ 'g-upcoming': line.upcoming }">
        <circle class="lchip" :cx="line.chip.x" :cy="line.chip.y" r="13" :style="{ fill: `var(--${line.lineClass})` }" />
        <text class="lchip-txt" :x="line.chip.x" :y="line.chip.y + 4.5">{{ line.code }}</text>
        <text class="name" :x="line.labelPos.x" :y="line.labelPos.y" :text-anchor="line.labelPos.anchor">{{ line.nameKo }}</text>
        <text class="sub" :x="line.labelPos.x" :y="line.labelPos.sub" :text-anchor="line.labelPos.anchor">
          {{ stateOf(line).status }}
        </text>
      </g>

      <!-- 현재 위치: 환승 홀 -->
      <circle class="pulse" :cx="JUNCTION.x" :cy="JUNCTION.y" r="17" />
      <circle class="xfer" :cx="JUNCTION.x" :cy="JUNCTION.y" r="12" />
      <circle :cx="JUNCTION.x" :cy="JUNCTION.y" r="3.5" style="fill: var(--text)" />
      <text class="name name-c" :x="JUNCTION.x" :y="JUNCTION.y - 52">환승 홀</text>
      <text class="sub sub-c" :x="JUNCTION.x" :y="JUNCTION.y - 34">Main Junction</text>
    </svg>

    <!-- 이동 목록 (접근성·모바일 폴백 + 실제 링크) -->
    <div class="route-rows">
      <component
        :is="line.upcoming ? 'div' : 'button'"
        v-for="line in rows"
        :key="`r-${line.code}`"
        class="route-row"
        :class="{ primary: line.kind === 'trunk', upcoming: line.upcoming }"
        :style="{ '--tick': `var(--${line.lineClass})` }"
        type="button"
        @click="go(line)"
      >
        <span class="tick" aria-hidden="true"></span>
        <span class="rr-main">
          <strong>
            <span class="roundel sm" :class="line.lineClass">{{ line.code }}</span>
            {{ line.nameKo }}
          </strong>
          <small>{{ stateOf(line).summary || line.rowStops || '' }}</small>
        </span>
        <span class="rr-status">{{ stateOf(line).status }}</span>
        <span class="rr-go" aria-hidden="true">{{ line.upcoming ? '' : '→' }}</span>
      </component>
    </div>
  </section>
</template>
