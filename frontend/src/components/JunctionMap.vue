<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { JUNCTION, JUNCTION_LINES } from '../data/lines.js'
import { withBasePath } from '../staticRouting.js'

const props = defineProps({
  disabledPages: { type: Array, default: () => [] },
  staticMode: { type: Boolean, default: false }
})

const emit = defineEmits(['open'])
const accessToast = ref(null)
let accessToastTimer

function effectiveAccess(destination) {
  if (destination?.access) return destination.access
  return props.staticMode && destination?.staticAccess === 'server' ? 'static-server' : undefined
}

function isRestricted(destination) {
  return ['protected', 'planned', 'static-server'].includes(effectiveAccess(destination))
}

function accessMessage(destination) {
  const access = effectiveAccess(destination)
  if (access === 'protected') return '보호 구역 · 준비 중'
  if (access === 'static-server') return '서버 시뮬 · 정적 공개본에서는 준비 중'
  return '예정 노선 · 준비 중'
}

function lineAccess(line) {
  return line.stations.every(station => station.access === 'protected') ? 'protected' : undefined
}

function isUnavailable(destination) {
  return Boolean(destination?.page && props.disabledPages.includes(destination.page))
}

function entryHref(destination) {
  return destination?.entryPath
    ? withBasePath(destination.entryPath, import.meta.env.BASE_URL)
    : undefined
}

function destinationTag(destination) {
  if (isRestricted(destination)) return 'button'
  if (destination.entryPath) return 'a'
  return 'button'
}

function showAccessToast(destination, event) {
  const element = event?.currentTarget
  const rect = element?.getBoundingClientRect()
  const isMobile = window.innerWidth < 900

  accessToast.value = {
    message: accessMessage(destination),
    x: !isMobile && rect
      ? `${Math.min(window.innerWidth - 150, Math.max(150, rect.left + rect.width / 2))}px`
      : undefined,
    y: !isMobile && rect
      ? `${Math.min(window.innerHeight - 70, Math.max(18, rect.bottom + 10))}px`
      : undefined
  }

  window.clearTimeout(accessToastTimer)
  accessToastTimer = window.setTimeout(() => {
    accessToast.value = null
  }, 2500)
}

function go(destination, event) {
  if (isRestricted(destination)) {
    showAccessToast(destination, event)
    return
  }
  if (destination.entryPath || !destination.page) return
  emit('open', destination.page)
}

onBeforeUnmount(() => window.clearTimeout(accessToastTimer))
</script>

