import { describe, expect, it } from 'vitest'
import seasonsContent from '../../data/sampleSeasons.js'
import {
  activeSeason,
  buildSeasonOverview,
  lifetimeTotals,
  lockSeasonEnding,
  normalizeSeasons,
  recordSeasonGain,
  selectSeasonEnding,
  startNewSeason,
} from '../seasonStats.js'

const DAY = new Date('2026-08-03T09:00:00+09:00')

function season(start = '2026-08-03', gains = []) {
  return {
    id: `season-${start}`,
    start,
    end: '2026-08-30',
    gains,
    closedAt: null,
    ending: null,
  }
}

describe('시즌 수명주기', () => {
  it('첫 방문은 빈 상태이고 구 seasonStats는 기록 수 그대로 한 시즌으로 마이그레이션한다', () => {
    expect(normalizeSeasons(undefined, undefined, DAY)).toEqual({
      activeId: null,
      byId: {},
      pendingGains: [],
    })

    const legacyGains = [
      { date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0' },
      { date: '2026-08-04', stat: 'vision', amount: 3, source: 'mission-submit:s1-wine-01' },
    ]
    const migrated = normalizeSeasons({ invalid: true }, {
      seasonStart: '2026-08-03',
      gains: legacyGains,
    }, DAY)

    expect(migrated.activeId).toBe('season-2026-08-03')
    expect(migrated.byId[migrated.activeId]).toMatchObject({
      id: 'season-2026-08-03',
      start: '2026-08-03',
      end: '2026-08-30',
      closedAt: null,
      ending: null,
    })
    expect(migrated.byId[migrated.activeId].gains).toEqual(legacyGains)
  })

  it('같은 날 같은 source는 한 번만 적립하고 29일차는 ended 사유로 거절한다', () => {
    const current = season()

    expect(recordSeasonGain(current, {
      date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0',
    })).toMatchObject({ ok: true })
    expect(recordSeasonGain(current, {
      date: '2026-08-03', stat: 'culture', amount: 1, source: 'routine-check:0',
    })).toEqual({ ok: false, reason: 'duplicate' })
    expect(recordSeasonGain(current, {
      date: '2026-08-31', stat: 'culture', amount: 1, source: 'routine-check:1',
    })).toEqual({ ok: false, reason: 'ended' })
    expect(current.gains).toHaveLength(1)
  })

  it('hidden → dominant → balanced → quiet 순으로 엔딩을 판정한다', () => {
    const endings = seasonsContent.seasonEndings
    const totals = (vision, voice, judgment, culture) => ({ vision, voice, judgment, culture })

    expect(selectSeasonEnding(endings, totals(50, 1, 1, 1), 24).id).toBe('ending-burnout')
    expect(selectSeasonEnding(endings, totals(45, 20, 10, 5), 0).id).toBe('ending-vision')
    expect(selectSeasonEnding(endings, totals(20, 20, 15, 15), 0).id).toBe('ending-generalist')
    expect(selectSeasonEnding(endings, totals(3, 3, 3, 3), 0).id).toBe('ending-quiet')
  })

  it('종료 결말을 고정하고 새 시즌에 대기 적립을 재시도해도 과거 합계와 결말은 바뀌지 않는다', () => {
    const old = season('2026-08-03', [
      { date: '2026-08-03', stat: 'vision', amount: 45, source: 'legacy' },
    ])
    const all = {
      activeId: old.id,
      byId: { [old.id]: old },
      pendingGains: [
        { date: '2026-08-31', stat: 'judgment', amount: 2, source: 'boundary-choice:test' },
      ],
    }
    const now = new Date('2026-08-31T09:00:00+09:00')

    expect(lockSeasonEnding(old, {}, seasonsContent.seasonEndings, now)).toBe(true)
    expect(old.ending).toEqual({ id: 'ending-vision', title: '경계를 긋는 사람' })
    const result = startNewSeason(all, now)

    expect(result).toMatchObject({ ok: true, retried: 1 })
    expect(old).toMatchObject({
      ending: { id: 'ending-vision', title: '경계를 긋는 사람' },
      closedAt: now.toISOString(),
    })
    expect(old.gains).toHaveLength(1)
    expect(activeSeason(all).gains).toEqual([
      { date: '2026-08-31', stat: 'judgment', amount: 2, source: 'boundary-choice:test' },
    ])
    expect(lifetimeTotals(all)).toEqual({ vision: 45, voice: 0, judgment: 2, culture: 0 })
  })

  it('진행 중인 시즌에는 자동으로 새 시즌을 만들지 않는다', () => {
    const current = season()
    const all = { activeId: current.id, byId: { [current.id]: current }, pendingGains: [] }

    expect(startNewSeason(all, new Date('2026-08-10T09:00:00+09:00'))).toEqual({
      ok: false,
      reason: 'active',
    })
    expect(Object.keys(all.byId)).toEqual([current.id])
  })

  it('28일 시즌의 종료와 평일·주말 완주일을 계산한다', () => {
    const current = season()
    const routineHistory = {
      '2026-08-03': 3,
      '2026-08-08': 2,
      '2026-08-09': 1,
      '2026-07-31': 3,
    }

    lockSeasonEnding(current, routineHistory, seasonsContent.seasonEndings, new Date('2026-08-31T09:00:00+09:00'))
    const overview = buildSeasonOverview(
      current,
      routineHistory,
      seasonsContent.seasonEndings,
      new Date('2026-08-31T09:00:00+09:00'),
    )

    expect(overview.ended).toBe(true)
    expect(overview.endDate).toBe('2026-08-30')
    expect(overview.perfectDays).toBe(2)
  })
})
