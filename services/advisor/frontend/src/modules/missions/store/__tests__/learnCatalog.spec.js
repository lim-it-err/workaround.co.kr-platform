import { describe, expect, it } from 'vitest'
import caseData from '../../data/sampleCaseFiles.js'
import sample from '../../data/sampleContent.js'
import projectData from '../../data/sampleProjects.js'
import { extraMissions } from '../../data/inflightContent.js'
import { practiceCatalog, standalonePracticeCatalog } from '../../games/practiceCatalog.js'
import { createCourseCatalog } from '../courseCatalog.js'
import { courseProgress, createLearnCatalog, filterLearnCatalog, summarizeLearnCatalog } from '../learnCatalog.js'

const missions = [...sample.missions, ...extraMissions]
const emptyLearner = {
  submissions: {}, explanations: {}, chats: {}, meetingChats: {}, plannerSubmissions: {},
  findingsDrafts: {}, caseProgress: {}, projectSubmissions: {},
}
const emptyPractice = { completed: {} }

function makeCatalog(learnerState = emptyLearner, practiceState = emptyPractice) {
  return createLearnCatalog({
    missions,
    courses: createCourseCatalog(missions),
    caseFiles: caseData.caseFiles,
    projects: projectData.projects,
    practiceGames: standalonePracticeCatalog,
    learnerState,
    practiceState,
  })
}

function defaultFilters(patch = {}) {
  return {
    query: '', time: 'all', code: 'all', kind: 'all', status: 'all',
    difficulty: [], scope: [], missionType: [], ...patch,
  }
}

describe('배우기 통합 인덱스', () => {
  it('다섯 콘텐츠 형식을 206개 단일 목록으로 정규화한다', () => {
    const catalog = makeCatalog()
    expect(catalog).toHaveLength(206)
    expect(Object.fromEntries(summarizeLearnCatalog(catalog).map((entry) => [entry.kind, entry.count]))).toEqual({
      course: 3,
      mission: 39,
      case: 10,
      project: 1,
      practice: 153,
    })
  })

  it('시간·코드 작성·형식·완료의 네 기본 축을 함께 적용한다', () => {
    const completedRound = standalonePracticeCatalog[0].rounds[0]
    const catalog = makeCatalog(emptyLearner, { completed: { reading: [completedRound.id] } })
    const result = filterLearnCatalog(catalog, defaultFilters({
      time: 'quick', code: 'no', kind: 'practice', status: 'completed',
    }))
    expect(result).toHaveLength(1)
    expect(result[0].href).toBe(`/games/practice/reading/${completedRound.id}`)
  })

  it('기존 12개 미션 칩을 고급 필터로 교차 적용한다', () => {
    const result = filterLearnCatalog(makeCatalog(), defaultFilters({
      difficulty: ['Easy'], scope: ['단일 파일'], missionType: ['리팩토링'],
    }))
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.kind === 'mission')).toBe(true)
    expect(result.every((item) => item.difficulty === 'Easy' && item.scope === '단일 파일' && item.missionType === '리팩토링')).toBe(true)
  })

  it('미션·사건·프로젝트의 저장 기록을 완료 상태로 반영한다', () => {
    const mission = missions[0]
    const caseFile = caseData.caseFiles[0]
    const project = projectData.projects[0]
    const learnerState = {
      ...emptyLearner,
      submissions: { [mission.id]: [{ submittedAt: '2026-09-14' }] },
      caseProgress: { [caseFile.id]: { verdict: 'answer' } },
      projectSubmissions: Object.fromEntries(project.subMissions.map((item) => [item.id, { submittedAt: '2026-09-14' }])),
    }
    const completed = filterLearnCatalog(makeCatalog(learnerState), defaultFilters({ status: 'completed' }))
    expect(completed.some((item) => item.id === `mission:${mission.id}`)).toBe(true)
    expect(completed.some((item) => item.id === `case:${caseFile.id}`)).toBe(true)
    expect(completed.some((item) => item.id === `project:${project.id}`)).toBe(true)
  })

  it('코스 게임을 마치면 다음 회차가 실제 다음 미션으로 전진한다', () => {
    const vienna = createCourseCatalog(missions).find((course) => course.id === 'vienna-1900')
    const firstGame = practiceCatalog.find((game) => game.id === vienna.missions[0].id)
    const progress = courseProgress(vienna, emptyLearner, {
      completed: { [firstGame.id]: firstGame.rounds.map((round) => round.id) },
    }, practiceCatalog)

    expect(progress.status).toBe('in-progress')
    expect(progress.progress).toBe('1/12')
    expect(progress.nextMission.id).toBe('v1900-b-pigments')
    expect(progress.nextMission.minutes).toBe(90)
  })
})
