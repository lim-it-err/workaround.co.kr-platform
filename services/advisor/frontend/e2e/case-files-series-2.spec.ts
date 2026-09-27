import { expect, test } from '@playwright/test'

const CASES = [
  {
    id: 'case-vignette-double-charge-01',
    title: '두 번 결제된 비네트',
    answer: '타임아웃 재시도마다 새 멱등키를 만들어 결제사가 별도 요청으로 처리했다',
    causeLine: 'String idempotencyKey = UUID.randomUUID().toString();',
  },
  {
    id: 'case-midnight-fx-cache-01',
    title: '환율이 밤새 바뀐다',
    answer: '캐시 준비가 환율 반입보다 먼저 돌고 반입 뒤 무효화가 없어 전일 값을 보존했다',
    causeLine: 'FX_JOB_ORDER=cache-warm,business-date-rollover,rate-import',
  },
]

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
  await page.goto('/learn')
  await expect(page.getByRole('heading', { name: '한 서가에서, 지금 맞는 배움을 고르세요' })).toBeVisible()
  await page.evaluate(() => localStorage.clear())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('/learn#cases에서 기존 8편 뒤 신규 2편을 바로 찾는다', async ({ page }) => {
  await page.goto('/learn#cases')
  await expect(page.getByRole('combobox', { name: '형식' })).toHaveValue('case')
  await expect(page.getByText('10개', { exact: true })).toBeVisible()
  await expect(page.locator('[data-content-kind="case"]')).toHaveCount(10)
  await expect(page.getByRole('link', { name: /두 번 결제된 비네트/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /환율이 밤새 바뀐다/ })).toBeVisible()
})

for (const caseFile of CASES) {
  test(`${caseFile.title}: 닷새 몰아보기부터 판정·해설까지 이어진다`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 })
    await page.goto(`/games/case/${caseFile.id}`)
    await expect(page.getByRole('heading', { name: caseFile.title })).toBeVisible()

    await page.getByRole('button', { name: '몰아보기' }).click()
    await expect(page.locator('.clue-list details')).toHaveCount(5)
    await expect(page.getByText('5/5일')).toBeVisible()

    await page.getByRole('button', { name: caseFile.answer }).click()
    const resolution = page.locator('.resolution')
    await expect(resolution.getByText('적중', { exact: true })).toBeVisible()
    await expect(resolution.getByRole('heading', { name: '해설' })).toBeVisible()
    await expect(resolution.getByText(caseFile.causeLine, { exact: false })).toBeVisible()
    await expect(resolution.getByRole('heading', { name: '에필로그' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    await page.screenshot({ path: testInfo.outputPath(`${caseFile.id}-375.png`), fullPage: true })
  })
}
