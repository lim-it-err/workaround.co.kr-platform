import { courseVienna1900 } from '../data/courseVienna1900.js'

export const COURSE_FORMATS = {
  coding: { label: '코딩', className: 'coding' },
  game: { label: '게임', className: 'game' },
  sim: { label: '시뮬', className: 'sim' },
}

function baseCourseMission(mission) {
  return {
    id: mission.id,
    kind: 'coding',
    title: mission.title,
    minutes: mission.estimatedMinutes,
  }
}

function withStation(course, index) {
  return {
    ...course,
    stationCode: `A${String(index + 1).padStart(2, '0')}`,
    missionCount: course.missions.length,
  }
}

export function createCourseCatalog(baseMissions = []) {
  return [
    {
      id: 'foundations',
      title: '기본 코스',
      subtitle: '분리와 계약부터 현실의 압력까지',
      theme: '소프트웨어 설계',
      intro: '기존 미션을 한 정류장에 모았습니다. 익숙한 순서와 제출 기록은 그대로 유지됩니다.',
      missions: baseMissions.map(baseCourseMission),
    },
    courseVienna1900,
  ].map(withStation)
}

export function courseMissionTarget(courseId, mission) {
  if (!mission) return null
  if (mission.kind === 'coding') return { path: `/missions/${mission.id}` }
  if (mission.kind === 'game') return { path: `/games/practice/${mission.id}` }
  if (mission.kind === 'sim') return { path: `/courses/${courseId}/sim/${mission.id}` }
  return null
}

export function findCourse(courses, courseId) {
  return courses.find((course) => course.id === courseId) ?? null
}

export function findCourseMission(courses, courseId, missionId) {
  const course = findCourse(courses, courseId)
  const mission = course?.missions.find((entry) => entry.id === missionId) ?? null
  return mission ? { course, mission } : null
}
