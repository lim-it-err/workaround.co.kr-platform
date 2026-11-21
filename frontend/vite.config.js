import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'

// TKT-219: 환승 홀 부팅 로그의 버전 문자열 — 저장소 루트 VERSION 파일을 빌드 시 주입한다(없으면 빈 값).
function readVersion() {
  try {
    return readFileSync(new URL('../VERSION', import.meta.url), 'utf8').trim()
  } catch (error) {
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
