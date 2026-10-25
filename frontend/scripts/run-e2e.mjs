#!/usr/bin/env node
// 메인 E2E 통합 러너 (TKT-159) — `npm run e2e:all`
//
// 파일마다 기대하는 정적 origin/base 가 다르다(Pages-base self-serve · root-base preview 4175 · root dist).
// 이 러너는 저장소 밖 임시 디렉터리(기본 /private/tmp/tkt159)에 빌드하고, 테스트가 `../dist/` 를 하드코딩하므로
// frontend 사본(stage)을 만들어 그 안의 dist 를 스위트 그룹마다 알맞은 빌드로 맞춘다.
// 작업 트리의 frontend/dist 는 건드리지 않는다(다른 빌드와 충돌하지 않는다). 테스트 파일은 수정하지 않는다.
//
//   node scripts/run-e2e.mjs [--only pages|root|studio] [--skip-build] [--keep-stage] [파일명 일부...]
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, readdir, rm, symlink, writeFile, realpath, access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = dirname(dirname(fileURLToPath(import.meta.url)))
const repo = dirname(frontend)
const advisorFrontend = join(repo, 'services', 'advisor', 'frontend')
const work = process.env.E2E_WORK_DIR || '/private/tmp/tkt159'
const dirs = {
  pages: join(work, 'build-pages'),
  root: join(work, 'build-root'),
  advisor: join(work, 'build-advisor'),
  stage: join(work, 'stage'),
  logs: join(work, 'logs')
}
const PAGES_BASE = '/workaround.co.kr-platform/'
const PREVIEW_PORT = 4175
const REQUIRED_PLAYWRIGHT = join(advisorFrontend, 'node_modules')

// 그룹: pages = Pages-base dist(대부분 self-serve, WritingStudio 는 격리 preview) · root = root-base dist
// ToneTools 는 root dist 를 스스로 띄운다. SimTone·taxi 는 root-base preview 4175 를 기대한다.
const ROOT_DIST_SELF = ['ToneTools.e2e.mjs']
const ROOT_PREVIEW = ['SimTone.e2e.mjs', 'taxiDispatch.e2e.mjs']
const STUDIO = ['WritingStudio.e2e.mjs']

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const onlyIndex = args.indexOf('--only')
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : 'all'
const filters = args.filter((arg, i) => !arg.startsWith('--') && !(onlyIndex >= 0 && i === onlyIndex + 1))
if (!['all', 'pages', 'root', 'studio'].includes(only)) fail(`--only 는 all|pages|root|studio 중 하나여야 합니다 (받은 값: ${only})`)

function fail(message) {
  console.error(`[e2e] 실패: ${message}`)
  process.exit(1)
}
const log = message => console.log(`[e2e] ${message}`)
const sec = ms => `${(ms / 1000).toFixed(1)}s`
const base = file => file.split('/').pop()

async function findE2e(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await findE2e(path))
    else if (entry.name.endsWith('.e2e.mjs')) out.push(path)
  }
  return out.sort()
}

function portFree(port) {
  return new Promise(resolve => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)))
  })
}

function run(command, commandArgs, options = {}) {
  return new Promise(resolve => {
    const started = Date.now()
    const child = spawn(command, commandArgs, { stdio: ['ignore', 'pipe', 'pipe'], ...options })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('close', code => resolve({ code, output, ms: Date.now() - started }))
  })
}

async function build(name, cwd, outDir, baseArg) {
  const vite = join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
  const result = await run(process.execPath, [vite, 'build', '--base', baseArg, '--outDir', outDir, '--emptyOutDir'], { cwd })
  if (result.code !== 0) {
    console.error(result.output.slice(-3000))
    fail(`${name} 빌드 실패`)
  }
  log(`빌드 ${name} (${baseArg}) ${sec(result.ms)}`)
}

async function replaceDist(source) {
  const target = join(dirs.stage, 'frontend', 'dist')
  await rm(target, { recursive: true, force: true })
  await cp(source, target, { recursive: true })
}

