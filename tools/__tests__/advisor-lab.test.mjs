import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run, loadMissions, resolveEntries, suggestIds } from '../advisor-lab.mjs'

const capture = () => {
  const out = []
  const err = []
  return { out, err, io: { log: (s) => out.push(s), err: (s) => err.push(s) } }
}
const tmp = () => mkdtempSync(join(tmpdir(), 'advisor-lab-'))
const walk = (dir, base = dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p, base) : [p.slice(base.length + 1)]
  })

// 특정 미션 내용에 묶지 않도록 starterTests 가 있는 첫 미션을 고른다.
async function pickEasy() {
  const { missions } = await loadMissions()
  return missions.find((m) => (m.starterTests ?? []).length > 0)
}

test('엔트리 목록·내용이 buildMissionEntries 결과와 같다 (easy, hard)', async () => {
  const { zip } = await loadMissions()
  const m = await pickEasy()
  for (const level of ['easy', 'hard']) {
    const out = tmp()
    const { io } = capture()
    assert.equal(await run([m.id, level, '--out', out], io), 0)
    const expected = resolveEntries(zip.buildMissionEntries(m, { level }), zip.safeZipPath)
    const dir = join(out, m.id)
    const actual = walk(dir).filter((p) => !p.startsWith('.advisor'))
    assert.deepEqual([...actual].sort(), expected.map((e) => e.path).sort())
    for (const e of expected) assert.equal(readFileSync(join(dir, e.path), 'utf8'), e.content)
  }
})

test('mission.json 필드', async () => {
  const m = await pickEasy()
  const out = tmp()
  await run([m.id, 'easy', '--out', out], capture().io)
  const meta = JSON.parse(readFileSync(join(out, m.id, '.advisor/mission.json'), 'utf8'))
  assert.deepEqual(Object.keys(meta).sort(), ['exportedAt', 'id', 'level', 'requirements', 'rubric', 'title'])
  assert.equal(meta.id, m.id)
  assert.equal(meta.level, 'easy')
  assert.deepEqual(meta.rubric, m.rubric)
  assert.deepEqual(meta.requirements, m.requirements)
  assert.ok(!Number.isNaN(Date.parse(meta.exportedAt)))
})

test('난이도 기본값: starterTests 있으면 easy, 없으면 hard', async () => {
  const { missions } = await loadMissions()
  for (const [m, want] of [
    [missions.find((x) => (x.starterTests ?? []).length), 'easy'],
    [missions.find((x) => !(x.starterTests ?? []).length), 'hard'],
  ]) {
    const out = tmp()
    await run([m.id, '--out', out], capture().io)
    assert.equal(JSON.parse(readFileSync(join(out, m.id, '.advisor/mission.json'), 'utf8')).level, want)
  }
})

test('이미 있으면 덮어쓰지 않고 1, --force 면 다시 만든다', async () => {
  const m = await pickEasy()
  const out = tmp()
  assert.equal(await run([m.id, '--out', out], capture().io), 0)
  const c = capture()
  assert.equal(await run([m.id, '--out', out], c.io), 1)
  assert.match(c.err.join('\n'), /--force/)
  assert.equal(await run([m.id, '--out', out, '--force'], capture().io), 0)
})

test('알 수 없는 id 는 비슷한 id 3개 제안 후 1', async () => {
  const m = await pickEasy()
  const out = tmp()
  const c = capture()
  assert.equal(await run([m.id.slice(0, -1) + 'x', '--out', out], c.io), 1)
  const line = c.err.find((l) => l.startsWith('비슷한 id:'))
  assert.ok(line)
  assert.equal(line.replace('비슷한 id:', '').split('(')[0].split(',').length, 3)
  assert.ok(line.includes(m.id))
  assert.ok(!existsSync(join(out, m.id)))
  assert.equal(suggestIds('zzzz', (await loadMissions()).missions).length, 3)
})

test('--list 는 모든 미션 한 줄씩', async () => {
  const { missions } = await loadMissions()
  const c = capture()
  assert.equal(await run(['--list'], c.io), 0)
  assert.equal(c.out.length, missions.length + 1)
})
