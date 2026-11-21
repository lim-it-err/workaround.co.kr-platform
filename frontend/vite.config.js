import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// TKT-221: 환승 홀 부팅 로그의 버전 문자열 — 빌드 환경값 RELEASE_VERSION 을 주입한다(없으면 빈 값 → 버전 없이 「기동」).
// 루트 VERSION 파일은 읽지 않는다(릴리스 버전과 어긋나 있었다). 값은 배포 워크플로가 저장소 변수로 준다.
function readVersion() {
  return (process.env.RELEASE_VERSION || '').trim()
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
