import { expect, test } from '@playwright/test'
import { getPracticeGame } from '../src/modules/missions/games/practiceCatalog.js'

const MISSION_ID = 's1-wine-01'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
  await page.goto('/today')
  await page.evaluate(() => localStorage.clear())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('일일 Probe는 관측 뒤 결과와 다음 가설이 375px에서 바로 이어진다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.evaluate(() => localStorage.setItem('workaround-theme', 'dark'))
  await page.clock.setFixedTime(new Date('2026-08-03T09:00:00'))
  await page.evaluate(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      seasonStats: { seasonStart: '2026-08-03', gains: [] },
    }))
  })
  await page.goto('/games/probe')

  await page.getByRole('button', { name: '오늘 오후의 슬로우 쿼리 로그를 연다' }).click()
  const postObservation = page.locator('.post-observation')
  const observation = postObservation.locator('.observation')
  const hypothesis = postObservation.locator('.hypothesis-step')
  const firstHypothesis = hypothesis.getByRole('button').first()
  await expect(observation).toContainText('order 테이블 full scan')
  await expect(firstHypothesis).toBeInViewport()

  const layout = await postObservation.evaluate(node => {
    const result = node.querySelector('.observation')?.getBoundingClientRect()
    const next = node.querySelector('.hypothesis-step')?.getBoundingClientRect()
    return {
      resultBeforeNext: Boolean(result && next && result.top < next.top),
      gap: result && next ? next.top - result.bottom : Number.POSITIVE_INFINITY,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  expect(layout.resultBeforeNext).toBe(true)
  expect(layout.gap).toBeLessThanOrEqual(16)
  expect(layout.overflow).toBe(0)
  await expect(page.getByText(/위의 가설/)).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('probe-daily-dark-375.png'), fullPage: true })
})

test('Probe 연습 15판은 관측 → 가설 → 결말 순서를 모두 지킨다', async ({ page }, testInfo) => {
  const probeGame = getPracticeGame('probe')
  expect(probeGame.rounds).toHaveLength(15)

  for (const [index, round] of probeGame.rounds.entries()) {
    const width = index % 2 === 0 ? 375 : 1440
    const theme = width === 375 ? 'dark' : 'light'
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ colorScheme: theme })
    await page.evaluate(value => localStorage.setItem('workaround-theme', value), theme)
    await page.goto(`/games/practice/probe/${round.id}`)
    await expect(page.locator('.shell')).toHaveAttribute('data-theme', theme)
    await page.getByRole('button', { name: round.probes[0].label, exact: true }).click()
    await page.getByRole('button', { name: '관측 결과 보기', exact: true }).click()
    const followup = page.locator('.probe-followup')
    await expect(followup.locator('.observation')).toContainText(round.probes[0].result)
    await expect(page.getByRole('heading', { name: '사건의 결말' })).toHaveCount(0)

    const layout = await followup.evaluate((node, viewportWidth) => {
      const result = node.querySelector('.observation')?.getBoundingClientRect()
      const next = node.querySelector('.hypothesis-panel')?.getBoundingClientRect()
      return {
        adjacent: viewportWidth <= 600
          ? Boolean(result && next && result.top < next.top && next.top - result.bottom <= 14)
          : Boolean(result && next && result.left < next.left && next.left - result.right <= 14),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    }, width)
    expect(layout.adjacent, round.id).toBe(true)
    expect(layout.overflow, round.id).toBe(0)
    if (index === 13) {
      await page.screenshot({ path: testInfo.outputPath('probe-practice-light-1440.png'), fullPage: true })
    }

    const answer = round.hypotheses.find(entry => entry.key === round.answerKey)
    await followup.getByRole('button', { name: answer.label, exact: true }).click()
    await page.getByRole('button', { name: '가설 지목하고 결말 보기', exact: true }).click()
    await expect(page.getByRole('heading', { name: '사건의 결말' })).toBeVisible()
    await expect(page.getByText(round.resolution, { exact: true })).toBeVisible()
  }
})

test('기내 빈 상태는 원인에 맞는 한 번의 조작으로 추천을 복구한다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.evaluate(() => localStorage.setItem('workaround-theme', 'dark'))
  await page.goto('/inflight')
  const settings = page.getByRole('region', { name: '기내 콘텐츠 설정' })
  await settings.getByRole('button', { name: '3분 한 판', exact: true }).click()
  await settings.getByRole('button', { name: '운영', exact: true }).click()
  await expect(page.getByText('조건에 맞는 콘텐츠가 없습니다.')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('inflight-empty-dark-375.png'), fullPage: true })
  await page.getByRole('button', { name: '시간 늘리기', exact: true }).click()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  expect(await page.locator('.flight-card').count()).toBeGreaterThanOrEqual(1)

  await settings.getByLabel('다시 볼 것만').check()
  await expect(page.getByText('조건에 맞는 콘텐츠가 없습니다.')).toBeVisible()
  await page.getByRole('button', { name: '조건 초기화', exact: true }).click()
  await expect(page.locator('.flight-card').first()).toBeVisible()
  expect(await page.locator('.flight-card').count()).toBeGreaterThanOrEqual(1)
})

test('리뷰 완료 요약은 시즌 변화와 기록 링크를 함께 보여주고 한 번에 이동한다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.addInitScript(missionId => {
    localStorage.setItem('workaround-theme', 'light')
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      learner: { nickname: '' },
      submissions: {
        [missionId]: [{
          files: [{ path: 'src/Main.java', content: 'class Main {}' }],
          submittedAt: '2026-09-14T10:00:00.000Z',
          by: null,
        }],
      },
      seasonStats: {
        seasonStart: '2026-09-14',
        gains: [{ date: '2026-09-14', stat: 'vision', amount: 3, source: `mission-submit:${missionId}` }],
      },
    }))
  }, MISSION_ID)
  await page.goto(`/missions/${MISSION_ID}/review`)
  const summary = page.getByRole('region', { name: '완료 요약' })
  await expect(summary.getByText('기록에 저장됨', { exact: true })).toBeVisible()
  await expect(summary.getByText('이번 시즌 · 구조를 보는 눈 +3', { exact: true })).toBeVisible()
  await summary.screenshot({ path: testInfo.outputPath('review-summary-light-1440.png') })
  await summary.getByRole('link', { name: '내 기록 보기', exact: true }).click()
  await expect(page).toHaveURL(/\/history$/)
  await expect(page.getByRole('heading', { name: '배운 흔적을 돌아봅니다' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '기록에 이름을 남깁니다' })).toHaveCount(0)
})

test('닉네임 없는 첫 기록 열람은 모달 없이 기록에 머문다', async ({ page }) => {
  await page.goto('/history')
  await expect(page).toHaveURL(/\/history$/)
  await expect(page.getByRole('heading', { name: '배운 흔적을 돌아봅니다' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '기록에 이름을 남깁니다' })).toHaveCount(0)
})
