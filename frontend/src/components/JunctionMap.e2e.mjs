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
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  await page.goto(`${base}blog`)
  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  await page.locator('.junction-overview').waitFor()
  return page
}

async function overflow(page) {
  return page.evaluate(() => ['html', 'body', '.page-scroller', '.junction-overview'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
}

async function routeTextContrasts(page) {
  return page.locator([
    '.junction-line-name',
    '.junction-route-group > h3',
    '.junction-route-group.protected > p',
    '.junction-route-row .junction-route-badge',
    '.junction-route-row.restricted .junction-route-name',
    '.junction-route-row.restricted .junction-route-status',
    '.junction-station.restricted .junction-station-code',
    '.junction-station.restricted .junction-station-name',
    '.junction-map-line.protected .junction-page-stop text'
  ].join(',')).evaluateAll(elements => {
    const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map(channel => {
        const normalized = channel / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const background = getComputedStyle(document.querySelector('.app-shell')).backgroundColor
    const backgroundRgb = parse(background)
    const backgroundLuminance = luminance(backgroundRgb)
    return elements.map(element => {
      const style = getComputedStyle(element)
      const foreground = element instanceof SVGElement ? style.fill : style.color
      const foregroundRgb = parse(foreground)
      let opacity = 1
      let current = element
      while (current && !current.classList.contains('app-shell')) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity) || 1
        current = current.parentElement
      }
      const renderedRgb = foregroundRgb.map((channel, index) => (
        channel * opacity + backgroundRgb[index] * (1 - opacity)
      ))
      const foregroundLuminance = luminance(renderedRgb)
      const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      const dimmed = Boolean(element.closest('.restricted, .protected, .unavailable'))
      return { label: element.textContent.trim(), foreground, background, opacity, ratio, dimmed }
    })
  })
}

async function assertRestrictedInteractions(page, scenario) {
  const initialUrl = page.url()
  const workRow = page.locator('.junction-route-row.protected').filter({ hasText: 'Work Manager' })
  const workBox = await workRow.boundingBox()
  await workRow.click()

  const toast = page.locator('.junction-access-toast')
  await toast.waitFor()
  assert.equal(await toast.getAttribute('role'), 'status')
  assert.equal(await toast.getAttribute('aria-live'), 'polite')
  assert.equal(await toast.textContent(), '보호 구역 · 준비 중')
  assert.equal(await page.locator('.junction-access-toast').count(), 1)
  assert.equal(page.url(), initialUrl, '보호 구역 목록 행은 주소를 바꾸면 안 된다')
  if (process.env.JUNCTION_SCREENSHOT_DIR) {
    await page.screenshot({
      path: `${process.env.JUNCTION_SCREENSHOT_DIR}/junction-toast-${scenario.width}-${scenario.theme}.png`
    })
  }

  const toastBox = await toast.boundingBox()
  if (scenario.width < 900) {
    assert.ok(
      scenario.height - (toastBox.y + toastBox.height) <= 24,
      '모바일 토스트는 화면 하단에 고정돼야 한다'
    )
  } else {
    assert.ok(
      Math.abs((toastBox.x + toastBox.width / 2) - (workBox.x + workBox.width / 2)) <= 2,
      '데스크톱 토스트는 누른 행 가까이에 정렬돼야 한다'
    )
  }

  const runtimeMapStation = page.getByRole('button', { name: 'Runtime Board · 보호 구역 · 준비 중' })
  await runtimeMapStation.focus()
  await page.keyboard.press('Enter')
  assert.equal(await toast.textContent(), '보호 구역 · 준비 중')
  assert.equal(page.url(), initialUrl, '보호 구역 SVG 역은 주소를 바꾸면 안 된다')

  const discoveryRow = page.locator('.junction-route-row.planned').filter({ hasText: '발견' })
  await discoveryRow.focus()
  await page.keyboard.press('Space')
  assert.equal(await toast.textContent(), '예정 노선 · 준비 중')
  assert.equal(page.url(), initialUrl, '예정 역 목록 행은 주소를 바꾸면 안 된다')

  const palateMapStation = page.getByRole('button', { name: '취향 · 예정 노선 · 준비 중' })
  await palateMapStation.locator('.junction-station-dot').click()
  await palateMapStation.locator('.junction-station-dot').click()
  assert.equal(await page.locator('.junction-access-toast').count(), 1, '연속 클릭에도 토스트는 하나여야 한다')
  assert.equal(page.url(), initialUrl, '예정 SVG 역은 주소를 바꾸면 안 된다')

  await page.waitForTimeout(2600)
  assert.equal(await page.locator('.junction-access-toast').count(), 0, '토스트는 2.5초 뒤 제거돼야 한다')
}

for (const scenario of [
  { width: 375, height: 812, theme: 'dark' },
  { width: 375, height: 812, theme: 'light' },
  { width: 1440, height: 900, theme: 'dark' },
  { width: 1440, height: 900, theme: 'light' }
]) {
  test(`${scenario.width}px ${scenario.theme}: 세 노선 직선 통과, 3묶음, 실제 이동과 가독성`, async t => {
    const page = await setup(t, scenario)

    assert.equal(await page.locator('.junction-route-group').count(), 3)
    assert.equal(await page.locator('.junction-route-row').count(), 8)
    assert.equal(await page.locator('.junction-route-row:is(a, button)').count(), 8)
    assert.equal(await page.locator('.junction-branch').count(), 4)
    assert.equal(await page.locator('.junction-station').count(), 8)
    assert.equal(await page.locator('.junction-station-hit').count(), 8)
    assert.equal(await page.locator('.junction-station.restricted').count(), 4)
    assert.equal(await page.locator('.junction-route-row.restricted').count(), 4)
    assert.equal(await page.getByText('Archive Line', { exact: true }).count(), 0)

    const mapBox = await page.locator('.junction-map-box').boundingBox()
    const listBox = await page.locator('.junction-lines').boundingBox()
    if (scenario.width < 900) {
      assert.ok(mapBox.y < listBox.y, '모바일에서는 지도 다음에 목록이 와야 한다')
      assert.equal(await page.locator('.junction-page-stop:visible').count(), 0)
      assert.equal(await page.locator('.junction-station-name:visible').count(), 8)
    } else {
      assert.ok(mapBox.x < listBox.x && Math.abs(mapBox.y - listBox.y) < 10, '데스크톱에서는 지도와 목록이 나란해야 한다')
    }

    if (scenario.width < 900) {
      const mobileStationSizes = await page.locator('.junction-station-name:visible')
        .evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)))
      const mobileLineSizes = await page.locator('.junction-line-name:visible')
        .evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)))
      assert.ok(mobileStationSizes.every(size => size === 24), `모바일 큰 역 이름은 24여야 한다: ${mobileStationSizes.join(', ')}`)
      assert.ok(mobileLineSizes.every(size => size === 18), `모바일 노선 이름은 18이어야 한다: ${mobileLineSizes.join(', ')}`)
    } else {
      const visibleMapTextSizes = await page.locator([
        '.junction-station-code',
        '.junction-station-name',
        '.junction-page-stop text',
        '.junction-line-name',
        '.junction-hub-name'
      ].join(',')).evaluateAll(elements => elements
        .filter(element => element.getClientRects().length > 0)
        .map(element => {
          const matrix = element.getScreenCTM()
          return parseFloat(getComputedStyle(element).fontSize) * Math.hypot(matrix.a, matrix.b)
        }))
      assert.ok(visibleMapTextSizes.every(size => size >= 10.95), `지도 글자 하한 미달: ${visibleMapTextSizes.join(', ')}`)
    }

    const mapTextOverlaps = await page.locator([
      '.junction-station-code',
      '.junction-station-name',
      '.junction-page-stop text',
      '.junction-line-name',
      '.junction-hub-name'
    ].join(',')).evaluateAll(elements => {
      const visible = elements
        .filter(element => element.getClientRects().length > 0)
        .map(element => ({ label: element.textContent.trim(), rect: element.getBoundingClientRect() }))
      const overlaps = []
      for (let left = 0; left < visible.length; left += 1) {
        for (let right = left + 1; right < visible.length; right += 1) {
          const a = visible[left]
          const b = visible[right]
          if (a.rect.right > b.rect.left + 1 && b.rect.right > a.rect.left + 1
            && a.rect.bottom > b.rect.top + 1 && b.rect.bottom > a.rect.top + 1) {
            overlaps.push(`${a.label}/${b.label}`)
          }
        }
      }
      return overlaps
    })
    assert.deepEqual(mapTextOverlaps, [], `지도 글자끼리 겹치면 안 된다: ${mapTextOverlaps.join(', ')}`)

    const routeTextIntersections = await page.evaluate(() => {
      const textSelectors = [
        '.junction-station-name',
        '.junction-page-stop text',
        '.junction-line-name',
        '.junction-hub-name'
      ].join(',')
      const texts = [...document.querySelectorAll(textSelectors)]
        .filter(element => element.getClientRects().length > 0)
        .map(element => ({ label: element.textContent.trim(), rect: element.getBoundingClientRect() }))

      return [...document.querySelectorAll('.junction-branch')].flatMap((path, pathIndex) => {
        const matrix = path.getScreenCTM()
        const screenScale = Math.hypot(matrix.a, matrix.b)
        const length = path.getTotalLength()
        const step = 3 / screenScale
        const collisions = new Set()
        for (let distance = 0; distance <= length + step; distance += step) {
          const point = path.getPointAtLength(Math.min(distance, length))
          const x = matrix.a * point.x + matrix.c * point.y + matrix.e
          const y = matrix.b * point.x + matrix.d * point.y + matrix.f
          for (const text of texts) {
            if (x > text.rect.left && x < text.rect.right && y > text.rect.top && y < text.rect.bottom) {
              collisions.add(`${pathIndex}:${text.label}`)
            }
          }
        }
        return [...collisions]
      })
    })
    assert.deepEqual(
      routeTextIntersections,
      [],
      `노선이 역 코드 외 글자 bbox를 지나면 안 된다: ${routeTextIntersections.join(', ')}`
    )

    const hitTargets = await page.locator([
      '.junction-route-row:is(a, button)',
      '.junction-sublinks > a',
      '.junction-sublinks > button'
    ].join(',')).evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      return [rect.width, rect.height]
    }))
    assert.ok(hitTargets.every(([width, height]) => width >= 40 && height >= 40), '모든 이동 링크는 40px 이상이어야 한다')

    const svgStationHitTargets = await page.locator('.junction-station').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect()
      const hitCircle = element.querySelector('.junction-station-hit')
      return {
        code: element.getAttribute('data-station-code'),
        width: rect.width,
        height: rect.height,
        radius: Number(hitCircle?.getAttribute('r')),
        pointerEvents: hitCircle ? getComputedStyle(hitCircle).pointerEvents : ''
      }
    }))
    assert.equal(svgStationHitTargets.length, 8)
    assert.ok(
      svgStationHitTargets.every(({ width, height }) => width >= 40 && height >= 40),
      `SVG 역 hit area는 모두 40px 이상이어야 한다: ${JSON.stringify(svgStationHitTargets)}`
    )
    assert.ok(
      svgStationHitTargets.every(({ radius, pointerEvents }) => radius >= 20 && pointerEvents === 'all'),
      `SVG 역은 투명 hit 원(r≥20, pointer-events: all)을 가져야 한다: ${JSON.stringify(svgStationHitTargets)}`
    )

    if (scenario.width >= 900) {
      const detailStopCircle = page.locator('.junction-page-stop').filter({ hasText: '격납고' }).locator('circle')
      const detailStopBox = await detailStopCircle.boundingBox()
      const topmostOwner = await page.evaluate(({ x, y }) => (
        document.elementFromPoint(x, y)?.closest('.junction-page-stop, .junction-station')?.getAttribute('class') ?? ''
      ), {
        x: detailStopBox.x + detailStopBox.width / 2,
        y: detailStopBox.y + detailStopBox.height / 2
      })
      assert.match(topmostOwner, /junction-page-stop/, '큰 역 hit 원이 인접한 세부 화면 역을 가리면 안 된다')
    }

    const advisorHref = await page.getByRole('link', { name: /Developer Advisor/ }).getAttribute('href')
    assert.equal(advisorHref, `${publicBase}advisor/`)
    const voyageEntry = page.getByRole('button', { name: /여행 노선/ }).locator('..')
    assert.equal(await voyageEntry.getByRole('button', { name: '노선도', exact: true }).count(), 1)

    const contrasts = await routeTextContrasts(page)
    assert.ok(
      contrasts.every(({ ratio, dimmed }) => ratio >= (dimmed ? 3 : 4.5)),
      `활성 라벨은 4.5:1, 흐린 라벨은 3:1 이상이어야 한다: ${JSON.stringify(contrasts)}`
    )

    const restrictedOpacity = await page.locator('[data-station-code="W"]')
      .evaluate(element => Number.parseFloat(getComputedStyle(element.parentElement).opacity))
    assert.equal(restrictedOpacity, scenario.theme === 'light' ? 0.8 : 0.55)

    for (const [selector, value] of await overflow(page)) {
      assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
    }

    if (process.env.JUNCTION_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.JUNCTION_SCREENSHOT_DIR}/junction-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    await assertRestrictedInteractions(page, scenario)

    await page.getByRole('button', { name: /여행 노선/ }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: '중부유럽 순환선', exact: true }).waitFor()
    await page.getByRole('button', { name: /^3일차/ }).focus()
    await page.keyboard.press('Enter')
    const stationDetailTrigger = page.getByRole('button', { name: /Papa's/ })
    await stationDetailTrigger.focus()
    assert.notEqual(await stationDetailTrigger.evaluate(element => getComputedStyle(element).outlineStyle), 'none')
    await page.keyboard.press('Enter')
    const stationDetail = page.getByRole('dialog', { name: /Papa's/ })
    await stationDetail.waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await stationDetail.count(), 0)
    assert.equal(await stationDetailTrigger.evaluate(element => element === document.activeElement), true)
  })
}
