<script setup>
import { useRoute } from 'vue-router'
import HomePage from './HomePage.vue'
import GamesPage from './GamesPage.vue'
import ProjectsPage from './ProjectsPage.vue'
import CourseList from '../components/CourseList.vue'

const route = useRoute()
</script>

<template>
  <div class="learn-page">
    <section class="surface-hero">
      <span>배우기</span>
      <h1>길이와 방식에 맞는 배움을 고르세요</h1>
      <p>미션, 짧은 연습, 프로젝트를 한 서가에서 찾습니다.</p>
    </section>

    <section id="courses" class="library-section" aria-labelledby="course-library-title">
      <div class="section-title">
        <h2 id="course-library-title">코스</h2>
        <router-link to="/courses">전체 화면으로</router-link>
      </div>
      <CourseList embedded />
    </section>

    <section class="library-section" aria-labelledby="mission-library-title">
      <h2 id="mission-library-title">기존 미션 빠르게 찾기</h2>
      <HomePage embedded entry-surface="/learn" />
    </section>

    <details id="practice" class="library-section expandable" :open="route.hash === '#practice'">
      <summary><strong>전체 연습</strong><span>원하는 판을 골라 다시하기</span></summary>
      <GamesPage embedded />
    </details>

    <details id="projects" class="library-section expandable" :open="route.hash === '#projects'">
      <summary><strong>프로젝트</strong><span>맨땅에서 구조를 쌓기</span></summary>
      <ProjectsPage embedded entry-surface="/learn" />
    </details>
  </div>
</template>

<style scoped>
.learn-page { max-width: 900px; margin: 0 auto; }
.surface-hero { margin-bottom: 30px; padding: 12px 0 24px 22px; border-left: 3px solid var(--accent); }
.surface-hero > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.surface-hero h1 { margin: 7px 0 5px; font-size: clamp(24px, 4vw, 34px); }
.surface-hero p { margin: 0; color: var(--fg-dim); }
.library-section { margin-top: 30px; }
.library-section > h2 { margin: 0 0 14px; font-size: 19px; }
.section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.section-title h2 { margin: 0; font-size: 19px; }
.section-title a { display: inline-flex; min-height: 40px; align-items: center; color: var(--accent-text); font-size: 13px; text-decoration: none; }
.expandable { border-top: 1px solid var(--line); }
.expandable > summary { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; min-height: 58px; padding: 16px 2px; cursor: pointer; }
.expandable > summary span { color: var(--fg-dim); font-size: 13px; }
.expandable[open] > summary { color: var(--accent-text); }
@media (max-width: 520px) { .expandable > summary { align-items: flex-start; flex-direction: column; gap: 2px; } }
</style>
