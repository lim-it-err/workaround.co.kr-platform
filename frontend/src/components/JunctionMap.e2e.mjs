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
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
// TKT-219 (D-036): 환승 홀은 노선도가 아니라 출발 안내판(기본)·역 목록(lite)이다.
// 이 파일은 예전 노선도 기대값(정류장·소역·노선 선·SVG hit 원)을 새 구조의 같은 의도로 바꿔 둔 것이다.
//   - 이동 가능한 곳이 목록에 하나도 빠지지 않는다(예전: 큰 역 7 → 행 8, 블로그는 흐린 행)
//   - 모든 이동 대상이 40px 이상 / 글자 대비 / 가로 넘침 0 / 접근 안내 토스트 위치
// 첫 방문 로그·lite 키보드·행 이동 상세는 HallV09.e2e.mjs 가 본다.
let base = process.env.JUNCTION_TEST_URL || ''
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

async function setup(t, scenario) {
  const context = await newSeoulContext(browser, {
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce'
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  // 블로그 주소는 D-031 로 환승 홀에 바로 닿고 접근 토스트를 띄운다(blogClosed.e2e.mjs). 이 스위트는 토스트 개수를 세므로 다른 화면에서 환승 홀로 들어간다.
  await page.goto(`${base}voyage`)
  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  await page.locator('.hall-row').first().waitFor()
  return page
}

async function overflow(page) {
  return page.evaluate(() => ['html', 'body', '.page-scroller', '.junction-overview'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
}

function contrastOf(page, selector) {
  return page.locator(selector).evaluateAll(elements => {
    const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map(channel => {
        const normalized = channel / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const backgroundRgb = parse(getComputedStyle(document.querySelector('.hall-screen')).backgroundColor)
    const backgroundLuminance = luminance(backgroundRgb)
    return elements.map(element => {
      const foregroundLuminance = luminance(parse(getComputedStyle(element).color))
      const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      return { label: element.textContent.trim(), ratio, dimmed: Boolean(element.closest('.is-dim')) }
    })
  })
}

for (const scenario of [
  { width: 375, height: 812 },
  { width: 1440, height: 900 }
]) {
  test(`${scenario.width}px: 안내판 행 8개·노선도 없음·40px 대상·글자 대비·넘침 0`, async t => {
    const page = await setup(t, scenario)

    // TKT-221: 큰 역 6 + 개통 준비 1 = 7행. 블로그 행은 안내판에서 뺐다(흐린 행 없음).
    assert.equal(await page.locator('.hall-row').count(), 7)
    assert.equal(await page.locator('.hall-row:is(a, button)').count(), 7)
    assert.equal(await page.locator('.hall-row.is-dim').count(), 0)
    assert.equal(await page.locator('.junction-map, .junction-station, .junction-branch, .junction-page-stop').count(), 0, '노선도(SVG)는 홀에 없다')
    assert.equal(await page.locator('.hall-row').filter({ hasText: 'Runtime' }).count(), 0, '보호 구역은 안내판에 없다')
    assert.equal(await page.getByText('Archive Line', { exact: true }).count(), 0)

    const hitTargets = await page.locator('.hall-row').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return [rect.width, rect.height]
    }))
    assert.ok(hitTargets.every(([width, height]) => width >= 40 && height >= 40), '모든 이동 행은 40px 이상이어야 한다')

    const contrasts = [
      ...await contrastOf(page, '.hall-line'),
      ...await contrastOf(page, '.hall-dest'),
      ...await contrastOf(page, '.hall-status')
    ]
    assert.ok(
      contrasts.every(({ ratio, dimmed }) => ratio >= (dimmed ? 3 : 4.5)),
      `활성 글자는 4.5:1, 흐린 행은 3:1 이상이어야 한다: ${JSON.stringify(contrasts.filter(({ ratio, dimmed }) => ratio < (dimmed ? 3 : 4.5)))}`
    )

    for (const [selector, value] of await overflow(page)) {
      assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
    }
  })

  test(`${scenario.width}px: 이동 불가 행은 주소를 바꾸지 않고 안내만 한 번, 2.5초 뒤 사라진다`, async t => {
    const page = await setup(t, scenario)
    const initialUrl = page.url()
    const row = page.locator('.hall-row').filter({ hasText: '일일 5지' })
    const rowBox = await row.boundingBox()
    await row.click()

    const toast = page.locator('.junction-access-toast')
    await toast.waitFor()
    assert.equal(await toast.getAttribute('role'), 'status')
    assert.equal(await toast.getAttribute('aria-live'), 'polite')
    assert.equal(await toast.textContent(), '일일 5지 · 개통 준비 중')
    assert.equal(page.url(), initialUrl, '개통 준비 행은 주소를 바꾸면 안 된다')
    assert.equal(await page.locator('.junction-access-toast').count(), 1)
    const toastBox = await toast.boundingBox()
    if (scenario.width < 900) {
      assert.ok(scenario.height - (toastBox.y + toastBox.height) <= 24, '모바일 토스트는 화면 하단에 고정돼야 한다')
    } else {
      assert.ok(toastBox.x >= 0 && toastBox.x + toastBox.width <= scenario.width, '데스크톱 토스트는 화면 안에 있어야 한다')
    }

    // 키보드로도 같다: 포커스 + Space.
    await row.focus()
    await row.press('Space')
    assert.equal(await page.locator('.junction-access-toast').count(), 1, '연속 입력에도 토스트는 하나여야 한다')
    assert.equal(page.url(), initialUrl)
    assert.ok(rowBox.height >= 40)

    await page.waitForTimeout(2600)
    assert.equal(await page.locator('.junction-access-toast').count(), 0, '토스트는 2.5초 뒤 제거돼야 한다')
  })
}
