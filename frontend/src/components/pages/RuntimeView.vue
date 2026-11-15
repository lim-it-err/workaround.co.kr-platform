<script setup>
import { reactive, toRefs } from 'vue'

const props = defineProps({
  // useWorkManager() 의 반환값(상태·함수 묶음).
  manager: { type: Object, required: true }
})
// 새로고침 버튼은 클릭 이벤트를 그대로 넘긴다(기존 @click="$emit('refresh', $event)" 와 같은 인자).
defineEmits(['refresh'])

const { runtimeState, runtimeToneRows, runtimeNeedsAttention } = toRefs(reactive(props.manager))
</script>

<template>
  <section class="feature-shell tone-page tone-runtime-page line-r">
    <section class="tone-page-hero line-r">
      <div class="tone-hero-topline">
        <small>주의가 필요한 신호</small>
        <span>보호 구역</span>
      </div>
      <h1>{{ runtimeNeedsAttention ? '응답 지연이 평소보다 깁니다' : '모든 실행 환경이 응답 중입니다' }}</h1>
      <p>{{ runtimeNeedsAttention ? '서비스는 동작 중이며 최근 10분의 변화입니다.' : '최근 확인한 실행 환경이 정상입니다.' }}</p>
    </section>

    <div class="tone-runtime-list" aria-label="실행 환경 상태">
      <div v-for="row in runtimeToneRows" :key="row.key" class="tone-runtime-row">
        <span class="tone-status-dot" :class="{ wait: row.warning }" aria-hidden="true"></span>
        <div>
          <strong>{{ row.label }}</strong>
          <small>{{ row.detail }}</small>
        </div>
        <span class="tone-runtime-metric">{{ row.status }}</span>
      </div>
    </div>

    <button type="button" class="ghost-button tone-refresh" @click="$emit('refresh', $event)">상태 새로고침</button>

    <details class="tone-support-details tone-runtime-details">
      <summary>오프로드·배포 기준</summary>
      <div class="tone-support-details__body">
    <section class="section-block split-layout">
      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">라우팅 규칙</p>
            <h3>오프로드 정책</h3>
          </div>
        </div>

        <ul class="rule-list">
          <li v-for="rule in runtimeState.routingRules" :key="`${rule.when}-${rule.preferNode}`">
            {{ rule.when }} -> {{ rule.preferNode }} / {{ rule.degradedFallback }}
          </li>
        </ul>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">배포 경로</p>
            <h3>배포 레일</h3>
          </div>
        </div>

        <ol class="path-steps" aria-label="배포 레일 단계">
          <li><span>01</span><strong>UI / docs 정리</strong></li>
          <li><span>02</span><strong>티켓 acceptance 확인</strong></li>
          <li><span>03</span><strong>tests / CI 확인</strong></li>
          <li><span>04</span><strong>PR 정리</strong></li>
          <li><span>05</span><strong>tag / release</strong></li>
        </ol>
      </article>
    </section>
      </div>
    </details>
  </section>
</template>
