import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let apiPort = 0
let apiBase = ''
let appBase = process.env.ETS2_DEV_TEST_URL || ''
let appServer
let apiServer
let browser
let requestLog = []
let pocState
let nextActionError = ''

function initialState() {
  return {
    telemetry: {
      connected: true,
      paused: false,
      speedMps: 25,
      cruiseMps: 22.222,
      inputSteer: 0.12,
      inputBrake: 0,
      speedLimitMps: 27.778,
      routeDistanceM: 14200,
      inputReady: true,
      channelsReady: true
    },
    armed: false,
    pendingArm: false,
    maneuver: null,
    reason: '명령 준비 전',
    events: [],
    token: 'stub-token',
    version: 2,
    monitor: { enabled: false, phase: 'off', reason: '감시 꺼짐', lowSpeedSeconds: 0, thresholdSeconds: 120 },
    capture: { available: true, id: 1, width: 1280, height: 720 },
    recovery: { running: false, configured: true, reason: '로컬 복구 어댑터 설정됨' }
  }
}

before(async () => {
  apiServer = createServer(serveApi)
  await new Promise((resolve, reject) => {
    apiServer.once('error', reject)
    apiServer.listen(0, '127.0.0.1', resolve)
  })
  apiPort = apiServer.address().port
  apiBase = `http://127.0.0.1:${apiPort}`

  if (!appBase) {
    appServer = createServer(serveStaticBuild)
    await new Promise((resolve, reject) => {
      appServer.once('error', reject)
      appServer.listen(0, '127.0.0.1', resolve)
    })
    appBase = `http://127.0.0.1:${appServer.address().port}${publicBase}`
  }
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  if (appServer) await new Promise(resolve => appServer.close(resolve))
  if (apiServer) await new Promise(resolve => apiServer.close(resolve))
})

