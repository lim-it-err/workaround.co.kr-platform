// 환승 홀 v0.9 데이터 (TKT-219·D-036) — 출발 안내판(기본)·역 목록(lite)·부팅 로그의 단일 소스.
// 시안: design/mockups-v0.9/hall-12.html 「선택안 미리보기」(A-08 → A-04 + lite 화살표).
// page 키는 data/lines.js 의 것을 그대로 쓴다. 노선 좌표(lines.js)는 이 화면이 쓰지 않는다.
import { readRecentSplashVisit } from '../composables/useSplash.js'

// 노선 5개(Q-025 ①) — tone 은 컴포넌트 CSS 클래스, 색은 styles.css 의 --line-*-text 토큰.
export const HALL_LINES = {
  record: { name: '기록선', tone: 'rec' },
  learn: { name: '배움선', tone: 'learn' },
  play: { name: '놀이선', tone: 'play' },
  life: { name: '생활선', tone: 'life' },
  base: { name: '기지선', tone: 'base' }
}

// 상태 tone: ok(운행·샘플·공개) · warn(개통 준비).
// 행 순서는 시안과 같다. 블로그 행은 TKT-221 에서 뺐다 — 블로그 본선 운행 중단(D-031)은 주소 진입 안내(토스트)로만 남는다.
export const HALL_ROWS = [
  { id: 'voyage', line: 'record', destination: '여행', status: '운행', tone: 'ok', page: 'voyage' },
  { id: 'advisor', line: 'learn', destination: 'Advisor', status: '운행', tone: 'ok', entryPath: '/advisor/' },
  { id: 'daily5', line: 'learn', destination: '일일 5지', status: '개통 준비', tone: 'warn', planned: true },
  { id: 'simhub', line: 'play', destination: '격납고', status: '운행', tone: 'ok', page: 'simhub' },
  { id: 'ets2', line: 'play', destination: '유로트럭', status: '샘플', tone: 'ok', page: 'ets2' },
  { id: 'pantry', line: 'life', destination: '자취 밥상', status: '운행', tone: 'ok', page: 'pantry' },
  { id: 'work', line: 'base', destination: '운영 노트', status: '공개', tone: 'ok', page: 'work' }
]

// 환승 홀 노선도(TKT-226) — viewBox 720×200 좌표만. 역 이름·상태·tone 은 HALL_ROWS/HALL_LINES 에서 읽는다.
// 옥틸리니어: 가로·세로·45° 선만. label = 역 이름을 점 위(above)·아래(below) 어디에 둘지.
export const HALL_MAP = {
  viewBox: { width: 720, height: 200 },
  hub: { x: 360, y: 100, label: '환승 홀' },
  routes: [
    { line: 'record', d: 'M360 100 H70' },
    { line: 'learn', d: 'M360 100 L420 40 H520' },
    { line: 'learn', d: 'M520 40 H660', planned: true },
    { line: 'play', d: 'M360 100 H660' },
    { line: 'life', d: 'M360 100 L300 160 H150' },
    { line: 'base', d: 'M360 100 L420 160 H570' }
  ],
  stations: {
    voyage: { x: 70, y: 100, label: 'above' },
    advisor: { x: 520, y: 40, label: 'above' },
    daily5: { x: 660, y: 40, label: 'above' },
    simhub: { x: 500, y: 100, label: 'below' },
    ets2: { x: 660, y: 100, label: 'below' },
    pantry: { x: 150, y: 160, label: 'below' },
    work: { x: 570, y: 160, label: 'below' }
  }
}

// lite: 역 이름 6개만(글자 입력 칸 없음).
export const HALL_LITE_ITEMS = [
  { id: 'voyage', label: '여행', page: 'voyage' },
  { id: 'pantry', label: '자취 밥상', page: 'pantry' },
  { id: 'work', label: '운영 노트', page: 'work' }
]

export const LITE_HINT = '↑↓ 고르기 · Enter 들어가기'

// 빌드 환경값 RELEASE_VERSION(vite.config.js 가 __APP_VERSION__ 으로 주입). 없으면 빈 값.
const BUILD_VERSION = typeof __APP_VERSION__ === 'undefined' ? '' : __APP_VERSION__

// 부팅 로그(시안 문구 그대로). 줄당 90ms, 마지막 줄 뒤 500ms 에 출발 안내판으로 바뀐다.
// 버전 문자열은 빌드 시 주입한 RELEASE_VERSION 값 — 값이 없으면 버전 없이 「기동」만 쓴다.
export const BOOT_LINE_MS = 90
export const BOOT_AFTER_MS = 500
export const BOOT_LOG = [
  { tone: 'd', text: `[ 0.000] workaround${BUILD_VERSION ? ` ${BUILD_VERSION}` : ''} 기동` },
  { text: '[ 0.012] 문 열림 ................', status: '[ 완료 ]', statusTone: 'ok' },
  { text: '[ 0.040]', line: 'record', rest: '여행 ............', status: '[ 운행 ]', statusTone: 'ok' },
  { text: '[ 0.052]', line: 'learn', rest: 'Advisor .........', status: '[ 운행 ]', statusTone: 'ok' },
  { text: '[ 0.053]', line: 'learn', rest: '일일 5지 ........', status: '[ 준비 ]', statusTone: 'warn' },
  { text: '[ 0.061]', line: 'play', rest: '격납고 ..........', status: '[ 운행 ]', statusTone: 'ok' },
  { text: '[ 0.062]', line: 'play', rest: '유로트럭 ........', status: '[ 샘플 ]', statusTone: 'ok' },
  { text: '[ 0.070]', line: 'life', rest: '자취 밥상 .......', status: '[ 운행 ]', statusTone: 'ok' },
  { text: '[ 0.081]', line: 'base', rest: '운영 노트 .......', status: '[ 공개 ]', statusTone: 'ok' },
  { tone: 'h', text: '환승 홀에 도착했습니다.' }
]

// 재방문 판정은 스플래시가 「방문 완료」를 기록하기 전(앱 시작 시점)에 한 번만 읽는다.
// 스플래시가 끝나면 splash:seen 이 새로 써지므로, 마운트 때 읽으면 첫 방문도 재방문으로 보인다.
const WAS_RETURN_VISIT = readRecentSplashVisit()
let bootConsumed = false

// 부팅 로그를 이번 페이지 로드에서 아직 안 봤고, 재방문도 모션 줄이기도 아니면 true. 한 번 true 를 주면 다시는 주지 않는다.
export function takeBootLog({ reducedMotion = false } = {}) {
  if (bootConsumed) return false
  bootConsumed = true
  return !WAS_RETURN_VISIT && !reducedMotion
}

// 행·항목을 눌렀을 때 할 일. open: 화면 이동 / link: 앵커가 처리 / notice: 안내 문구.
export function resolveHallTarget(target, disabledPages = []) {
  if (target.planned) return { type: 'notice', message: `${target.destination} · 개통 준비 중` }
  if (target.page && disabledPages.includes(target.page)) {
    return { type: 'notice', message: '정적 공개본에서는 사용할 수 없음' }
  }
  if (target.entryPath) return { type: 'link' }
  return { type: 'open', page: target.page }
}
