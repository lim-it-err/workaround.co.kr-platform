#!/usr/bin/env node
// Advisor 미션 → labs/advisor/<id>/ 실습 폴더. 미션 데이터·엔트리는 화면 zip 과 같은 코드를 import 해 쓴다.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
export const repoRoot = resolve(here, '..')
const missionsDir = join(repoRoot, 'services/advisor/frontend/src/modules/missions')

const USAGE = `사용법: tools/advisor-lab.sh <미션id> [easy|hard] [--force] [--out <폴더>]
        tools/advisor-lab.sh --list
  easy  테스트가 미리 들어 있음 (미션에 starterTests 가 있으면 기본)
  hard  테스트를 직접 씀 (없으면 기본)
  --force      이미 있는 실습 폴더를 지우고 다시 만든다
  --out <폴더> 결과를 <폴더>/<미션id>/ 에 만들고 git 브랜치는 건드리지 않는다 (테스트·검증용)`

export async function loadMissions() {
  const content = await import(pathToFileURL(join(missionsDir, 'data/sampleContent.js')).href)
  const zip = await import(pathToFileURL(join(missionsDir, 'utils/zip.js')).href)
  const missions = content.default.missions
  return { missions: Array.isArray(missions) ? missions : Object.values(missions), zip }
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

export function suggestIds(id, missions) {
  return missions
    .map((m) => ({ id: m.id, score: (m.id.includes(id) || id.includes(m.id) ? -100 : 0) + distance(id, m.id) }))
    .sort((x, y) => x.score - y.score)
    .slice(0, 3)
    .map((x) => x.id)
}

// buildZip 과 같은 경로 규칙: 안전하지 않은 경로·중복은 files/<n>.txt.
export function resolveEntries(entries, safeZipPath) {
  const used = new Set()
  return entries.map((e, i) => {
    let path = safeZipPath(e.path, i)
    if (used.has(path)) path = `files/${i + 1}.txt`
    used.add(path)
    return { path, content: e.content ?? '' }
  })
}

function parseArgs(argv) {
  const o = { positional: [], force: false, list: false, out: null, help: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--force') o.force = true
    else if (a === '--list') o.list = true
    else if (a === '--help' || a === '-h') o.help = true
    else if (a === '--out') o.out = argv[++i]
    else if (a.startsWith('--')) throw new Error(`알 수 없는 옵션: ${a}`)
    else o.positional.push(a)
  }
  return o
}

const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim()

// 반환: 종료 코드. out(줄) 로 출력해 테스트에서 가로챌 수 있다.
export async function run(argv, { log = console.log, err = console.error } = {}) {
  let o
  try {
    o = parseArgs(argv)
  } catch (e) {
    err(e.message)
    err(USAGE)
    return 1
  }
  if (o.help) return log(USAGE), 0
  const { missions, zip } = await loadMissions()

  if (o.list) {
    log('미션id\t제목\t이지(starterTests)')
    for (const m of missions) log(`${m.id}\t${m.title}\t${(m.starterTests ?? []).length ? '있음' : '없음'}`)
    return 0
  }

  const [id, levelArg] = o.positional
  if (!id || o.positional.length > 2) {
    err(USAGE)
    return 1
  }
  if (levelArg && levelArg !== 'easy' && levelArg !== 'hard') {
    err(`난이도는 easy 또는 hard 입니다: ${levelArg}`)
    return 1
  }
  const mission = missions.find((m) => m.id === id)
  if (!mission) {
    err(`알 수 없는 미션 id: ${id}`)
    err(`비슷한 id: ${suggestIds(id, missions).join(', ')}  (전체는 --list)`)
    return 1
  }
  const level = levelArg ?? ((mission.starterTests ?? []).length ? 'easy' : 'hard')

  const baseDir = o.out ? resolve(o.out) : join(repoRoot, 'labs/advisor')
  const dir = join(baseDir, id)
  if (existsSync(dir)) {
    if (!o.force) {
      err(`${dir} 이미 있습니다 — 지우고 다시 하려면 --force`)
      return 1
    }
    const { rmSync } = await import('node:fs')
    rmSync(dir, { recursive: true, force: true })
  }

  if (!o.out) {
    const branch = `lab/${id}`
    const current = git('rev-parse', '--abbrev-ref', 'HEAD')
    if (current !== branch) {
      let exists = true
      try {
        git('rev-parse', '--verify', '--quiet', `refs/heads/${branch}`)
      } catch {
        exists = false
      }
      git('switch', ...(exists ? [] : ['-c']), branch)
      log(`브랜치 ${exists ? '전환' : '생성'}: ${current} → ${branch}`)
    } else log(`브랜치: ${branch} (그대로)`)
  }

  const entries = resolveEntries(zip.buildMissionEntries(mission, { level }), zip.safeZipPath)
  for (const e of entries) {
    const target = join(dir, e.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, e.content, 'utf8')
  }
  mkdirSync(join(dir, '.advisor'), { recursive: true })
  const meta = {
    id: mission.id,
    title: mission.title,
    level,
    rubric: mission.rubric ?? [],
    requirements: mission.requirements ?? [],
    exportedAt: new Date().toISOString(),
  }
  writeFileSync(join(dir, '.advisor/mission.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8')

  log(`${mission.title} (${level}) — 파일 ${entries.length}개를 ${dir} 에 풀었습니다.`)
  log('다음 할 일:')
  log(`  1. 구현한다 (제공 코드·테스트 파일은 고치지 않음)`)
  log(`  2. cd labs/advisor/${id} && mvn -q test`)
  log(`  3. git add labs/advisor/${id} && git commit -m "..." && git push -u origin lab/${id}  → Actions 가 채점합니다`)
  return 0
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  run(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => (console.error(e.message), process.exit(1)),
  )
}
