import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'
import { BLOG_LINE_OPEN } from '../data/lines.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
// 기대 개수는 블로그 본선(B) 스위치 상태에서 손으로 센 값이다 (구현이 내놓는 숫자를 따라 적지 않는다).
//   큰 역  : 기록선 B·V + 실험선 A·S·D·P + 기지선 W·R = 8 → B 를 빼면 7
//   소역   : B 3(아카이브·글 상세·스튜디오) + V 1 + A 1 + S 6 + W 1 + R 1 = 13 → B 를 빼면 10
//   노선 선: 기록선 1 + 실험선 3 + 기지선 1 = 5 — 기록선은 환승 홀 직선 통과(r16)를 위해 꼬리로 남으므로 그대로
//   제한 역: D(예정) + W·R(보호) = 3 — B 와 무관
// D-031(PO 2026-10-25): 스위치가 꺼진 동안 B 행·B 역·B 소역 3개가 홈에 없어야 한다.
const STATION_COUNT = BLOG_LINE_OPEN ? 8 : 7
const SUBSTOP_COUNT = BLOG_LINE_OPEN ? 13 : 10
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
  await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), scenario.theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  // 블로그 주소는 D-031 로 환승 홀에 바로 닿고 접근 토스트를 띄운다(blogClosed.e2e.mjs). 이 스위트는 토스트 개수를 세므로 다른 화면에서 환승 홀로 들어간다.
  await page.goto(`${base}voyage`)
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
    '.junction-station.restricted .junction-station-name'
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
  // TKT-195·D-033: Work Manager 는 잠금이 풀렸다(보호 구역 행은 Runtime Board 만). 토스트 위치 검증은 Runtime 행으로 한다.
  assert.equal(await page.locator('.junction-route-row.protected').filter({ hasText: 'Work Manager' }).count(), 0)
  assert.equal(await page.locator('.junction-route-row').filter({ hasText: 'Work Manager' }).locator('.junction-route-status').textContent(), '운영 노트')
  const workRow = page.locator('.junction-route-row.protected').filter({ hasText: 'Runtime Board' })
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

  const discoveryMapStation = page.getByRole('button', { name: '발견 · 예정 노선 · 준비 중' })
  await discoveryMapStation.locator('.junction-station-dot').click()
  await discoveryMapStation.locator('.junction-station-dot').click()
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
  test(`${scenario.width}px ${scenario.theme}: 세 노선 본선·S 수직 지선, 3묶음, 실제 이동과 가독성`, async t => {
    const page = await setup(t, scenario)

    assert.equal(await page.locator('.junction-route-group').count(), 3)
    assert.equal(await page.locator('.junction-route-row').count(), STATION_COUNT)
    assert.equal(await page.locator('.junction-route-row:is(a, button)').count(), STATION_COUNT)
    assert.equal(await page.locator('.junction-branch').count(), 5)
    assert.equal(await page.locator('.junction-station').count(), STATION_COUNT)
    assert.equal(await page.locator('.junction-station-hit').count(), STATION_COUNT)
    assert.equal(await page.locator('.junction-page-stop-hit').count(), SUBSTOP_COUNT)
    assert.equal(await page.locator('.junction-station.restricted').count(), 2) // TKT-195: W 잠금 해제 — D·R 만 남는다
    assert.equal(await page.locator('.junction-route-row.restricted').count(), 2)
    assert.equal(await page.getByText('Archive Line', { exact: true }).count(), 0)
    if (!BLOG_LINE_OPEN) {
      const archiveBranch = page.locator('.junction-branch[data-line-id="archive"]')
      assert.equal(await archiveBranch.count(), 1)
      assert.equal(await archiveBranch.getAttribute('d'), 'M290 360 L630 360', '기록선은 왼쪽 꼬리만 남기고 환승 홀을 직선으로 통과한다')
      assert.equal(await page.locator('[data-station-code="B"]').count(), 0)
      assert.deepEqual(
        await page.locator('.junction-route-group').first().locator('h3, p').allTextContents(),
        ['기록선', '환승 홀 → 여행']
      )
      assert.equal(
        await page.getByRole('img', { name: /일곱 정류장/ }).count(),
        1,
        '지도 설명은 정류장 수(일곱)를 따라야 한다'
      )
      const overviewText = await page.locator('.junction-overview').innerText()
      assert.doesNotMatch(overviewText, /블로그|Writing Studio|스튜디오|아카이브/, '내려간 블로그 노선 문구가 홈에 남으면 안 된다')
    }

    const mapBox = await page.locator('.junction-map-box').boundingBox()
    const listBox = await page.locator('.junction-lines').boundingBox()
    if (scenario.width < 900) {
      assert.ok(mapBox.y < listBox.y, '모바일에서는 지도 다음에 목록이 와야 한다')
      assert.equal(await page.locator('.junction-page-stop:visible').count(), 0)
      assert.equal(await page.locator('.junction-station-name:visible').count(), STATION_COUNT)
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
        '.junction-page-stop-name',
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
      '.junction-page-stop-name',
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
        '.junction-page-stop-name',
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
    assert.equal(svgStationHitTargets.length, STATION_COUNT)
    assert.ok(
      svgStationHitTargets.every(({ width, height }) => width >= 40 && height >= 40),
      `SVG 역 hit area는 모두 40px 이상이어야 한다: ${JSON.stringify(svgStationHitTargets)}`
    )
    assert.ok(
      svgStationHitTargets.every(({ radius, pointerEvents }) => radius >= 20 && pointerEvents === 'all'),
      `SVG 역은 투명 hit 원(r≥20, pointer-events: all)을 가져야 한다: ${JSON.stringify(svgStationHitTargets)}`
    )

    const detailStopHitTargets = await page.locator('.junction-page-stop-hit').evaluateAll(elements => elements.map(hitCircle => {
      const rect = hitCircle.getBoundingClientRect()
      return {
        label: hitCircle.dataset.stopLabel,
        width: rect.width,
        height: rect.height,
        radius: Number(hitCircle.getAttribute('r')),
        pointerEvents: getComputedStyle(hitCircle).pointerEvents
      }
    }))
    assert.equal(detailStopHitTargets.length, SUBSTOP_COUNT)
    assert.ok(
      detailStopHitTargets.every(({ radius, pointerEvents }) => radius >= 26 && pointerEvents === 'all'),
      `모든 소역은 투명 hit 원(r≥26, pointer-events: all)을 가져야 한다: ${JSON.stringify(detailStopHitTargets)}`
    )
    if (scenario.width >= 900) {
      assert.ok(
        detailStopHitTargets.every(({ width, height }) => width >= 40 && height >= 40),
        `1440 소역 hit bbox는 모두 40×40px 이상이어야 한다: ${JSON.stringify(detailStopHitTargets)}`
      )
    }

    if (scenario.width >= 900) {
      // TKT-203: 작은 역 이름은 항상 보인다(툴팁 없음) — 큰 역보다 작고 흐리고 가늘게.
      const stopLabels = await page.locator('.junction-page-stop').evaluateAll(elements => elements.map(element => element.dataset.stopLabel))
      assert.equal(stopLabels.length, SUBSTOP_COUNT)
      const smallNames = await page.locator('.junction-page-stop-name').evaluateAll(elements => elements
        .filter(element => element.getClientRects().length > 0)
        .map(element => {
          const style = getComputedStyle(element)
          const matrix = element.getScreenCTM()
          return { label: element.textContent.trim(), size: parseFloat(style.fontSize) * Math.hypot(matrix.a, matrix.b), fill: style.fill, weight: Number(style.fontWeight) }
        }))
      assert.deepEqual(smallNames.map(item => item.label).sort(), [...stopLabels].sort(), '작은 역 이름이 모두 보여야 한다')
      const bigName = await page.locator('.junction-station-name').first().evaluate(element => {
        const style = getComputedStyle(element)
        const matrix = element.getScreenCTM()
        return { size: parseFloat(style.fontSize) * Math.hypot(matrix.a, matrix.b), fill: style.fill, weight: Number(style.fontWeight) }
      })
      for (const item of smallNames) {
        assert.ok(item.size >= 10.95 && item.size <= 12.5, `작은 역 글씨는 11~12px: ${item.label} ${item.size}`)
        assert.ok(item.size < bigName.size, `작은 역 글씨가 큰 역보다 작아야 한다: ${item.label}`)
        assert.notEqual(item.fill, bigName.fill, `작은 역 색이 큰 역과 달라야 한다: ${item.label}`)
        assert.ok(item.weight < bigName.weight, `작은 역 굵기가 큰 역보다 가벼워야 한다: ${item.label}`)
      }
      assert.equal(await page.locator('.junction-stop-tip').count(), 0, '툴팁은 제거됐다')
      // 작은 역 이름 글자는 클릭을 가로채지 않는다.
      assert.equal(
        await page.locator('.junction-page-stop-name').first().evaluate(element => getComputedStyle(element).pointerEvents),
        'none'
      )
      // 작은 역 이름 글자가 큰 글자(역 이름·노선 이름·환승 홀)와 겹치지 않는다는 점은 위의 겹침 검사가 함께 본다.

      // 키보드 포커스: 작은 역에 Tab 으로 닿으면 접근 이름을 갖는다.
      const focusStop = page.locator('.junction-page-stop[data-stop-label="격납고"]')
      assert.equal(await focusStop.getAttribute('aria-label'), '격납고 열기')
      await focusStop.focus()
      await page.evaluate(() => document.activeElement?.blur())
    }

    if (scenario.width >= 900) {
      const detailStopCircle = page.locator('.junction-page-stop[data-stop-label="격납고"]').locator('.junction-page-stop-dot')
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
    const voyageEntry = page.locator('.junction-route-entry').filter({ has: page.getByRole('button', { name: /여행 노선/ }) })
    assert.equal(await voyageEntry.getByRole('button', { name: '노선도', exact: true }).count(), 1)
    const pantryEntry = page.locator('.junction-route-entry').filter({ has: page.getByRole('button', { name: /자취 밥상/ }) })
    assert.match(await pantryEntry.innerText(), /오늘의 한 상:/)
    await page.locator('.junction-route-row').filter({ hasText: '자취 밥상' }).click()
    await page.getByRole('heading', { name: '자취 밥상', exact: true }).waitFor()
    assert.match(new URL(page.url()).pathname, /\/pantry$/)
    await page.getByRole('button', { name: '환승 홀', exact: true }).click()

    const ets2Entry = page.locator('.junction-route-entry').filter({ has: page.getByRole('button', { name: /미스터리 트레인/ }) })
    assert.equal(await ets2Entry.getByRole('button', { name: '유로트럭', exact: true }).count(), 1)
    assert.equal(await ets2Entry.locator('.junction-sublinks > button').filter({ hasText: /^유로트럭 개발자$/ }).count(), 1)
    assert.deepEqual(await ets2Entry.locator('.junction-sublinks > *').allTextContents(), [
      '격납고',
      '유로트럭',
      '유로트럭 개발자',
      '엘리베이터',
      '택시',
      '화이트채플'
    ])

    const labSpur = page.locator('.junction-branch[data-line-id="lab"][data-path-index="2"]')
    assert.equal(await labSpur.getAttribute('d'), 'M501.4 218.6 L501.4 96')
    assert.equal(
      await labSpur.evaluate(element => getComputedStyle(element).display !== 'none'),
      scenario.width >= 900,
      '수직 지선은 소역이 보이는 데스크톱에서만 보여야 한다'
    )
    const [labMainStyle, labSpurStyle] = await page
      .locator('.junction-branch[data-line-id="lab"][data-path-index="0"], .junction-branch[data-line-id="lab"][data-path-index="2"]')
      .evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element)
        return { stroke: style.stroke, strokeWidth: style.strokeWidth, strokeLinecap: style.strokeLinecap }
      }))
    assert.deepEqual(labSpurStyle, labMainStyle, '수직 지선은 실험선 본선과 같은 색·굵기·둥근 끝을 써야 한다')
    assert.equal(labSpurStyle.strokeWidth, scenario.width < 900 ? '7px' : '5px')
    assert.equal(labSpurStyle.strokeLinecap, 'round')
    const spurStops = page.locator('.junction-page-stop[data-path-index="2"]')
    assert.deepEqual(await spurStops.evaluateAll(elements => elements.map(element => ({
      label: element.dataset.stopLabel,
      cx: Number(element.querySelector('.junction-page-stop-dot')?.getAttribute('cx')),
      cy: Number(element.querySelector('.junction-page-stop-dot')?.getAttribute('cy'))
    }))), [
      { label: '유로트럭', cx: 501.4, cy: 150 },
      { label: '유로트럭 개발자', cx: 501.4, cy: 105 }
    ])

    if (process.env.JUNCTION_SCREENSHOT_DIR) {
      await page.screenshot({
        path: `${process.env.JUNCTION_SCREENSHOT_DIR}/junction-${scenario.width}-${scenario.theme}.png`,
        fullPage: true
      })
    }

    if (scenario.width >= 900) {
      const junctionUrl = page.url()
      await page.locator('.junction-page-stop[data-stop-label="유로트럭"]').locator('.junction-page-stop-dot').click()
      assert.match(new URL(page.url()).pathname, /\/ets2$/)
      await page.getByRole('button', { name: '환승 홀', exact: true }).click()
      await page.locator('.junction-overview').waitFor()

      await page.locator('.junction-page-stop[data-stop-label="유로트럭 개발자"]').locator('.junction-page-stop-dot').click()
      const developerToast = page.locator('.junction-access-toast')
      await developerToast.waitFor()
      assert.equal(await developerToast.textContent(), '개발자 페이지 · 로컬 전용')
      assert.equal(page.url(), junctionUrl, '정적 공개본의 개발자 소역은 주소를 바꾸면 안 된다')
    }

    const contrasts = await routeTextContrasts(page)
    assert.ok(
      contrasts.every(({ ratio, dimmed }) => ratio >= (dimmed ? 3 : 4.5)),
      `활성 라벨은 4.5:1, 흐린 라벨은 3:1 이상이어야 한다: ${JSON.stringify(contrasts)}`
    )

    const restrictedOpacity = await page.locator('[data-station-code="W"]')
      .evaluate(element => Number.parseFloat(getComputedStyle(element.parentElement).opacity))
    // TKT-195: 기지선이 더는 전부 보호 구역이 아니므로(W 해제) 선 묶음은 흐려지지 않는다. 이전 기대값 0.55/0.8 은 W 잠금 전제였다.
    assert.equal(restrictedOpacity, 1)
    assert.equal(
      await page.locator('[data-station-code="R"]').evaluate(element => Number.parseFloat(getComputedStyle(element).opacity)),
      scenario.theme === 'light' ? 0.8 : 0.55,
      'Runtime 역은 여전히 흐리다'
    )

    for (const [selector, value] of await overflow(page)) {
      assert.equal(value, 0, `${selector} 가로 넘침이 없어야 한다`)
    }

    await assertRestrictedInteractions(page, scenario)

    await page.locator('.junction-route-row').filter({ hasText: '여행 노선' }).focus()
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
