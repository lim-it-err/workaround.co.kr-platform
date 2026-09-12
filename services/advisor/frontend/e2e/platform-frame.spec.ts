import { expect, test } from '@playwright/test'

for (const width of [375, 1280]) for (const theme of ['dark', 'light']) {
  test(`모선 프레임: ${theme} ${width}px 메뉴·입력·코드·테마`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), theme)
    await page.route('http://localhost:8080/**', route => route.abort())
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const overflow = async () => {
      expect(await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth,
      )), page.url()).toBe(0)
    }
    const routes = [
      '/missions', '/routine', '/inflight', '/season', '/games', '/projects',
      '/missions/history', '/missions/s1-wine-01', '/missions/s1-wine-01/review',
      '/games/probe', '/games/boundary', '/games/case/case-vanishing-points-01',
      '/routine/swipe', '/games/practice/minimal-repro',
    ]
    for (const route of routes) {
      await page.goto(route)
      await page.locator('.shell-main > *').first().waitFor()
      await expect(page.locator('.shell')).toHaveAttribute('data-theme', theme)
      await expect(page.locator('.station-code')).toHaveText('A')
      await expect(page.getByRole('button', { name: '미션 목록으로', exact: true })).toBeVisible()
      await overflow()
      if (['/missions', '/season', '/games/practice/minimal-repro'].includes(route)) {
        await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true })
      }
    }
    await page.goto('/projects')
    await page.getByRole('link', { name: /공공자전거 시스템 — 맨땅에서/ }).click()
    await expect(page.locator('.node-card')).toHaveCount(6)
    await overflow()

    await page.goto('/missions/s1-wine-01')
    await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
    const code = page.locator('.viewer pre').first()
    await expect(code).toBeVisible()
    expect(await code.evaluate(el => getComputedStyle(el).color)).toBe('rgb(243, 246, 251)')
    expect(await code.evaluate(el => getComputedStyle(el).backgroundColor))
      .toBe(theme === 'light' ? 'rgb(16, 23, 36)' : 'rgb(16, 22, 31)')
    await code.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath('code.png') })
    await page.getByRole('button', { name: '제출', exact: true }).click()
    const editor = page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요')
    await editor.fill('public class FrameCheck {}')
    expect(await editor.evaluate(el => getComputedStyle(el).color)).toBe('rgb(243, 246, 251)')
    await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
    await page.getByPlaceholder('예: 김부장').fill('Frame Check')
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await expect(page.getByText('종합 점수')).toBeVisible()
    await page.getByTitle('닉네임 변경').click()
    await expect(page.getByPlaceholder('예: 김부장')).toHaveValue('Frame Check')
    await overflow()
    await page.screenshot({ path: testInfo.outputPath('nickname.png') })
    await page.getByRole('button', { name: '닫기', exact: true }).click()
    await page.getByRole('button', { name: '미션 목록으로', exact: true }).click()
    await expect(page).toHaveURL(/\/missions$/)

    if (width === 375) {
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await overflow()
      await expect(page.locator('.theme-toggle')).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('text-200-percent.png') })
    }
    expect(errors).toEqual([])
  })
}
