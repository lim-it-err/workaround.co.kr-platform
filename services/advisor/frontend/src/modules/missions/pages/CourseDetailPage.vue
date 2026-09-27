<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { COURSE_FORMATS, courseMissionTarget } from '../store/courseCatalog.js'
import { formatDuration } from '../store/durationFormat.js'
import { useMissions } from '../store/missions.js'

const route = useRoute()
const store = useMissions()
const course = computed(() => store.getCourse(String(route.params.courseId)))
const totalMinutes = computed(() => course.value?.missions.reduce((sum, mission) => sum + (mission.minutes ?? 0), 0) ?? 0)

function targetFor(mission) {
  const target = courseMissionTarget(course.value.id, mission)
  return target ? {
    ...target,
    state: { from: `/courses/${course.value.id}`, fromLabel: `${course.value.title} 코스` },
  } : null
}

function statusFor(mission) {
  return mission.kind === 'coding' ? store.missionStatus(mission.id) : '진행 가능'
}
</script>

<template>
  <div v-if="course" class="course-page">
    <router-link to="/learn#courses" class="back-link">← 코스 목록</router-link>

    <header class="course-hero">
      <span class="course-station-code">{{ course.stationCode }}</span>
      <div>
        <small>{{ course.theme }}</small>
        <h1>{{ course.title }}</h1>
        <p class="subtitle">{{ course.subtitle }}</p>
      </div>
    </header>
    <p class="intro">{{ course.intro }}</p>

    <section aria-labelledby="course-timetable-title">
      <div class="section-head">
        <h2 id="course-timetable-title">미션 시각표</h2>
        <span>{{ course.missionCount }}개 · 전체 {{ formatDuration(totalMinutes) }}</span>
      </div>
      <div class="mission-rows">
        <router-link
          v-for="(mission, index) in course.missions"
          :key="mission.id"
          :to="targetFor(mission)"
          class="mission-row"
          :data-mission-id="mission.id"
        >
          <span class="sequence">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="mission-copy">
            <strong>{{ mission.title }}</strong>
            <small>{{ mission.minutes ? formatDuration(mission.minutes) : '자유 진행' }}</small>
          </span>
          <span class="format-badge" :class="COURSE_FORMATS[mission.kind]?.className">
            {{ COURSE_FORMATS[mission.kind]?.label }}
          </span>
          <span class="status" :class="{ done: statusFor(mission) === '제출됨' }">{{ statusFor(mission) }}</span>
          <span class="arrow" aria-hidden="true">→</span>
        </router-link>
      </div>
    </section>
  </div>

  <div v-else class="not-found">
    <h1>코스를 찾지 못했습니다</h1>
    <router-link to="/learn#courses" class="btn primary">코스 목록으로</router-link>
  </div>
</template>

<style scoped>
.course-page, .not-found { max-width: 860px; margin: 0 auto; min-width: 0; }
.back-link { display: inline-flex; min-height: 40px; align-items: center; color: var(--accent-text); text-decoration: none; }
.course-hero { display: flex; align-items: center; gap: 18px; margin: 12px 0 18px; padding: 16px 0 20px 20px; border-left: 3px solid var(--accent); }
.course-station-code { display: inline-grid; flex: 0 0 52px; width: 52px; height: 52px; place-items: center; border: 2px solid var(--accent); border-radius: 50%; color: var(--accent-text); font-size: 13px; font-weight: 850; }
.course-hero small { color: var(--accent-text); font-size: 12px; font-weight: 800; }
.course-hero h1 { margin: 4px 0 2px; font-size: clamp(25px, 4vw, 36px); }
.subtitle { margin: 0; color: var(--fg-dim); }
.intro { max-width: 720px; margin: 0 0 30px; color: var(--fg-dim); line-height: 1.75; }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.section-head h2 { margin: 0 0 10px; font-size: 19px; }
.section-head span { color: var(--fg-dim); font-size: 13px; }
.mission-rows { border-top: 1px solid var(--line); }
.mission-row { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto 72px 18px; align-items: center; gap: 12px; min-height: 64px; padding: 10px 2px; border-bottom: 1px solid var(--line); color: var(--fg); text-decoration: none; }
.mission-row:hover .mission-copy strong, .mission-row:focus-visible .mission-copy strong { color: var(--accent-text); }
.mission-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.sequence { color: var(--fg-dim); font-size: 12px; font-variant-numeric: tabular-nums; }
.mission-copy { display: grid; gap: 3px; min-width: 0; }
.mission-copy strong { line-height: 1.4; transition: color .15s; }
.mission-copy small, .status { color: var(--fg-dim); font-size: 12px; }
.format-badge { min-width: 44px; padding: 4px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 11px; font-weight: 800; text-align: center; }
.format-badge.coding { color: var(--accent-text); }
.format-badge.game { color: var(--good); }
.format-badge.sim { color: var(--warn); }
.status { text-align: right; }
.status.done { color: var(--good); }
.arrow { color: var(--accent-text); }
@media (max-width: 620px) {
  .course-hero { align-items: flex-start; padding-left: 14px; }
  .mission-row { grid-template-columns: 28px minmax(0, 1fr) auto; gap: 8px; }
  .format-badge { grid-column: 2; justify-self: start; }
  .status { grid-column: 2; justify-self: end; margin-top: -28px; }
  .arrow { grid-column: 3; grid-row: 1 / span 2; }
}
</style>
