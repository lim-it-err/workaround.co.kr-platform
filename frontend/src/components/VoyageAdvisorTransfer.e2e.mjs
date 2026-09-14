import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const advisorRequire = createRequire(new URL('../../../services/advisor/frontend/package.json', import.meta.url))
const { chromium } = advisorRequire('playwright')
const publicBase = '/workaround.co.kr-platform/'
const advisorBase = `${publicBase}advisor/`
const distRoot = process.env.VOYAGE_ADVISOR_DIST_ROOT || fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.VOYAGE_ADVISOR_TEST_URL || ''
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
  const pathname = decodeURIComponent(url.pathname)
  const relativePath = pathname.startsWith(publicBase)
    ? pathname.slice(publicBase.length)
    : pathname.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, pathname.startsWith(advisorBase) ? 'advisor/index.html' : 'index.html')
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

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 벨베데레와 Advisor 미션을 왕복한다`, async t => {
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
    await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
    t.after(async () => {
      await context.close()
      assert.deepEqual(errors, [], '왕복 중 브라우저 오류나 경고가 없어야 한다')
    })

    await page.goto(`${base}voyage`)
    await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
    await page.getByRole('button', { name: /^7일차/ }).click()
    const belvedereRow = page.locator('#voyage-stop-day-6-belvedere')
    await belvedereRow.getByRole('link', { name: /이걸로 미션 만들기/ }).click()

    await page.getByRole('heading', { name: '비엔나 1900', exact: true }).waitFor()
    assert.match(page.url(), /\/advisor\/courses\/vienna-1900$/)
    await page.locator('[data-mission-id="v1900-f-belvedere-route"]').click()
    await page.getByRole('heading', { name: '벨베데레를 연대순으로 걷기', exact: true }).waitFor()
    if (process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR}/advisor-mission-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }
    await page.getByRole('link', { name: /이 미션의 정류장/ }).click()

    const returnedDetail = page.getByRole('dialog', { name: '벨베데레 상궁' })
    await returnedDetail.waitFor()
    assert.match(page.url(), /\/voyage$/, '딥링크를 소비한 뒤 여행 표준 URL로 정리되어야 한다')
    assert.equal(await page.getByRole('button', { name: /^7일차/ }).getAttribute('aria-current'), 'date')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
    if (process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.VOYAGE_ADVISOR_SCREENSHOT_DIR}/voyage-return-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await returnedDetail.getByRole('button', { name: '상세 닫기', exact: true }).click()
    await page.getByRole('button', { name: /^1일차/ }).click()
    assert.equal(await page.locator('.route-transfer-link').count(), 0, '연결 없는 정차역에는 환승 링크가 없어야 한다')
  })
}
