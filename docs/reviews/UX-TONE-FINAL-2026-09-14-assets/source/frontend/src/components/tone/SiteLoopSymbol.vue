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
  <svg
    class="site-loop-symbol"
    :class="size === 'large' ? 'site-loop-symbol-lg' : 'site-loop-symbol-sm'"
    viewBox="0 0 96 96"
    focusable="false"
    role="img"
    :aria-label="label"
  >
    <path d="M58 18.55 A33 33 0 1 1 38 18.55" />
    <circle cx="48" cy="16" r="4" />
  </svg>
</template>
