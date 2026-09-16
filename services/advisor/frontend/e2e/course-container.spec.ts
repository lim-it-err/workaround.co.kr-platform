import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', (route) => route.abort())
  await page.goto('/learn')
  await expect(page.locator('[data-course-id]')).toHaveCount(3)
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
  const missionReturn = page.getByRole('link', { name: '← 비엔나 1900 코스' })
  await expect.poll(async () => {
    const box = await missionReturn.boundingBox()
    return Boolean(box && box.width >= 40 && box.height >= 40)
  }).toBe(true)
  await missionReturn.click()

  await page.locator('[data-mission-id="v1900-2-gold-damage"]').click()
  await expect(page).toHaveURL(/\/games\/practice\/v1900-2-gold-damage$/)
  await expect(page.getByRole('heading', { name: '금박 박락을 어디까지 손상으로 볼까' })).toBeVisible()
  const gameReturn = page.getByRole('link', { name: '← 비엔나 1900 코스' })
  await expect.poll(async () => {
    const box = await gameReturn.boundingBox()
    return Boolean(box && box.width >= 40 && box.height >= 40)
  }).toBe(true)
  await gameReturn.click()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('시뮬 미션이 다중 창구 큐로 대기 결과를 만들고 코스로 돌아간다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/courses/vienna-1900')
  await page.locator('[data-mission-id="v1900-5-entry-queue"]').click()

  await expect(page).toHaveURL(/\/courses\/vienna-1900\/sim\/v1900-5-entry-queue$/)
  await expect(page.getByRole('link', { name: '배우기' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('heading', { name: '벨베데레 입장 큐' })).toBeVisible()
  await page.getByRole('button', { name: '대기열 돌려보기' }).click()
  await expect(page.getByRole('heading', { name: /평균 대기/ })).toBeVisible()
  await expect(page.getByText('실행 조건 · 09시 · 창구 3개 · 사전 예약 35%')).toBeVisible()
  const metrics = page.locator('.result dl')
  await expect(metrics).toContainText('시간 내 미처리')
  await expect(metrics).toContainText('이용률')
  const arrivals = Number((await metrics.locator('dd').nth(0).innerText()).replace(/\D/g, ''))
  const completed = Number((await metrics.locator('dd').nth(1).innerText()).replace(/\D/g, ''))
  const unprocessed = Number((await metrics.locator('dd').nth(2).innerText()).replace(/\D/g, ''))
  expect(completed + unprocessed).toBe(arrivals)

  await page.locator('select').selectOption('10')
  await expect(page.getByText('조건이 바뀌었습니다', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '바뀐 조건으로 다시 실행' })).toBeVisible()
  await page.getByRole('button', { name: '바뀐 조건으로 다시 실행' }).click()
  await expect(page.getByText('실행 조건 · 10시 · 창구 3개 · 사전 예약 35%')).toBeVisible()
  await expect(page.getByText('조건이 바뀌었습니다', { exact: true })).toHaveCount(0)
  await expect(page.getByText('생각해 볼 질문')).toBeVisible()
  await expect(page.getByText(/고정 시드 확률 도착/)).toBeVisible()
  await page.getByRole('link', { name: '← 비엔나 1900 코스' }).click()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('코스 상세에서도 배우기를 현재 표면으로 표시하고 양 폭에서 넘치지 않는다', async ({ page }) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/courses/vienna-1900')
    await expect(page.getByRole('link', { name: '배우기' })).toHaveAttribute('aria-current', 'page')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.goto('/courses/vienna-1900/sim/v1900-5-entry-queue')
    await page.getByRole('button', { name: '대기열 돌려보기' }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})
