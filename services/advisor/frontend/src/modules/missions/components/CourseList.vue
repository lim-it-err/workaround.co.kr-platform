<script setup>
import { computed } from 'vue'
import { practiceCatalog } from '../games/practiceCatalog.js'
import { formatDuration } from '../store/durationFormat.js'
import { courseProgress } from '../store/learnCatalog.js'
import { useMissions } from '../store/missions.js'
import { usePractice } from '../store/practice.js'

defineProps({ embedded: { type: Boolean, default: false } })

const learner = useMissions()
const practice = usePractice()
const courseRows = computed(() => learner.state.courses.map((course) => {
  const progress = courseProgress(course, learner.state, practice.state, practiceCatalog)
  return {
    ...course,
    nextMinutes: progress.nextMission?.minutes ?? null,
    totalMinutes: course.missions.reduce((sum, mission) => sum + (mission.minutes ?? 0), 0),
  }
}))
</script>

<template>
  <section class="course-list" :aria-labelledby="embedded ? undefined : 'course-list-title'">
    <header v-if="!embedded" class="course-head">
      <span>배우기 · 코스</span>
      <h1 id="course-list-title">정류장을 고르세요</h1>
      <p>하나의 주제를 따라 코딩·게임·시뮬을 이어갑니다.</p>
    </header>

    <div class="course-rows">
      <router-link
        v-for="course in courseRows"
        :key="course.id"
        :to="`/courses/${course.id}`"
        class="course-row"
        :data-course-id="course.id"
      >
        <span class="course-station-code" aria-hidden="true">{{ course.stationCode }}</span>
        <span class="course-copy">
          <small>{{ course.theme }}</small>
          <strong>{{ course.title }}</strong>
          <span>{{ course.subtitle }}</span>
        </span>
        <span class="course-time">
          <strong>{{ course.nextMinutes === null ? '완료' : `다음 ${formatDuration(course.nextMinutes)}` }}</strong>
          <small>전체 {{ formatDuration(course.totalMinutes) }} · {{ course.missionCount }}개</small>
        </span>
        <span class="course-arrow" aria-hidden="true">→</span>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.course-list { min-width: 0; }
.course-head { margin-bottom: 22px; padding: 10px 0 20px 20px; border-left: 3px solid var(--accent); }
.course-head > span { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.course-head h1 { margin: 6px 0 5px; font-size: clamp(24px, 4vw, 32px); }
.course-head p { margin: 0; color: var(--fg-dim); }
.course-rows { border-top: 1px solid var(--line); }
.course-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  min-height: 78px;
  padding: 12px 2px;
  border-bottom: 1px solid var(--line);
  color: var(--fg);
  text-decoration: none;
}
.course-row:hover .course-copy strong, .course-row:focus-visible .course-copy strong { color: var(--accent-text); }
.course-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.course-station-code {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 2px solid var(--accent);
  border-radius: 50%;
  color: var(--accent-text);
  font-size: 12px;
  font-weight: 850;
}
.course-copy { display: grid; gap: 2px; min-width: 0; }
.course-copy small { color: var(--accent-text); font-size: 11px; font-weight: 750; }
.course-copy strong { font-size: 17px; line-height: 1.35; transition: color .15s; }
.course-copy span { overflow: hidden; color: var(--fg-dim); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.course-time { display: grid; gap: 3px; text-align: right; white-space: nowrap; }
.course-time strong { color: var(--fg); font-size: 12px; font-variant-numeric: tabular-nums; }
.course-time small { color: var(--fg-dim); font-size: 11px; font-variant-numeric: tabular-nums; }
.course-arrow { color: var(--accent-text); font-weight: 800; }
@media (max-width: 520px) {
  .course-row { grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; }
  .course-time { grid-column: 2; justify-self: start; text-align: left; }
  .course-arrow { grid-column: 3; grid-row: 1 / span 2; }
  .course-copy span { white-space: normal; }
}
</style>
