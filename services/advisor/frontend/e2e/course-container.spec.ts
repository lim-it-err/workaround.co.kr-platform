import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', (route) => route.abort())
  await page.goto('/learn')
  await expect(page.locator('[data-course-id]')).toHaveCount(2)
  await page.evaluate(() => localStorage.clear())
})

test('배우기에서 기본·비엔나 코스를 보고 12개 형식 시각표를 연다', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/learn#courses')

  await expect(page.locator('[data-course-id="foundations"]')).toContainText('39개')
  await page.locator('[data-course-id="vienna-1900"]').click()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  await expect(page.getByRole('heading', { name: '비엔나 1900' })).toBeVisible()
  await expect(page.locator('[data-mission-id]')).toHaveCount(12)
  await expect(page.locator('.format-badge.coding')).toHaveCount(6)
  await expect(page.locator('.format-badge.game')).toHaveCount(5)
  await expect(page.locator('.format-badge.sim')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('코딩·게임 미션에 진입하고 출발한 코스로 복귀한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/courses/vienna-1900')

  await page.locator('[data-mission-id="v1900-b-pigments"]').click()
  await expect(page).toHaveURL(/\/missions\/v1900-b-pigments$/)
  await expect(page.getByRole('heading', { name: '안료 연표가 양식을 바꿨다' })).toBeVisible()
  await page.getByRole('link', { name: '← 비엔나 1900 코스' }).click()

  await page.locator('[data-mission-id="v1900-2-gold-damage"]').click()
  await expect(page).toHaveURL(/\/games\/practice\/v1900-2-gold-damage$/)
  await expect(page.getByRole('heading', { name: '금박 박락을 어디까지 손상으로 볼까' })).toBeVisible()
  await page.getByRole('link', { name: '← 비엔나 1900 코스' }).click()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('시뮬 미션이 격납고 배차 엔진으로 대기 결과를 만들고 코스로 돌아간다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/courses/vienna-1900')
  await page.locator('[data-mission-id="v1900-5-entry-queue"]').click()

  await expect(page).toHaveURL(/\/courses\/vienna-1900\/sim\/v1900-5-entry-queue$/)
  await expect(page.getByRole('heading', { name: '벨베데레 입장 큐' })).toBeVisible()
  await page.getByRole('button', { name: '대기열 돌려보기' }).click()
  await expect(page.getByRole('heading', { name: /평균 대기/ })).toBeVisible()
  await expect(page.getByText(/격납고의 배차 전이 엔진/)).toBeVisible()
  await page.getByRole('link', { name: '← 비엔나 1900 코스' }).click()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
