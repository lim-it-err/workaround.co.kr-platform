<script setup>
// 승강장 역명판 헤더 (스펙 §3.1, TKT-071/S1)
// 모든 기능 페이지 상단을 역명판 문법으로 통일한다:
// 노선색 띠 + 역 코드 원 + 역명 + 인접역 + 상태 chip + 환승 홀 복귀 CTA.
// 접근성: 상태는 색+텍스트 동시, 복귀 CTA 항상 노출.
defineProps({
  lineClass: { type: String, default: '' }, // 'line-e' 등 — --accent/--accent-text 주입 (§1.3)
  stationCode: { type: String, required: true }, // 'E01'
  title: { type: String, required: true },
  titleEn: { type: String, default: '' },
  prevLabel: { type: String, default: '← 환승 홀' },
  nextLabel: { type: String, default: '다음 승강장 →' },
  status: { type: String, default: '' },
  statusTone: {
    type: String,
    default: 'live',
    validator: (v) => ['live', 'warn', 'ok'].includes(v)
  },
  summary: { type: String, default: '' },
  exitLabel: { type: String, default: '환승 홀로 나가기' }
})

defineEmits(['exit'])
</script>

<template>
  <section class="station-sign" :class="lineClass">
    <div class="band" aria-hidden="true"></div>
    <div class="station-sign-in">
      <button type="button" class="station-prev" @click="$emit('exit')">{{ prevLabel }}</button>
      <div class="station-center">
        <span class="station-code">{{ stationCode }}</span>
        <div>
          <h3>{{ title }}</h3>
          <small v-if="titleEn">{{ titleEn }}</small>
        </div>
      </div>
      <span class="station-next">{{ nextLabel }}</span>
    </div>
    <div class="station-sub">
      <span v-if="status" class="chip" :class="statusTone === 'live' ? '' : statusTone">
        <span class="dot" aria-hidden="true"></span>{{ status }}
      </span>
      <span v-if="summary">{{ summary }}</span>
      <span class="spacer"></span>
      <slot name="actions"></slot>
      <button type="button" class="btn btn-ghost" @click="$emit('exit')">{{ exitLabel }}</button>
    </div>
  </section>
</template>
