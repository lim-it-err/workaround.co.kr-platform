import { expect, test, type Locator } from '@playwright/test'

const durations = ['3분 한 판', '10분 세 판', '30분 사건', '60분 혼합 코스']
const tastes = ['운영', '설계', '동시성', '도메인 여행', '랜덤']

async function expectSelection(group: Locator, selected: string) {
  await expect(group.getByRole('button', { pressed: true })).toHaveCount(1)
  for (const button of await group.getByRole('button').all()) {
    const active = (await button.textContent()) === selected
    await expect(button).toHaveAttribute('aria-pressed', String(active))
    if (active) await expect(button).toHaveClass(/\bactive\b/)
    else await expect(button).not.toHaveClass(/\bactive\b/)
  }
}

for (const colorScheme of ['dark', 'light'] as const) {
  test(`기내 필터 접근성: ${colorScheme} 375px 선택·키보드·복원`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.emulateMedia({ colorScheme })
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('http://localhost:8080/**', route => route.abort())
    await page.goto('/inflight')
    const settings = page.getByRole('region', { name: '기내 콘텐츠 설정' })
    const timeGroup = settings.locator('.control-row').nth(0)
    const tasteGroup = settings.locator('.control-row').nth(1)
    await expect(timeGroup.getByRole('button')).toHaveCount(4)
    await expect(tasteGroup.getByRole('button')).toHaveCount(5)
    await expectSelection(timeGroup, '10분 세 판')
    await expectSelection(tasteGroup, '랜덤')

    for (const label of durations) {
      await timeGroup.getByRole('button', { name: label, exact: true }).click()
      await expectSelection(timeGroup, label)
      await expectSelection(tasteGroup, '랜덤')
    }
    for (const label of tastes) {
      await tasteGroup.getByRole('button', { name: label, exact: true }).click()
      await expectSelection(tasteGroup, label)
      await expectSelection(timeGroup, '60분 혼합 코스')
    }

    await timeGroup.getByRole('button', { name: '30분 사건', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expectSelection(timeGroup, '30분 사건')
    await tasteGroup.getByRole('button', { name: '동시성', exact: true }).focus()
    await page.keyboard.press('Space')
    await expectSelection(tasteGroup, '동시성')
    await page.reload()
    await expectSelection(timeGroup, '30분 사건')
    await expectSelection(tasteGroup, '동시성')
    expect(await page.evaluate(() => {
      const root = document.documentElement
      return Math.max(0, root.scrollWidth - root.clientWidth)
    })).toBe(0)
    await settings.screenshot({ path: testInfo.outputPath(`inflight-${colorScheme}-375.png`) })
    expect(errors).toEqual([])
  })
}
