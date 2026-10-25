import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = process.env.VOYAGE_SETTLEMENT_DIST_ROOT || fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_SETTLEMENT_TEST_URL || ''
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
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }
  const extension = extname(filePath)
  let content = await readFile(filePath)
  response.writeHead(200, { 'content-type': contentTypes[extension] || 'application/octet-stream' })
  response.end(content)
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0)
}

function closeEnough(actual, expected) {
  return Math.abs(actual - expected) < 0.0001
}

test('날짜상 종료한 boarding 여행 결산: 4환경 총액 검산·7개 카테고리·3개 지역·제외 항목과 overflow 0', async () => {
  for (const scenario of [
    { width: 375, height: 812, theme: 'dark' },
    { width: 375, height: 812, theme: 'light' },
    { width: 1440, height: 900, theme: 'dark' },
    { width: 1440, height: 900, theme: 'light' }
  ]) {
    const context = await newSeoulContext(browser, {
      viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()
    const errors = []
    const apiRequests = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (['error', 'warning'].includes(message.type())) errors.push(message.text())
    })
    page.on('request', request => {
      if (new URL(request.url()).pathname.startsWith('/api')) apiRequests.push(request.url())
    })
    await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)

    await page.goto(`${base}voyage`)
    await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor({ timeout: 15000 })
    assert.match(await page.locator('.route-heading > span').textContent(), /운행 종료/)
    const settlement = page.locator('.route-settlement')
    await settlement.getByRole('heading', { name: '영수증 기준 실제 지출', exact: true }).waitFor()

    assert.match(await page.locator('.route-gauge--spend').textContent(), /777만원/)
    assert.match(await settlement.locator('.route-settlement__total').textContent(), /777\.1만원\s*· 1인 388\.6만원/)

    const summary = await settlement.locator('.route-settlement__summary > div')
      .evaluateAll(elements => elements.map(element => Number(element.dataset.amount)))
    assert.equal(summary.length, 2)
    assert.ok(closeEnough(sum(summary), 777.101), `사전 확정 + 현지 지출 = 총액이어야 한다: ${summary.join(' + ')}`)

    const categoryAmounts = await settlement.locator('.route-settlement__table--category tbody tr')
      .evaluateAll(elements => elements.map(element => Number(element.dataset.amount)))
    const regionAmounts = await settlement.locator('.route-settlement__table--region tbody tr')
      .evaluateAll(elements => elements.map(element => Number(element.dataset.amount)))
    assert.equal(categoryAmounts.length, 7)
    assert.equal(regionAmounts.length, 3)
    assert.ok(closeEnough(sum(categoryAmounts), summary[1]), '카테고리 합계는 현지 지출과 같아야 한다')
    assert.ok(closeEnough(sum(regionAmounts), summary[1]), '지역 합계는 현지 지출과 같아야 한다')
    assert.equal(await settlement.locator('.route-settlement__excluded li').count(), 3)

    const renderedAmounts = await settlement.locator('dd, td').allTextContents()
    assert.ok(renderedAmounts.every(value => /^\d{1,3}(?:,\d{3})*\.\d만원$/.test(value.trim())), `금액은 소수 1자리여야 한다: ${renderedAmounts.join(', ')}`)

    for (const [selector, value] of await page.evaluate(() => ['html', 'body', '.page-scroller', '.voyage-route-map'].map(selector => {
      const element = document.querySelector(selector)
      return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
    }))) {
      assert.equal(value, 0, `${scenario.width}px ${scenario.theme} ${selector} 가로 넘침이 없어야 한다`)
    }

    if (process.env.VOYAGE_SETTLEMENT_SCREENSHOT_DIR) {
      await settlement.scrollIntoViewIfNeeded()
      await settlement.screenshot({
        path: `${process.env.VOYAGE_SETTLEMENT_SCREENSHOT_DIR}/voyage-settlement-${scenario.width}-${scenario.theme}.png`
      })
    }

    assert.deepEqual(errors, [], `${scenario.width}px ${scenario.theme} 브라우저 오류나 경고가 없어야 한다`)
    assert.deepEqual(apiRequests, [], '정적 결산 화면은 API를 호출하지 않아야 한다')
    await context.close()
  }
})
