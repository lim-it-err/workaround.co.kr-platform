<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) => ['draft', 'preview', 'published', 'archived'].includes(value)
  }
})

const labels = {
  draft: '초안',
  preview: '미리보기',
  published: '공개',
  archived: '보관'
}

const badgeClass = computed(() => ({
  draft: 'badge-draft',
  preview: 'badge-preview',
  published: 'badge-pub',
  archived: 'badge-arch'
})[props.status])
</script>

<template>
  <span class="badge" :class="badgeClass">{{ labels[status] }}</span>
</template>
