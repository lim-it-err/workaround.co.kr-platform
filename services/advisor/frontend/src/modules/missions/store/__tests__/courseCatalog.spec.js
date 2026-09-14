import { describe, expect, it } from 'vitest'
import sample from '../../data/sampleContent.js'
import { extraMissions } from '../../data/inflightContent.js'
import { courseVienna1900 } from '../../data/courseVienna1900.js'
import {
  courseMissionTarget,
  createCourseCatalog,
  findCourseMission,
} from '../courseCatalog.js'

const baseMissions = [...sample.missions, ...extraMissions]
const courses = createCourseCatalog(baseMissions)

describe('Advisor 코스 카탈로그', () => {
  it('기존 39개 미션을 기본 코스에 그대로 묶고 비엔나 코스를 함께 노출한다', () => {
    expect(courses.map((course) => course.id)).toEqual(['foundations', 'vienna-1900'])
    expect(courses[0].missions).toHaveLength(39)
    expect(courses[0].missions.map((mission) => mission.id)).toEqual(baseMissions.map((mission) => mission.id))
  })

  it('비엔나 1900을 코딩 6·게임 5·시뮬 1로 분류한다', () => {
    const counts = courseVienna1900.missions.reduce((result, mission) => {
      ;(result[mission.kind] ??= []).push(mission)
      return result
    }, {})
    expect(counts.coding).toHaveLength(6)
    expect(counts.game).toHaveLength(5)
    expect(counts.sim).toHaveLength(1)
  })

  it('세 형식을 기존 수행 화면과 코스 시뮬 화면으로 연결한다', () => {
    const coding = findCourseMission(courses, 'vienna-1900', 'v1900-b-pigments').mission
    const game = findCourseMission(courses, 'vienna-1900', 'v1900-2-gold-damage').mission
    const sim = findCourseMission(courses, 'vienna-1900', 'v1900-5-entry-queue').mission

    expect(courseMissionTarget('vienna-1900', coding).path).toBe('/missions/v1900-b-pigments')
    expect(courseMissionTarget('vienna-1900', game).path).toBe('/games/practice/v1900-2-gold-damage')
    expect(courseMissionTarget('vienna-1900', sim).path).toBe('/courses/vienna-1900/sim/v1900-5-entry-queue')
  })
})
