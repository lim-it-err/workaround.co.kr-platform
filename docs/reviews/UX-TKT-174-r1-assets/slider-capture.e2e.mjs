import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
const apiPort = 48174
let appBase = process.env.ETS2_DEV_TEST_URL || ''
let appServer
let apiServer
let browser
let requestLog = []
let pocState

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
    apiServer.listen(apiPort, '127.0.0.1', resolve)
  })

  if (!appBase) {
    appServer = createServer(serveStaticBuild)
    await new Promise((resolve, reject) => {
      appServer.once('error', reject)
      appServer.listen(0, '127.0.0.1', resolve)
    })
    appBase = `http://127.0.0.1:${appServer.address().port}/`
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
})

async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  let filePath = join(distRoot, decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html')
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

async function setup(t, { width = 1440, height = 900, theme = 'dark' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(selectedTheme => localStorage.setItem('workaround-theme', selectedTheme), theme)
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
  const page = await setup(t)
  assert.equal(await page.locator('.ets2-dev-connection').textContent(), '연결됨 · 25Hz · 일시정지 아님')
  assert.match(await page.locator('.ets2-dev-telemetry').innerText(), /90\.0 km\/h[\s\S]*80 km\/h[\s\S]*100 km\/h[\s\S]*14\.2 km/)
  pocState.telemetry.connected = false
  await page.waitForFunction(() => document.querySelector('.ets2-dev-connection')?.textContent.includes('게임 연결 대기'))
  assert.equal(await page.locator('.ets2-dev-connection').textContent(), 'PoC 연결됨 · 게임 연결 대기')
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
  const heights = await page.locator('.ets2-dev-button-row button:visible').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height))
  assert.ok(heights.every(height => height >= 40), `40px 미만 조작: ${heights.join(', ')}`)
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

const uxOut='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-174-r1-assets';
const uxResults=[];
after(async()=>writeFile(`${uxOut}/slider-metrics.json`,JSON.stringify(uxResults,null,2)+'\n'));
for(const width of [375,1440])for(const theme of ['dark','light'])test(`UX ${width} ${theme}`,async t=>{
 const context=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
 t.after(()=>context.close());const page=await context.newPage();const r={width,theme,errors:[]};uxResults.push(r);
 page.on('pageerror',e=>r.errors.push(e.message));
 await page.addInitScript(theme=>localStorage.setItem('workaround-theme',theme),theme);
 await page.goto(`${appBase}ets2/dev`);await page.waitForFunction(()=>document.querySelector('.ets2-dev-connection')?.textContent.includes('25Hz'));
 const shot=async(name,selector)=>{if(selector)await page.locator(selector).screenshot({path:`${uxOut}/ux-${width}-${theme}-${name}.png`});else await page.screenshot({path:`${uxOut}/ux-${width}-${theme}-${name}.png`,fullPage:false});};
 const measure=()=>page.evaluate(()=>({connection:document.querySelector('.ets2-dev-connection').textContent,overflow:['html','body','.page-scroller','.ets2-dev-page'].map(s=>{const e=document.querySelector(s);return[s,e?.scrollWidth-e?.clientWidth]}),controls:[...document.querySelectorAll('.ets2-dev-button-row button,.ets2-dev-control-group label,.ets2-dev-simulator summary')].filter(e=>e.getBoundingClientRect().height).map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,disabled:e.disabled})),message:document.querySelector('.ets2-dev-message')?.textContent}));
 await shot('first');r.initial=await measure();await shot('controls','.ets2-dev-layout');
 await page.getByRole('button',{name:'명령 준비',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.ets2-dev-primary')||document.querySelector('.ets2-dev-primary').disabled);
 await page.getByLabel('빈 도로 확인',{exact:true}).check();await page.getByLabel('내장 차선유지 껐음',{exact:true}).check();
 await page.getByRole('button',{name:'← 왼쪽',exact:true}).click();await page.waitForFunction(()=>document.body.innerText.includes('왼쪽 변경 중'));await shot('armed-lane','.ets2-dev-layout');r.armed=await measure();
 pocState.telemetry.connected=false;await page.waitForFunction(()=>document.querySelector('.ets2-dev-connection').textContent.includes('게임 연결 대기'));r.disconnected=await measure();await shot('disconnected-controls','.ets2-dev-layout');
 // Restore a stationary game for the confirmation dialog, all API requests still hit this test-owned stub.
 pocState.telemetry.connected=true;pocState.telemetry.speedMps=0;pocState.maneuver=null;
 await page.getByRole('button',{name:'견인 서비스 입력 시험',exact:true}).waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='견인 서비스 입력 시험'&&!b.disabled));
 await page.getByRole('button',{name:'견인 서비스 입력 시험',exact:true}).click();await page.locator('dialog[open]').waitFor();r.dialog=await page.locator('dialog').evaluate(e=>({labelledby:e.getAttribute('aria-labelledby'),ariaLabel:e.getAttribute('aria-label'),text:e.innerText,focused:document.activeElement.textContent}));await shot('dialog');await page.getByRole('button',{name:'취소',exact:true}).click();r.recoveryPosts=requestLog.filter(x=>x.method==='POST'&&x.body.includes('recoveryNow')).length;
 await page.locator('.ets2-dev-simulator summary').click();const frame=page.locator('.ets2-dev-simulator iframe').contentFrame();await frame.locator('#road').waitFor();await shot('simulator','.ets2-dev-simulator');
 r.simulator=await frame.locator('body').evaluate(e=>({overflow:e.scrollWidth-e.clientWidth,controls:[...e.querySelectorAll('button,input,select')].filter(e=>e.getBoundingClientRect().width).map(e=>({tag:e.tagName,text:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))}));
 await frame.locator('#target-speed').scrollIntoViewIfNeeded();await shot('simulator-controls','.ets2-dev-simulator');
 // A synthetic command rejection: measure whether feedback is visible near the triggering control.
 await page.route('**/api/action',route=>route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'검증용 거절: 명령 준비가 만료되었습니다.'})}));
 await page.getByRole('button',{name:'ACC 설정/해제',exact:true}).click();await page.getByRole('alert').waitFor();r.rejection=await page.getByRole('alert').evaluate(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON(),viewport:innerHeight,scrollY:document.querySelector('.page-scroller')?.scrollTop}));await shot('rejection-viewport');
 await page.unroute('**/api/action');await page.route('**/api/state',route=>route.abort('connectionrefused'));
 await page.waitForFunction(()=>document.querySelector('.ets2-dev-connection').textContent.includes('PoC 서버 없음'));r.serverLost=await measure();await shot('server-lost-controls','.ets2-dev-layout');
 console.log(`UX completed ${width} ${theme}`);
});
