// Run against the Pages-base preview on an isolated origin. Playwright must be
// installed or available via NODE_PATH; no production storage is accessed.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { VOYAGE } from '../data/voyage.js'
import { voyageStorageKey } from '../data/voyageStorage.js'

const { chromium } = createRequire(import.meta.url)('playwright')
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:4174/workaround.co.kr-platform/'
const storageKey = 'workaround-blog-posts'
const initialPublishedAt = '2026-06-26T12:00:00.000Z'
const draft = {
  id: 'studio-regression-draft', title: '검증용 초안', slug: 'studio-regression',
  summary: '', bodyMarkdown: '', tags: [], status: 'draft', slugLocked: false,
  createdAt: initialPublishedAt, updatedAt: initialPublishedAt, publishedAt: ''
}
let browser
before(async () => { browser = await chromium.launch({ headless: true }) })
after(async () => { await browser?.close() })

async function setup(t, { posts = [draft], theme = 'dark', width = 375, height = 812 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true })
  const page = await context.newPage()
  const errors = []
  const apiRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api')) apiRequests.push(request.url()) })
  await page.addInitScript(({ posts, theme, storageKey }) => {
    if (sessionStorage.getItem('studio-test-seeded')) return
    localStorage.setItem(storageKey, JSON.stringify(posts))
    localStorage.setItem('workaround-blog-studio-post', posts[0].id)
    localStorage.setItem('workaround-theme', theme)
    localStorage.setItem('workaround-blog-studio-view', 'split')
    sessionStorage.setItem('studio-test-seeded', 'true')
  }, { posts, theme, storageKey })
  t.after(async () => {
    await context.close()
    assert.deepEqual(errors, [], 'no uncaught browser errors')
    assert.deepEqual(apiRequests, [], 'static editing makes no API requests')
  })
  await page.goto(`${base}studio`)
  await page.getByRole('textbox', { name: '본문', exact: true }).waitFor()
  return page
}

const body = page => page.getByRole('textbox', { name: '본문', exact: true })
const title = page => page.getByRole('textbox', { name: '제목', exact: true })
const sheet = page => page.getByRole('dialog')
async function posts(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey) }
async function saved(page) {
  await page.waitForFunction(() => document.querySelector('.writer-save')?.textContent.startsWith('저장됨'))
}
async function menu(page, action) {
  await page.getByRole('button', { name: '글 메뉴', exact: true }).click()
  await sheet(page).getByRole('button', { name: action, exact: true }).click()
}
async function openPublish(page) {
  await page.getByRole('button', { name: '발행', exact: true }).click()
}
async function overflow(page) {
  return page.evaluate(() => ['html', 'body', '.page-scroller', '.writing-room', 'dialog[open]'].map(selector => {
    const element = document.querySelector(selector)
    return [selector, element ? Math.max(0, element.scrollWidth - element.clientWidth) : 0]
  }))
}

