import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
  await page.goto('/learn')
  await expect(page.locator('[data-course-id]')).toHaveCount(3)
  await page.evaluate(() => localStorage.clear())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('375에서 부다페스트 6개 시각표와 코딩·게임·시뮬 비율을 읽는다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/learn')
  await expect(page.locator('[data-course-preview]')).toHaveCount(3)
  await page.locator('[data-course-id="budapest-baths"]').click()

  await expect(page).toHaveURL(/\/courses\/budapest-baths$/)
  await expect(page.getByRole('heading', { name: '부다페스트 온천 큐' })).toBeVisible()
  await expect(page.locator('[data-mission-id]')).toHaveCount(6)
  await expect(page.locator('.format-badge.coding')).toHaveCount(3)
  await expect(page.locator('.format-badge.game')).toHaveCount(2)
  await expect(page.locator('.format-badge.sim')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('budapest-baths-course-375.png'), fullPage: true })
})

test('부다페스트 코스의 코딩·게임·시뮬을 각각 한 번 완료한다', async ({ page }) => {
  await page.goto('/missions/budapest-2-pool-load')
  await expect(page.getByRole('heading', { name: '16개 풀의 시간대 혼잡' })).toBeVisible()
  await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/PoolLoadAnalyzer.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('public final class PoolLoadAnalyzer {}')
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
  await page.getByPlaceholder('예: 김부장').fill('Codex E2E')
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/missions\/budapest-2-pool-load\/review$/)
  const learner = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(learner.submissions['budapest-2-pool-load']).toHaveLength(1)

  await page.goto('/games/practice/budapest-4-etiquette')
  await expect(page.getByRole('heading', { name: '수영장에서는 수영모를 쓴다' })).toBeVisible()
  await page.getByRole('button', { name: '머지', exact: true }).click()
  await page.getByRole('button', { name: '선택하고 해설 보기' }).click()
  await expect(page.getByText('판 뒤집기')).toBeVisible()
  const practice = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.practice.v1') ?? '{}'))
  expect(practice.completed['budapest-4-etiquette']).toHaveLength(1)

  await page.goto('/courses/budapest-baths/sim/budapest-1-morning-entry')
  await expect(page.getByRole('heading', { name: '08–09시 입장 큐' })).toBeVisible()
  await page.getByRole('button', { name: '대기열 돌려보기' }).click()
  const metrics = page.locator('.result dl')
  const arrivals = Number((await metrics.locator('dd').nth(0).innerText()).replace(/\D/g, ''))
  const completed = Number((await metrics.locator('dd').nth(1).innerText()).replace(/\D/g, ''))
  const unprocessed = Number((await metrics.locator('dd').nth(2).innerText()).replace(/\D/g, ''))
  expect(completed + unprocessed).toBe(arrivals)
  await expect(metrics).toContainText('이용률')
})
