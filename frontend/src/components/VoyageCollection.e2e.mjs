import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_TEST_URL || ''
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
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}

async function setup(t, { width, height, theme }) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
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
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('workaround-theme', selectedTheme)
  }, theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
    assert.deepEqual(apiRequests, [], '정적 여행 화면은 API를 호출하지 않아야 한다')
  })
  await page.goto(`${base}voyage`)
  await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
  return page
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 현재 여행 직행, 3건 목록과 지난 기록 진입`, async t => {
    const page = await setup(t, scenario)
    assert.equal(await page.getByRole('button', { name: '← 여행 목록', exact: true }).count(), 1)
    await page.getByRole('button', { name: '← 여행 목록', exact: true }).click()
    await page.getByRole('heading', { name: '여행 목록', exact: true }).waitFor()
    assert.equal(await page.locator('.station-sign').count(), 0, '목록에 예전 역 간판이 남지 않아야 한다')
    assert.equal(await page.locator('.voyage-index__badge').textContent(), 'V')
    assert.equal(await page.locator('.voyage-current').count(), 1, '현재 여행만 히어로로 보여야 한다')

    for (const title of ['중부유럽 순환선', '아이슬란드', '스페인']) {
      assert.ok(await page.getByText(title).count(), `${title} 여행이 보여야 한다`)
    }
    assert.equal(await page.locator('.tone-schedule-row').count(), 2)
    assert.equal(await page.getByRole('button', { name: /아이슬란드/ }).count(), 1)
    assert.equal(await page.getByRole('button', { name: /스페인/ }).count(), 1)

    if (process.env.VOYAGE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_SCREENSHOT_DIR}/voyage-list-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await page.getByRole('button', { name: /스페인/ }).click()
    await page.getByText('아직 정리된 여행 기록이 없습니다.', { exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: '← 여행 목록', exact: true }).count(), 1)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0)

    if (process.env.VOYAGE_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_SCREENSHOT_DIR}/voyage-empty-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
  })
}
