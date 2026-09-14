import { beforeEach, describe, expect, it } from 'vitest'
import { clearDraftThrough, DRAFT_STORAGE_KEY, draftKey, readDraft, writeDraft } from '../drafts.js'

beforeEach(() => localStorage.clear())

describe('mission draft contract', () => {
  it('stores exact files and descriptions per mission and mode', () => {
    const first = writeDraft({
      missionId: 'mission-1',
      mode: 'developer',
      files: [{ name: 'Main.java', body: 'class Main {}' }, { name: 'MainTest.java', body: 'class MainTest {}' }],
      description: '설명 초안',
      now: new Date('2026-09-14T01:02:03.000Z'),
    })
    writeDraft({
      missionId: 'mission-1',
      mode: 'plannerReview',
      files: [{ name: 'review.md', body: '검토' }],
      description: '',
      now: new Date('2026-09-14T01:03:00.000Z'),
    })

    expect(first.updatedAt).toBe('2026-09-14T01:02:03.000Z')
    expect(readDraft('mission-1', 'developer')).toMatchObject({
      files: [{ name: 'Main.java', body: 'class Main {}' }, { name: 'MainTest.java', body: 'class MainTest {}' }],
      description: '설명 초안',
    })
    expect(Object.keys(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY)))).toEqual([
      draftKey('mission-1', 'developer'),
      draftKey('mission-1', 'plannerReview'),
    ])
  })

  it('clears only the submitted snapshot and preserves newer input', () => {
    writeDraft({
      missionId: 'mission-1', mode: 'developer', files: [], description: '제출분',
      now: new Date('2026-09-14T01:00:00.000Z'),
    })
    writeDraft({
      missionId: 'mission-2', mode: 'developer', files: [], description: '다른 미션',
      now: new Date('2026-09-14T01:00:00.000Z'),
    })
    expect(clearDraftThrough('mission-1', 'developer', '2026-09-14T01:00:01.000Z')).toBe(true)
    expect(readDraft('mission-1', 'developer')).toBeNull()
    expect(readDraft('mission-2', 'developer')?.description).toBe('다른 미션')

    writeDraft({
      missionId: 'mission-1', mode: 'developer', files: [], description: '응답 대기 중 입력',
      now: new Date('2026-09-14T01:00:03.000Z'),
    })
    expect(clearDraftThrough('mission-1', 'developer', '2026-09-14T01:00:02.000Z')).toBe(false)
    expect(readDraft('mission-1', 'developer')?.description).toBe('응답 대기 중 입력')
  })
})
