import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.TONE_TOOLS_TEST_URL || ''
let browser
let server

const ticket = (id, title, status, priority = 'P1') => ({
  id,
  title,
  status,
  priority,
  targetVersion: 'tone',
  progressDecision: '진행 가능',
  goal: '톤 전환 검증',
  workItems: '화면 정리',
  deliverables: '실화면',
  prerequisites: '없음',
  dependencies: '없음',
  questions: '없음',
  reviewMemo: '',
  prPreparationMemo: '',
  notes: ''
})

const apiFixtures = {
  '/api/health': {
    status: 'degraded',
    responseTimeMs: 82,
    tickets: { queued: 1, running: 1, waiting_llm: 0, retrying: 0, completed: 4 }
  },
  '/api/runtime': {
    nodes: [
      { nodeId: 'ion2', role: '로컬 제어', availability: 'online', latencyMs: 41, handles: ['gateway', 'worker'] },
      { nodeId: 'rtx5070', role: '외부 추론', availability: 'degraded', durationMs: 126, handles: ['ollama'] }
    ],
    routingRules: [
      { when: '가벼운 작업', preferNode: 'ion2', degradedFallback: 'local' }
    ],
    ollama: { status: 'unavailable' }
  },
  '/api/services': { services: [] },
  '/api/services/elevator-service/api/state': {},
  '/api/work-manager/board': {
    columns: [
      {
        status: 'backlog',
        tickets: [
          ticket('TKT-201', '다음 작업', 'backlog', 'P2'),
          ticket('TKT-202', '준비된 작업', 'backlog')
        ]
      },
      { status: 'started', tickets: [ticket('TKT-203', '진행 중 작업', 'started')] },
      { status: 'need_review', tickets: [ticket('TKT-204', '화면 검토', 'need_review')] },
      { status: 'finished', tickets: [ticket('TKT-205', '완료한 작업', 'finished', 'P3')] }
    ],
    workerSummary: [
      { workerId: 'codex-1', status: 'active', focus: '톤 전환', currentTicketIds: ['TKT-203'] }
    ],
    priorityPolicy: {
      queueSource: '보드',
      automaticRange: ['표시'],
      manualRange: ['판정'],
      nextCandidates: ['TKT-202 P1']
    },
    persistence: {
      mode: 'file',
      filePath: 'gateway/data/work-manager-store.json',
      targetDatabase: 'H2',
      auditEventCount: 2,
      lastAuditAt: '2026-09-14T00:00:00Z'
    },
    actions: {
      commandBridgeReady: true,
      commandPresets: [{ action: 'review', label: '검토 요청', description: '검토 큐에 전달' }]
    },
    activityFeed: [],
    commandHistory: []
  }
}

before(async () => {
  if (!base) {
    server = createServer(serveStaticBuild)
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    base = `http://127.0.0.1:${server.address().port}/`
  }
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
})

async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

async function setup(t, scenario, path) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    const body = apiFixtures[pathname]
    await route.fulfill({
      status: body ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(body || { error: 'not-found' })
    })
  })
  await page.addInitScript(({ theme, readyIds }) => {
    localStorage.setItem('workaround-theme', theme)
    localStorage.setItem('workaround-ready-lane', JSON.stringify(readyIds))
    localStorage.setItem('workaround-blog-posts', JSON.stringify([{
      id: 'tone-draft',
      title: '낯선 도시에서 속도를 고르는 법',
      slug: 'tone-draft',
      summary: '',
      bodyMarkdown: '좋은 일정은 빈틈이 없는 계획이 아니었다.',
      tags: [],
      tables: [],
      status: 'draft',
      slugLocked: false,
      createdAt: '2026-09-14T00:00:00Z',
      updatedAt: '2026-09-14T00:00:00Z',
      publishedAt: ''
    }]))
    localStorage.setItem('workaround-blog-studio-post', 'tone-draft')
  }, { theme: scenario.theme, readyIds: ['TKT-202'] })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  await page.goto(`${base}${path}`)
  await page.locator('.portal-stage').waitFor()
  return page
}

async function assertNoPageOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.portal-stage', '.page-scroller', '.feature-shell']
    .map(selector => {
      const element = document.querySelector(selector)
      return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
    }))
  for (const [selector, overflow] of values) {
    assert.equal(overflow, 0, `${selector} 가로 넘침이 없어야 한다`)
  }
}

