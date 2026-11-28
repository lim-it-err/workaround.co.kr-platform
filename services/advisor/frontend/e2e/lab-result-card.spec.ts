import { expect, test, type Page } from '@playwright/test'

const MISSION = '/missions/s1-wine-01'
const RAW = 'https://raw.githubusercontent.com/lim-it-err/workaround.co.kr-platform/lab/s1-wine-01/labs/advisor/s1-wine-01/.grade/'

const RESULT = {
  missionId: 's1-wine-01', level: 'easy', commit: '0123456789abcdef', gradedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  compiled: true, tests: 6, passed: 4, failed: 2, errors: 0, skipped: 0,
  cases: [
    { class: 'A', name: 'recommend_empty', status: 'failed', message: '기대 0 이지만 3\n스택 줄' },
    { class: 'A', name: 'recommend_ok', status: 'passed', message: '' },
    { class: 'A', name: 'recommend_null', status: 'failed', message: 'NPE' },
  ],
}

async function open(page: Page) {
  await page.route('http://localhost:8080/**', (r) => r.abort())
  await page.goto(MISSION)
  await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
  await expect(page.getByRole('heading', { name: '상황' })).toBeVisible()
}

test('결과가 있으면 받기 줄 아래에 카드: 요약·실패 케이스·리뷰 접기·다시 불러오기', async ({ page }) => {
  const urls: string[] = []
  await page.route(`${RAW}**`, (route) => {
    const u = route.request().url()
    urls.push(u)
    if (u.includes('result.json')) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(RESULT) })
    return route.fulfill({ contentType: 'text/plain', body: '## 총평\n<b>굵게</b> 아님' })
  })
  await open(page)
  const card = page.getByTestId('lab-result')
  await expect(card).toContainText('☁ 온라인 채점 · 4/6 통과 · 5분 전 · 커밋 0123456')
  await expect(card).toContainText('recommend_empty')
  await expect(card).toContainText('기대 0 이지만 3')
  await expect(card).not.toContainText('스택 줄')
  await expect(card).toContainText('recommend_null')
  await expect(card).not.toContainText('recommend_ok')
  // 받기 줄 바로 아래
  const barBox = (await page.getByTestId('transfer-bar').first().boundingBox())!
  const cardBox = (await card.boundingBox())!
  expect(cardBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height)
  // 리뷰는 텍스트로(HTML 해석 없음)
  await card.getByText('Claude 리뷰 보기').click()
  await expect(card.locator('pre.lab-review')).toContainText('<b>굵게</b> 아님')
  expect(await card.locator('b').count()).toBe(0)
  // 다시 불러오기 — ?t= 쿼리
  await card.getByRole('button', { name: '다시 불러오기' }).click()
  await expect.poll(() => urls.some((u) => /result\.json\?t=\d+/.test(u))).toBe(true)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('404 면 카드 없음(조용히)', async ({ page }) => {
  await page.route(`${RAW}**`, (route) => route.fulfill({ status: 404, body: 'Not Found' }))
  await open(page)
  await page.waitForTimeout(300)
  await expect(page.getByTestId('lab-result')).toHaveCount(0)
})

test('컴파일 실패: 안내와 빌드 로그 접기', async ({ page }) => {
  await page.route(`${RAW}**`, (route) => route.request().url().includes('result.json')
    ? route.fulfill({ contentType: 'application/json', body: JSON.stringify({ compiled: false, commit: 'deadbeefcafe', gradedAt: RESULT.gradedAt, buildTail: 'ERROR cannot find symbol' })})
    : route.fulfill({ status: 404, body: '' }))
  await open(page)
  const card = page.getByTestId('lab-result')
  await expect(card).toContainText('컴파일 실패')
  await card.getByText('빌드 로그 끝부분').click()
  await expect(card).toContainText('cannot find symbol')
})

for (const [w, h, tag] of [[375, 812, '375'], [1440, 900, '1440']] as const) {
  test(`캡처 ${tag}`, async ({ page }) => {
    await page.route(`${RAW}**`, (route) => route.request().url().includes('result.json')
      ? route.fulfill({ contentType: 'application/json', body: JSON.stringify(RESULT) })
      : route.fulfill({ contentType: 'text/plain', body: '- 정확성 3/4\n- 가독성 4/4\n총평: 경계값을 보세요.' }))
    await page.setViewportSize({ width: w, height: h })
    await open(page)
    await page.getByTestId('lab-result').getByText('Claude 리뷰 보기').click()
    await page.screenshot({ path: `../../../docs/tickets/captures/TKT-246/result-${tag}.png` })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  })
}
