<script setup>
import HistoryPage from './HistoryPage.vue'
import SeasonPage from './SeasonPage.vue'
</script>

<template>
  <div class="records-page">
    <section class="surface-hero">
      <span>기록</span>
      <h1>배운 흔적을 돌아봅니다</h1>
      <p>제출과 리뷰, 이번 시즌의 변화가 시간순으로 남습니다.</p>
    </section>
    <HistoryPage embedded />
    <section id="season" class="season-embed" aria-labelledby="season-title">
      <h2 id="season-title">이번 시즌</h2>
      <SeasonPage embedded />
    </section>
  </div>
</template>

<style scoped>
.records-page { max-width: 900px; margin: 0 auto; }
.surface-hero { margin-bottom: 28px; padding: 12px 0 24px 22px; border-left: 3px solid var(--accent); }
.surface-hero > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.surface-hero h1 { margin: 7px 0 5px; font-size: clamp(24px, 4vw, 34px); }
.surface-hero p { margin: 0; color: var(--fg-dim); }
.season-embed { margin-top: 38px; padding-top: 26px; border-top: 1px solid var(--line); }
.season-embed > h2 { margin: 0 0 18px; font-size: 20px; }
</style>