async function findRenderedUppercaseEnglishLeaves(page) {
  await page.locator('details').evaluateAll(elements => {
    for (const element of elements) element.open = true
  })
  return page.locator('body *').evaluateAll(elements => elements
    .filter(element => element.children.length === 0 && element.getClientRects().length > 0)
    .map(element => ({
      tag: element.tagName.toLowerCase(),
      className: element.className,
      text: element.innerText?.trim() || ''
    }))
    .filter(element => /\b[A-Z]{4,}\b/.test(element.text)))
}

const scenarios = [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]

for (const scenario of scenarios) {
  test(`${scenario.width}px ${scenario.theme}: 격납고는 한 히어로와 시뮬레이션 행으로 읽힌다`, async t => {
    const page = await setup(t, scenario, 'sim')
    await page.getByRole('heading', { name: '멈춘 엘리베이터', exact: true }).waitFor()
    assert.equal(await page.locator('.tone-page-hero').count(), 1)
    assert.equal(await page.locator('.station-sign, .line-card').count(), 0)
    assert.equal(await page.locator('.tone-service-row').count(), 1)
    assert.equal(await page.getByText('추천 시나리오 · 시스템 설계', { exact: true }).count(), 1)
    assert.equal(await page.getByRole('heading', { name: '심야 택시', exact: true }).count(), 1)
    assert.equal(await page.getByText('제품 판단', { exact: true }).count(), 1)
    assert.equal(await page.getByRole('button', { name: '시작', exact: true }).count(), 2)
    assert.equal(await page.getByText('Elevator Station', { exact: true }).count(), 0)
    assert.equal(await page.getByText('Taxi District Lab', { exact: true }).count(), 0)
    await assertNoPageOverflow(page)
    if (process.env.TONE_TOOLS_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.TONE_TOOLS_SCREENSHOT_DIR}/simhub-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })

  test(`${scenario.width}px ${scenario.theme}: Work는 검토 히어로 뒤에 기능 보드를 보존한다`, async t => {
    const page = await setup(t, scenario, 'work')
    await page.getByRole('heading', { name: '검토 대기 1건', exact: true }).waitFor()
    assert.equal(await page.locator('.tone-page-hero').count(), 1)
    assert.equal(await page.getByText('보호 구역', { exact: true }).count(), 1)
    assert.equal(await page.locator('.tone-status-row').count(), 3)
    assert.equal(await page.locator('.tone-work-layout .lane-card').count(), 5)
    assert.equal(await page.locator('.tone-support-details').evaluate(element => element.open), false)
    assert.equal(await page.locator('.tone-work-manager-details').evaluate(element => element.open), false)
    assert.equal(await page.locator('.version-chip-card:visible').count(), 0)
    assert.equal(await page.locator('.station-sign, .station-lead').count(), 0)
    await page.locator('.tone-support-details summary').click()
    assert.deepEqual(await page.locator('.tone-support-details .eyebrow').allTextContents(), [
      '목표 버전',
      '담당 현황',
      '우선순위 정책',
      '저장 방식',
      '다음 작업 예상'
    ])
    const workEyebrows = await page.locator('.tone-work-page .eyebrow').allTextContents()
    assert.equal(workEyebrows.some(label => /\b[A-Z]{4,}\b/.test(label)), false)
    assert.deepEqual(await page.locator('.tone-support-details .prototype-rule-card > strong').allTextContents(), [
      '큐 출처',
      '자동',
      '수동'
    ])
    assert.deepEqual(await page.locator('.tone-support-details .info-stack span').allTextContents(), [
      '방식',
      '감사 파일',
      '대상 DB',
      '감사 기록'
    ])
    await page.locator('.tone-work-manager-details summary').click()
    assert.equal(await page.locator('.tone-work-layout .lane-card:visible').count(), 5)
    assert.equal(await page.getByRole('combobox', { name: '목표 버전 수정', exact: true }).count(), 1)
    assert.equal(await page.getByRole('combobox', { name: '우선순위 수정', exact: true }).count(), 1)
    assert.equal(await page.getByRole('textbox', { name: '의존성 수정', exact: true }).count(), 1)
    assert.deepEqual(await page.locator('.tone-work-layout .detail-stack > article > span').allTextContents(), [
      '레인',
      '목표 버전',
      '목표 버전 수정',
      '우선순위',
      '우선순위 수정',
      '진행 판정',
      '목표',
      '작업 항목',
      '산출물',
      '선행 조건',
      '의존성',
      '의존성 수정',
      '질문',
      '검토 메모',
      'PR 준비 메모',
      '메모'
    ])
    await assertNoPageOverflow(page)
    if (process.env.TONE_TOOLS_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.TONE_TOOLS_SCREENSHOT_DIR}/work-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })

  test(`${scenario.width}px ${scenario.theme}: Runtime은 경고 히어로와 상태 행을 먼저 보인다`, async t => {
    const page = await setup(t, scenario, 'runtime')
    await page.getByRole('heading', { name: '응답 지연이 평소보다 깁니다', exact: true }).waitFor()
    assert.equal(await page.locator('.tone-page-hero').count(), 1)
    assert.equal(await page.locator('.tone-runtime-row').count(), 4)
    assert.deepEqual(await page.locator('.tone-runtime-metric').allTextContents(), [
      '지연 · 82 ms',
      '중단',
      '정상 · 41 ms',
      '지연 · 126 ms'
    ])
    for (const rawStatus of ['degraded', 'unavailable', 'online', 'unknown']) {
      assert.equal(await page.getByText(rawStatus, { exact: true }).count(), 0)
    }
    assert.equal(await page.getByRole('button', { name: '상태 새로고침', exact: true }).count(), 1)
    assert.equal(await page.locator('.tone-support-details').evaluate(element => element.open), false)
    assert.equal(await page.locator('.station-sign, .station-lead, .runtime-card').count(), 0)
    await page.locator('.tone-support-details summary').click()
    assert.deepEqual(await page.locator('.tone-support-details .eyebrow').allTextContents(), [
      '라우팅 규칙',
      '배포 경로'
    ])
    await assertNoPageOverflow(page)
    if (process.env.TONE_TOOLS_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.TONE_TOOLS_SCREENSHOT_DIR}/runtime-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })

  test(`${scenario.width}px ${scenario.theme}: Studio는 720px 본문과 우측/시트 도구를 유지한다`, async t => {
    const page = await setup(t, scenario, 'studio')
    await page.getByRole('textbox', { name: '본문', exact: true }).waitFor()
    const editor = await page.locator('.writer-page').boundingBox()
    assert.ok(editor.width <= 721, `편집 폭은 720px 이하여야 한다: ${editor.width}`)
    assert.equal(await page.getByRole('button', { name: '블로그', exact: true }).textContent(), '← 블로그')
    if (scenario.width >= 1100) {
      const tools = await page.locator('.writer-tools').boundingBox()
      assert.ok(tools && tools.x > editor.x + editor.width, '데스크톱 도구 메뉴는 본문 우측에 있어야 한다')
    } else {
      assert.equal(await page.locator('.writer-tools').isVisible(), false)
      assert.equal(await page.getByRole('button', { name: '글 도구', exact: true }).count(), 1)
    }
    await assertNoPageOverflow(page)
    if (process.env.TONE_TOOLS_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.TONE_TOOLS_SCREENSHOT_DIR}/studio-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })

  test(`${scenario.width}px ${scenario.theme}: 전 정적 경로의 렌더 영어 대문자 간판은 0건이다`, async t => {
    const page = await setup(t, scenario, 'blog')
    const routes = [
      { path: '/', enter: async () => {
        await page.getByRole('button', { name: '환승 홀', exact: true }).click()
        await page.getByRole('heading', { name: '환승 홀', exact: true }).waitFor()
      } },
      { path: '/blog', enter: async () => page.goto(`${base}blog`) },
      { path: '/blog-district', enter: async () => page.goto(`${base}blog-district`) },
      { path: '/studio', enter: async () => page.goto(`${base}studio`) },
      { path: '/sim', enter: async () => page.goto(`${base}sim`) },
      { path: '/work', enter: async () => page.goto(`${base}work`) },
      { path: '/runtime', enter: async () => page.goto(`${base}runtime`) },
      { path: '/voyage', enter: async () => page.goto(`${base}voyage`) }
    ]
    const results = []

    for (const route of routes) {
      await route.enter()
      await page.locator('.portal-stage').waitFor()
      const violations = await findRenderedUppercaseEnglishLeaves(page)
      results.push({ path: route.path, violations })
      if (process.env.TONE_TOOLS_SCREENSHOT_DIR) {
        const slug = route.path === '/' ? 'root' : route.path.slice(1)
        await page.screenshot({
          path: `${process.env.TONE_TOOLS_SCREENSHOT_DIR}/render-copy-${slug}-${scenario.width}-${scenario.theme}.png`,
          fullPage: true
        })
      }
    }

    assert.deepEqual(
      results,
      routes.map(route => ({ path: route.path, violations: [] })),
      'details를 모두 펼친 렌더 leaf innerText에 대문자 영어 간판이 없어야 한다'
    )
  })
}
