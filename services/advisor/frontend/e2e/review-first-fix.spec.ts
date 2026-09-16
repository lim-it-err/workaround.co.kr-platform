import { expect, test } from '@playwright/test'

const MISSION_ID = 's1-wine-01'
const NEXT_MISSION_ID = 's2-furniture-01'

async function seedSubmission(page) {
  await page.addInitScript((missionId) => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      learner: { nickname: '리뷰 검증' },
      submissions: {
        [missionId]: [{
          files: [{ path: 'src/Main.java', content: 'class Main {}' }],
          submittedAt: '2026-09-15T10:00:00.000Z',
          by: '리뷰 검증',
        }],
      },
    }))
  }, MISSION_ID)
}

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('미제출 리뷰는 제출 CTA만 보여 주고 편집 화면으로 이어진다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`/missions/${MISSION_ID}/review`)

  const empty = page.getByRole('region', { name: '미제출 안내' })
  await expect(empty.getByRole('heading', { name: '아직 제출한 코드가 없습니다' })).toBeVisible()
  await expect(page.getByRole('link', { name: '코드 고쳐서 재제출' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '다음 미션' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: '배우기로' })).toHaveCount(0)

  await empty.getByRole('link', { name: '제출하러 가기' }).click()
  await expect(page).toHaveURL(new RegExp(`/missions/${MISSION_ID}$`))
})

test('제출 후 첫 화면은 점수·최대 감점 항목·재제출 CTA를 375px 안에 둔다', async ({ page }, testInfo) => {
  await seedSubmission(page)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto(`/missions/${MISSION_ID}/review`)

  const lead = page.getByRole('region', { name: '리뷰 핵심' })
  await expect(lead.getByText('66점', { exact: true })).toBeVisible()
  await expect(lead.getByText('먼저 고칠 것 1개', { exact: true })).toBeVisible()
  await expect(lead.getByText('도메인 개념의 타입화', { exact: true })).toBeVisible()
  await expect(lead.getByRole('link', { name: '코드 고쳐서 재제출' })).toBeVisible()
  expect(await page.locator('.review-disclosure').evaluateAll(nodes => nodes.every(node => !(node as HTMLDetailsElement).open))).toBe(true)

  const firstScroll = await lead.evaluate((node) => {
    const score = node.querySelector('.score-line')?.getBoundingClientRect()
    const fix = node.querySelector('.first-fix')?.getBoundingClientRect()
    const action = node.querySelector('.retry-action')?.getBoundingClientRect()
    return {
      scoreBottom: score?.bottom ?? Number.POSITIVE_INFINITY,
      fixBottom: fix?.bottom ?? Number.POSITIVE_INFINITY,
      actionBottom: action?.bottom ?? Number.POSITIVE_INFINITY,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  expect(firstScroll.scoreBottom).toBeLessThanOrEqual(812)
  expect(firstScroll.fixBottom).toBeLessThanOrEqual(812)
  expect(firstScroll.actionBottom).toBeLessThanOrEqual(812)
  expect(firstScroll.overflow).toBe(0)

  const variants = [
    { width: 375, height: 812, theme: 'dark' as const },
    { width: 375, height: 812, theme: 'light' as const },
    { width: 1440, height: 900, theme: 'dark' as const },
    { width: 1440, height: 900, theme: 'light' as const },
  ]
  for (const variant of variants) {
    await page.setViewportSize({ width: variant.width, height: variant.height })
    await page.emulateMedia({ colorScheme: variant.theme })
    await page.evaluate(theme => localStorage.setItem('workaround-theme', theme), variant.theme)
    await page.reload()
    await expect(page.getByRole('region', { name: '리뷰 핵심' })).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath(`review-${variant.width}-${variant.theme}.png`),
      fullPage: true,
    })
  }
})

test('실제 다음 코스 항목만 다음 미션이라 부르고 목록 복귀는 배우기로 부른다', async ({ page }) => {
  await seedSubmission(page)
  await page.goto(`/missions/${MISSION_ID}/review`)
  await page.evaluate(() => {
    window.history.replaceState({
      ...window.history.state,
      from: '/courses/foundations',
      fromLabel: '기본 코스',
    }, '')
  })
  await page.reload()

  const next = page.getByRole('link', { name: '다음 미션', exact: true })
  await expect(next).toBeVisible()
  await expect(page.getByRole('link', { name: '배우기로', exact: true })).toHaveCount(0)
  await next.click()
  await expect(page).toHaveURL(new RegExp(`/missions/${NEXT_MISSION_ID}$`))
  expect(await page.evaluate(() => window.history.state?.from)).toBe('/courses/foundations')

  await page.goto(`/missions/${MISSION_ID}/review`)
  const learn = page.getByRole('link', { name: '배우기로', exact: true })
  await expect(learn).toBeVisible()
  await expect(page.getByRole('link', { name: '다음 미션', exact: true })).toHaveCount(0)
  await learn.click()
  await expect(page).toHaveURL(/\/learn$/)
})
