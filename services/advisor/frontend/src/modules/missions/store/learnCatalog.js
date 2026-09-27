const NO_CODE_MISSION_TYPES = new Set(['코드 판독', '설계 리뷰', '배역극'])

export const LEARN_KIND_OPTIONS = [
  { value: 'all', label: '전체 형식' },
  { value: 'course', label: '코스' },
  { value: 'mission', label: '미션' },
  { value: 'case', label: '사건 파일' },
  { value: 'project', label: '프로젝트' },
  { value: 'practice', label: '연습' },
]

export const LEARN_TIME_OPTIONS = [
  { value: 'all', label: '전체 시간' },
  { value: 'quick', label: '5분 이하' },
  { value: 'short', label: '6–30분' },
  { value: 'session', label: '31–90분' },
  { value: 'deep', label: '90분 초과' },
]

export const LEARN_CODE_OPTIONS = [
  { value: 'all', label: '코드 작성 전체' },
  { value: 'yes', label: '코드 작성함' },
  { value: 'no', label: '코드 작성 안 함' },
]

export const LEARN_STATUS_OPTIONS = [
  { value: 'all', label: '전체 완료 상태' },
  { value: 'not-started', label: '시작 전' },
  { value: 'in-progress', label: '진행 중' },
  { value: 'completed', label: '완료' },
]

export const ADVANCED_FILTER_GROUPS = [
  { key: 'difficulty', label: '난이도', values: ['Easy', 'Normal', 'Hard'] },
  { key: 'scope', label: '범위', values: ['단일 파일', '여러 파일', '모듈 경계'] },
  { key: 'missionType', label: '미션 유형', values: ['리팩토링', '기능 추가', '도메인 로직 구현', '설계 리뷰', '코드 판독', '배역극'] },
]

const KIND_LABELS = {
  course: '코스',
  mission: '미션',
  case: '사건 파일',
  project: '프로젝트',
  practice: '연습',
}

const STATUS_LABELS = {
  'not-started': '시작 전',
  'in-progress': '진행 중',
  completed: '완료',
}

function normalizedItem(item) {
  const status = item.status ?? 'not-started'
  return {
    ...item,
    kindLabel: KIND_LABELS[item.kind],
    status,
    statusLabel: STATUS_LABELS[status],
    searchText: `${item.title} ${item.context ?? ''} ${item.kindLabel ?? KIND_LABELS[item.kind]}`.toLowerCase(),
  }
}

function missionStatus(mission, state) {
  const submitted = Boolean(state.submissions?.[mission.id]?.length || state.plannerSubmissions?.[mission.id]?.review)
  if (submitted) return 'completed'
  const started = Boolean(
    state.explanations?.[mission.id]
    || state.chats?.[mission.id]?.length
    || state.meetingChats?.[mission.id]?.length
    || state.plannerSubmissions?.[mission.id]?.meeting
    || state.findingsDrafts?.[mission.id]?.length,
  )
  return started ? 'in-progress' : 'not-started'
}

function courseMissionDone(mission, learnerState, practiceState, practiceById) {
  if (mission.kind === 'coding') {
    return Boolean(learnerState.submissions?.[mission.id]?.length || learnerState.plannerSubmissions?.[mission.id]?.review)
  }
  if (mission.kind === 'game') {
    const game = practiceById.get(mission.id)
    const completed = practiceState.completed?.[mission.id] ?? []
    return Boolean(game?.rounds?.length && completed.length >= game.rounds.length)
  }
  return false
}

export function courseProgress(course, learnerState, practiceState, practiceGames = []) {
  const practiceById = new Map(practiceGames.map((game) => [game.id, game]))
  const completed = course.missions.filter((mission) => courseMissionDone(mission, learnerState, practiceState, practiceById)).length
  const nextMission = course.missions.find((mission) => !courseMissionDone(mission, learnerState, practiceState, practiceById)) ?? null
  return {
    status: completed === course.missions.length ? 'completed' : completed ? 'in-progress' : 'not-started',
    progress: `${completed}/${course.missions.length}`,
    nextMission,
  }
}

