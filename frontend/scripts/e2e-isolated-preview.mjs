import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access } from 'node:fs/promises'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontendDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

async function reservePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  if (!port) throw new Error('격리 preview 포트를 배정하지 못했습니다.')
  return port
}

function normalizeBasePath(basePath) {
  const withLeadingSlash = basePath.startsWith('/') ? basePath : `/${basePath}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export async function startIsolatedPreview({ basePath = '/', readyTimeout = 15_000 } = {}) {
  await access(join(frontendDirectory, 'dist', 'index.html'))
  const normalizedBase = normalizeBasePath(basePath)
  const port = await reservePort()
  const url = `http://127.0.0.1:${port}${normalizedBase}`
  const viteEntry = join(frontendDirectory, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(process.execPath, [
    viteEntry,
    'preview',
    '--host', '127.0.0.1',
    '--port', String(port),
    '--strictPort',
    '--base', normalizedBase
  ], {
    cwd: frontendDirectory,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  let output = ''
  const collect = chunk => { output = `${output}${chunk}`.slice(-4_000) }
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  const exited = once(child, 'exit').catch(() => [])
  const killOnParentExit = () => {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
  process.once('exit', killOnParentExit)

  async function stop() {
    process.removeListener('exit', killOnParentExit)
    if (child.exitCode !== null) return
    child.kill('SIGTERM')
    await Promise.race([exited, delay(3_000)])
    if (child.exitCode === null) {
      child.kill('SIGKILL')
      await exited
    }
  }

  const deadline = Date.now() + readyTimeout
  try {
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`preview가 준비 전에 종료되었습니다.\n${output}`)
      try {
        const response = await fetch(url)
        await response.text()
        if (response.ok) {
          console.log(`[studio-e2e] isolated preview pid=${child.pid} port=${port}`)
          return { pid: child.pid, port, url, stop }
        }
      } catch {
        // The preview socket may not be accepting connections yet.
      }
      await delay(50)
    }
    throw new Error(`preview가 ${readyTimeout}ms 안에 준비되지 않았습니다.\n${output}`)
  } catch (error) {
    await stop()
    throw error
  }
}
