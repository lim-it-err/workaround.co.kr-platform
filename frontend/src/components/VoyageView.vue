<script setup>
import { nextTick, ref } from 'vue'
import VoyageArchiveView from './VoyageArchiveView.vue'
import VoyageDailyView from './VoyageDailyView.vue'
import VoyagePrepView from './VoyagePrepView.vue'

const emit = defineEmits(['exit'])
const activeView = ref('prep')
const root = ref(null)

async function openView(view) {
  activeView.value = view
  await nextTick()
  root.value?.closest('.page-scroller')?.scrollTo({ top: 0 })
}
</script>

<template>
  <div ref="root" class="voyage-view">
    <VoyagePrepView
      v-if="activeView === 'prep'"
      @exit="emit('exit')"
      @open-daily="openView('daily')"
      @open-archive="openView('archive')"
    />
    <VoyageDailyView
      v-else-if="activeView === 'daily'"
      @exit="emit('exit')"
      @back="openView('prep')"
      @open-archive="openView('archive')"
    />
    <VoyageArchiveView
      v-else
      @exit="emit('exit')"
      @open-prep="openView('prep')"
      @open-daily="openView('daily')"
    />
  </div>
</template>

<style scoped>
.voyage-view {
  min-width: 0;
}
</style>
