import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

// TKT-219 (D-036): 환승 홀 v0.9 — 출발 안내판(기본) · 화살표 선택 목록(lite) · 첫 방문 부팅 로그.
// TKT-221: 블로그 행 제거(7행) · 유로트럭 「샘플」 · 운영 노트 「공개」 · 부팅 로그 버전은 RELEASE_VERSION 과 같다.
// 시간은 Playwright 가상 시계로 흘린다(호스트가 느려도 90ms·500ms 가 흔들리지 않는다).
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const SHOT_DIR = process.env.HALL_SCREENSHOT_DIR || ''
let base = process.env.HALL_TEST_URL || ''
let browser
let server

before(async () => {
  if (!base) {
    server = createServer(serveStaticBuild)
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    base = `http://127.0.0.1:${server.address().port}${publicBase}`
  }
  browser = await chromium.launch({ headless: true })
  if (SHOT_DIR) await mkdir(SHOT_DIR, { recursive: true })
})

after(async () => {
  await browser?.close()
  if (server) await new Promise(resolve => server.close(resolve))
})

async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase)
    ? decodedPath.slice(publicBase.length)
    : decodedPath.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 1440, height: 900 }
]
const EXPECTED_ROWS = [
  ['기록선', '여행', '운행'],
  ['배움선', 'Advisor', '운행'],
  ['배움선', '일일 5지', '개통 준비'],
  ['놀이선', '격납고', '운행'],
  ['놀이선', '유로트럭', '샘플'],
  ['생활선', '자취 밥상', '운행'],
  ['기지선', '운영 노트', '공개']
]
const LITE_LABELS = ['여행', 'Advisor', '격납고', '유로트럭', '자취 밥상', '운영 노트']