for (const theme of ['dark', 'light']) {
  test(`375px ${theme}: immediate typing, one status/primary, overlays and no overflow`, async t => {
    const page = await setup(t, { theme })
    const box = await body(page).boundingBox()
    assert.ok(box.y < 400 && box.y + 50 < 812, `body starts at ${box.y}`)
    assert.equal(await page.evaluate(() => document.querySelector('.page-scroller').scrollTop), 0)
    assert.equal(await page.locator('.writing-room .primary-button:visible').count(), 1)
    assert.equal(await page.locator('.writing-room [role=status]:visible').count(), 1)
    assert.equal(await page.getByRole('button', { name: '지금 저장', exact: true }).count(), 0)
    assert.equal(await page.getByRole('textbox', { name: '요약', exact: true }).count(), 0)
    assert.equal(await page.locator('.writing-room .station-header, .studio-state-flow, .studio-sidebar').count(), 0)
    await body(page).fill('첫 화면에서 바로 씁니다.')
    await saved(page)
    assert.match(await page.locator('.writer-save').textContent(), /저장됨 \d{2}:\d{2}/)
    for (const [, value] of await overflow(page)) assert.equal(value, 0)
    if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/studio-${theme}.png` })
    await page.getByRole('button', { name: '글 도구', exact: true }).click()
    assert.match(await sheet(page).getByRole('heading').textContent(), /글 도구/)
    for (const [, value] of await overflow(page)) assert.equal(value, 0)
    if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/tools-${theme}.png` })
    await sheet(page).getByRole('button', { name: '표 삽입', exact: true }).click()
    await page.locator('.writer-inline-table').waitFor()
    for (const [, value] of await overflow(page)) assert.equal(value, 0)
    if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/inline-mobile-${theme}.png`, fullPage: true })
    assert.equal(await page.getByRole('button', { name: '블로그', exact: true }).textContent(), '← 블로그')
    await title(page).fill('모바일에서도 여러 줄로 온전히 보이는 아주 긴 글 제목입니다')
    assert.equal(await title(page).evaluate(element => element.scrollHeight <= element.clientHeight + 1), true)
    await page.getByRole('button', { name: '표 삭제', exact: true }).click()
    await openPublish(page)
    assert.equal(await page.locator('.writing-room .primary-button:visible').count(), 1)
    for (const [, value] of await overflow(page)) assert.equal(value, 0)
    const sheetBox = await sheet(page).boundingBox()
    assert.ok(Math.abs(sheetBox.y + sheetBox.height - 812) <= 1, 'mobile sheet is bottom aligned')
    if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/publish-${theme}.png` })
    for (let index = 0; index < 8; index++) {
      await page.keyboard.press('Tab')
      assert.equal(await sheet(page).evaluate(element => element.contains(document.activeElement)), true)
    }
    await page.keyboard.press('Escape')
    assert.equal(await sheet(page).count(), 0)
    assert.equal(await page.getByRole('button', { name: '발행', exact: true }).evaluate(element => document.activeElement === element), true)
    await menu(page, '초안 서랍')
    for (const [, value] of await overflow(page)) assert.equal(value, 0)
    if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/drawer-${theme}.png` })
  })
}

test('054/097: autosave, title-only draft, stable custom slug and editing-target reload', async t => {
  const page = await setup(t)
  await title(page).fill('첫 번째 기록')
  await saved(page)
  assert.equal((await posts(page))[0].bodyMarkdown, '')
  await openPublish(page)
  await sheet(page).getByRole('textbox', { name: '글 주소' }).fill('manual-route')
  await sheet(page).getByRole('button', { name: '계속 쓰기' }).click()
  await title(page).fill('제목을 바꾸어도 주소 유지')
  await body(page).fill('자동저장과 새로고침을 확인합니다.')
  await saved(page)
  let post = (await posts(page))[0]
  assert.equal(post.slug, 'manual-route')
  assert.equal(post.slugLocked, true)
  await page.reload()
  assert.equal(await title(page).inputValue(), post.title)
  assert.equal(await body(page).inputValue(), post.bodyMarkdown)
  await menu(page, '새 초안')
  await title(page).fill('두 번째 기록')
  await body(page).fill('편집 대상을 복원합니다.')
  await saved(page)
  const targetId = await page.evaluate(() => localStorage.getItem('workaround-blog-studio-post'))
  assert.notEqual(targetId, draft.id)
  await page.reload()
  assert.equal(await title(page).inputValue(), '두 번째 기록')
  assert.equal((await posts(page)).length, 2)
})

test('054: publish sheet validation, published autosave and first publication date survive transitions', async t => {
  const page = await setup(t, { posts: [{ ...draft, status: 'published', summary: '요약', bodyMarkdown: '발행 본문', publishedAt: initialPublishedAt }] })
  await body(page).fill('공개 상태를 유지하는 편집')
  await saved(page)
  assert.equal((await posts(page))[0].status, 'published')
  assert.equal((await posts(page))[0].publishedAt, initialPublishedAt)
  await menu(page, '발행 취소')
  assert.equal((await posts(page))[0].status, 'draft')
  await openPublish(page)
  await sheet(page).getByRole('textbox', { name: '요약' }).fill('')
  await sheet(page).getByRole('button', { name: '발행 확정' }).click()
  assert.match(await sheet(page).getByRole('alert').textContent(), /요약과 본문/)
  assert.equal((await posts(page))[0].status, 'draft')
  await sheet(page).getByRole('textbox', { name: '요약' }).fill('발행할 요약')
  await sheet(page).getByRole('textbox', { name: '태그' }).fill('여행, 여행')
  await sheet(page).getByRole('button', { name: '발행 확정' }).click()
  await page.waitForURL(`${base}blog/**`)
  assert.equal((await posts(page))[0].publishedAt, initialPublishedAt)
  await page.getByRole('button', { name: 'Studio에서 편집' }).click()
  assert.equal(await body(page).inputValue(), '공개 상태를 유지하는 편집')
})

test('054: blocked save and cancelled exit/new-draft guard preserve input', async t => {
  const page = await setup(t)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.restoreStudioStorage = () => { Storage.prototype.setItem = original }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'workaround-blog-posts') throw new DOMException('quota', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await body(page).fill('저장 실패해도 입력은 유지')
  await page.waitForFunction(() => document.querySelector('.writer-save')?.textContent === '저장 실패')
  page.on('dialog', dialog => dialog.dismiss())
  await page.getByRole('button', { name: '블로그', exact: true }).click()
  assert.equal(await body(page).inputValue(), '저장 실패해도 입력은 유지')
  await menu(page, '새 초안')
  assert.equal(await body(page).inputValue(), '저장 실패해도 입력은 유지')
  assert.equal((await posts(page))[0].bodyMarkdown, '')
  await page.evaluate(() => window.restoreStudioStorage())
  await body(page).fill('복구 후 재입력')
  await saved(page)
  assert.equal((await posts(page))[0].bodyMarkdown, '복구 후 재입력')
})

test('056/055: archive drawer restores draft/public, preserves dates and excludes private deep links', async t => {
  const archived = { ...draft, id: 'archived', title: '보관 검증', slug: 'archived', slugLocked: true, status: 'archived', summary: '요약', bodyMarkdown: '복원 본문', publishedAt: initialPublishedAt }
  const page = await setup(t, { posts: [draft, archived] })
  await menu(page, '초안 서랍')
  assert.equal(await sheet(page).locator('.badge-draft').count(), 1)
  assert.equal(await sheet(page).locator('.badge-arch').count(), 1)
  const colors = await sheet(page).locator('.badge').evaluateAll(elements => elements.map(e => getComputedStyle(e).backgroundColor))
  assert.notEqual(colors[0], colors[1])
  await sheet(page).getByRole('button', { name: '초안으로 복원' }).click()
  assert.equal((await posts(page)).find(p => p.id === 'archived').status, 'draft')
  await sheet(page).getByRole('button', { name: /보관 검증/ }).click()
  assert.equal(await title(page).inputValue(), '보관 검증')
  await menu(page, '보관')
  await page.goto(`${base}blog/archived`)
  assert.match(await page.locator('.blog-not-found').textContent(), /공개 글을 찾을 수 없습니다/)
  await page.goto(`${base}studio`)
  await menu(page, '초안 서랍')
  await sheet(page).getByRole('button', { name: '공개로 복원' }).click()
  const restored = (await posts(page)).find(p => p.id === 'archived')
  assert.equal(restored.status, 'published')
  assert.equal(restored.publishedAt, initialPublishedAt)
  await page.goto(`${base}blog/archived`)
  await page.locator('.post-body').waitFor()
  await page.reload()
  assert.match(await page.locator('.post-body').textContent(), /복원 본문/)
  await page.getByRole('button', { name: '아카이브로', exact: true }).click()
  await page.goBack()
  await page.locator('.post-body').waitFor()
  await page.goForward()
  assert.equal(new URL(page.url()).pathname.endsWith('/blog'), true)
  await page.goto(`${base}blog/studio-regression`)
  await page.locator('.blog-not-found').waitFor()
  await page.goto(`${base}blog/does-not-exist`)
  await page.locator('.blog-not-found').waitFor()
})

test('057: same-place preview preserves Markdown fidelity, escaping and cursor', async t => {
  const page = await setup(t, { width: 1280, height: 900 })
  const markdown = '1. 첫 항목\n   - 중첩\n     1. 세 번째\n2. 두 번째\n\n`a**b**` **강조** *기울임*\n\n문단 첫 줄\n둘째 줄\n\n*\n\n[안전](https://example.com) [메일](mailto:test@example.com)\n\n[위험](javascript:alert(1))\n\n![위험한 사진](data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4=)\n\n<img src=x onerror="window.studioXss=1">\n\n<script>window.studioXss=1</script>\n\n[속성](https://example.com/"onmouseover="alert(1))'
  await body(page).fill(markdown)
  await body(page).evaluate(element => element.setSelectionRange(5, 9))
  await page.getByRole('button', { name: '미리보기', exact: true }).click()
  assert.equal(await body(page).isVisible(), false)
  const preview = page.locator('.writer-preview')
  assert.equal(await preview.locator('ol > li').count(), 3)
  assert.equal(await preview.locator('ol ul ol').count(), 1)
  assert.equal(await preview.locator('code').textContent(), 'a**b**')
  assert.equal(await preview.locator('code strong').count(), 0)
  assert.match(await preview.textContent(), /문단 첫 줄\s+둘째 줄/)
  assert.equal(await preview.locator('a[href^="javascript:"], script, [onerror], [onmouseover]').count(), 0)
  assert.equal(await preview.locator('img[src^="data:image/svg"]').count(), 0)
  assert.equal(await page.evaluate(() => window.studioXss), undefined)
  assert.equal(await preview.locator('a[href="https://example.com"]').count(), 1)
  assert.equal(await preview.locator('a[href="mailto:test@example.com"]').count(), 1)
  for (const [, value] of await overflow(page)) assert.equal(value, 0)
  if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/preview-desktop.png` })
  await page.getByRole('button', { name: '편집', exact: true }).click()
  assert.deepEqual(await body(page).evaluate(element => [element.selectionStart, element.selectionEnd]), [5, 9])
  assert.equal(await body(page).inputValue(), markdown)
})

test('105: heading tools, functional table and local photo survive preview, publish and reload', async t => {
  const page = await setup(t, { width: 1280, height: 900 })
  assert.ok(await page.locator('.writer-page').evaluate(element => element.getBoundingClientRect().width <= 720))
  await title(page).fill('도구 메뉴 검증')
  await body(page).fill('제목 줄\n\n본문')
  await body(page).evaluate(element => element.setSelectionRange(0, 4))
  const tools = page.getByRole('complementary', { name: '글 도구' })
  if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/tools-desktop.png` })
  await tools.getByRole('button', { name: 'H1', exact: true }).click()
  assert.match(await body(page).inputValue(), /^# 제목 줄/)
  await tools.getByRole('button', { name: 'H2', exact: true }).click()
  assert.match(await body(page).inputValue(), /^## 제목 줄/)
  await tools.getByRole('button', { name: 'H3', exact: true }).click()
  assert.match(await body(page).inputValue(), /^### 제목 줄/)
  await tools.getByRole('button', { name: 'H3', exact: true }).click()
  assert.match(await body(page).inputValue(), /^제목 줄/)

  await body(page).evaluate(element => element.setSelectionRange(element.value.length, element.value.length))
  const toolSizes = await tools.getByRole('button').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height))
  assert.equal(toolSizes.every(height => height >= 40), true, 'desktop tool targets are at least 40px')
  await tools.getByRole('button', { name: '표 삽입', exact: true }).click()
  const inlineTable = page.locator('.writer-inline-table')
  await inlineTable.waitFor()
  assert.equal(await sheet(page).count(), 0, 'table is edited inline, not in a dialog')
  await inlineTable.getByRole('button', { name: '＋ 행', exact: true }).click()
  await inlineTable.getByRole('button', { name: '＋ 열', exact: true }).click()
  assert.equal(await inlineTable.locator('thead input').count(), 3)
  assert.equal(await inlineTable.locator('tbody tr').count(), 3)
  await inlineTable.locator('summary[aria-label="3행 3열 메뉴"]').click()
  await inlineTable.getByRole('button', { name: '행 삭제', exact: true }).click()
  await inlineTable.locator('summary[aria-label="3열 메뉴"]').click()
  await inlineTable.getByRole('button', { name: '열 삭제', exact: true }).click()
  assert.equal(await inlineTable.locator('thead input').count(), 2)
  assert.equal(await inlineTable.locator('tbody tr').count(), 2)
  await inlineTable.getByRole('textbox', { name: '표 이름', exact: true }).fill('여행 일정')
  await inlineTable.getByRole('textbox', { name: '열 1 제목', exact: true }).fill('도시')
  await inlineTable.getByRole('textbox', { name: '열 2 제목', exact: true }).fill('날짜')
  await inlineTable.getByRole('textbox', { name: '1행 1열', exact: true }).fill('프라하')
  await inlineTable.getByRole('textbox', { name: '1행 2열', exact: true }).fill('9월 8일')
  await inlineTable.getByRole('textbox', { name: '2행 1열', exact: true }).fill('빈')
  await inlineTable.getByRole('textbox', { name: '2행 2열', exact: true }).fill('9월 13일')
  await inlineTable.getByRole('textbox', { name: '열 1 제목', exact: true }).focus()
  await page.keyboard.press('Tab')
  assert.equal(await inlineTable.getByRole('textbox', { name: '열 2 제목', exact: true }).evaluate(element => document.activeElement === element), true)
  assert.equal((await body(page).inputValue()).includes('|'), false, 'table pipe syntax stays hidden')
  assert.equal((await body(page).inputValue()).includes('[[studio-table:'), false, 'table reference stays hidden')

  const fileChooserPromise = page.waitForEvent('filechooser')
  await tools.getByRole('button', { name: '사진', exact: true }).click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({
    name: '창가.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  })
  await page.getByText('사진을 본문에 첨부했습니다.', { exact: true }).waitFor()
  const inlineImage = page.locator('.writer-image-block')
  await inlineImage.waitFor()
  assert.equal(await inlineImage.locator('img[alt="창가"]').count(), 1)
  const visibleEditorValues = await page.locator('.writer-editor textarea:visible, .writer-editor input:visible').evaluateAll(elements => elements.map(element => element.value).join('\n'))
  assert.doesNotMatch(visibleEditorValues, /\[\[studio-table:|data:image\//, 'internal references are not user-visible')
  if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/tools-inline-desktop.png`, fullPage: true })
  await saved(page)
  const stored = (await posts(page))[0]
  assert.equal(stored.tables.length, 1)
  assert.equal(stored.tables[0].rows[0][0], '프라하')
  assert.match(stored.bodyMarkdown, /data:image\/png;base64,/)

  await page.getByRole('button', { name: '미리보기', exact: true }).click()
  assert.equal(await page.locator('.writer-preview table').count(), 1)
  assert.equal(await page.locator('.writer-preview th').allTextContents().then(values => values.join(',')), '도시,날짜')
  assert.match(await page.locator('.writer-preview tbody').textContent(), /프라하.*9월 8일/s)
  assert.equal(await page.locator('.writer-preview img[alt="창가"]').count(), 1)
  if (process.env.STUDIO_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.STUDIO_SCREENSHOT_DIR}/tools-preview-desktop.png` })
  await page.reload()
  assert.equal(await page.locator('.writer-preview table').count(), 1)
  assert.equal(await page.locator('.writer-preview img[alt="창가"]').count(), 1)
  assert.equal(await page.locator('.writer-inline-table').count(), 1)
  assert.equal(await page.locator('.writer-image-block img[alt="창가"]').count(), 1)
  const restoredEditorValues = await page.locator('.writer-editor textarea:visible, .writer-editor input:visible').evaluateAll(elements => elements.map(element => element.value).join('\n'))
  assert.doesNotMatch(restoredEditorValues, /\[\[studio-table:|data:image\//)

  await page.getByRole('button', { name: '발행', exact: true }).click()
  await sheet(page).getByRole('textbox', { name: '요약', exact: true }).fill('도구 메뉴로 만든 글')
  await sheet(page).getByRole('button', { name: '발행 확정', exact: true }).click()
  await page.waitForURL(`${base}blog/**`)
  assert.equal(await page.locator('.post-body table').count(), 1)
  assert.equal(await page.locator('.post-body img[alt="창가"]').count(), 1)
})

test('097: local storage disclosure, loss conditions and combined JSON download remain accessible', async t => {
  const page = await setup(t)
  assert.match(await page.locator('.writer-storage').textContent(), /이 브라우저에만 저장됩니다. 다른 기기와 동기화되지 않습니다/)
  await body(page).fill('백업할 초안')
  await saved(page)
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ notes: { prague: '여행 기록' }, stamps: ['prague'] })), voyageStorageKey(VOYAGE.id, 'archive'))
  await page.getByRole('button', { name: '저장 안내와 백업' }).click()
  assert.match(await sheet(page).textContent(), /브라우저 데이터를 지우거나 시크릿 모드/)
  const downloading = page.waitForEvent('download')
  await sheet(page).getByRole('button', { name: '내 기록 백업' }).click()
  const download = await downloading
  const backup = JSON.parse(await readFile(await download.path(), 'utf8'))
  assert.equal(backup.format, 'workaround-local-writing')
  assert.equal(backup.blogDrafts[0].bodyMarkdown, '백업할 초안')
  assert.equal(backup.travel.notes.prague, '여행 기록')
})
