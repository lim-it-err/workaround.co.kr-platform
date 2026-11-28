import { expect, test } from '@playwright/test'
import fs from 'node:fs'

const MISSION = '/missions/s1-wine-01'

// 무압축 ZIP 중앙 디렉터리 파서(테스트용).
function parseZip(buf: Buffer) {
  const eocd = buf.length - 22
  expect(buf.readUInt32LE(eocd)).toBe(0x06054b50)
  const count = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const out: Record<string, string> = {}
  for (let i = 0; i < count; i++) {
    const size = buf.readUInt32LE(p + 24)
    const nlen = buf.readUInt16LE(p + 28)
    const off = buf.readUInt32LE(p + 42)
    const name = buf.subarray(p + 46, p + 46 + nlen).toString('utf8')
    const lnlen = buf.readUInt16LE(off + 26)
    out[name] = buf.subarray(off + 30 + lnlen, off + 30 + lnlen + size).toString('utf8')
    p += 46 + nlen
  }
  return out
}

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:8080/**', (route) => route.abort())
  await page.goto(MISSION)
  await page.getByRole('button', { name: '브리핑 읽었어요 → 미션 보기' }).click()
  await expect(page.getByRole('heading', { name: '상황' })).toBeVisible()
})

test('코드 전체 받기: zip 에 legacyFiles 경로가 모두 들어 있다', async ({ page }) => {
  const paths = await page.locator('.viewer').last().locator('.tab').allTextContents()
  expect(paths.length).toBeGreaterThan(0)
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '⬇ 코드 전체 받기 (.zip)' }).click(),
  ])
  expect(dl.suggestedFilename()).toBe('s1-wine-01.zip')
  const files = parseZip(fs.readFileSync(await dl.path()))
  expect(Object.keys(files)[0]).toBe('pom.xml')
  expect(files['README.md']).toContain('제공 코드는 수정하지 않는다.')
  for (const p of paths) expect(Object.keys(files)).toContain(p.trim())
})

test('파일 하나 받기: 파일명은 경로의 마지막 조각', async ({ page }) => {
  const first = (await page.locator('.viewer').last().locator('.tab').first().textContent())!.trim()
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.viewer').last().getByRole('button', { name: '현재 파일 내려받기' }).click(),
  ])
  expect(dl.suggestedFilename()).toBe(first.split('/').pop())
})

test('파일 올리기: 행 채움·경로·내용, 무시 폴더·큰 파일 안내', async ({ page }) => {
  await page.getByRole('button', { name: '제출', exact: true }).click()
  await page.getByLabel('파일 올리기').setInputFiles([
    { name: 'A.java', mimeType: 'text/plain', buffer: Buffer.from('// 한글\nclass A {}') },
    { name: 'pom.xml', mimeType: 'text/xml', buffer: Buffer.from('<project/>') },
  ])
  await expect(page.getByLabel('파일 1 경로')).toHaveValue('A.java')
  await expect(page.getByLabel('파일 1 내용')).toHaveValue('// 한글\nclass A {}')
  await expect(page.getByLabel('파일 2 경로')).toHaveValue('pom.xml')
  await expect(page.getByLabel('파일 3 경로')).toHaveCount(0)

  // 같은 경로는 덮어쓰기
  await page.getByLabel('파일 올리기').setInputFiles([
    { name: 'A.java', mimeType: 'text/plain', buffer: Buffer.from('class A2 {}') },
  ])
  await expect(page.getByLabel('파일 1 내용')).toHaveValue('class A2 {}')
  await expect(page.getByLabel('파일 3 경로')).toHaveCount(0)

  // 큰 파일 안내
  await page.getByLabel('파일 올리기').setInputFiles([
    { name: 'Big.java', mimeType: 'text/plain', buffer: Buffer.alloc(201 * 1024, 'a') },
  ])
  await expect(page.getByRole('status')).toContainText('200KB')
  await expect(page.getByLabel('파일 3 경로')).toHaveCount(0)
})

test('폴더 올리기: target/ 아래는 무시', async ({ page }) => {
  await page.getByRole('button', { name: '제출', exact: true }).click()
  const dir = fs.mkdtempSync('/tmp/tkt236-')
  fs.mkdirSync(`${dir}/proj/src`, { recursive: true })
  fs.mkdirSync(`${dir}/proj/target`, { recursive: true })
  fs.writeFileSync(`${dir}/proj/src/B.java`, 'class B {}')
  fs.writeFileSync(`${dir}/proj/target/Out.java`, 'class Out {}')
  await page.getByLabel('폴더 올리기').setInputFiles(`${dir}/proj`)
  await expect(page.getByLabel('파일 1 경로')).toHaveValue('src/B.java')
  await expect(page.getByLabel('파일 2 경로')).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('건너뛰었습니다')
  await expect(page.getByText('IDE 에서 작업한 파일을 올리거나 붙여넣으세요.')).toBeVisible()
  fs.rmSync(dir, { recursive: true, force: true })
})

for (const [w, h, tag] of [[375, 812, '375'], [1440, 900, '1440']] as const) {
  test(`캡처 ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await page.locator('.code-head').last().scrollIntoViewIfNeeded()
    await page.screenshot({ path: `../../../docs/tickets/captures/TKT-236/mission-${tag}.png` })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    await page.getByRole('button', { name: '제출', exact: true }).click()
    await page.screenshot({ path: `../../../docs/tickets/captures/TKT-236/submit-${tag}.png` })
  })
}
