import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { newSeoulContext } from '../e2eContext.mjs'
import { PANTRY_SETS } from '../data/pantry/sets.js'
import { setTags } from '../data/pantry/index.js'

// 태그 필터 기대값은 콘텐츠에서 계산한다(세트가 늘어도 깨지지 않게 — TKT-206)
const titlesWithTag = (tag, excludeIds = []) => PANTRY_SETS.filter((set) => setTags(set).includes(tag) && !excludeIds.includes(set.id)).map((set) => set.title)
const { chromium } = createRequire(import.meta.url)('playwright')
const publicBase = '/workaround.co.kr-platform/'
const distRoot = fileURLToPath(new URL('../../dist/', import.meta.url))
let base = process.env.PANTRY_TEST_URL || ''
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

async function setup(t, { width = 375, height = 812, theme = 'dark' } = {}) {
  const context = await newSeoulContext(browser, { viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.setDefaultTimeout(5000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text())
  })
  await page.addInitScript(selectedTheme => {
    localStorage.setItem('workaround-theme', selectedTheme)
    if (!sessionStorage.getItem('pantry-test-ready')) {
      localStorage.removeItem('pantry:shopping')
      localStorage.removeItem('pantry:history')
      localStorage.removeItem('pantry:tags')
      sessionStorage.setItem('pantry-test-ready', '1')
    }
  }, theme)
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], '브라우저 오류나 경고가 없어야 한다')
  })
  await page.goto(`${base}pantry`)
  await page.locator('.pantry-page').waitFor()
  return page
}

async function title(page) {
  return page.locator('.pantry-hero h1').textContent()
}

async function assertDistinctRecommendations(page, step) {
  const titles = [
    (await title(page)).trim(),
    ...(await page.locator('.pantry-alternative strong').allTextContents()).map(value => value.trim())
  ]
  assert.equal(titles.length, 3, `${step}: 주인공과 대안 2행이 있어야 한다`)
  assert.equal(new Set(titles).size, 3, `${step}: 추천 3칸은 서로 달라야 한다: ${titles.join(', ')}`)
  return titles[0]
}

async function assertNoOverflow(page) {
  const { values, pantryBounds, viewportWidth } = await page.evaluate(() => ({
    values: ['html', 'body', '.portal-stage', '.page-scroller'].map(selector => {
      const element = document.querySelector(selector)
      return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
    }),
    pantryBounds: document.querySelector('.pantry-page')?.getBoundingClientRect().toJSON(),
    viewportWidth: window.innerWidth
  }))
  for (const [selector, overflow] of values) {
    assert.equal(overflow, 0, `${selector} 가로 넘침이 없어야 한다`)
  }
  assert.ok(pantryBounds.left >= 0 && pantryBounds.right <= viewportWidth, '자취 밥상 화면이 뷰포트 안에 있어야 한다')
}

async function capture(page, name) {
  if (!process.env.PANTRY_SCREENSHOT_DIR) return
  await page.screenshot({ path: `${process.env.PANTRY_SCREENSHOT_DIR}/${name}.png`, fullPage: true })
}

test('오늘의 한 상은 같은 날 유지되고 다른 상 세 번은 겹치지 않는다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'dark' })
  await capture(page, 'pantry-375-dark')
  const firstTitle = await assertDistinctRecommendations(page, '첫 추천')
  assert.equal(await page.getByText('오늘의 한 상', { exact: true }).count(), 1)
  assert.equal(await page.locator('.pantry-alternative').count(), 2)
  const firstScreen = await page.locator('.pantry-alternatives').boundingBox()
  assert.ok(firstScreen.y + firstScreen.height <= 812, '375 첫 화면에 주인공과 대안 2행이 보여야 한다')

  await page.reload()
  await page.locator('.pantry-page').waitFor()
  assert.equal(await title(page), firstTitle)

  const titles = [firstTitle]
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: '다른 상 보기', exact: true }).click()
    titles.push(await assertDistinctRecommendations(page, `다른 상 ${index + 1}회`))
  }
  assert.equal(new Set(titles).size, 4, `다른 상 3회는 중복되면 안 된다: ${titles.join(', ')}`)
  await assertNoOverflow(page)
})

