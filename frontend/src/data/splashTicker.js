// 스플래시 티커 멘트 풀 (TKT-186). 원문은 PM 지정 콘텐츠 — 문구를 바꾸거나 더하고 빼지 않는다.
// App.vue 의 회전 로직과 splashTone.e2e.mjs 가 같은 배열을 쓴다.
export const SPLASH_TICKER_POOL = Object.freeze([
  '에스컬레이터 방향 다수결로 정하는 중…',
  '지연 시간을 정성껏 반올림하는 중…',
  '출구 번호에 서열 매기는 중…',
  '계단과 에스컬레이터 화해시키는 중…',
  '손잡이 높이 만장일치로 조정하는 중…',
  '환승 저항을 0에 수렴시키는 중…',
  '첫차의 각오를 백업하는 중…',
  '노란 안전선 자존감 챙기는 중…',
  '막차 놓친 사람 위로 캐시 불러오는 중…',
  '냉방 온도 만장일치로 정하는 중…',
  '갈아타기 최단경로가 삐지지 않게 계산하는 중…',
  '승객들의 한숨을 열차 추진력으로 재활용하는 중…',
  '오늘 치 무표정을 표준 규격에 맞추는 중…',
  '지하철 손잡이 악력 등급 매기는 중…',
  '안내방송 성우에게 따뜻한 차 대접하는 중…',
  '노선 색깔끼리 안 싸우게 중재하는 중…',
  '엘리베이터에게 오늘 기분 물어보는 중…',
  '교통카드 잔액에 위로 건네는 중…',
  '개찰구에 오늘의 운세 심는 중…',
  '관리자 몰래 내맘대로 홈페이지 로딩하는 중.',
  '월요일의 사기를 롤백하는 중…',
  '오늘의 의욕을 절전 모드에서 깨우는 중…',
  '잔소리를 캐시에서 비우는 중…',
  '참을성 잔액을 조회하는 중…',
  '어제의 후회를 아카이브로 옮기는 중…',
  '점심 메뉴 결정권을 위임하는 중…',
  '침묵의 어색함을 반올림하는 중…',
  '오후 3시의 나른함을 격리하는 중…',
  '미룬 일들의 대기표를 재정렬하는 중…',
  '양심의 알림을 스누즈하는 중…',
  '표정 관리 모듈을 재기동하는 중…',
  '금요일의 설렘을 미리 당겨 쓰는 중…',
  '게으름에게 정당한 사유를 부여하는 중…',
  '눈꺼풀의 중력을 재협상하는 중…',
  '딴생각의 트래픽을 분산하는 중…',
  '하품의 도미노를 진압하는 중…',
  '실없는 농담의 품질을 검수하는 중…',
  '결심의 롤백 지점을 저장하는 중…',
  '직장인들 화가 취미로 오르는 중…'
])

// 다음 티커 문구를 고른다. 직전 문구(previous)와 이번 방문에 이미 나온 문구(shown, Set)는 제외하고,
// 후보가 바닥나면 shown 을 비워 다시 시작한다(그래도 직전 문구는 제외). 고른 문구는 shown 에 더한다.
export function pickSplashTicker(previous, shown, random = Math.random) {
  let candidates = SPLASH_TICKER_POOL.filter((message) => message !== previous && !shown.has(message))
  if (candidates.length === 0) {
    shown.clear()
    candidates = SPLASH_TICKER_POOL.filter((message) => message !== previous)
  }
  const message = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))]
  shown.add(message)
  return message
}
