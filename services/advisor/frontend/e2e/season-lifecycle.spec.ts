import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('종료 적립을 새 시즌에 재시도하고 지난 결말을 그대로 재열람한다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.clock.setFixedTime(new Date('2026-08-31T09:00:00+09:00'))
  await page.addInitScript(() => {
    if (!localStorage.getItem('workaround-theme')) {
      localStorage.setItem('workaround-theme', 'dark')
    }
    if (!localStorage.getItem('advisor.learner.v1')) {
      localStorage.setItem('advisor.learner.v1', JSON.stringify({
        seasonStats: {
          seasonStart: '2026-08-03',
          gains: [
            { date: '2026-08-03', stat: 'vision', amount: 45, source: 'legacy' },
          ],
        },
      }))
    }
  })

  await page.goto('/games/boundary')
  await page.locator('.boundary-button').first().click()
  const pendingBefore = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}')
    return saved.seasons.pendingGains
  })
  expect(pendingBefore.length).toBeGreaterThanOrEqual(1)

  await page.goto('/history#season')
  const current = page.locator('#season')
  await expect(current.getByText('시즌이 끝나 적립하지 못했습니다.', { exact: true })).toBeVisible()
  await expect(current.getByText('경계를 긋는 사람', { exact: true })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('season-ended-dark-375.png'), fullPage: true })

  const endingBefore = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}')
    return saved.seasons.byId['season-2026-08-03'].ending
  })
  expect(endingBefore).toEqual({ id: 'ending-vision', title: '경계를 긋는 사람' })

  await current.getByRole('button', { name: '새 시즌 시작', exact: true }).click()
  await expect(current.getByText(new RegExp(`대기 중이던 적립 ${pendingBefore.length}건을 반영했습니다`))).toBeVisible()
  await expect(current.getByText('2026-08-31 — 2026-09-27', { exact: true })).toBeVisible()

  const savedAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(savedAfter.seasonStats).toBeUndefined()
  expect(savedAfter.seasons.activeId).toBe('season-2026-08-31')
  expect(savedAfter.seasons.pendingGains).toEqual([])
  expect(savedAfter.seasons.byId['season-2026-08-31'].gains).toHaveLength(pendingBefore.length)
  expect(savedAfter.seasons.byId['season-2026-08-31'].gains.every((gain: { date: string }) => gain.date === '2026-08-31')).toBe(true)
  expect(savedAfter.seasons.byId['season-2026-08-03'].gains).toHaveLength(1)
  expect(savedAfter.seasons.byId['season-2026-08-03'].ending).toEqual(endingBefore)

  const pastRow = page.locator('.past-season-row').first()
  await expect(pastRow).toContainText('2026-08-03 → 08.30')
  await expect(pastRow).toContainText('합계 45')
  await expect(pastRow).toContainText('경계를 긋는 사람')
  await pastRow.click()
  const pastDetail = page.locator('.past-season-detail')
  await expect(pastDetail.getByText('읽기 전용', { exact: true })).toBeVisible()
  await expect(pastDetail.getByText('경계를 긋는 사람', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.evaluate(() => localStorage.setItem('workaround-theme', 'light'))
  await page.reload()
  await expect(page.locator('.shell')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('heading', { name: '누적 스탯', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('season-active-light-1440.png'), fullPage: true })
})