test('무알코올은 기본 한 줄 맨 앞에서 바로 토글되고 첫 화면 밀도를 지킨다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'dark' })
  const primaryRow = page.getByLabel('무알코올과 상황 태그')
  const primaryChips = primaryRow.locator('.pantry-chip')
  const alcoholFreeChip = page.getByRole('button', { name: '무알코올', exact: true })

  assert.equal((await primaryChips.first().textContent()).trim(), '무알코올', '선호 칩은 기본 행 맨 앞이어야 한다')
  assert.equal(await alcoholFreeChip.count(), 1, '무알코올 칩은 펼침 묶음과 중복되면 안 된다')
  const rowMetrics = await primaryRow.evaluate((row) => {
    const tops = [...row.querySelectorAll('.pantry-chip')].map((chip) => chip.getBoundingClientRect().top)
    return {
      clientHeight: row.clientHeight,
      scrollHeight: row.scrollHeight,
      clientWidth: row.clientWidth,
      scrollWidth: row.scrollWidth,
      topSpread: Math.max(...tops) - Math.min(...tops)
    }
  })
  assert.equal(rowMetrics.clientHeight, 40, '기본 행 높이는 칩 한 줄이어야 한다')
  assert.ok(rowMetrics.scrollHeight <= rowMetrics.clientHeight, '기본 행은 세로로 줄바꿈되면 안 된다')
  assert.ok(rowMetrics.scrollWidth > rowMetrics.clientWidth, '넘치는 상황 칩은 가로 스크롤로 탐색해야 한다')
  assert.ok(rowMetrics.topSpread < 1, '모든 기본 칩은 같은 행에 있어야 한다')

  await alcoholFreeChip.click()
  assert.equal(await alcoholFreeChip.getAttribute('aria-pressed'), 'true')
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pantry:tags'))), ['무알코올'])
  assert.doesNotMatch(await page.locator('.pantry-page').innerText(), /소주|맥주|막걸리|하이볼|와인|사케|청하/)
  const firstScreen = await page.locator('.pantry-alternatives').boundingBox()
  assert.ok(firstScreen.y + firstScreen.height <= 812, '375 첫 화면에 한 상과 대안 2행이 보여야 한다')
  await capture(page, 'pantry-nonalcohol-default-375-dark')

  await alcoholFreeChip.click()
  assert.equal(await alcoholFreeChip.getAttribute('aria-pressed'), 'false', '기본 행에서 선호를 다시 해제할 수 있어야 한다')
  await assertNoOverflow(page)
})

test('차림·장보기 체크는 펼쳐지고 로컬 저장 뒤 새로고침에도 남는다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'light' })
  await capture(page, 'pantry-375-light')
  await page.getByText('상 펼치기', { exact: true }).click()
  assert.equal(
    await page.locator('.pantry-detail-quip').textContent(),
    await page.locator('.pantry-hero .pantry-quip').textContent(),
    '한 줄 농담은 주인공과 펼친 차림 상단에 같아야 한다'
  )
  assert.ok(await page.locator('.pantry-dish-row').count() >= 1)
  await page.locator('.pantry-dish-row > summary').first().click()
  assert.ok(await page.getByRole('heading', { name: '재료', exact: true }).count() >= 1)
  assert.ok(await page.getByRole('heading', { name: '순서', exact: true }).count() >= 1)

  const firstShopping = page.locator('.pantry-shopping label').first()
  const firstShoppingText = (await firstShopping.textContent()).trim()
  await firstShopping.click()
  assert.equal(await firstShopping.locator('input').isChecked(), true)
  await page.reload()
  await page.getByText('상 펼치기', { exact: true }).click()
  const restoredShopping = page.locator('.pantry-shopping label').filter({ hasText: firstShoppingText })
  assert.equal(await restoredShopping.locator('input').isChecked(), true)
  await assertNoOverflow(page)
})

