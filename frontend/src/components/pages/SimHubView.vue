<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  isStaticMode: { type: Boolean, default: false },
  // 엘리베이터 서비스가 실시간 루프로 도는지(카드 상태 문구). App 이 elevatorState.mode 로 계산해 내려준다.
  elevatorLive: { type: Boolean, default: false }
})
const emit = defineEmits(['open-page'])

const STATIC_SIM_NOTICE_MS = 2500

const staticSimNotice = ref(null)
let staticSimNoticeTimer

const simHubCards = computed(() => [
  {
    key: 'elevator',
    page: 'elevator',
    lineNo: 'E',
    name: 'Elevator Station',
    displayName: '멈춘 엘리베이터',
    kicker: '추천 시나리오 · 시스템 설계',
    summary: '재시도와 상태 복구를 설계합니다.',
    status: props.elevatorLive ? '실시간 루프' : '저하 운행',
    accent: 'line-e',
    cta: '시작'
  },
  {
    key: 'taxi',
    page: 'taxi',
    lineNo: 'T',
    name: 'Taxi District Lab',
    displayName: '심야 택시',
    summary: '제한된 정보로 안전한 선택을 만듭니다.',
    status: '제품 판단',
    accent: 'line-t',
    cta: '시작'
  },
  {
    key: 'ets2',
    page: 'ets2',
    lineNo: 'S',
    name: '유로트럭 관제',
    displayName: '유로트럭 관제',
    summary: '최근 주행 화면과 연결 상태를 읽습니다.',
    status: '읽기 전용',
    accent: 'line-s',
    cta: '관제 보기'
  },
  {
    key: 'ets2Dev',
    page: 'ets2Dev',
    lineNo: 'S',
    name: '유로트럭 개발자',
    displayName: '유로트럭 개발자',
    summary: '로컬 PoC 제어와 정적 시뮬레이터를 점검합니다.',
    status: '로컬 전용',
    accent: 'line-s',
    cta: '개발 도구 열기',
    staticAccess: 'server'
  }
])
const featuredSimCard = computed(() => simHubCards.value[0])
const secondarySimCards = computed(() => simHubCards.value.slice(1))

function showStaticSimNotice(event) {
  const rect = event?.currentTarget?.getBoundingClientRect()
  const isMobile = window.innerWidth < 900
  staticSimNotice.value = {
    message: '서버 시뮬 · 정적 공개본에서는 준비 중',
    x: !isMobile && rect
      ? `${Math.min(window.innerWidth - 150, Math.max(150, rect.left + rect.width / 2))}px`
      : undefined,
    y: !isMobile && rect
      ? `${Math.min(window.innerHeight - 70, Math.max(18, rect.bottom + 10))}px`
      : undefined
  }
  window.clearTimeout(staticSimNoticeTimer)
  staticSimNoticeTimer = window.setTimeout(() => {
    staticSimNotice.value = null
  }, STATIC_SIM_NOTICE_MS)
}

function showEts2DevStaticNotice(event) {
  showStaticSimNotice(event)
  staticSimNotice.value.message = '개발자 페이지 · 로컬 전용'
}

function openSimCard(card, event) {
  if (props.isStaticMode && card.staticAccess === 'server') {
    showEts2DevStaticNotice(event)
    return
  }
  if (props.isStaticMode && card.page === 'elevator') {
    showStaticSimNotice(event)
    return
  }
  emit('open-page', card.page)
}

// App.openPage 가 이동을 시작할 때 즉시 알림을 걷는다(이동 전 동작과 같다).
function clearNotice() {
  window.clearTimeout(staticSimNoticeTimer)
  staticSimNotice.value = null
}
defineExpose({ clearNotice })

onBeforeUnmount(() => {
  window.clearTimeout(staticSimNoticeTimer)
})
</script>

<template>
  <section class="feature-shell tone-page tone-sim-page line-s">
    <section
      v-if="featuredSimCard"
      class="tone-page-hero"
      :class="[featuredSimCard.accent, { 'static-sim-locked': isStaticMode }]"
    >
      <small>{{ featuredSimCard.kicker }}</small>
      <h1>{{ featuredSimCard.displayName }}</h1>
      <p>{{ featuredSimCard.summary }}</p>
      <button
        type="button"
        class="primary-button"
        :aria-label="isStaticMode ? `${featuredSimCard.displayName} · 서버 시뮬 · 정적 공개본에서는 준비 중` : undefined"
        @click="openSimCard(featuredSimCard, $event)"
      >
        {{ isStaticMode ? '준비 중' : featuredSimCard.cta }}
      </button>
    </section>

    <div class="tone-service-list" aria-label="격납고">
      <article
        v-for="card in secondarySimCards"
        :key="card.key"
        class="tone-service-row"
        :class="card.accent"
      >
        <span class="line-round" :class="card.accent" aria-hidden="true">{{ card.lineNo }}</span>
        <div>
          <small>{{ card.status }}</small>
          <h2>{{ card.displayName }}</h2>
          <p>{{ card.summary }}</p>
        </div>
        <button type="button" class="ghost-button" @click="openSimCard(card, $event)">
          {{ card.cta }}
        </button>
      </article>
    </div>

    <p
      v-if="staticSimNotice"
      class="junction-access-toast"
      :style="{ '--toast-x': staticSimNotice.x, '--toast-y': staticSimNotice.y }"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >{{ staticSimNotice.message }}</p>
  </section>
</template>
