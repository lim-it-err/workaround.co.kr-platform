import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: '한 서가에서, 지금 맞는 배움을 고르세요' })).toBeVisible()
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('375 첫 화면은 코스 2행과 네 기본 필터만 보이고 기존 높이의 1/3 이하이다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await page.goto('/learn')
  await expect(page.locator('[data-course-preview]')).toHaveCount(2)
  await expect(page.locator('[data-content-index]')).toHaveCount(0)
  await expect(page.locator('.index-row')).toHaveCount(2)
  await expect(page.getByRole('button', { name: '전체 181개 보기' })).toBeVisible()
  await expect(page.locator('.filter-grid select')).toHaveCount(4)
  await expect(page.getByRole('combobox', { name: '시간', exact: true })).toHaveCount(1)
  await expect(page.getByRole('combobox', { name: '코드 작성', exact: true })).toHaveCount(1)
  await expect(page.getByRole('combobox', { name: '형식', exact: true })).toHaveCount(1)
  await expect(page.getByRole('combobox', { name: '완료', exact: true })).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(Math.floor(4999 / 3))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('필터를 고르면 통합 목록이 열리고 초기화하면 다시 첫 화면으로 돌아간다', async ({ page }) => {
  await page.getByRole('combobox', { name: '형식', exact: true }).selectOption('mission')
  await expect(page.locator('[data-content-index]')).toBeVisible()
  await expect(page.locator('.index-row')).not.toHaveCount(0)
  expect(await page.locator('.index-row').evaluateAll(rows => rows.every(row => row.getAttribute('data-content-kind') === 'mission'))).toBe(true)

  await page.getByRole('button', { name: '필터 초기화' }).click()
  await expect(page.locator('[data-content-index]')).toHaveCount(0)
  await expect(page.locator('[data-course-preview]')).toHaveCount(2)
})

test('전체 보기를 누르면 181개 통합 인덱스를 30개씩 연다', async ({ page }) => {
  await page.getByRole('button', { name: '전체 181개 보기' }).click()
  await expect(page.getByRole('button', { name: '전체 목록 접기' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('[data-content-index]')).toBeVisible()
  await expect(page.getByText('코스 2')).toBeVisible()
  await expect(page.getByText('미션 39')).toBeVisible()
  await expect(page.getByText('사건 파일 8')).toBeVisible()
  await expect(page.getByText('프로젝트 1')).toBeVisible()
  await expect(page.getByText('연습 131')).toBeVisible()
  await expect(page.getByText('181개', { exact: true })).toBeVisible()
  await expect(page.locator('.index-row')).toHaveCount(30)
  expect(await page.locator('input:not([type="hidden"]), select, textarea').evaluateAll(elements => (
    elements.every(element => Boolean(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || element.labels?.length))
  ))).toBe(true)
  await expect(page.locator('.advanced-filters')).not.toHaveAttribute('open', '')

  await page.getByText('고급 필터').click()
  await expect(page.locator('.chip-toggle')).toHaveCount(12)
  await page.getByRole('button', { name: '쉬움', exact: true }).click()
  await expect(page.locator('.index-row')).not.toHaveCount(0)
  expect(await page.locator('.index-row').evaluateAll(rows => rows.every(row => row.getAttribute('data-content-kind') === 'mission'))).toBe(true)
})

test('/games 별칭은 연습 131판만 보여 주고 실제 판의 심층 링크로 이어진다', async ({ page }) => {
  await page.goto('/games')
  await expect(page).toHaveURL(/\/learn#practice$/)
  await expect(page.getByLabel('형식')).toHaveValue('practice')
  await expect(page.getByText('131개', { exact: true })).toBeVisible()
  await expect(page.getByText('시즌제 스탯 준비 중')).toHaveCount(0)

  const firstPractice = page.locator('[data-content-kind="practice"]').first()
  const href = await firstPractice.getAttribute('href')
  expect(href).toMatch(/^\/games\/practice\//)
  await firstPractice.click()
  await expect(page).toHaveURL(/\/games\/practice\/.+\/.+$/)
})

test('마지막 연습을 정확한 판으로 이어서 열고 375·1440px에서 넘치지 않는다', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('advisor.practice.v1', JSON.stringify({
      completed: {},
      attempts: {},
      last: { gameId: 'reading', roundId: 'read-ggs-01', at: '2026-09-14T00:00:00.000Z' },
    }))
  })
  await page.reload()
  const resume = page.getByRole('complementary', { name: '이어 하던 것' })
  await expect(resume).toBeVisible()
  await expect(resume.getByRole('link', { name: '이어서' })).toHaveAttribute('href', '/games/practice/reading/read-ggs-01')

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px`).toBe(true)
  }
})

test('기존 카드 링크는 한 카드만 열고 최초 갈래 선택 기록을 보존한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/games?card=read-ggs-01')
  await expect(page).toHaveURL(/\/learn\?card=read-ggs-01#practice$/)
  const card = page.locator('[data-card-id="read-ggs-01"]')
  await expect(card).toHaveCount(1)
  await card.getByRole('button', { name: '🌾 축복 — 그 덕에 여기까지 왔다' }).click()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(saved.cardForkChoices['read-ggs-01']).toBe('blessing')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
