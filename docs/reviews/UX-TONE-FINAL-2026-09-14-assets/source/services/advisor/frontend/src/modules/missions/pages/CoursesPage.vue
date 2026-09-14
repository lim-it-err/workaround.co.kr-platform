<script setup>
import CourseList from '../components/CourseList.vue'
</script>

<template>
  <div class="courses-page">
    <router-link to="/learn" class="back-link">← 배우기</router-link>
    <CourseList />
  </div>
</template>

<style scoped>
.courses-page { max-width: 860px; margin: 0 auto; }
.back-link { display: inline-flex; min-height: 40px; align-items: center; margin-bottom: 12px; color: var(--accent-text); text-decoration: none; }
</style>
