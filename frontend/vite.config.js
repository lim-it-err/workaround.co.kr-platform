import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// TKT-221·TKT-224: 환승 홀 부팅 로그의 버전 문자열.
// 1) 환경값 RELEASE_VERSION 이 비어 있지 않으면 그 값(덮어쓰기용).
// 2) 아니면 저장소 루트 VERSION 파일(첫 줄 trim) — 릴리스 버전의 단일 출처. 릴리스 PR 에서 PM 이 올린다.
// 3) 파일이 없으면 빈 값 → 버전 없이 「기동」.
const VERSION_FILE = fileURLToPath(new URL('../VERSION', import.meta.url))

function readVersion() {
  const override = (process.env.RELEASE_VERSION || '').trim()
  if (override) return override
  try {
    return readFileSync(VERSION_FILE, 'utf8').split('\n')[0].trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(readVersion())
  },
  server: {
    port: 7000,
    host: '0.0.0.0',
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