async function prepareStage() {
  const stageFrontend = join(dirs.stage, 'frontend')
  await rm(dirs.stage, { recursive: true, force: true })
  await mkdir(stageFrontend, { recursive: true })
  for (const item of ['src', 'scripts', 'package.json', 'index.html', 'public']) {
    await cp(join(frontend, item), join(stageFrontend, item), { recursive: true })
  }
  await symlink(await realpath(join(frontend, 'node_modules')), join(stageFrontend, 'node_modules'))
  const stageAdvisor = join(dirs.stage, 'services', 'advisor', 'frontend')
  await mkdir(stageAdvisor, { recursive: true })
  await writeFile(join(stageAdvisor, 'package.json'), '{"private":true}\n')
  await symlink(await realpath(REQUIRED_PLAYWRIGHT), join(stageAdvisor, 'node_modules'))
}

let preview = null
async function stopPreview() {
  if (!preview || preview.exitCode !== null) return
  preview.kill('SIGTERM')
  await new Promise(resolve => {
    const timer = setTimeout(() => { preview.kill('SIGKILL'); resolve() }, 3000)
    preview.once('exit', () => { clearTimeout(timer); resolve() })
  })
}
process.on('exit', () => { if (preview && preview.exitCode === null) preview.kill('SIGKILL') })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await stopPreview(); process.exit(130) })

async function startPreview() {
  const vite = join(dirs.stage, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js')
  preview = spawn(process.execPath, [vite, 'preview', '--outDir', dirs.root, '--host', '127.0.0.1', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: join(dirs.stage, 'frontend'), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' }
  })
  let output = ''
  preview.stdout.on('data', c => { output += c })
  preview.stderr.on('data', c => { output += c })
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) fail(`preview ${PREVIEW_PORT} 가 준비 전에 종료됐습니다.\n${output}`)
    try {
      const response = await fetch(`http://127.0.0.1:${PREVIEW_PORT}/`)
      await response.text()
      if (response.ok) return
    } catch { /* not ready */ }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  fail(`preview ${PREVIEW_PORT} 가 15초 안에 준비되지 않았습니다.\n${output}`)
}

