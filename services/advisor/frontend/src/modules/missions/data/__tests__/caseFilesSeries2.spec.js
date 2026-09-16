import { describe, expect, it } from 'vitest'
import { caseFilesSeries2 } from '../caseFilesSeries2.js'
import caseData from '../sampleCaseFiles.js'

const ORIGINAL_CASE_IDS = [
  'case-vanishing-points-01',
  'case-all-red-morning-01',
  'case-flight-01-cold-room',
  'case-flight-02-museum-light',
  'case-flight-03-fab-queue',
  'case-flight-04-shelter-map',
  'case-flight-05-greenhouse-rain',
  'case-flight-06-water-alarm',
]

describe('TKT-157 사건 파일 시리즈 2', () => {
  it('기존 8편을 그대로 둔 뒤 신규 2편을 덧붙인다', () => {
    expect(caseData.caseFiles.slice(0, 8).map((caseFile) => caseFile.id)).toEqual(ORIGINAL_CASE_IDS)
    expect(caseData.caseFiles.slice(8)).toEqual(caseFilesSeries2)
  })

  it('각 편은 닷새 단서와 단일 정답·원인 코드 또는 설정을 갖춘다', () => {
    expect(caseFilesSeries2).toHaveLength(2)
    for (const caseFile of caseFilesSeries2) {
      expect(caseFile.days.map((day) => day.day)).toEqual([1, 2, 3, 4, 5])
      expect(caseFile.days.every((day) => day.kind && day.title && day.content)).toBe(true)
      expect(caseFile.finale.options).toHaveLength(4)
      expect(caseFile.finale.options.filter((option) => option.key === caseFile.finale.answerKey)).toHaveLength(1)
      expect(caseFile.finale.explanation).toMatch(/`[^`]+`/)
      expect(caseFile.finale.epilogue).toBeTruthy()
    }
  })
})
