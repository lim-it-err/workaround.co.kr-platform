// GitHub Pages post-deploy smoke (TKT-160).
// Usage: node smoke-pages.mjs [baseUrl] [--sha <commit>] [--expect-copies=true|false]
// Path lists are read from the same sources as prepare-github-pages.mjs
// (infra/public-site/route-rules.mjs - frontend/src/staticRouting.js, Advisor missions/routes.js) - no hardcoding.
import { appendFileSync } from 'node:fs'
import { LOCKED_PATHS, copiedMainPaths, extractAdvisorRoutePaths } from './route-rules.mjs'

const DEFAULT_URL = 'https://lim-it-err.github.io/workaround.co.kr-platform/'
const SHELL_MARKER = 'SPA entry request failed'
const ADVISOR_MAIN_PATHS = ['/today', '/learn', '/history']

function parseArgs(argv) {
  const out = { url: DEFAULT_URL, sha: '', expectCopies: true }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--sha') out.sha = argv[++i] || ''
    else if (arg.startsWith('--sha=')) out.sha = arg.slice(6)
    else if (arg.startsWith('--expect-copies=')) out.expectCopies = arg.slice(16) !== 'false'
    else if (!arg.startsWith('--') && arg) out.url = arg
  }
  out.url = out.url.endsWith('/') ? out.url : `${out.url}/`
  return out
}

async function get(url) {
  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' }, redirect: 'follow' })
  return { status: res.status, body: await res.text() }
}

const isHtml = (body) => /<!doctype html|<html/i.test(body)
const isShell = (r) => r.status === 404 && isHtml(r.body) && r.body.includes(SHELL_MARKER)
const isPage = (r) => r.status === 200 && isHtml(r.body) && !r.body.includes(SHELL_MARKER)

const opts = parseArgs(process.argv.slice(2))
const rows = []
async function check(label, path, expectLabel, predicate, fetchUrl = opts.url + path.replace(/^\//, '')) {
  let ok = false
  let detail = ''
  try {
    const r = await get(fetchUrl)
    ok = predicate(r)
    detail = `HTTP ${r.status}`
    if (r.status === 404 && r.body.includes(SHELL_MARKER)) detail += ' (404 셸)'
  } catch (e) {
    detail = `오류 ${e.message}`
  }
  rows.push({ label, path, expectLabel, ok, detail })
}

const expectPage = opts.expectCopies ? isPage : isShell
const expectPageLabel = opts.expectCopies ? '200 HTML' : '404 셸'

await check('루트', '/', '200 HTML', isPage)
const root = await get(opts.url).catch(() => ({ status: 0, body: '' }))
for (const p of copiedMainPaths()) await check('공개 경로', p, expectPageLabel, expectPage, `${opts.url}${p.slice(1)}/`)
await check('Advisor', '/advisor/', '200 HTML', isPage)
for (const p of ADVISOR_MAIN_PATHS.filter((x) => extractAdvisorRoutePaths().includes(x))) {
  await check('Advisor 경로', `/advisor${p}`, expectPageLabel, expectPage, `${opts.url}advisor${p}/`)
}
const icon = root.body.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)
  || root.body.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*icon/i)
if (icon) {
  const iconUrl = new URL(icon[1], opts.url).href
  await check('파비콘', new URL(iconUrl).pathname, '200', (r) => r.status === 200, iconUrl)
} else {
  rows.push({ label: '파비콘', path: '(link rel=icon)', expectLabel: '200', ok: false, detail: '루트 HTML 에 링크 없음' })
}
if (opts.sha) {
  let ok = false
  let detail = ''
  try {
    const r = await get(`${opts.url}deployment.json`)
    const json = r.status === 200 ? JSON.parse(r.body) : null
    ok = Boolean(json) && json.commitSha === opts.sha
    detail = json ? `commitSha ${String(json.commitSha).slice(0, 7)}` : `HTTP ${r.status}`
  } catch (e) {
    detail = `오류 ${e.message}`
  }
  rows.push({ label: 'deployment.json', path: '/deployment.json', expectLabel: `commitSha=${opts.sha.slice(0, 7)}`, ok, detail })
} else {
  await check('deployment.json', '/deployment.json', '200 (SHA 생략)', (r) => r.status === 200)
}
await check('임의 깊은 경로', '/__smoke__/deep/path', '404 셸', isShell)
for (const p of LOCKED_PATHS) await check('잠금·운행 중단', p, '404 셸', isShell, `${opts.url}${p.slice(1)}`)

const failed = rows.filter((r) => !r.ok)
console.log(`기준 URL: ${opts.url}  expect-copies=${opts.expectCopies}  sha=${opts.sha || '-'}`)
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label.padEnd(14)} ${r.path.padEnd(32)} 기대 ${r.expectLabel.padEnd(14)} 실제 ${r.detail}`)
console.log(`결과: ${rows.length - failed.length}/${rows.length} 통과`)

if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    `## Pages 스모크 — ${failed.length ? '실패' : '통과'}`,
    `- 기준 URL: ${opts.url} · expect-copies=${opts.expectCopies}`,
    '',
    '| 결과 | 구분 | 경로 | 기대 | 실제 |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.ok ? 'PASS' : 'FAIL'} | ${r.label} | \`${r.path}\` | ${r.expectLabel} | ${r.detail} |`),
    '',
  ].join('\n')
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md)
}
process.exit(failed.length ? 1 : 0)
