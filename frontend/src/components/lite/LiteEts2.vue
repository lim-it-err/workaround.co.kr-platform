<script setup>
import LiteScreen from './LiteScreen.vue'
import { useLiteKeys } from '../../composables/useLiteKeys.js'

// TKT-228 자리표시 — 후속 티켓이 통째로 교체한다.
const emit = defineEmits(['back'])
useLiteKeys({ onBack: () => emit('back') })
</script>

<template>
  <LiteScreen crumb="유로트럭" keys="Esc 뒤로" @back="emit('back')">
    <p data-lite-placeholder>준비 중 · 상단 기본으로 보기</p>
  </LiteScreen>
</template>