beforeEach(() => {
  pocState = initialState()
  requestLog = []
  nextActionError = ''
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
  const types = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.svg': 'image/svg+xml' }
  response.writeHead(200, { 'content-type': types[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

function corsHeaders(request) {
  return {
    'access-control-allow-origin': request.headers.origin || '*',
    'access-control-allow-headers': 'Content-Type, X-Poc-Token',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'content-type': 'application/json; charset=utf-8'
  }
}

function serveApi(request, response) {
  const url = new URL(request.url, `http://127.0.0.1:${apiPort}`)
  requestLog.push({ method: request.method, path: url.pathname, headers: request.headers, body: '' })
  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders(request))
    response.end()
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/state') {
    response.writeHead(200, corsHeaders(request))
    response.end(JSON.stringify(pocState))
    return
  }
  if (request.method === 'GET' && url.pathname === '/api/frame.jpg') {
    response.writeHead(200, { ...corsHeaders(request), 'content-type': 'image/svg+xml' })
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="100%" height="100%" fill="#203039"/></svg>')
    return
  }
  if (request.method === 'POST' && url.pathname === '/api/action') {
    let body = ''
    request.on('data', chunk => { body += chunk })
    request.on('end', () => {
      requestLog.at(-1).body = body
      const payload = JSON.parse(body)
      if (nextActionError) {
        const error = nextActionError
        nextActionError = ''
        response.writeHead(409, corsHeaders(request))
        response.end(JSON.stringify({ error }))
        return
      }
      if (payload.action === 'arm') {
        pocState.armed = true
        pocState.reason = '명령 준비'
      }
      if (payload.action === 'monitorStart') {
        pocState.monitor.enabled = true
        pocState.monitor.reason = '주행 데이터 대기'
      }
      if (payload.action === 'monitorStop') {
        pocState.monitor.enabled = false
        pocState.monitor.reason = '사용자 중단'
      }
      if (payload.action === 'laneChange') pocState.maneuver = { direction: payload.direction, elapsed: 0 }
      response.writeHead(200, corsHeaders(request))
      response.end(JSON.stringify({ ok: true }))
    })
    return
  }
  response.writeHead(404, corsHeaders(request))
  response.end(JSON.stringify({ error: 'not found' }))
}

async function setup(t, { width = 1440, height = 900, theme = 'dark', allowHttp409 = false } = {}) {
  const context = await newSeoulContext(browser, { viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) {
      if (allowHttp409 && message.text().includes('409 (Conflict)')) return
      errors.push(message.text())
    }
  })
  await page.addInitScript(selectedTheme => localStorage.setItem('workaround-theme', selectedTheme), theme)
  await page.addInitScript(testApi => {
    window.__WORKAROUND_ETS2_DEV_TEST_API__ = testApi
  }, apiBase)
  t.after(async () => {
    const unexpected = requestLog.filter(entry => !['/api/state', '/api/frame.jpg', '/api/action'].includes(entry.path))
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(unexpected, [], 'PoC 원격 요청은 세 API로 제한해야 한다')
  })
  await page.goto(`${appBase}ets2/dev`)
  await page.locator('.ets2-dev-page').waitFor()
  await page.waitForFunction(() => document.querySelector('.ets2-dev-connection')?.textContent.includes('25Hz'))
  return page
}

async function assertNoOverflow(page) {
  const values = await page.evaluate(() => ['html', 'body', '.portal-stage', '.page-scroller', '.ets2-dev-page'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
  assert.ok(values.every(([, value]) => value === 0), `가로 overflow: ${JSON.stringify(values)}`)
}

test('연결 상태와 연결 끊김을 같은 상태 줄에서 구분한다', async t => {
  pocState.armed = true
  const page = await setup(t)
  assert.equal(await page.locator('.ets2-dev-connection').textContent(), '연결됨 · 25Hz · 일시정지 아님')
  assert.match(await page.locator('.ets2-dev-telemetry').innerText(), /90\.0 km\/h[\s\S]*80 km\/h[\s\S]*100 km\/h[\s\S]*14\.2 km/)
  assert.equal(await page.getByRole('button', { name: 'ACC 설정/해제', exact: true }).isEnabled(), true)
  pocState.telemetry.connected = false
  await page.waitForFunction(() => document.querySelector('.ets2-dev-connection')?.textContent.includes('게임 연결 대기'))
  assert.equal(await page.locator('.ets2-dev-connection').textContent(), 'PoC 연결됨 · 게임 연결 대기')
  for (const name of ['ACC 설정/해제', '−5 km/h', '+5 km/h', '차선유지 토글']) {
    assert.equal(await page.getByRole('button', { name, exact: true }).isDisabled(), true, `${name}은 연결 단절 시 잠겨야 한다`)
  }
  assert.equal(await page.getByRole('button', { name: '커스텀 제어 중단', exact: true }).isEnabled(), true)
})

test('명령 준비 전 제어가 잠기고 준비 후 활성화된다', async t => {
  const page = await setup(t)
  assert.equal(await page.getByRole('button', { name: 'ACC 설정/해제', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: '명령 준비', exact: true }).click()
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find(item => item.textContent.trim() === 'ACC 설정/해제')
    return button && !button.disabled
  })
  assert.equal(await page.getByRole('button', { name: 'ACC 설정/해제', exact: true }).isEnabled(), true)
})

test('+5 요청은 토큰 헤더와 JSON 본문을 보낸다', async t => {
  pocState.armed = true
  const page = await setup(t)
  await page.getByRole('button', { name: '+5 km/h', exact: true }).click()
  await page.waitForTimeout(120)
  const request = requestLog.find(entry => entry.method === 'POST' && JSON.parse(entry.body || '{}').action === 'plus')
  assert.ok(request)
  assert.equal(request.headers['x-poc-token'], 'stub-token')
  assert.match(String(request.headers['content-type']), /^application\/json/)
  assert.deepEqual(JSON.parse(request.body), { action: 'plus' })
})

test('명령 실패는 누른 버튼 묶음 바로 아래에서 요청·실패로 구분된다', async t => {
  pocState.armed = true
  nextActionError = '게임이 응답하지 않았습니다.'
  const page = await setup(t, { width: 375, height: 812, allowHttp409: true })
  const button = page.getByRole('button', { name: 'ACC 설정/해제', exact: true })
  await button.scrollIntoViewIfNeeded()
  await button.click()
  const feedback = page.locator('.ets2-dev-action-feedback[data-tone="error"]')
  await feedback.waitFor()
  assert.equal(await feedback.textContent(), 'ACC 설정/해제 실패 · 게임이 응답하지 않았습니다.')
  const [buttonBox, feedbackBox] = await Promise.all([button.boundingBox(), feedback.boundingBox()])
  assert.ok(buttonBox && feedbackBox && feedbackBox.y >= buttonBox.y + buttonBox.height, '실패 안내는 조작 묶음 바로 뒤에 있어야 한다')
  assert.ok(feedbackBox.y < 812, '실패 안내는 클릭 직후 현재 뷰포트에서 보여야 한다')
})

test('차선 변경은 준비·속도·두 확인 조건을 모두 통과해야 한다', async t => {
  pocState.armed = true
  const page = await setup(t)
  const left = page.getByRole('button', { name: '← 왼쪽', exact: true })
  assert.equal(await left.isDisabled(), true)
  await page.getByLabel('빈 도로 확인', { exact: true }).check()
  assert.equal(await left.isDisabled(), true)
  await page.getByLabel('내장 차선유지 껐음', { exact: true }).check()
  assert.equal(await left.isEnabled(), true)
  await left.click()
  await page.waitForTimeout(120)
  const request = requestLog.find(entry => entry.method === 'POST' && JSON.parse(entry.body || '{}').action === 'laneChange')
  assert.deepEqual(JSON.parse(request.body), { action: 'laneChange', direction: 'left', clearRoad: true, laneAssistOff: true, widthM: 3.6 })
})

test('감시 시작·중단을 반영하고 네 화면 규격에서 overflow와 40px 조작 높이를 지킨다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'light' })
  await page.getByRole('button', { name: '감시 시작', exact: true }).click()
  await page.waitForTimeout(160)
  assert.equal(await page.getByRole('button', { name: '감시 시작', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: '감시 중단', exact: true }).click()
  await page.waitForTimeout(160)
  assert.equal(await page.getByRole('button', { name: '감시 시작', exact: true }).isEnabled(), true)
  await page.locator('.ets2-dev-simulator summary').click()
  const simulator = page.locator('.ets2-dev-simulator iframe')
  await simulator.waitFor()
  await simulator.contentFrame().locator('#road').waitFor()
  const rangeHeight = await simulator.contentFrame().locator('#target-speed').evaluate(element => element.getBoundingClientRect().height)
  assert.ok(rangeHeight >= 40, `시뮬레이터 range 높이 ${rangeHeight}px`)
  const heights = await page.locator('.ets2-dev-button-row button:visible').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height))
  assert.ok(heights.every(height => height >= 40), `40px 미만 조작: ${heights.join(', ')}`)
  const surfaces = await page.locator('.ets2-dev-control-group, .ets2-dev-events').evaluateAll(elements => elements.map(element => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, border: style.borderTopWidth }
  }))
  assert.ok(surfaces.every(({ background, border }) => background === 'rgba(0, 0, 0, 0)' && border === '0px'), `읽기 섹션 면이 남음: ${JSON.stringify(surfaces)}`)
  assert.equal(await page.locator('.ets2-dev-dialog').getAttribute('aria-labelledby'), 'ets2-recovery-dialog-title')
  assert.equal(await page.locator('#ets2-recovery-dialog-title').count(), 1)
  await assertNoOverflow(page)
  if (process.env.ETS2_DEV_SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.ETS2_DEV_SCREENSHOT_DIR}/ets2-dev-375-light.png`, fullPage: true })
  }

  for (const scenario of [
    { width: 375, height: 812, theme: 'dark' },
    { width: 1440, height: 900, theme: 'dark' },
    { width: 1440, height: 900, theme: 'light' }
  ]) {
    const visualPage = await setup(t, scenario)
    const visualHeights = await visualPage.locator('.ets2-dev-button-row button:visible').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height))
    assert.ok(visualHeights.every(height => height >= 40), `${scenario.width}px ${scenario.theme} 40px 미만 조작`)
    await assertNoOverflow(visualPage)
    if (process.env.ETS2_DEV_SCREENSHOT_DIR) {
      await visualPage.screenshot({ path: `${process.env.ETS2_DEV_SCREENSHOT_DIR}/ets2-dev-${scenario.width}-${scenario.theme}.png`, fullPage: true })
    }
  }
})
