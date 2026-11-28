// 미션·코스·형식 개수와 기본 코스 합계 시간을 데이터에서 계산한다.
// 콘텐츠를 추가·삭제해도 e2e 기대값을 다시 고치지 않도록 여기서만 읽는다.
import { extraMissions } from '../../src/modules/missions/data/inflightContent.js'
import sample from '../../src/modules/missions/data/sampleContent.js'
import caseData from '../../src/modules/missions/data/sampleCaseFiles.js'
import projectData from '../../src/modules/missions/data/sampleProjects.js'
import { standalonePracticeCatalog } from '../../src/modules/missions/games/practiceCatalog.js'
import { createCourseCatalog } from '../../src/modules/missions/store/courseCatalog.js'
import { formatDuration } from '../../src/modules/missions/store/durationFormat.js'

export const missions = [...sample.missions, ...extraMissions]

export const missionCount = missions.length

// 기본 코스 행의 「전체 …」 표기. 표시 규칙은 formatDuration 을 그대로 쓴다.
const foundationMinutes = missions.reduce((sum, mission) => sum + (mission.estimatedMinutes ?? 0), 0)
export const foundationTimeText = `전체 ${formatDuration(foundationMinutes)}`

export const learnKindCounts = {
  course: createCourseCatalog(missions).length,
  mission: missions.length,
  case: caseData.caseFiles.length,
  project: projectData.projects.length,
  practice: standalonePracticeCatalog.reduce((sum, game) => sum + game.rounds.length, 0),
}