test('조건 칩은 시간·상황을 거르고 무알코올 화면에는 술 이름을 남기지 않는다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'dark' })
  await capture(page, 'pantry-1440-dark')
  const quickTag = page.getByRole('button', { name: '15분 이내', exact: true })
  await quickTag.click()
  assert.equal(await quickTag.getAttribute('aria-pressed'), 'true')
  assert.ok(titlesWithTag('15분 이내').includes(await title(page)))
  assert.equal(await page.locator('.pantry-alternative span').first().textContent(), '빠른 대안')
  await quickTag.click()

  const hangoverTag = page.getByRole('button', { name: '해장', exact: true })
  await hangoverTag.click()
  assert.ok(titlesWithTag('해장').includes(await title(page)))

  await page.evaluate(() => {
    const today = new Date()
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')
    ].join('-')
    localStorage.setItem('pantry:history', JSON.stringify([{ date, setId: 'hwe-payday' }]))
  })
  await page.reload()
  await page.locator('.pantry-page').waitFor()
  await hangoverTag.click()
  const guestTag = page.getByRole('button', { name: '손님', exact: true })
  await guestTag.click()
  assert.ok(titlesWithTag('손님', ['hwe-payday']).includes(await title(page)))
  assert.equal(await page.locator('.pantry-alternative span').first().textContent(), '빠른 대안')

  await guestTag.click()
  await page.getByRole('button', { name: '태그 더 보기', exact: true }).click()
  await page.getByRole('button', { name: '맥주', exact: true }).click()
  const alcoholFreeChip = page.getByRole('button', { name: '무알코올', exact: true })
  await alcoholFreeChip.click()
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pantry:tags'))), ['무알코올'])
  assert.equal(await page.locator('.pantry-pairing strong').textContent(), '곁들임')
  assert.doesNotMatch(await page.locator('.pantry-page').innerText(), /소주|맥주|막걸리|하이볼|와인|사케|청하/)

  await page.locator('.pantry-alternative').first().click()
  assert.equal(await alcoholFreeChip.getAttribute('aria-pressed'), 'true', '빠른 대안을 골라도 무알코올 선호가 유지되어야 한다')
  assert.doesNotMatch(await page.locator('.pantry-page').innerText(), /소주|맥주|막걸리|하이볼|와인|사케|청하/)

  await page.locator('.pantry-alternative').nth(1).click()
  assert.equal(await alcoholFreeChip.getAttribute('aria-pressed'), 'true', '야식 대안을 골라도 무알코올 선호가 유지되어야 한다')
  assert.doesNotMatch(await page.locator('.pantry-page').innerText(), /소주|맥주|막걸리|하이볼|와인|사케|청하/)
  await assertNoOverflow(page)
})

test('태그는 복수 AND로 추천하고 다시 누르면 선택을 해제한다', async t => {
  const page = await setup(t, { width: 375, height: 812, theme: 'dark' })
  const quickTag = page.getByRole('button', { name: '15분 이내', exact: true })
  await quickTag.click()
  const tagToggle = page.getByRole('button', { name: '태그 더 보기', exact: true })
  const tagToggleBox = await tagToggle.boundingBox()
  const tagToggleHit = await page.evaluate(({ x, y }) => {
    const target = document.elementFromPoint(x, y)
    return target?.className || ''
  }, { x: tagToggleBox.x + tagToggleBox.width / 2, y: tagToggleBox.y + tagToggleBox.height / 2 })
  assert.match(tagToggleHit, /pantry-tags-toggle/, '태그 펼침 버튼 중심이 클릭 가능해야 한다')
  await tagToggle.click()
  const vegetableTag = page.getByRole('button', { name: '채소', exact: true })
  await vegetableTag.click()
  await capture(page, 'pantry-tags-375-dark')

  const both = PANTRY_SETS.filter((set) => setTags(set).includes('15분 이내') && setTags(set).includes('채소')).map((set) => set.title)
  assert.ok(both.length >= 2 && both.includes(await title(page)), '15분 이내 AND 채소를 모두 가진 한 상이어야 한다')
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pantry:tags'))), ['15분 이내', '채소'])
  assert.equal(await quickTag.getAttribute('aria-pressed'), 'true')
  assert.equal(await vegetableTag.getAttribute('aria-pressed'), 'true')

  await vegetableTag.click()
  assert.equal(await vegetableTag.getAttribute('aria-pressed'), 'false')
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('pantry:tags'))), ['15분 이내'])
  const chipHeights = await page.locator('.pantry-chip, .pantry-tags-toggle').evaluateAll((elements) => (
    elements.map((element) => element.getBoundingClientRect().height)
  ))
  assert.ok(chipHeights.every((height) => height >= 40), '모든 태그 조작부는 40px 이상이어야 한다')
  await assertNoOverflow(page)
})

