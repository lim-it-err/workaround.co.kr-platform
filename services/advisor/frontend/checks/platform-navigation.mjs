// Run against a merged Pages artifact prepared by TKT-103, never a Vite fallback.
// node checks/platform-navigation.mjs <merged-dist> <evidence-dir> [before]
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { chromium } from '@playwright/test'

const [distArgument, evidenceArgument, mode] = process.argv.slice(2)
assert.ok(distArgument && evidenceArgument, 'Provide a merged dist and evidence directory')
const dist = resolve(distArgument)
const evidence = resolve(evidenceArgument)
const before = mode === 'before'
const base = '/workaround.co.kr-platform/'
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' }
await mkdir(evidence, { recursive: true })
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (!pathname.startsWith(base)) { res.writeHead(404); res.end(); return }
    let file = resolve(dist, pathname.slice(base.length) || 'index.html')
    if (!file.startsWith(`${dist}/`)) { res.writeHead(404); res.end(); return }
    if ((await stat(file).catch(() => null))?.isDirectory()) file = resolve(file, 'index.html')
    const found = await stat(file).catch(() => null)
    const status = found?.isFile() ? 200 : 404
    if (status === 404) file = resolve(dist, '404.html')
    res.writeHead(status, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
    res.end(await readFile(file))
  } catch { res.writeHead(500); res.end() }
})
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
const results = []
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [375, 1280]) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' })
      await context.addInitScript(theme => {
        if (!localStorage.getItem('workaround-theme')) localStorage.setItem('workaround-theme', theme)
      }, theme)
      const page = await context.newPage()
      const errors = []
      const apiRequests = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => { if (new URL(request.url()).pathname.includes('/api/')) apiRequests.push(request.url()) })
      await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
      const checkOverflow = async () => {
        const overflow = await page.evaluate(() => Math.max(0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
          document.body.scrollWidth - document.body.clientWidth,
          ...Array.from(document.querySelectorAll('.page-scroller')).map(el => el.scrollWidth - el.clientWidth)))
        if (overflow > 0) {
          console.log(await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > window.innerWidth).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right }))))
          await page.screenshot({ path: resolve(evidence, `overflow-${width}-${theme}.png`), fullPage: true })
        }
        assert.equal(overflow, 0, `${width}/${theme}: viewport overflow`)
      }
      const openJunction = async () => {
        await page.getByRole('button', { name: '바로 환승 홀로 이동' }).click()
        await page.locator('.route-rows').waitFor()
        assert.equal(await page.locator('.app-shell').getAttribute('data-theme'), theme)
      }
      await page.goto(`${origin}${base}`)
      await openJunction()
      const row = page.locator('.route-row').filter({ hasText: 'Developer Advisor' })
      await checkOverflow()
      await row.scrollIntoViewIfNeeded()
      await page.screenshot({ path: resolve(evidence, `${before ? 'before' : 'after'}-junction-${width}-${theme}.png`) })
      if (before) {
        assert.match(await row.getAttribute('class'), /upcoming/)
        await page.goto(`${origin}${base}advisor/inflight`)
        await page.getByRole('region', { name: '기내 콘텐츠 설정' }).waitFor()
        assert.equal(await page.getByRole('link', { name: '← 환승 홀', exact: true }).count(), 0)
      } else {
        assert.equal(await row.evaluate(el => el.tagName), 'A')
        assert.equal(await row.getAttribute('href'), `${base}advisor/`)
        assert.doesNotMatch(await row.getAttribute('class'), /upcoming/)
        await row.focus()
        await page.keyboard.press('Enter')
        await page.waitForURL(`${origin}${base}advisor/missions`)
        const home = page.getByRole('button', { name: '환승 홀로 나가기', exact: true })
        await home.waitFor()
        assert.equal(await page.locator('.station-code').textContent(), 'A')
        assert.equal(await page.locator('.shell').getAttribute('data-theme'), theme)
        const originalColors = await page.evaluate(() => ({
          bg: getComputedStyle(document.body).backgroundColor,
          accent: getComputedStyle(document.querySelector('.band')).backgroundColor,
          font: getComputedStyle(document.body).fontFamily,
        }))
        assert.equal(originalColors.bg, theme === 'dark' ? 'rgb(13, 19, 28)' : 'rgb(237, 241, 246)')
        assert.equal(originalColors.accent, theme === 'dark' ? 'rgb(124, 137, 240)' : 'rgb(61, 78, 192)')
        assert.match(originalColors.font, /Pretendard Variable/)
        await page.locator('.theme-toggle').focus()
        await page.keyboard.press('Enter')
        const opposite = theme === 'dark' ? 'light' : 'dark'
        assert.equal(await page.locator('.shell').getAttribute('data-theme'), opposite)
        await page.reload()
        await home.waitFor()
        assert.equal(await page.locator('.shell').getAttribute('data-theme'), opposite)
        await page.locator('.theme-toggle').click()
        await checkOverflow()
        await page.getByRole('link', { name: '기내 모드', exact: true }).click()
        await page.getByRole('region', { name: '기내 콘텐츠 설정' }).waitFor()
        assert.equal(new URL(page.url()).pathname, `${base}advisor/inflight`)
        const reload = await page.reload()
        assert.equal(reload.status(), 404, 'Exercise the Pages 404 body, not dev-server fallback')
        await page.getByRole('region', { name: '기내 콘텐츠 설정' }).waitFor()
        await checkOverflow()
        assert.equal(await page.locator('.shell').getAttribute('data-theme'), theme)
        await home.scrollIntoViewIfNeeded()
        await page.screenshot({ path: resolve(evidence, `after-advisor-${width}-${theme}.png`) })
        await home.click()
        await page.waitForURL(`${origin}${base}`)
        await openJunction()
        await checkOverflow()
        // SVG and the accessible row share the same destination.
        if (width > 760) {
          await page.locator('.route-map g').filter({ hasText: 'Developer Advisor' }).click()
          await page.waitForURL(`${origin}${base}advisor/missions`)
          await home.waitFor()
        }
      }
      await checkOverflow()
      if (before) await page.screenshot({ path: resolve(evidence, `before-advisor-${width}-${theme}.png`) })
      assert.deepEqual(errors, [])
      assert.deepEqual(apiRequests, [])
      results.push({ width, theme, mode: before ? 'before' : 'after', overflow: 0, pageErrors: 0, apiRequests: 0 })
      await context.close()
    }
  }
  await writeFile(resolve(evidence, `${before ? 'before' : 'after'}-results.json`), JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser?.close()
  await new Promise(resolveClosed => server.close(resolveClosed))
}
