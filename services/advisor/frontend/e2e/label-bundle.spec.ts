import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('코스 행은 다음 회차 시간을 먼저, 전체 시간을 뒤에 보여 준다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/learn')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('workaround-theme', 'dark')
  })
  await page.reload()

  const foundations = page.locator('[data-course-preview][data-course-id="foundations"]')
  await expect(foundations.locator('.row-meta')).toContainText('다음 1시간 30분')
  await expect(foundations.locator('.row-meta')).toContainText('전체 약 76시간')

  const vienna = page.locator('[data-course-preview][data-course-id="vienna-1900"]')
  await expect(vienna.locator('.row-meta')).toContainText('다음 20분')
  await expect(vienna.locator('.row-meta')).toContainText('전체 11시간 20분')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('course-times-dark-375.png'), fullPage: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.evaluate(() => localStorage.setItem('workaround-theme', 'light'))
  await page.reload()
  await expect(foundations.locator('.row-meta')).toContainText('전체 약 76시간')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('course-times-light-1440.png'), fullPage: true })

  await page.goto('/courses')
  await expect(page.locator('[data-course-id="foundations"] .course-time')).toContainText('다음 1시간 30분')
  await expect(page.locator('[data-course-id="foundations"] .course-time')).toContainText('전체 약 76시간')

  await page.goto('/courses/foundations')
  await expect(page.getByText('39개 · 전체 약 76시간', { exact: true })).toBeVisible()
})

test('첫 시즌과 0기록 시즌은 다음 행동 하나만 또렷하게 안내한다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/history#season')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('workaround-theme', 'dark')
  })
  await page.reload()

  const season = page.locator('#season')
  await season.getByRole('button', { name: '첫 시즌 시작', exact: true }).click()
  const firstRecord = season.getByRole('link', { name: /오늘 첫 기록 만들기/ })
  await expect(firstRecord).toHaveAttribute('href', '/today')
  await expect(season.locator('.stat-row')).toHaveCount(0)
  await expect(season.getByText('아직 적립 기록이 없습니다.', { exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('season-first-record-dark-375.png'), fullPage: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ colorScheme: 'light' })
  await page.evaluate(() => localStorage.setItem('workaround-theme', 'light'))
  await page.reload()
  await expect(season.getByRole('link', { name: /오늘 첫 기록 만들기/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('season-first-record-light-1440.png'), fullPage: true })
})