function parseTap(output) {
  const count = name => Number((output.match(new RegExp(`^# ${name} (\\d+)`, 'm')) || [0, 0])[1])
  const failed = []
  for (const line of output.split('\n')) {
    const match = line.match(/^\s*not ok \d+ - (.*?)(?:\s+# .*)?$/)
    if (match) failed.push(match[1])
  }
  return { tests: count('tests'), pass: count('pass'), fail: count('fail'), skipped: count('skipped'), failed }
}

async function runFile(file, env) {
  const name = base(file)
  const started = Date.now()
  const cwd = join(dirs.stage, 'frontend')
  const stageFile = join(cwd, relative(frontend, file))
  const result = await run(process.execPath, ['--test', '--test-reporter=tap', stageFile], {
    cwd,
    env: { ...process.env, NODE_PATH: REQUIRED_PLAYWRIGHT, ...env }
  })
  await writeFile(join(dirs.logs, `${name}.log`), result.output)
  const parsed = parseTap(result.output)
  // 실패 테스트가 파싱되지 않았는데 종료 코드가 0 이 아니거나 테스트가 0개면 스위트 자체 실패로 본다.
  const broken = (result.code !== 0 && parsed.fail === 0) || parsed.tests === 0
  if (broken) parsed.failed.push('(스위트 실행 오류 — 로그 참조)')
  return { name, ...parsed, broken, ms: Date.now() - started, code: result.code }
}

async function main() {
  await mkdir(dirs.logs, { recursive: true })
  const all = (await findE2e(join(frontend, 'src'))).filter(f => !filters.length || filters.some(x => f.includes(x)))
  const select = group => all.filter(f => group.includes(base(f)))
  const rootSelf = select(ROOT_DIST_SELF)
  const rootPreview = select(ROOT_PREVIEW)
  const studio = select(STUDIO)
  const pages = all.filter(f => ![...ROOT_DIST_SELF, ...ROOT_PREVIEW, ...STUDIO].includes(base(f)))
  const plan = {
    all: { pages, studio, rootSelf, rootPreview },
    pages: { pages, studio: [], rootSelf: [], rootPreview: [] },
    studio: { pages: [], studio, rootSelf: [], rootPreview: [] },
    root: { pages: [], studio: [], rootSelf, rootPreview }
  }[only]
  const total = Object.values(plan).reduce((n, list) => n + list.length, 0)
  if (!total) fail('실행할 E2E 파일이 없습니다.')

  try { await access(REQUIRED_PLAYWRIGHT) } catch { fail(`Playwright 경로가 없습니다: ${REQUIRED_PLAYWRIGHT} (Advisor 프런트 의존성을 먼저 설치하세요)`) }
  const needRootPreview = plan.rootPreview.length > 0
  if (needRootPreview && !(await portFree(PREVIEW_PORT))) {
    fail(`포트 ${PREVIEW_PORT} 가 이미 사용 중입니다(SimTone·taxiDispatch 가 root-base preview 를 기대). 점유 프로세스를 종료한 뒤 다시 실행하세요: lsof -i :${PREVIEW_PORT}`)
  }

  const needPages = plan.pages.length + plan.studio.length > 0
  const needRoot = plan.rootSelf.length + plan.rootPreview.length > 0 || plan.pages.some(f => base(f) === 'blogClosed.e2e.mjs')
  if (!flag('--skip-build')) {
    const t0 = Date.now()
    if (needPages) {
      await build('advisor', advisorFrontend, dirs.advisor, `${PAGES_BASE}advisor/`)
      await build('pages', frontend, dirs.pages, PAGES_BASE)
      await rm(join(dirs.pages, 'advisor'), { recursive: true, force: true })
      await cp(dirs.advisor, join(dirs.pages, 'advisor'), { recursive: true })
    }
    if (needRoot) await build('root', frontend, dirs.root, '/')
    log(`빌드 합계 ${sec(Date.now() - t0)}`)
  }
  await prepareStage()

  const results = []
  const t0 = Date.now()
  try {
    if (needPages) {
      await replaceDist(dirs.pages)
      for (const file of [...plan.pages, ...plan.studio]) {
        log(`실행 ${base(file)} (Pages-base)`)
        results.push(await runFile(file, { BLOG_CLOSED_ROOT_DIST: dirs.root + '/' }))
      }
    }
    if (plan.rootSelf.length) {
      await replaceDist(dirs.root)
      for (const file of plan.rootSelf) {
        log(`실행 ${base(file)} (root dist)`)
        results.push(await runFile(file, {}))
      }
    }
    if (plan.rootPreview.length) {
      await startPreview()
      log(`root-base preview ${PREVIEW_PORT} 기동`)
      for (const file of plan.rootPreview) {
        log(`실행 ${base(file)} (preview ${PREVIEW_PORT})`)
        results.push(await runFile(file, {}))
      }
    }
  } finally {
    await stopPreview()
    preview = null
    if (needPages && plan.rootSelf.length) await replaceDist(dirs.pages) // 마지막은 Pages-base 로
    if (!flag('--keep-stage')) await rm(join(dirs.stage, 'frontend', 'src'), { recursive: true, force: true })
  }

  const pad = (value, n) => String(value).padEnd(n)
  console.log('\n파일'.padEnd(36) + pad('pass', 6) + pad('skip', 6) + pad('fail', 6) + '소요')
  let sums = { pass: 0, skipped: 0, fail: 0 }
  for (const r of results) {
    sums = { pass: sums.pass + r.pass, skipped: sums.skipped + r.skipped, fail: sums.fail + r.fail }
    console.log(pad(r.name, 35) + pad(r.pass, 6) + pad(r.skipped, 6) + pad(r.fail + (r.broken && !r.fail ? '!' : ''), 6) + sec(r.ms))
  }
  console.log(pad('합계', 35) + pad(sums.pass, 6) + pad(sums.skipped, 6) + pad(sums.fail, 6) + sec(Date.now() - t0))
  const bad = results.filter(r => r.fail > 0 || r.broken)
  if (bad.length) {
    console.log('\n실패:')
    for (const r of bad) {
      console.log(`  ${r.name}  (로그 ${join(dirs.logs, r.name)}.log)`)
      for (const name of r.failed) console.log(`    - ${name}`)
    }
    process.exitCode = 1
  } else {
    log(`전체 통과 — pass ${sums.pass} / skip ${sums.skipped} / fail 0`)
    process.exitCode = 0
  }
}

main().catch(async error => {
  await stopPreview()
  console.error(`[e2e] 실패: ${error.stack || error.message}`)
  process.exit(1)
})
