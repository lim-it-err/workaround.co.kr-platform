<script setup>
import { computed, nextTick, onBeforeMount, ref } from 'vue'
import { VOYAGES, findVoyageById } from '../data/voyage.js'
import { migrateLegacyVoyageStorage } from '../data/voyageStorage.js'
import VoyageArchiveView from './VoyageArchiveView.vue'
import VoyageDailyView from './VoyageDailyView.vue'
import VoyageEmptyArchiveView from './VoyageEmptyArchiveView.vue'
import VoyageIndexView from './VoyageIndexView.vue'
import VoyagePrepView from './VoyagePrepView.vue'

const emit = defineEmits(['exit'])
const currentVoyage = VOYAGES.find((voyage) => voyage.status === 'boarding') || null
const selectedVoyage = ref(currentVoyage || VOYAGES[0])
const activeView = ref(currentVoyage ? 'daily' : 'index')
const root = ref(null)
const hasArchiveContent = computed(() => Boolean(selectedVoyage.value?.days?.length))

onBeforeMount(() => {
  if (typeof window !== 'undefined') {
    migrateLegacyVoyageStorage(window.localStorage)
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
  await openView(requestedView || (voyage.status === 'arrived' ? 'archive' : 'prep'))
}
</script>

<template>
  <div ref="root" class="voyage-view">
    <nav v-if="activeView !== 'index'" class="voyage-collection-nav" aria-label="여행 컬렉션">
      <button type="button" class="ghost-button" @click="openView('index')">← 여행 목록</button>
      <span>{{ selectedVoyage.title }}</span>
    </nav>
    <VoyageIndexView
      v-if="activeView === 'index'"
      :voyages="VOYAGES"
      @exit="emit('exit')"
      @open-voyage="openVoyage"
    />
    <VoyagePrepView
      v-else-if="activeView === 'prep'"
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      @exit="emit('exit')"
      @open-daily="openView('daily')"
      @open-archive="openView('archive')"
    />
    <VoyageDailyView
      v-else-if="activeView === 'daily'"
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      @exit="emit('exit')"
      @back="openView('prep')"
      @open-archive="openView('archive')"
    />
    <VoyageArchiveView
      v-else-if="hasArchiveContent"
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      @exit="emit('exit')"
      @open-prep="openView('prep')"
      @open-daily="openView('daily')"
    />
    <VoyageEmptyArchiveView
      v-else
      :key="selectedVoyage.id"
      :voyage="selectedVoyage"
      @exit="emit('exit')"
    />
  </div>
</template>

<style scoped>
.voyage-view {
  min-width: 0;
}

.voyage-collection-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.voyage-collection-nav span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