// opts: reducedMotion · seen(재방문 표시) · lite · clock(가상 시계)
async function setup(t, viewport, opts = {}) {
  const context = await newSeoulContext(browser, {
    viewport,
    reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference'
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  if (opts.seen) await page.addInitScript(() => localStorage.setItem('splash:seen', new Date().toISOString()))
  if (opts.lite) await page.addInitScript(() => localStorage.setItem('workaround-view', 'lite'))
  if (opts.clock) await page.clock.install()
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  return page
}

// 여행에서 「환승 홀」 버튼으로 들어간다(블로그 주소 토스트·스플래시를 피하는 경로). 가상 시계면 문 전환이 끝날 때까지 흘린다.
async function enterHall(page, { clock = false } = {}) {
  await page.goto(`${base}voyage`)
  // install 만으로는 시계가 실시간으로 흐른다 — 멈춰 두고 runFor 로만 흘린다.
  if (clock) await page.clock.pauseAt(Date.now() + 2000)
  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  if (clock) {
    for (let waited = 0; waited < 1500; waited += 25) {
      if (await page.locator('.junction-overview').count() > 0 && await page.locator('.door-transition').count() === 0) break
      await page.clock.runFor(25)
    }
  }
  await page.locator('.junction-overview').waitFor()
}

const logLineCount = page => page.evaluate(() => {
  const pre = document.querySelector('[data-hall-log] pre')
  return pre ? pre.textContent.split('\n').filter(Boolean).length : -1
})

async function shot(page, name) {
  if (SHOT_DIR) await page.screenshot({ path: `${SHOT_DIR}/${name}.png` })
}

async function noOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.page-scroller', '.hall'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  for (const [selector, value] of values) assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
}

// 영어 간판 0 — 브랜드명(Advisor·workaround)과 키 이름(Enter)만 허용한다.
async function assertNoEnglishSignage(page) {
  const text = await page.locator('.hall').innerText()
  const leftover = text.replace(/Advisor|workaround|Enter/g, '').match(/[A-Za-z]{2,}/g) || []
  assert.deepEqual(leftover, [], '렌더 텍스트에 영어 간판이 없어야 한다')
}

for (const viewport of VIEWPORTS) {
  const tag = `${viewport.width}px`

  test(`${tag} 기본: 첫 방문은 부팅 로그(줄당 90ms)가 흐른 뒤 500ms 에 출발 안내판으로 바뀐다`, async t => {
    const page = await setup(t, viewport, { clock: true })
    await enterHall(page, { clock: true })
    assert.equal(await page.locator('[data-hall-log]').count(), 1, '첫 방문은 부팅 로그부터')
    assert.equal(await page.locator('[data-hall-board]').count(), 0)

    // 줄이 늘어나는 시각을 10ms 단위로 잰다.
    const firstSeenAt = new Map()
    let elapsed = 0
    let count = await logLineCount(page)
    firstSeenAt.set(count, 0)
    while (count < 10 && elapsed < 1500) {
      await page.clock.runFor(10)
      elapsed += 10
      count = await logLineCount(page)
      if (!firstSeenAt.has(count)) firstSeenAt.set(count, elapsed)
    }
    assert.equal(count, 10, '로그는 10줄')
    // 문 전환이 끝난 시점에 이미 몇 줄이 나와 있다 — 그 뒤에 새로 생긴 줄들의 평균 간격이 90ms 여야 한다.
    const startCount = Math.min(...firstSeenAt.keys())
    assert.ok(startCount <= 6, `문 전환이 끝난 뒤에도 로그가 한참 남아 있어야 한다 (시작 ${startCount}줄)`)
    const stamps = []
    for (let lines = startCount + 1; lines <= 10; lines += 1) {
      assert.ok(firstSeenAt.has(lines), `${lines}번째 줄이 관측돼야 한다`)
      stamps.push(firstSeenAt.get(lines))
    }
    const average = (stamps.at(-1) - stamps[0]) / (stamps.length - 1)
    assert.ok(average >= 85 && average <= 95, `줄당 90ms 안팎: 평균 ${average}ms (${stamps.join(',')})`)
    const logText = await page.locator('[data-hall-log] pre').textContent()
    // TKT-224: VERSION 파일 단일 출처. 빌드와 같은 규칙으로 기대 버전을 계산한다 (RELEASE_VERSION 우선, 없으면 루트 VERSION 첫 줄).
    const rootVersion = await readFile(fileURLToPath(new URL('../../../VERSION', import.meta.url)), 'utf8').then(s => s.split('\n')[0].trim(), () => '')
    const expectedVersion = (process.env.RELEASE_VERSION || '').trim() || rootVersion
    if (expectedVersion) {
      assert.match(logText, new RegExp('\\[ 0\\.000\\] workaround ' + expectedVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' 기동'))
    } else {
      assert.match(logText, /\[ 0\.000\] workaround 기동/)
      assert.doesNotMatch(logText, /workaround \d/, '버전이 없을 때 버전 문자열이 없어야 한다')
    }
    assert.match(logText, /기록선 여행 \.+ \[ 운행 \]/)
    assert.match(logText, /일일 5지 \.+ \[ 준비 \]/)
    assert.match(logText, /유로트럭 \.+ \[ 샘플 \]/)
    assert.match(logText, /운영 노트 \.+ \[ 공개 \]/)
    assert.match(logText, /환승 홀에 도착했습니다\./)
    await noOverflow(page)
    await assertNoEnglishSignage(page)

    // 시안: setTimeout(board, 줄 수 × 90 + 500) = 1400ms — 마지막 줄(810ms)을 그리고 90ms 뒤 + 500ms 에 바뀐다.
    await page.clock.runFor(560)
    assert.equal(await page.locator('[data-hall-board]').count(), 0, '1400ms 전에는 아직 로그')
    await page.clock.runFor(50)
    await page.locator('[data-hall-board]').waitFor()
    assert.equal(await page.locator('[data-hall-log]').count(), 0)
    await page.waitForTimeout(450)
    await shot(page, `board-base-${viewport.width}`)
  })

  test(`${tag} 기본: 부팅 로그 중간 캡처`, { skip: !SHOT_DIR }, async t => {
    // 스크린샷은 가상 시계를 풀어 버리므로 다른 단언과 따로 찍는다.
    const page = await setup(t, viewport, { clock: true })
    await enterHall(page, { clock: true })
    await page.clock.runFor(450)
    await shot(page, `log-mid-${viewport.width}`)
  })

  test(`${tag} 기본: 로그 중 키·클릭·탭 입력이면 바로 안내판`, async t => {
    for (const method of ['key', 'click', 'tap']) {
      const page = await setup(t, { ...viewport }, { clock: true })
      await enterHall(page, { clock: true })
      await page.clock.runFor(200)
      assert.equal(await page.locator('[data-hall-log]').count(), 1, `${method}: 로그 중`)
      if (method === 'key') await page.keyboard.press('a')
      else if (method === 'click') await page.mouse.click(viewport.width / 2, 400)
      else await page.evaluate(({ x, y }) => {
        // 터치 포인터 입력(pointerdown pointerType=touch)
        document.elementFromPoint(x, y)?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }))
      }, { x: viewport.width / 2, y: 400 })
      await page.locator('[data-hall-board]').waitFor()
      assert.equal(await page.locator('[data-hall-log]').count(), 0, `${method}: 로그가 사라진다`)
      assert.equal(await page.locator('.hall-row').count(), 7)
      // 이미 본 로그는 환승 홀을 다시 열어도 돌지 않는다.
      await page.getByRole('button', { name: '기본', exact: true }).waitFor()
    }
  })

  test(`${tag} 기본: 재방문·모션 줄이기는 로그 없이 안내판부터`, async t => {
    for (const opts of [{ seen: true, clock: true }, { reducedMotion: true, clock: true }]) {
      const page = await setup(t, viewport, opts)
      await page.goto(`${base}voyage`)
      await page.clock.pauseAt(Date.now() + 2000)
      await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      const seenLog = []
      for (let waited = 0; waited < 800; waited += 25) {
        seenLog.push(await page.locator('[data-hall-log]').count())
        await page.clock.runFor(25)
      }
      await page.locator('[data-hall-board]').waitFor()
      assert.ok(seenLog.every(value => value === 0), `${JSON.stringify(opts)}: 로그가 한 번도 없어야 한다`)
      assert.equal(await page.locator('.hall-row').count(), 7)
    }
  })

  test(`${tag} 기본: 안내판 표·44px 행·노선색·행 이동·개통 준비 안내`, async t => {
    const page = await setup(t, viewport, { reducedMotion: true })
    await enterHall(page)
    const rows = await page.locator('.hall-row').evaluateAll(elements => elements.map(element => (
      [...element.querySelectorAll(':scope > span')].map(cell => cell.textContent.trim())
    )))
    assert.deepEqual(rows, EXPECTED_ROWS, '시안과 같은 8행·순서')
    assert.deepEqual(await page.locator('.hall-head span').allTextContents(), ['노선', '행선지', '상태'])
    assert.equal(await page.locator('.hall-row:is(a, button)').count(), 7, '행 전체가 버튼/링크')
    assert.equal(await page.locator('.hall-board .hall-title').textContent().then(text => text.replace(/\s+/g, ' ').trim()).then(text => text.startsWith('환승 홀 · 출발 안내')), true)
    const boxes = await page.locator('.hall-row').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
    assert.ok(boxes.every(height => height >= 44), `행 높이 ≥ 44px: ${boxes.join(',')}`)
    const colors = await page.locator('.hall-line').evaluateAll(elements => elements.map(element => getComputedStyle(element).color))
    const [record, learn, play, life, depot] = [colors[0], colors[1], colors[3], colors[5], colors[6]]
    assert.equal(new Set([record, learn, play, life, depot]).size, 5, '노선 5개는 서로 다른 글자색')
    assert.equal(colors[1], colors[2], '같은 노선은 같은 색')
    assert.equal(await page.getByRole('link', { name: /Advisor/ }).getAttribute('href'), `${publicBase}advisor/`)
    await noOverflow(page)
    await assertNoEnglishSignage(page)

    const home = page.url()
    await page.locator('.hall-row').filter({ hasText: '일일 5지' }).click()
    const toast = page.locator('.junction-access-toast')
    await toast.waitFor()
    assert.match(await toast.textContent(), /일일 5지 · 개통 준비 중/)
    assert.equal(page.url(), home, '개통 준비 행은 이동하지 않는다')
    await page.waitForTimeout(2700)
    assert.equal(await page.locator('.junction-access-toast').count(), 0, '안내는 2.5초 뒤 사라진다')

    const targets = [
      ['여행', /\/voyage$/, '여행 노선'],
      ['격납고', /\/sim$/, '미스터리 트레인'],
      ['유로트럭', /\/ets2$/, '유로트럭 관제'],
      ['자취 밥상', /\/pantry$/, '자취 밥상'],
      ['운영 노트', /\/work$/, '운영 노트']
    ]
    for (const [name, pathPattern, title] of targets) {
      await page.locator('.hall-row').filter({ hasText: name }).click()
      await page.locator('.station-topbar h2', { hasText: title }).waitFor()
      assert.match(new URL(page.url()).pathname, pathPattern, `${name} 행 → 해당 화면`)
      await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      await page.locator('.hall-row').first().waitFor()
    }
  })

  test(`${tag} lite: 입력 칸 없는 listbox — 첫 로드 포커스 없음, Tab 으로 첫 항목, ↑↓ 순환·Home/End`, async t => {
    const page = await setup(t, viewport, { reducedMotion: true, lite: true })
    await enterHall(page)
    const hall = page.locator('.hall[data-hall="lite"]')
    await hall.waitFor()
    assert.equal(await hall.locator('input, textarea, [contenteditable]').count(), 0, '글자 입력 칸 없음')
    assert.equal(await hall.locator('#hall-lite-title').textContent(), '환승 홀')
    const list = hall.getByRole('listbox')
    assert.equal(await list.count(), 1)
    assert.deepEqual(await hall.getByRole('option').allTextContents(), LITE_LABELS)
    assert.equal(await page.locator('.hall-board, .hall-row').count(), 0, 'lite 에는 안내판이 없다')
    assert.equal(await list.getAttribute('aria-activedescendant'), null, '처음엔 선택 없음')
    assert.equal(await hall.locator('[aria-selected="true"]').count(), 0)
    assert.equal(await list.evaluate(element => element === document.activeElement), false, '첫 로드에 목록 포커스를 주지 않는다')
    const optionBoxes = await hall.getByRole('option').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
    assert.ok(optionBoxes.every(height => height >= 44), `항목 높이 ≥ 44px: ${optionBoxes.join(',')}`)
    await noOverflow(page)
    await assertNoEnglishSignage(page)

    // Tab 으로 들어오면 첫 항목이 선택된다.
    await page.locator('.view-toggle button').last().focus()
    await page.keyboard.press('Tab')
    assert.equal(await list.evaluate(element => element === document.activeElement), true)
    assert.equal(await list.getAttribute('aria-activedescendant'), 'hall-lite-opt-0')
    assert.equal(await hall.locator('[aria-selected="true"]').textContent(), '여행')
    assert.equal(await hall.getByRole('option').first().evaluate(element => getComputedStyle(element, '::before').content), '"▶ "')

    await page.keyboard.press('ArrowUp')
    assert.equal(await list.getAttribute('aria-activedescendant'), 'hall-lite-opt-5', '맨 위에서 ↑ 는 맨 아래로 순환')
    await page.keyboard.press('ArrowDown')
    assert.equal(await list.getAttribute('aria-activedescendant'), 'hall-lite-opt-0', '맨 아래에서 ↓ 는 맨 위로 순환')
    await page.keyboard.press('End')
    assert.equal(await list.getAttribute('aria-activedescendant'), 'hall-lite-opt-5')
    await page.keyboard.press('Home')
    assert.equal(await list.getAttribute('aria-activedescendant'), 'hall-lite-opt-0')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    assert.equal(await hall.locator('[aria-selected="true"]').textContent(), '격납고')
    await shot(page, `lite-selected-${viewport.width}`)
  })

  test(`${tag} lite: ↓↓Enter 로 세 번째 역(격납고) 진입`, async t => {
    const page = await setup(t, viewport, { reducedMotion: true, lite: true })
    await enterHall(page)
    await page.locator('.view-toggle button').last().focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.locator('.station-topbar h2', { hasText: '미스터리 트레인' }).waitFor()
    assert.match(new URL(page.url()).pathname, /\/sim$/)
  })

  test(`${tag} lite: 탭/클릭 한 번 = 선택, 선택된 줄 다시 = 진입 (첫 줄도 첫 탭은 선택만)`, async t => {
    const page = await setup(t, viewport, { reducedMotion: true, lite: true })
    await enterHall(page)
    const hall = page.locator('.hall[data-hall="lite"]')
    const home = page.url()

    await hall.getByRole('option', { name: '여행' }).click()
    assert.equal(page.url(), home, '첫 탭은 선택만')
    assert.equal(await hall.locator('[aria-selected="true"]').textContent(), '여행')
    await hall.getByRole('option', { name: '자취 밥상' }).click()
    assert.equal(page.url(), home)
    assert.equal(await hall.locator('[aria-selected="true"]').textContent(), '자취 밥상')
    await hall.getByRole('option', { name: '자취 밥상' }).click()
    await page.locator('.station-topbar h2', { hasText: '자취 밥상' }).waitFor()
    assert.match(new URL(page.url()).pathname, /\/pantry$/)
  })

  test(`${tag} lite: Advisor 는 Pages base 의 advisor 주소로 들어간다`, async t => {
    const page = await setup(t, viewport, { reducedMotion: true, lite: true })
    await enterHall(page)
    await page.route(`**${publicBase}advisor/**`, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>advisor</title>' }))
    const hall = page.locator('.hall[data-hall="lite"]')
    await hall.getByRole('option', { name: 'Advisor' }).click()
    await hall.getByRole('option', { name: 'Advisor' }).click()
    await page.waitForURL(`**${publicBase}advisor/`)
  })
}
