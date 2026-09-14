<script setup>
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import { VOYAGES, findVoyageById } from '../data/voyage.js'
import { migrateLegacyVoyageStorage, migrateVoyageDayStorage } from '../data/voyageStorage.js'
import VoyageEmptyArchiveView from './VoyageEmptyArchiveView.vue'
import VoyageIndexView from './VoyageIndexView.vue'
import VoyageRouteMap from './voyage/VoyageRouteMap.vue'

const emit = defineEmits(['exit'])
const currentVoyage = VOYAGES.find((voyage) => voyage.status === 'boarding') || null
const selectedVoyage = ref(currentVoyage || VOYAGES[0])
const activeView = ref(currentVoyage ? 'route' : 'index')
const entryMode = ref(currentVoyage ? 'today' : 'archive')
const root = ref(null)
const hasArchiveContent = computed(() => Boolean(selectedVoyage.value?.days?.length))

onBeforeMount(() => {
  if (typeof window !== 'undefined') {
    migrateLegacyVoyageStorage(window.localStorage)
    VOYAGES.forEach((voyage) => migrateVoyageDayStorage(window.localStorage, voyage))
  }
})

async function openView(view) {
  activeView.value = view
  await nextTick()
  root.value?.closest('.page-scroller')?.scrollTo({ top: 0 })
}

async function openVoyage(voyageId, requestedView = '') {
  const voyage = findVoyageById(voyageId)
  if (!voyage) return
  selectedVoyage.value = voyage
  entryMode.value = ({ prep: 'prep', daily: 'today', archive: 'archive' })[requestedView]
    || (voyage.status === 'arrived' ? 'archive' : voyage.status === 'planned' ? 'prep' : 'today')
  await openView('route')
}
</script>

<template>
  <div ref="root" class="voyage-view">
    <VoyageIndexView
      v-if="activeView === 'index'"
      :voyages="VOYAGES"
      @exit="emit('exit')"
      @open-voyage="openVoyage"
    />
    <VoyageRouteMap
      v-else-if="hasArchiveContent"
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      :entry-mode="entryMode"
      @exit="emit('exit')"
      @back="openView('index')"
    />
    <VoyageEmptyArchiveView
      v-else
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      @exit="emit('exit')"
      @back="openView('index')"
    />
  </div>
</template>

<style scoped>
.voyage-view {
  min-width: 0;
}

</style>
