import { expect, test } from '@playwright/test'

const MISSION_ID = 's1-wine-01'
const MISSION_TITLE = '와인 추천기의 뒤엉킨 책임 풀어내기'

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', route => route.abort())
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear()).catch(() => {})
})

test('3표면과 기존 주소가 새 의미로 이어지고 화면이 넘치지 않는다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto('/')
  await expect(page).toHaveURL(/\/today$/)
  const globalNav = page.getByRole('navigation', { name: '전역 메뉴' })
  await expect(globalNav.getByRole('link')).toHaveText(['오늘', '배우기', '기록'])
  await expect(page.locator('.surface-hero h1')).toBeVisible()
  await expect(page.locator('.surface-hero .btn.primary')).toHaveCount(1)
  await expect(page.locator('.surface-hero .btn.primary')).toBeInViewport()

  const aliases = [
    ['/routine', /\/today$/],
    ['/inflight', /\/today#offline$/],
    ['/missions', /\/learn$/],
    ['/games', /\/learn#practice$/],
    ['/projects', /\/learn#projects$/],
    ['/missions/history', /\/history$/],
    ['/season', /\/history#season$/],
  ] as const
  for (const [path, destination] of aliases) {
    await page.goto(path)
    await expect(page).toHaveURL(destination)
    await expect(page.locator('.shell-main > *').first()).toBeVisible()
  }

  const details = [
    `/missions/${MISSION_ID}`,
    `/missions/${MISSION_ID}/review`,
    '/games/practice/minimal-repro',
    '/games/probe',
    '/games/boundary',
    '/games/case/case-vanishing-points-01',
    '/routine/swipe',
    '/projects/p-bike-01',
  ]
  for (const path of details) {
    await page.goto(path)
    await expect(page.locator('.shell-main > *').first()).toBeVisible()
  }

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/today', '/learn', '/history', `/missions/${MISSION_ID}`]) {
      await page.goto(path)
      expect(await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth,
      )), `${width}px ${path}`).toBe(0)
    }
  }
})

test('초안은 탭 전환·목록 왕복·새로고침에서 여러 파일과 설명을 복원한다', async ({ page }) => {
  await page.goto('/learn')
  await page.getByRole('link', { name: new RegExp(MISSION_TITLE) }).click()
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/Main.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('class Main {}')
  await page.getByRole('button', { name: '+ 파일 추가' }).click()
  await page.locator('.path').nth(1).fill('src/MainTest.java')
  await page.locator('.content').nth(1).fill('class MainTest {}')
  await page.getByRole('button', { name: '설명 훈련' }).click()
  await page.locator('.explain-input').fill('설명 초안도 함께 보존')
  await expect(page.getByText(/^저장됨 /)).toBeVisible()

  await page.getByRole('button', { name: '제출', exact: true }).click()
  expect(await page.locator('.path').evaluateAll(nodes => nodes.map(node => (node as HTMLInputElement).value)))
    .toEqual(['src/Main.java', 'src/MainTest.java'])
  await page.locator('.content').first().fill('class Main { int x; }')
  await page.getByRole('link', { name: '← 배우기' }).click()
  await page.getByRole('link', { name: new RegExp(MISSION_TITLE) }).click()
  await page.getByRole('button', { name: '제출', exact: true }).click()
  expect(await page.locator('.content').evaluateAll(nodes => nodes.map(node => (node as HTMLTextAreaElement).value)))
    .toEqual(['class Main { int x; }', 'class MainTest {}'])

  await page.reload()
  await page.getByRole('button', { name: '제출', exact: true }).click()
  expect(await page.locator('.path').evaluateAll(nodes => nodes.map(node => (node as HTMLInputElement).value)))
    .toEqual(['src/Main.java', 'src/MainTest.java'])
  await page.getByRole('button', { name: '설명 훈련' }).click()
  await expect(page.locator('.explain-input')).toHaveValue('설명 초안도 함께 보존')
})

test('핵심 조작부의 실제 높이는 모두 40px 이상이다', async ({ page }) => {
  const expectMinimumHeight = async (selector: string) => {
    const locator = page.locator(selector)
    await expect(locator.first()).toBeVisible()
    const heights = await locator.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))
    expect(heights.length, selector).toBeGreaterThan(0)
    expect(Math.min(...heights), selector).toBeGreaterThanOrEqual(40)
  }

  await page.goto('/learn')
  await page.getByText('고급 필터').click()
  await expectMinimumHeight('.chip-toggle')
  await page.goto('/inflight')
  await expect(page.locator('.pill').first()).toBeVisible()
  await expectMinimumHeight('.pill')
  await page.goto(`/missions/${MISSION_ID}`)
  await expect(page.locator('.tab').first()).toBeVisible()
  await expectMinimumHeight('.tab')
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await expectMinimumHeight('.remove')
})

test('초안 저장 실패는 입력을 유지하고 이탈 확인과 재시도를 제공한다', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'advisor.drafts.v1') throw new DOMException('quota', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.goto(`/missions/${MISSION_ID}`)
  await page.getByRole('button', { name: '제출', exact: true }).click()
  const editor = page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요')
  await editor.fill('잃으면 안 되는 입력')
  await expect(page.getByText('저장 실패', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible()

  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('초안을 저장하지 못했습니다')
    await dialog.dismiss()
  })
  await page.getByRole('link', { name: '← 배우기' }).click()
  await expect(page).toHaveURL(new RegExp(`/missions/${MISSION_ID}$`))
  await expect(editor).toHaveValue('잃으면 안 되는 입력')
})

test('성공 응답은 제출 스냅샷만 비우고 응답 중 새 입력은 남긴다', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({ learner: { nickname: '초안 검증' } }))
  })
  await page.route('http://localhost:8080/api/advisor/review/preview', async route => {
    await new Promise(resolve => setTimeout(resolve, 450))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], summary: '검토 완료', hiddenCases: [], nextSteps: [], followUpQuestions: [] }),
    })
  })
  await page.goto(`/missions/${MISSION_ID}`)
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await page.locator('.path').fill('src/Main.java')
  const editor = page.locator('.content')
  await editor.fill('제출 스냅샷')
  await expect(page.getByText(/^저장됨 /)).toBeVisible()
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
  await editor.fill('응답 대기 중 새 입력')
  await expect(page).toHaveURL(new RegExp(`/missions/${MISSION_ID}/review$`))

  const draft = await page.evaluate(id => {
    const all = JSON.parse(localStorage.getItem('advisor.drafts.v1') ?? '{}')
    return all[`${id}:developer`]
  }, MISSION_ID)
  expect(draft.files[0]).toEqual({ name: 'src/Main.java', body: '응답 대기 중 새 입력' })
})

test('성공 응답 뒤 바뀌지 않은 제출 초안은 비워진다', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({ learner: { nickname: '초안 검증' } }))
  })
  await page.route('http://localhost:8080/api/advisor/review/preview', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items: [], summary: '검토 완료', hiddenCases: [], nextSteps: [], followUpQuestions: [] }),
  }))
  await page.goto(`/missions/${MISSION_ID}`)
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await page.locator('.path').fill('src/Main.java')
  await page.locator('.content').fill('제출 뒤 비울 입력')
  await expect(page.getByText(/^저장됨 /)).toBeVisible()
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
  await expect(page).toHaveURL(new RegExp(`/missions/${MISSION_ID}/review$`))
  expect(await page.evaluate(() => localStorage.getItem('advisor.drafts.v1'))).toBeNull()
})