export function createLearnCatalog({
  missions,
  courses,
  caseFiles,
  projects,
  practiceGames,
  coursePracticeGames = practiceGames,
  learnerState,
  practiceState,
}) {
  const courseItems = courses.map((course) => {
    const progress = courseProgress(course, learnerState, practiceState, coursePracticeGames)
    return normalizedItem({
      id: `course:${course.id}`,
      sourceId: course.id,
      kind: 'course',
      title: course.title,
      context: `${course.stationCode} · ${course.subtitle} · ${course.missions.length}개 · ${progress.progress}`,
      minutes: course.missions.reduce((sum, mission) => sum + (mission.minutes ?? 0), 0),
      nextMinutes: progress.nextMission?.minutes ?? null,
      writesCode: course.missions.some((mission) => mission.kind === 'coding'),
      status: progress.status,
      href: `/courses/${course.id}`,
      emoji: course.emoji ?? '🧭',
    })
  })

  const missionItems = missions.map((mission) => normalizedItem({
    id: `mission:${mission.id}`,
    sourceId: mission.id,
    kind: 'mission',
    title: mission.title,
    context: `${mission.domainEmoji ?? '🧩'} ${mission.domain} · ${mission.missionType}`,
    minutes: mission.estimatedMinutes,
    writesCode: !NO_CODE_MISSION_TYPES.has(mission.missionType),
    status: missionStatus(mission, learnerState),
    href: `/missions/${mission.id}`,
    emoji: mission.domainEmoji ?? '🧩',
    difficulty: mission.difficulty,
    scope: mission.scope,
    missionType: mission.missionType,
  }))

  const caseItems = caseFiles.map((caseFile) => {
    const progress = learnerState.caseProgress?.[caseFile.id]
    return normalizedItem({
      id: `case:${caseFile.id}`,
      sourceId: caseFile.id,
      kind: 'case',
      title: caseFile.title,
      context: caseFile.tagline,
      minutes: 30,
      writesCode: false,
      status: progress?.verdict ? 'completed' : progress?.openedDays ? 'in-progress' : 'not-started',
      href: `/games/case/${caseFile.id}`,
      emoji: caseFile.emoji,
    })
  })

  const projectItems = projects.map((project) => {
    const completed = project.subMissions.filter((mission) => learnerState.projectSubmissions?.[mission.id]).length
    return normalizedItem({
      id: `project:${project.id}`,
      sourceId: project.id,
      kind: 'project',
      title: project.title,
      context: `${project.domain} · ${completed}/${project.subMissions.length}`,
      minutes: project.subMissions.reduce((sum, mission) => sum + (mission.estimatedMinutes ?? 0), 0),
      writesCode: true,
      status: completed === project.subMissions.length ? 'completed' : completed ? 'in-progress' : 'not-started',
      href: `/projects/${project.id}`,
      emoji: project.emoji,
    })
  })

  const practiceItems = practiceGames.flatMap((game) => game.rounds.map((round) => normalizedItem({
    id: `practice:${game.id}:${round.id}`,
    sourceId: round.id,
    gameId: game.id,
    kind: 'practice',
    title: round.title ?? round.question ?? game.title,
    context: `${game.emoji} ${game.title}`,
    minutes: round.minutes ?? game.minutes,
    writesCode: false,
    status: (practiceState.completed?.[game.id] ?? []).includes(round.id) ? 'completed' : 'not-started',
    href: `/games/practice/${game.id}/${round.id}`,
    emoji: game.emoji,
  })))

  return [...courseItems, ...missionItems, ...caseItems, ...projectItems, ...practiceItems]
}

function matchesTime(minutes, filter) {
  if (filter === 'quick') return minutes <= 5
  if (filter === 'short') return minutes > 5 && minutes <= 30
  if (filter === 'session') return minutes > 30 && minutes <= 90
  if (filter === 'deep') return minutes > 90
  return true
}

export function filterLearnCatalog(items, filters) {
  const query = filters.query.trim().toLowerCase()
  const advancedActive = filters.difficulty.length || filters.scope.length || filters.missionType.length
  return items.filter((item) => {
    if (query && !item.searchText.includes(query)) return false
    if (filters.time !== 'all' && !matchesTime(item.minutes, filters.time)) return false
    if (filters.code !== 'all' && item.writesCode !== (filters.code === 'yes')) return false
    if (filters.kind !== 'all' && item.kind !== filters.kind) return false
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (advancedActive && item.kind !== 'mission') return false
    if (filters.difficulty.length && !filters.difficulty.includes(item.difficulty)) return false
    if (filters.scope.length && !filters.scope.includes(item.scope)) return false
    if (filters.missionType.length && !filters.missionType.includes(item.missionType)) return false
    return true
  })
}

export function summarizeLearnCatalog(items) {
  return LEARN_KIND_OPTIONS.slice(1).map(({ value, label }) => ({
    kind: value,
    label,
    count: items.filter((item) => item.kind === value).length,
  }))
}
