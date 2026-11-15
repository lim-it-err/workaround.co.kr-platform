// codex-9: built Pages bundle only; source files are never changed.
const { chromium } = require('/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules/playwright')
const { createServer } = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')
const repo = '/Users/imjeonghan/newProject/workaround.co.kr-platform'
const out = process.env.UX_CAPTURE_OUT || __dirname
const distRoot = process.env.UX_DIST_ROOT || path.join(repo, 'frontend/dist')
const widths = process.env.UX_WIDTHS ? process.env.UX_WIDTHS.split(',').map(Number) : [375, 390, 414, 430, 1440]
const base = '/workaround.co.kr-platform/'
const clock = new Date('2026-10-25T12:00:00+09:00')

async function main() {
  await fs.mkdir(out, { recursive: true })
  const pool = (await import(path.join(repo, 'frontend/src/data/splashTicker.js'))).SPLASH_TICKER_POOL
  const server = createServer(async (req, res) => {
    try {
      const rel = new URL(req.url, 'http://localhost').pathname.slice(base.length)
      let file = path.join(distRoot, rel || 'index.html')
      try { if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html') }
      catch { file = path.join(distRoot, 'index.html') }
      res.setHeader('content-type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream')
      res.end(await fs.readFile(file))
    } catch (e) { res.writeHead(500); res.end(String(e)) }
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(4193, '127.0.0.1', resolve) })
  const browser = await chromium.launch({ headless: true })
  const results = { base: 'http://127.0.0.1:4193' + base, browser: browser.version(), splash: [], pantry: [], errors: [] }
  try {
    for (const width of widths) for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
      const page = await context.newPage()
      page.on('pageerror', e => results.errors.push(e.message))
      await page.clock.install({ time: clock })
      await page.clock.pauseAt(clock)
      await page.addInitScript(theme => {
        localStorage.setItem('workaround-theme', theme)
        Math.random = () => 0.25
        window.__ticker = []
        new MutationObserver(() => {
          const s = document.querySelector('.splash-ticker-strip .ticker-copy')?.textContent
          if (s && window.__ticker.at(-1)?.text !== s) window.__ticker.push({ at: Date.now(), text: s })
        }).observe(document, { subtree: true, childList: true, characterData: true })
      }, theme)
      await page.goto(results.base)
      await page.locator('.splash-stage').waitFor()
      await page.clock.runFor(4500)
      const rotation = await page.evaluate(() => window.__ticker)
      const measured = []
      for (let index = 0; index < pool.length; index++) {
        const item = await page.evaluate(message => {
          const element = document.querySelector('.splash-ticker-strip .ticker-copy')
          element.textContent = message
          const node = element.firstChild
          const lines = new Map()
          for (let i = 0; i < node.length; i++) {
            const range = document.createRange()
            range.setStart(node, i); range.setEnd(node, i + 1)
            const rect = range.getBoundingClientRect()
            const y = Math.round(rect.y)
            lines.set(y, (lines.get(y) || '') + node.textContent[i])
          }
          const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON()
          const style = getComputedStyle(element)
          return { message, lines: [...lines.values()].map(s => s.trim()).filter(Boolean), title: box('.splash-top h1'), flap: box('.splash-flap-board'), strip: box('.splash-ticker-strip'), copy: box('.splash-ticker-strip .ticker-copy'), font: style.font, lineHeight: style.lineHeight, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) }
        }, pool[index])
        measured.push(item)
        if ([6, 10, 11].includes(index)) await page.screenshot({ path: path.join(out, `splash-${width}-${theme}-${index === 6 ? 'short' : 'long' + (index - 9)}.png`) })
      }
      results.splash.push({ width, theme, rotation, measured })
      await context.close()
    }
    for (const width of [375, 1440]) for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 900 : 812 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' })
      const page = await context.newPage()
      page.on('pageerror', e => results.errors.push(e.message))
      await page.addInitScript(theme => localStorage.setItem('workaround-theme', theme), theme)
      await page.goto(results.base + 'pantry')
      await page.locator('.pantry-page').waitFor()
      await page.screenshot({ path: path.join(out, `pantry-${width}-${theme}.png`), fullPage: true })
      const last = page.locator('.pantry-filter-primary .pantry-chip').last()
      // Keyboard navigation, not focus() or scrollIntoView(), reveals actual automatic scroll behavior.
      await page.keyboard.press('Tab')
      for (let i = 0; i < 40; i++) {
        if (await last.evaluate(el => document.activeElement === el)) break
        await page.keyboard.press('Tab')
      }
      const focus = await last.evaluate(el => {
        const container = el.parentElement, r = el.getBoundingClientRect(), c = container.getBoundingClientRect()
        const style = getComputedStyle(el)
        return { label: el.textContent.trim(), focused: document.activeElement === el, focusVisible: el.matches(':focus-visible'), box: r.toJSON(), container: c.toJSON(), scrollLeft: container.scrollLeft, scrollWidth: container.scrollWidth, clientWidth: container.clientWidth, mask: getComputedStyle(container).maskImage, outline: style.outline, outlineOffset: style.outlineOffset, fadedButtonWidth: Math.max(0, r.right - (c.right - 28)), globalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) }
      })
      await page.screenshot({ path: path.join(out, `pantry-${width}-${theme}-last-focus.png`), fullPage: true })
      await page.locator('.pantry-filter-primary > .pantry-filters').evaluate(el => { el.style.maskImage = 'none'; el.style.webkitMaskImage = 'none' })
      await page.screenshot({ path: path.join(out, `pantry-${width}-${theme}-last-focus-unmasked-diagnostic.png`), fullPage: true })
      results.pantry.push({ width, theme, focus })
      await context.close()
    }
    // PO chose 1.5s while the 1.3s source was being audited. Preview the new
    // cadence by remapping this timer in the browser only, without editing app code.
    const cadenceContext = await browser.newContext({ viewport: { width: 375, height: 812 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
    const cadencePage = await cadenceContext.newPage()
    await cadencePage.clock.install({ time: clock })
    await cadencePage.clock.pauseAt(clock)
    await cadencePage.addInitScript(() => {
      localStorage.setItem('workaround-theme', 'dark')
      let picks = 0
      Math.random = () => [0.27, 0.27, 0.1, 0.2][Math.floor(picks++ / 100) % 4]
      const nativeSetTimeout = window.setTimeout
      window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 1300 ? 1500 : delay, ...args)
      window.__ticker1500 = []
      new MutationObserver(() => {
        const text = document.querySelector('.splash-ticker-strip .ticker-copy')?.textContent
        if (text && window.__ticker1500.at(-1)?.text !== text) window.__ticker1500.push({ at: Date.now(), text })
      }).observe(document, { subtree: true, childList: true, characterData: true })
    })
    await cadencePage.goto(results.base)
    await cadencePage.locator('.splash-stage').waitFor()
    await cadencePage.clock.runFor(4500)
    await cadencePage.screenshot({ path: path.join(out, 'cadence1500-preview-4500ms.png') })
    await cadencePage.clock.runFor(500)
    results.cadence1500Diagnostic = await cadencePage.evaluate(() => window.__ticker1500)
    await cadenceContext.close()
    await fs.writeFile(path.join(out, 'measurements.json'), JSON.stringify(results, null, 2) + '\n', 'utf8')
    console.log(JSON.stringify({ browser: results.browser, splashCases: results.splash.length, measuredPhrases: results.splash.reduce((n, r) => n + r.measured.length, 0), errors: results.errors, pantry: results.pantry }, null, 2))
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
