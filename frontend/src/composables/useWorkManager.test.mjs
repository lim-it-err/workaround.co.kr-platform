import assert from 'node:assert/strict'
import { test } from 'node:test'

// TKT-209: 인증 토큰 저장·만료·잠금(TKT-060 하드닝) 동작 고정.
function installWindow(initial = {}) {
  const store = new Map(Object.entries(initial))
  globalThis.window = {
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key)
    },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis)
  }
  return store
}

const warn = console.warn
console.warn = () => {} // 컴포넌트 밖에서 onBeforeUnmount 를 부르는 Vue 경고 무음
const mod = await import('./useWorkManager.js')
const { TOKEN_STORAGE_KEY, TOKEN_EXPIRY_STORAGE_KEY } = mod

const fallbacks = { health: { status: 'degraded' }, runtime: { nodes: [] }, workBoard: { columns: [], actions: {} } }
const future = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const past = () => new Date(Date.now() - 1000).toISOString()

test('resolveWorkManagerAuthSession: 만료 시각·TTL·무효 응답', () => {
  const abs = future()
  assert.deepEqual(mod.resolveWorkManagerAuthSession({ token: 't', expiresAt: abs }), { token: 't', expiresAt: abs })
  const ttl = mod.resolveWorkManagerAuthSession({ token: 't', sessionTtlMinutes: 10 })
  assert.equal(ttl.token, 't')
  assert.ok(Date.parse(ttl.expiresAt) > Date.now())
  assert.equal(mod.resolveWorkManagerAuthSession({ token: 't', expiresAt: past() }), null)
  assert.equal(mod.resolveWorkManagerAuthSession({ expiresAt: future() }), null)
  assert.equal(mod.resolveWorkManagerAuthSession({ token: 't' }), null)
})

test('isExpiredWorkManagerSession: 빈 값·파싱 불가·과거는 만료', () => {
  assert.equal(mod.isExpiredWorkManagerSession(''), true)
  assert.equal(mod.isExpiredWorkManagerSession('nope'), true)
  assert.equal(mod.isExpiredWorkManagerSession(past()), true)
  assert.equal(mod.isExpiredWorkManagerSession(future()), false)
})

test('readStoredWorkManagerSession: 유효하면 복원, 만료면 지우고 expired 표시', () => {
  const exp = future()
  installWindow({ [TOKEN_STORAGE_KEY]: 'tok', [TOKEN_EXPIRY_STORAGE_KEY]: exp })
  assert.deepEqual(mod.readStoredWorkManagerSession(), { token: 'tok', expiresAt: exp, expired: false })

  const store = installWindow({ [TOKEN_STORAGE_KEY]: 'tok', [TOKEN_EXPIRY_STORAGE_KEY]: past() })
  assert.deepEqual(mod.readStoredWorkManagerSession(), { token: '', expiresAt: '', expired: true })
  assert.equal(store.size, 0)

  installWindow()
  assert.deepEqual(mod.readStoredWorkManagerSession(), { token: '', expiresAt: '', expired: false })
})

test('persistWorkManagerSession: 유효 세션만 저장, 아니면 삭제', () => {
  const store = installWindow()
  const exp = future()
  mod.persistWorkManagerSession('tok', exp)
  assert.equal(store.get(TOKEN_STORAGE_KEY), 'tok')
  assert.equal(store.get(TOKEN_EXPIRY_STORAGE_KEY), exp)
  mod.persistWorkManagerSession('tok', past())
  assert.equal(store.size, 0)
})

test('useWorkManager: 만료된 저장 세션은 잠금 안내와 함께 시작, 요청 0', () => {
  installWindow({ [TOKEN_STORAGE_KEY]: 'tok', [TOKEN_EXPIRY_STORAGE_KEY]: past() })
  let calls = 0
  const wm = mod.useWorkManager({ fallbacks, fetchJson: async () => { calls += 1; return {} } })
  assert.equal(wm.workManagerToken.value, '')
  assert.match(wm.workManagerError.value, /만료/)
  assert.equal(calls, 0)
})

test('useWorkManager: 인증 성공 → 저장, 401 → 잠금·삭제, 잠그기 → 삭제', async () => {
  const store = installWindow()
  const exp = future()
  const seen = []
  const wm = mod.useWorkManager({
    fallbacks,
    fetchJson: async (url, options) => {
      seen.push(url)
      if (url === '/api/work-manager/auth') return { token: 'tok', expiresAt: exp, message: 'ok' }
      if (url.endsWith('/metadata')) {
        const error = new Error('unauthorized')
        error.status = 401
        throw error
      }
      return {}
    }
  })

  wm.workManagerPassword.value = '  '
  await wm.unlockWorkManager()
  assert.equal(wm.workManagerError.value, '비밀번호를 입력해야 합니다.')
  assert.deepEqual(seen, [])

  wm.workManagerPassword.value = 'pw'
  await wm.unlockWorkManager()
  assert.equal(wm.workManagerToken.value, 'tok')
  assert.equal(wm.workManagerPassword.value, '')
  await new Promise((resolve) => setImmediate(resolve)) // watch flush
  assert.equal(store.get(TOKEN_STORAGE_KEY), 'tok')
  assert.equal(store.get(TOKEN_EXPIRY_STORAGE_KEY), exp)

  // 401 → 즉시 잠금 + 저장 토큰 삭제
  wm.workBoardState.value = {
    columns: [{ status: 'backlog', tickets: [{ id: 'TKT-1', targetVersion: 'v0.4.0', priority: 'P2' }] }]
  }
  await new Promise((resolve) => setImmediate(resolve))
  await wm.saveWorkTicketMetadata()
  assert.equal(wm.workManagerToken.value, '')
  assert.match(wm.metadataError.value, /다시 인증/)
  assert.equal(store.size, 0)

  // 다시 열고 잠그기
  wm.workManagerPassword.value = 'pw'
  await wm.unlockWorkManager()
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(store.get(TOKEN_STORAGE_KEY), 'tok')
  wm.logoutWorkManager()
  assert.equal(wm.workManagerToken.value, '')
  assert.equal(store.size, 0)
  assert.equal(wm.workManagerMessage.value, 'Command gate 를 잠갔습니다.')
})

console.warn = warn
