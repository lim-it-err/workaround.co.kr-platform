import { expect, test } from '@playwright/test'

const WINE_TITLE = '와인 추천기의 뒤엉킨 책임 풀어내기'
const KTX_TITLE = '통일호가 살아 있는 예매 시스템에 KTX 넣기'
const PROJECT_TITLE = '공공자전거 시스템 — 맨땅에서'

test.beforeEach(async ({ page }) => {
  // The E2E suite intentionally exercises the keyless, backend-off prototype path.
  await page.route('http://localhost:8080/**', (route) => route.abort())
  await page.goto('/learn')
  // A document load can finish before Vue's initial routine persistence.
  // Wait for the mounted home before clearing/seeding browser-local fixtures.
  await expect(page.getByRole('button', { name: '전체 181개 보기' })).toBeVisible()
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByRole('button', { name: '전체 181개 보기' }).click()
  await expect(page.locator('[data-content-index]')).toBeVisible()
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
})

test('미션 완주: 홈에서 제출하고 샘플 리뷰의 핵심 섹션을 본다', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(WINE_TITLE) }).click()
  await expect(page.getByRole('heading', { name: WINE_TITLE })).toBeVisible()

  await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
  await expect(page.getByRole('heading', { name: '상황' })).toBeVisible()
  await page.getByRole('button', { name: '제출', exact: true }).click()

  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/main/java/wine/WineRecommender.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('public class WineRecommender {}')
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()

  await expect(page.getByRole('heading', { name: '기록에 이름을 남깁니다' })).toBeVisible()
  await page.getByPlaceholder('예: 김부장').fill('Codex E2E')
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/missions\/s1-wine-01\/review$/)
  await expect(page.getByText('종합 점수')).toBeVisible()
  await expect(page.getByRole('heading', { name: '🕵️ 히든 케이스 공개' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /시나리오/ })).toBeVisible()
})

test('필터: 난이도와 검색을 조합하고 초기화한다', async ({ page }) => {
  const missionCards = page.locator('.mission-card')
  await page.getByLabel('형식').selectOption('mission')
  await page.getByRole('button', { name: /더 보기/ }).click()
  await expect(missionCards).toHaveCount(39)

  await page.getByText('고급 필터').click()
  await page.getByRole('button', { name: '쉬움', exact: true }).click()
  const easyCount = await missionCards.count()
  expect(easyCount).toBeGreaterThan(0)
  expect(easyCount).toBeLessThan(39)

  await page.getByPlaceholder('제목·도메인으로 찾기').fill('와인')
  await expect(missionCards).toHaveCount(1)
  await expect(page.getByRole('link', { name: new RegExp(WINE_TITLE) })).toBeVisible()

  await page.getByRole('button', { name: '필터 초기화' }).click()
  await expect(page.getByText('181개', { exact: true })).toBeVisible()
})

test('기획자 모드: 참석자는 보이지만 비공개 관심사는 DOM에 없다', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(KTX_TITLE) }).click()
  await expect(page.locator('.mode-btn')).toHaveCount(3)

  await page.getByRole('button', { name: '🤝 기획자 · 회의' }).click()
  await expect(page.getByRole('heading', { name: '참석자' })).toBeVisible()
  await expect(page.locator('.stakeholder')).toHaveCount(4)
  await expect(page.locator('body')).not.toContainText('수기 보정')
})

test('프로젝트 여정: 첫 제출이 두 번째 소미션을 해금한다', async ({ page }) => {
  await page.goto('/projects')
  await page.getByRole('link', { name: new RegExp(PROJECT_TITLE) }).click()

  const nodeCards = page.locator('.node-card')
  await expect(nodeCards).toHaveCount(6)
  await expect(page.getByRole('button', { name: /도메인 모델 — 이름을 먼저 짓는다/ })).toBeEnabled()
  await expect(page.getByRole('button', { name: /대여와 반납 — 규칙이 코드가 되는 순간/ })).toBeDisabled()

  await page.getByPlaceholder('예: src/main/java/wine/WineRecommender.java').fill('src/main/java/bike/Bike.java')
  await page.getByPlaceholder('IntelliJ에서 작성한 코드를 여기에 붙여넣으세요').fill('public record Bike(String id) {}')
  await page.getByRole('button', { name: '제출하고 리뷰 받기' }).click()
  await page.getByPlaceholder('예: 김부장').fill('Codex E2E')
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page.getByRole('button', { name: /대여와 반납 — 규칙이 코드가 되는 순간/ })).toBeEnabled()
})

