import { expect, test } from '@playwright/test'

for (const width of [375, 1280]) {
  test(`모선 v0.9 프레임: ${width}px 상단바·메뉴·입력·코드`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    // 모선에서 넘어온 옛 저장값(light·lite)이 있어도 Advisor 는 검은 기본 화면이다.
    await page.addInitScript(() => {
      localStorage.setItem('workaround-theme', 'light')
      localStorage.setItem('workaround-view', 'lite')
    })
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
      await expect(page.locator('.portal-stage > .station-topbar')).toBeVisible()
      await expect(page.locator('.station-topbar .roundel')).toHaveText('A')
      await expect(page.locator('.station-topbar h2')).toHaveText('Developer Advisor')
      await expect(page.getByRole('button', { name: '오늘로', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: /밝게|어둡게/ })).toHaveCount(0)
      await expect(page.locator('.view-toggle')).toHaveCount(0)
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(12, 12, 12)')
      expect(await page.evaluate(() => document.documentElement.dataset.theme ?? null)).toBeNull()
      await expect(page.getByRole('navigation', { name: '전역 메뉴' }).getByRole('link')).toHaveCount(3)
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
    expect(await code.evaluate(el => getComputedStyle(el).color)).toBe('rgb(214, 214, 214)')
    expect(await code.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(16, 16, 16)')
    await code.scrollIntoViewIfNeeded()
    await page.screenshot({ path: testInfo.outputPath('code.png') })
    await page.getByRole('button', { name: '제출', exact: true }).click()
    const editor = page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요')
    await expect(editor).toHaveAccessibleName('파일 1 내용')
    await editor.fill('public class FrameCheck {}')
    expect(await editor.evaluate(el => getComputedStyle(el).color)).toBe('rgb(214, 214, 214)')
    await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
    await page.getByPlaceholder('예: 김부장').fill('Frame Check')
    await page.getByRole('button', { name: '확인', exact: true }).click()
    await expect(page.getByText('종합 점수')).toBeVisible()
    await page.getByTitle('닉네임 변경').click()
    await expect(page.getByPlaceholder('예: 김부장')).toHaveValue('Frame Check')
    await overflow()
    await page.screenshot({ path: testInfo.outputPath('nickname.png') })
    await page.getByRole('button', { name: '닫기', exact: true }).click()
    await page.getByRole('button', { name: '오늘로', exact: true }).click()
    await expect(page).toHaveURL(/\/today$/)

    if (width === 375) {
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
      await overflow()
      await expect(page.getByRole('button', { name: '오늘로', exact: true })).toBeVisible()
      await page.screenshot({ path: testInfo.outputPath('text-200-percent.png') })
    }
    expect(errors).toEqual([])
  })
}
