import { expect, test } from '@playwright/test'

const scenarios = [
  { width: 375, colorScheme: 'dark' as const },
  { width: 375, colorScheme: 'light' as const },
  { width: 1440, colorScheme: 'dark' as const },
  { width: 1440, colorScheme: 'light' as const },
]

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
})

for (const scenario of scenarios) {
  test(`기내 추천은 ${scenario.width}px ${scenario.colorScheme}에서 면 없는 한 줄 행이다`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: scenario.width, height: 900 })
    await page.emulateMedia({ colorScheme: scenario.colorScheme })
    await page.addInitScript(theme => {
      window.localStorage.setItem('workaround-theme', theme)
    }, scenario.colorScheme)
    await page.goto('/inflight')
    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.colorScheme)

    const rows = page.locator('.flight-card')
    await expect(rows).toHaveCount(3)
    const surfaces = await rows.evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element)
      const box = element.getBoundingClientRect()
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        borderRadius: style.borderRadius,
        borderTopWidth: style.borderTopWidth,
        borderRightWidth: style.borderRightWidth,
        borderBottomWidth: style.borderBottomWidth,
        borderLeftWidth: style.borderLeftWidth,
        outlineStyle: style.outlineStyle,
        minHeight: box.height,
      }
    }))
    for (const surface of surfaces) {
      expect(surface).toMatchObject({
        backgroundColor: 'rgba(0, 0, 0, 0)',
        backgroundImage: 'none',
        borderRadius: '0px',
        borderTopWidth: '0px',
        borderRightWidth: '0px',
        borderBottomWidth: '1px',
        borderLeftWidth: '0px',
        outlineStyle: 'none',
      })
      expect(surface.minHeight).toBeGreaterThanOrEqual(52)
    }
    await expect(rows.first().locator('strong')).toBeVisible()
    await expect(rows.first().locator('small')).toContainText(/분$/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
    await page.screenshot({
      path: testInfo.outputPath(`inflight-rows-${scenario.width}-${scenario.colorScheme}.png`),
      fullPage: true,
    })
  })
}

test('오늘의 독서 CTA는 추천 제목과 출발 문맥을 그대로 연습 판에 전달한다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-05T08:00:00+02:00'))
  await page.goto('/today')

  const recommendedTitle = (await page.locator('.surface-hero h1').textContent())?.trim() ?? ''
  expect(recommendedTitle).not.toBe('')
  const action = page.getByRole('link', { name: '오늘의 첫 판 시작', exact: true })
  await expect(action).toHaveAttribute('href', /\/games\/practice\/reading\/read-/)
  await action.click()

  await expect(page).toHaveURL(/\/games\/practice\/reading\/read-/)
  await expect(page.locator('.round-card h1')).toHaveText(recommendedTitle)
  await expect(page.locator('.practice-head a')).toHaveText('← 오늘')
  expect(await page.evaluate(() => window.history.state?.from)).toBe('/today')
  await page.locator('.practice-head a').click()
  await expect(page).toHaveURL(/\/today$/)
})