<template>
  <section class="junction-overview" aria-label="환승 홀 노선과 이동 목록">
    <section class="junction-map-box" aria-labelledby="junction-map-title">
      <h3 id="junction-map-title">환승 홀 · 기록선 · 실험선 · 기지선</h3>
      <svg
        class="junction-map"
        viewBox="0 0 720 720"
        role="img"
        aria-label="환승 홀에서 기록선, 실험선, 기지선으로 이어지는 여덟 정류장"
      >
        <g
          v-for="line in JUNCTION_LINES"
          :key="`${line.id}-paths`"
          class="junction-map-line"
          :class="lineAccess(line)"
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
        </g>

        <g
          v-for="line in JUNCTION_LINES"
          :key="`${line.id}-stations`"
          class="junction-map-line"
          :class="lineAccess(line)"
          :style="{
            '--route-color': `var(--${line.colorToken})`,
            '--route-text-color': `var(--${line.textColorToken})`
          }"
        >
          <g
            v-for="station in line.stations"
            :key="station.code"
            class="junction-station"
            :class="{
              upcoming: station.upcoming,
              restricted: isRestricted(station),
              planned: station.access === 'planned',
              protected: station.access === 'protected'
            }"
            :data-station-code="station.code"
            :role="isRestricted(station) ? 'button' : undefined"
            :tabindex="isRestricted(station) ? 0 : undefined"
            :aria-label="isRestricted(station) ? `${station.nameKo} · ${accessMessage(station)}` : undefined"
            @click="isRestricted(station) ? go(station, $event) : undefined"
            @keydown.enter.prevent="isRestricted(station) ? go(station, $event) : undefined"
            @keydown.space.prevent="isRestricted(station) ? go(station, $event) : undefined"
          >
            <circle class="junction-station-hit" :cx="station.map.x" :cy="station.map.y" r="48" />
            <circle class="junction-station-dot" :cx="station.map.x" :cy="station.map.y" r="12" />
            <text class="junction-station-code" :x="station.map.x" :y="station.map.y">{{ station.code }}</text>
            <text
              class="junction-station-name"
              :x="station.map.labelX"
              :y="station.map.labelY"
              :text-anchor="station.map.anchor"
            >{{ station.mapName }}</text>
          </g>

          <text
            class="junction-line-name"
            :x="line.label.x"
            :y="line.label.y"
            :text-anchor="line.label.anchor"
          >{{ line.nameKo }}</text>
        </g>

        <g
          v-for="line in JUNCTION_LINES"
          :key="`${line.id}-stops`"
          class="junction-map-line"
          :class="lineAccess(line)"
          :style="{
            '--route-color': `var(--${line.colorToken})`,
            '--route-text-color': `var(--${line.textColorToken})`
          }"
        >
          <template v-for="station in line.stations" :key="`${station.code}-stops`">
            <g
              v-for="stop in station.mapStops || []"
              :key="`${station.code}-${stop.label}`"
              class="junction-page-stop"
              :class="{
                restricted: isRestricted(stop),
                planned: effectiveAccess(stop) === 'planned',
                'static-server': effectiveAccess(stop) === 'static-server'
              }"
              :role="stop.page || isRestricted(stop) ? 'button' : undefined"
              :tabindex="stop.page || isRestricted(stop) ? 0 : undefined"
              :aria-label="isRestricted(stop) ? `${stop.label} · ${accessMessage(stop)}` : stop.page ? `${stop.label} 열기` : undefined"
              @click="stop.page || isRestricted(stop) ? go(stop, $event) : undefined"
              @keydown.enter.prevent="stop.page || isRestricted(stop) ? go(stop, $event) : undefined"
              @keydown.space.prevent="stop.page || isRestricted(stop) ? go(stop, $event) : undefined"
            >
              <circle :cx="stop.x" :cy="stop.y" r="4.5" />
              <text :x="stop.labelX" :y="stop.labelY" :text-anchor="stop.anchor">{{ stop.label }}</text>
            </g>
          </template>
        </g>

        <g class="junction-hub">
          <circle class="junction-hub-ring" :cx="JUNCTION.x" :cy="JUNCTION.y" r="28" />
          <path class="junction-hub-mark" d="M368.8 333.4 A28 28 0 1 1 351.2 333.4" />
          <circle class="junction-hub-dot" :cx="JUNCTION.x" cy="332" r="3.4" />
          <text class="junction-hub-name" :x="JUNCTION.x" y="306">환승 홀</text>
        </g>
      </svg>
      <p class="junction-map-legend">큰 역은 서비스 · 작은 역은 세부 화면</p>
    </section>

    <nav class="junction-lines" aria-label="노선별 이동">
      <section
        v-for="line in JUNCTION_LINES"
        :key="`${line.id}-list`"
        class="junction-route-group"
        :class="lineAccess(line)"
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
            :class="{
              upcoming: station.upcoming,
              restricted: isRestricted(station),
              planned: station.access === 'planned',
              protected: station.access === 'protected',
              unavailable: isUnavailable(station) && !isRestricted(station)
            }"
            :type="destinationTag(station) === 'button' ? 'button' : undefined"
            :href="entryHref(station)"
            @click="go(station, $event)"
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
              :class="{
                unavailable: isUnavailable(link),
                restricted: isRestricted(link),
                planned: effectiveAccess(link) === 'planned',
                'static-server': effectiveAccess(link) === 'static-server'
              }"
              :aria-label="isRestricted(link) ? `${link.label} · ${accessMessage(link)}` : undefined"
              @click="go(link, $event)"
            >{{ link.label }}</component>
          </div>
        </div>
      </section>
    </nav>

    <p
      v-if="accessToast"
      class="junction-access-toast"
      :style="{ '--toast-x': accessToast.x, '--toast-y': accessToast.y }"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >{{ accessToast.message }}</p>
  </section>
</template>

<style scoped>
.junction-station-hit {
  fill: transparent;
  pointer-events: all;
}

@media (max-width: 899px) {
  .junction-station-code {
    font-size: 19px;
  }

  .junction-station-name,
  .junction-station.upcoming .junction-station-name {
    display: block;
    font-size: 24px;
  }

  .junction-line-name {
    font-size: 18px;
  }

  .junction-hub-name {
    font-size: 22px;
  }
}
</style>
