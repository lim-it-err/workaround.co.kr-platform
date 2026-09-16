import { expect, test } from '@playwright/test'

test('375px에서 오늘 → 배우기 → 코스 상세를 빈 화면 없이 늦게 불러온다', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/today')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('today-375.png'), fullPage: true })

  await page.route('**/LearnPage.vue*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.continue()
  })
  await page.getByRole('link', { name: '배우기' }).evaluate((link: HTMLAnchorElement) => link.click())
  await expect(page.locator('.route-loading')).toContainText('불러오는 중')
  await expect(page.locator('.shell-main')).not.toBeEmpty()
  await expect(page).toHaveURL(/\/learn$/)
  await expect(page.getByRole('heading', { level: 1, name: /한 서가에서/ })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('learn-375.png'), fullPage: true })

  await page.route('**/CourseDetailPage.vue*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.continue()
  })
  await page.locator('[data-course-preview][data-course-id="vienna-1900"]').evaluate((link: HTMLAnchorElement) => link.click())
  await expect(page.locator('.route-loading')).toContainText('불러오는 중')
  await expect(page.locator('.shell-main')).not.toBeEmpty()
  await expect(page).toHaveURL(/\/courses\/vienna-1900$/)
  await expect(page.getByRole('heading', { level: 1, name: '비엔나 1900' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('course-vienna-375.png'), fullPage: true })
})