test('선택한 상황·재료 태그는 새로고침 뒤에도 복원된다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'light' })
  const guestTag = page.getByRole('button', { name: '손님', exact: true })
  await guestTag.click()
  await page.getByRole('button', { name: '태그 더 보기', exact: true }).click()
  const sashimiTag = page.getByRole('button', { name: '생선·회', exact: true })
  await sashimiTag.click()
  assert.equal(await title(page), '월급날 회무침')

  await page.reload()
  await page.locator('.pantry-page').waitFor()
  assert.equal(await guestTag.getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: /^태그 더 보기/ }).click()
  assert.equal(await page.getByRole('button', { name: '생선·회', exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await title(page), '월급날 회무침')
  await assertNoOverflow(page)
})

test('일치하는 한 상이 없으면 고른 재료를 담은 가까운 상을 한 행으로 알린다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'light' })
  await page.getByRole('button', { name: '해장', exact: true }).click()
  await page.getByRole('button', { name: '태그 더 보기', exact: true }).click()
  await page.getByRole('button', { name: '생선·회', exact: true }).click()
  await capture(page, 'pantry-tags-empty-1440-light')

  assert.equal(await page.locator('.pantry-empty-result').count(), 1)
  assert.match(await page.locator('.pantry-empty-result').textContent(), /이 조합은 아직 없어요 — 가까운 상/)
  assert.ok(titlesWithTag('생선·회').includes(await title(page)), '가까운 상은 고른 재료(생선·회)를 담은 세트여야 한다')
  await assertDistinctRecommendations(page, '0건 가까운 상')
  await assertNoOverflow(page)
})

for (const [ingredient, drink, theme] of [['닭', '막걸리', 'dark'], ['생선·회', '막걸리', 'light']]) {
  test(`${ingredient}+${drink} 는 0건이어도 ${ingredient} 세트를 가까운 상으로 보여 준다`, async t => {
    const page = await setup(t, { width: 375, height: 812, theme })
    await page.getByRole('button', { name: '태그 더 보기', exact: true }).click()
    await page.getByRole('button', { name: ingredient, exact: true }).click()
    await page.getByRole('button', { name: drink, exact: true }).click()
    assert.equal(await page.locator('.pantry-empty-result').count(), 1)
    assert.ok(titlesWithTag(ingredient).includes(await title(page)), `가까운 상이 ${ingredient} 세트여야 한다`)
    await capture(page, `pantry-tags-open-nearest-375-${theme}`)
    await assertNoOverflow(page)
  })
}

test('P 역은 자취 밥상으로 열리고 스탬프는 기록되어 다음 추천에 반영된다', async t => {
  const page = await setup(t, { width: 1440, height: 900, theme: 'light' })
  await capture(page, 'pantry-1440-light')
  await page.getByRole('button', { name: '환승 홀', exact: true }).click()
  const pantryStation = page.locator('.junction-route-row').filter({ hasText: '자취 밥상' })
  assert.equal(await pantryStation.count(), 1)
  assert.equal(await page.locator('[data-station-code="P"].upcoming').count(), 0)
  await pantryStation.click()
  assert.match(new URL(page.url()).pathname, /\/pantry$/)

  const eatenTitle = await title(page)
  await page.getByText('상 펼치기', { exact: true }).click()
  await page.getByRole('button', { name: '오늘 먹었음', exact: true }).click()
  assert.equal(await page.getByRole('button', { name: '오늘 기록됨', exact: true }).isDisabled(), true)
  const storedHistory = await page.evaluate(() => JSON.parse(localStorage.getItem('pantry:history') || '[]'))
  assert.equal(storedHistory.at(-1).setId.length > 0, true)

  await page.reload()
  await page.locator('.pantry-page').waitFor()
  assert.notEqual(await title(page), eatenTitle, '최근 7일에 먹은 상은 다음 추천에서 피해야 한다')
  await assertNoOverflow(page)
})