test('오늘: 다음 한 걸음 하나와 접힌 보조 루틴을 보여준다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.clock.setFixedTime(new Date('2026-08-03T08:00:00'))
  await page.goto('/routine')
  await expect(page).toHaveURL(/\/today$/)
  await expect(page.getByRole('navigation', { name: '전역 메뉴' }).getByRole('link')).toHaveCount(3)
  await expect(page.locator('.surface-hero .btn.primary')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: '사라지는 적립금 · 1일차' })).toBeVisible()
  await expect(page.locator('.routine-row').first()).not.toBeVisible()
  await page.getByText('오늘 전체 보기').click()
  await expect(page.locator('.routine-row')).toHaveCount(3)
  await expect(page.locator('.routine-row').first()).toBeVisible()
  await expect(page.locator('.secondary-block').nth(1)).not.toHaveAttribute('open', '')
  expect(errors).toEqual([])
})

test('머지 or 반려: 375px에서 5장 판정 후 세션 요약을 본다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto('/routine/swipe')
  await expect(page).toHaveURL(/\/routine\/swipe$/)
  await expect(page.getByText(/오늘의 판정 5장/)).toBeVisible()

  for (let index = 0; index < 5; index++) {
    await page.getByRole('button', { name: '✅ 머지' }).click()
    await page.getByRole('button', { name: '정확성', exact: true }).click()
    await expect(page.getByText(/^정답:/)).toBeVisible()
    await page.getByRole('button', { name: index === 4 ? '결과 보기' : '다음 카드 →' }).click()
  }

  await expect(page.getByRole('heading', { name: '5장 판정 완료' })).toBeVisible()
  await expect(page.getByText('맞은 판정')).toBeVisible()
  await expect(page.getByText('근거 적중')).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(Object.values(persisted.swipeSessions ?? {})).toContain(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('한 번만 물어본다면: 관측으로 가설을 흐리고 지목 뒤 정보량 해설을 본다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })
  await page.clock.setFixedTime(new Date('2026-08-03T09:00:00'))
  await page.evaluate(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      seasonStats: { seasonStart: '2026-08-03', gains: [] },
    }))
  })
  await page.reload()

  await page.goto('/games/probe')
  await expect(page).toHaveURL(/\/games\/probe$/)
  await expect(page.getByRole('heading', { name: '금요일 오후의 p99' })).toBeVisible()

  await page.getByRole('button', { name: '오늘 오후의 슬로우 쿼리 로그를 연다' }).click()
  await expect(page.getByText(/order 테이블 full scan/)).toBeVisible()
  const eliminated = page.locator('.hypothesis.eliminated')
  await expect(eliminated).toHaveCount(2)
  await expect.poll(() => eliminated.evaluateAll((nodes) => nodes.every((node) => {
    const style = getComputedStyle(node)
    return Number(style.opacity) < 0.5 && style.textDecorationLine === 'none'
  }))).toBe(true)

  await page.getByRole('button', { name: /DB 인덱스를 안 타는 쿼리가 생겼다/ }).click()
  await expect(page.getByText('적중', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: '내 관측의 정보량' })).toBeVisible()
  await expect(page.getByText('최선의 관측을 골랐습니다.')).toBeVisible()
  await page.getByText('다른 관측들의 정보량 해설').click()
  await expect(page.getByText(/결제사는 무죄/)).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.probeSessions['2026-08-03']).toEqual({
    roundId: 'probe-slow-api-01',
    probeKey: 'slow-query',
    verdictKey: 'index',
  })
  const seasonGains = persisted.seasons.activeId
    ? persisted.seasons.byId[persisted.seasons.activeId].gains
    : persisted.seasons.pendingGains
  expect(seasonGains.filter(
    (gain: { source: string }) => gain.source.startsWith('probe-'),
  )).toHaveLength(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('경계선 한 칸: 같은 운명 구간과 타임아웃 결과를 보고 다른 경계와 비교한다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })
  await page.clock.setFixedTime(new Date('2026-08-03T09:00:00'))
  await page.evaluate(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      seasonStats: { seasonStart: '2026-08-03', gains: [] },
    }))
  })
  await page.reload()

  await page.goto('/games/boundary')
  await expect(page).toHaveURL(/\/games\/boundary$/)
  await expect(page.getByRole('heading', { name: '타행 이체의 세 단계' })).toBeVisible()
  await expect(page.locator('.flow-step')).toHaveCount(4)

  await page.getByRole('button', { name: /출금 먼저 확정/ }).click()
  await expect(page.locator('.flow-step.grouped')).toHaveCount(1)
  await expect(page.getByText('⚡ 타임아웃 발생')).toBeVisible()
  await expect(page.getByText(/돈의 보존/)).toBeVisible()
  await expect(page.getByText('이 상황의 권장 · 정답 아님')).toBeVisible()

  await page.getByRole('button', { name: /입금 확인까지 동기로/ }).click()
  await expect(page.locator('.outcome-card')).toHaveCount(2)
  await expect(page.getByText(/확실성을 동기로 사면/)).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.boundarySessions['2026-08-03']).toEqual({
    roundId: 'boundary-transfer-01',
    chosenKey: 'debit-first',
  })
  const seasonGains = persisted.seasons.activeId
    ? persisted.seasons.byId[persisted.seasons.activeId].gains
    : persisted.seasons.pendingGains
  expect(seasonGains.filter(
    (gain: { source: string }) => gain.source.startsWith('boundary-'),
  )).toHaveLength(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('카드 갈래: 첫 선택을 저장하고 반대 입장도 본 뒤 새로고침하면 복원한다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto('/games?card=read-ggs-01')
  const card = page.locator('[data-card-id="read-ggs-01"]')
  await expect(card.getByText('여러분 프로젝트에서 가장 오래된 초기 선택 — 지금 그것은 무엇에 가깝습니까?'))
    .toBeVisible()

  await card.getByRole('button', { name: '🌾 축복 — 그 덕에 여기까지 왔다' }).click()
  await expect(card.getByText(/축복이라 느껴진다면/)).toBeVisible()
  const otherChoice = card.getByRole('button', { name: '⛓ 부채 — 매일 이자를 내고 있다' })
  await expect(otherChoice).toHaveClass(/muted/)
  await otherChoice.click()
  await expect(card.getByText(/부채라 부르는 순간/)).toBeVisible()

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.cardForkChoices['read-ggs-01']).toBe('blessing')
  expect(persisted.cardForkChoiceDates['read-ggs-01']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  const seasonGains = persisted.seasons.activeId
    ? persisted.seasons.byId[persisted.seasons.activeId].gains
    : persisted.seasons.pendingGains
  expect(seasonGains.filter(
    (gain: { source: string }) => gain.source === 'card-fork:read-ggs-01',
  )).toHaveLength(1)

  await page.reload()
  const reloadedCard = page.locator('[data-card-id="read-ggs-01"]')
  await expect(reloadedCard.getByText(/축복이라 느껴진다면/)).toBeVisible()
  await expect(reloadedCard.getByRole('button', { name: '🌾 축복 — 그 덕에 여기까지 왔다' }))
    .toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('사건 파일: Day 1부터 몰아보고 근본 원인을 한 번 지목한다', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.setViewportSize({ width: 375, height: 812 })

  await page.goto('/games/case/case-vanishing-points-01')

  await expect(page).toHaveURL(/\/games\/case\/case-vanishing-points-01$/)
  await expect(page.getByRole('heading', { name: '사라지는 적립금' })).toBeVisible()
  await expect(page.getByText('1일차 · 민원과 그래프')).toBeVisible()
  await expect(page.getByText('민원 41건 표본 정리:')).toBeVisible()
  await expect(page.getByRole('heading', { name: '이 사건의 근본 원인은 무엇입니까?' })).not.toBeVisible()

  await page.getByRole('button', { name: '몰아보기' }).click()
  await expect(page.getByText('5일차 · 코드')).toBeVisible()
  await expect(page.getByText('민원 41건 표본 정리:')).not.toBeVisible()
  await page.getByText('1일차 · 민원과 그래프').click()
  await expect(page.getByText('민원 41건 표본 정리:')).toBeVisible()
  await page.getByRole('button', {
    name: '증설 서버의 크론이 시간대 차이로 이중 실행됐고, 만료 차감에 멱등성이 없었다',
  }).click()

  await expect(page.getByText('적중', { exact: true })).toBeVisible()
  await expect(page.getByText(/방아쇠는 D-14의 증설입니다/)).toBeVisible()
  await expect(page.getByText(/수정은 세 줄이었습니다/)).toBeVisible()
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
  expect(persisted.caseProgress['case-vanishing-points-01']).toMatchObject({
    openedDays: 5,
    verdict: 'cron-idempotency',
  })
  const seasonGains = persisted.seasons.activeId
    ? persisted.seasons.byId[persisted.seasons.activeId].gains
    : persisted.seasons.pendingGains
  expect(seasonGains.filter((gain: { source: string }) => gain.source.startsWith('case-')))
    .toHaveLength(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('시즌: 루틴 수동 체크가 교양 +1과 최근 적립 로그에 반영된다', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-04T08:00:00'))
  await page.evaluate(() => {
    localStorage.setItem('advisor.learner.v1', JSON.stringify({
      learner: { nickname: 'Codex E2E' },
      seasonStats: { seasonStart: '2026-08-03', gains: [] },
    }))
  })
  await page.reload()

  await page.goto('/today')
  await page.getByText('오늘 전체 보기').click()
  await page.getByRole('button', { name: '읽었어요 ✓' }).click()
  await page.getByRole('link', { name: '기록', exact: true }).click()

  await expect(page).toHaveURL(/\/history$/)
  await expect(page.locator('[data-stat="culture"] .stat-value')).toHaveText('1')
  await expect(page.getByText('루틴 수동 체크')).toBeVisible()
  await expect(page.getByText('+1', { exact: true })).toBeVisible()
})

test('기내 모드: 375px에서 설정과 이어보기를 로컬로 복원한다', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/inflight')
  await expect(page).toHaveURL(/\/today#offline$/)
  await expect(page.getByText('오프라인 세션 만들기')).toBeVisible()
  await page.getByRole('button', { name: '30분 사건' }).click()
  await page.getByRole('button', { name: '운영' }).click()
  await page.locator('.flight-card').first().click()
  await expect(page.getByText('연습 모드 · 보상/연속 기록 없음')).toBeVisible()
  await page.reload()
  await page.goto('/inflight')
  await expect(page.getByRole('link', { name: /이어서 하기/ })).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.practice.v1') ?? '{}'))
  expect(saved.inflight).toMatchObject({ duration: 30, taste: 'operations' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

for (const scenario of [
  { game: 'minimal-repro', heading: '빈 목록에서만 합계가 NaN', choice: /입력을 0개와 1개로 줄이고/ },
  { game: 'concurrency-sequencing', heading: '재고 1개에 주문 두 건', choice: /원자적 조건 갱신/ },
  { game: 'bulkheads', heading: '썸네일 장애가 상품 API를 고갈', choice: /이미지 호출의 풀과 타임아웃/ },
]) {
  test(`신규 연습 게임 완주: ${scenario.game}`, async ({ page }) => {
    await page.goto(`/games/practice/${scenario.game}`)
    await expect(page.getByRole('heading', { name: scenario.heading })).toBeVisible()
    await page.getByRole('button', { name: scenario.choice }).click()
    await page.getByRole('button', { name: '선택하고 해설 보기' }).click()
    await expect(page.getByText('판 뒤집기')).toBeVisible()
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.practice.v1') ?? '{}'))
    expect(saved.completed[scenario.game]).toHaveLength(1)
    const daily = await page.evaluate(() => JSON.parse(localStorage.getItem('advisor.learner.v1') ?? '{}'))
    expect(daily.swipeSessions ?? {}).toEqual({})
    expect(daily.probeSessions ?? {}).toEqual({})
    expect(daily.boundarySessions ?? {}).toEqual({})
  })
}
