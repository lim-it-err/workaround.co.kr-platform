import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
  await page.goto('/games')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('Java 21 · Spring Boot 3 게임을 목록에서 찾아 20장 완주하고 오늘로 돌아간다', async ({ page }) => {
  await page.getByPlaceholder('제목·도메인으로 찾기').fill('Java 21')
  const rounds = page.locator('[data-content-kind="practice"]')
  await expect(rounds).toHaveCount(20)
  await rounds.first().click()

  await expect(page.getByText('Java 21 · Spring Boot 3 판정 · 1/20')).toBeVisible()
  for (let index = 0; index < 20; index++) {
    await page.getByRole('button', { name: '좋다', exact: true }).click()
    await page.getByRole('button', { name: '선택하고 해설 보기' }).click()
    await expect(page.getByText(/^권장 판정:/)).toBeVisible()

    if (index < 19) {
      await page.getByRole('button', { name: '다음 판' }).click()
      await expect(page.getByText(`Java 21 · Spring Boot 3 판정 · ${index + 2}/20`)).toBeVisible()
    }
  }

  await page.getByRole('button', { name: '20장 결과 보기' }).click()
  await expect(page.getByRole('heading', { name: 'Java 21 · Spring Boot 3 판정 완료' })).toBeVisible()
  await expect(page.getByText('20장 중 10장의 판정을 맞혔습니다.')).toBeVisible()
  await expect(page.getByRole('link', { name: '오늘로 돌아가기' })).toHaveAttribute('href', '/today')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.practice.v1') ?? '{}'))
  expect(saved.completed['java21-spring3-swipe']).toHaveLength(20)

  await page.getByRole('link', { name: '오늘로 돌아가기' }).click()
  await expect(page).toHaveURL(/\/today$/)
})
