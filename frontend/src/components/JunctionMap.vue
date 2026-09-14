<script setup>
import { JUNCTION, JUNCTION_LINES } from '../data/lines.js'
import { withBasePath } from '../staticRouting.js'

const props = defineProps({
  disabledPages: { type: Array, default: () => [] }
})

const emit = defineEmits(['open'])

function isUnavailable(destination) {
  return Boolean(destination?.page && props.disabledPages.includes(destination.page))
}

function entryHref(destination) {
  return destination?.entryPath
    ? withBasePath(destination.entryPath, import.meta.env.BASE_URL)
    : undefined
}

function destinationTag(destination) {
  if (destination.upcoming) return 'div'
  if (destination.entryPath) return 'a'
  return 'button'
}

function go(destination) {
  if (destination.upcoming || destination.entryPath || !destination.page) return
  emit('open', destination.page)
}
</script>

<template>
  <section class="junction-overview" aria-label="환승 홀 노선과 이동 목록">
    <section class="junction-map-box" aria-labelledby="junction-map-title">
      <h3 id="junction-map-title">환승 홀 · 기록선 · 실험선 · 기지선</h3>
      <svg
        class="junction-map"
        viewBox="120 130 540 540"
        role="img"
        aria-label="환승 홀에서 기록선, 실험선, 기지선으로 이어지는 여덟 정류장"
      >
        <g
          v-for="line in JUNCTION_LINES"
          :key="line.id"
          class="junction-map-line"
          :style="{
            '--route-color': `var(--${line.colorToken})`,
            '--route-text-color': `var(--${line.textColorToken})`
          }"
        >
          <path
            v-for="(path, pathIndex) in line.paths"
            :key="`${line.id}-path-${pathIndex}`"
            class="junction-branch"
            :class="{ upcoming: line.stations.some((station) => station.upcoming && station.pathIndex === pathIndex) }"
            :d="path"
          />

          <g
            v-for="station in line.stations"
            :key="station.code"
            class="junction-station"
            :class="{ upcoming: station.upcoming }"
          >
            <circle class="junction-station-dot" :cx="station.map.x" :cy="station.map.y" r="12" />
            <text class="junction-station-code" :x="station.map.x" :y="station.map.y">{{ station.code }}</text>
            <text
              class="junction-station-name"
              :x="station.map.labelX"
              :y="station.map.labelY"
              :text-anchor="station.map.anchor"
            >{{ station.mapName }}</text>

            <g v-for="stop in station.mapStops || []" :key="`${station.code}-${stop.label}`" class="junction-page-stop">
              <circle :cx="stop.x" :cy="stop.y" r="4.5" />
              <text :x="stop.labelX" :y="stop.labelY" :text-anchor="stop.anchor">{{ stop.label }}</text>
            </g>
          </g>

          <text
            class="junction-line-name"
            :x="line.label.x"
            :y="line.label.y"
            :text-anchor="line.label.anchor"
          >{{ line.nameKo }}</text>
        </g>

        <g class="junction-hub">
          <circle class="junction-hub-ring" :cx="JUNCTION.x" :cy="JUNCTION.y" r="28" />
          <path class="junction-hub-mark" d="M368.8 333.4 A28 28 0 1 1 351.2 333.4" />
          <circle class="junction-hub-dot" :cx="JUNCTION.x" cy="332" r="3.4" />
          <text class="junction-hub-name" :x="JUNCTION.x" y="308">환승 홀</text>
        </g>
      </svg>
      <p class="junction-map-legend">큰 역은 서비스 · 작은 역은 세부 화면</p>
    </section>

    <nav class="junction-lines" aria-label="노선별 이동">
      <section
        v-for="line in JUNCTION_LINES"
        :key="`${line.id}-list`"
        class="junction-route-group"
        :style="{
          '--route-color': `var(--${line.colorToken})`,
          '--route-text-color': `var(--${line.textColorToken})`
        }"
      >
        <h3>{{ line.nameKo }}</h3>
        <p>{{ line.order }}</p>

        <div v-for="station in line.stations" :key="`${station.code}-row`" class="junction-route-entry">
          <component
            :is="destinationTag(station)"
            class="junction-route-row"
            :class="{ upcoming: station.upcoming, unavailable: isUnavailable(station) }"
            :type="destinationTag(station) === 'button' ? 'button' : undefined"
            :href="entryHref(station)"
            :aria-disabled="station.upcoming ? 'true' : undefined"
            @click="go(station)"
          >
            <span class="junction-route-badge" aria-hidden="true">{{ station.code }}</span>
            <span class="junction-route-name">{{ station.nameKo }}</span>
            <span class="junction-route-status">{{ station.status }}</span>
          </component>

          <div v-if="station.sublinks?.length" class="junction-sublinks">
            <component
              :is="destinationTag(link)"
              v-for="link in station.sublinks"
              :key="`${station.code}-${link.label}`"
              :type="destinationTag(link) === 'button' ? 'button' : undefined"
              :href="entryHref(link)"
              :class="{ unavailable: isUnavailable(link) }"
              @click="go(link)"
            >{{ link.label }}</component>
          </div>
        </div>
      </section>
    </nav>
  </section>
</template>
