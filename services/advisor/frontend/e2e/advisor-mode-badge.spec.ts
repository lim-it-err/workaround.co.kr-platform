import { expect, test } from '@playwright/test'

const MISSION_ID = 's1-wine-01'
const CAPTURE_DIR = process.env.TKT237_CAPTURE_DIR

async function seed(page, review?: object) {
  await page.addInitScript(([id, rev]) => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      learner: { nickname: '모드 검증' },
      submissions: { [id]: [{ files: [{ path: 'src/Main.java', content: 'class Main {}' }], submittedAt: '2026-11-28T10:00:00.000Z', by: '모드 검증' }] },
      ...(rev ? { reviews: { [id]: [rev] } } : {}),
    }))
  }, [MISSION_ID, review ?? null])
}

async function health(page, body: object | null) {
  await page.route('http://localhost:8080/health', (route) => (
    body ? route.fulfill({ json: body, headers: { 'access-control-allow-origin': '*' } }) : route.abort()
  ))
}

const badge = (page) => page.getByTestId('mode-badge')

test('백엔드 없음 — 배포 · 연습 리뷰 배지와 연습 리뷰 표식', async ({ page }) => {
  await seed(page)
  await health(page, null)
  await page.goto(`/missions/${MISSION_ID}`)
  await expect(badge(page)).toHaveText('배포 · 연습 리뷰')
  await badge(page).click()
  await expect(page.getByText('./local.sh claude')).toBeVisible()
  if (CAPTURE_DIR) await page.screenshot({ path: `${CAPTURE_DIR}/mission-deploy-${page.viewportSize()!.width}.png` })
  await page.goto(`/missions/${MISSION_ID}/review`)
  await expect(badge(page)).toHaveText('배포 · 연습 리뷰')
  await expect(page.getByTestId('practice-mark')).toHaveText('연습 리뷰 — LLM 아님')
  if (CAPTURE_DIR) await page.screenshot({ path: `${CAPTURE_DIR}/review-deploy-${page.viewportSize()!.width}.png` })
})

test('mock 백엔드 — 로컬 · 연습 리뷰', async ({ page }) => {
  await seed(page)
  await health(page, { status: 'ok', service: 'advisor', profile: 'mock' })
  await page.goto(`/missions/${MISSION_ID}`)
  await expect(badge(page)).toHaveText('로컬 · 연습 리뷰')
  if (CAPTURE_DIR) await page.screenshot({ path: `${CAPTURE_DIR}/mission-local-mock-${page.viewportSize()!.width}.png` })
})

test('claude 백엔드 — 로컬 · Claude 리뷰, LLM 리뷰에는 연습 표식 없음', async ({ page }) => {
  await seed(page, {
    overall: 80,
    reviewedAt: '2026-11-28T10:00:01.000Z',
    source: 'llm',
    content: { summary: '검증용', items: [{ rubricName: '책임 분리', score: 24, feedback: '검증용', evidence: '검증용' }] },
  })
  await health(page, { status: 'ok', service: 'advisor', profile: 'claude' })
  await page.goto(`/missions/${MISSION_ID}/review`)
  await expect(badge(page)).toHaveText('로컬 · Claude 리뷰')
  await expect(page.getByTestId('practice-mark')).toHaveCount(0)
})
