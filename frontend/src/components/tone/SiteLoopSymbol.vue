<script setup>
defineProps({
  size: {
    type: String,
    default: 'small',
    validator: (value) => ['small', 'large'].includes(value)
  },
  label: {
    type: String,
    default: '순환선'
  }
})
</script>

<template>
  <span
    class="site-loop-symbol"
    :class="size === 'large' ? 'site-loop-symbol-lg' : 'site-loop-symbol-sm'"
    role="img"
    :aria-label="label"
  ></span>
</template>
