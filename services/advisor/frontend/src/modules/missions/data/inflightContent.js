/**
 * TKT-098 기내 콘텐츠 팩.
 * 전부 합성 학습 콘텐츠이며 실제 기관·장비의 운영 절차가 아니다.
 */

const readingSeeds = [
  ['ship-theseus', '테세우스의 배', '플루타르코스', '부품이 모두 바뀐 뒤에도 같은 배인가', '점진적 마이그레이션에서 정체성은 데이터와 계약이 지킨다'],
  ['silent-spring', '침묵의 봄', '레이첼 카슨', '국소 최적화가 생태계 전체에 지연된 비용을 만든다', '부작용은 호출부가 아니라 연결된 시스템에서 늦게 나타난다'],
  ['seeing-like-state', '국가처럼 보기', '제임스 C. 스콧', '측정 가능한 것만 남기면 현장의 맥락이 사라진다', '대시보드 한 숫자가 원시 이벤트의 다양성을 지우는 방식과 같다'],
  ['structure-revolutions', '과학혁명의 구조', '토머스 쿤', '이상 현상이 쌓이면 문제풀이의 틀 자체가 바뀐다', '패치가 반복되면 구현이 아니라 모델을 교체할 시점이다'],
  ['checklist', '체크리스트 선언', '아툴 가완디', '전문가는 기억력이 아니라 빠뜨리지 않는 구조로 일한다', '배포 체크리스트는 판단을 없애지 않고 판단할 여유를 만든다'],
  ['maps', '지도와 영토', '앨프리드 코르집스키', '표현은 현실이 아니며 언제나 일부를 버린다', 'DTO와 도메인 모델을 같은 것으로 착각하면 경계가 무너진다'],
  ['normal-accidents', '정상 사고', '찰스 페로', '복잡하게 결합된 시스템의 사고는 우연이 아니라 구조적 결과다', '독립 실패처럼 보이는 컴포넌트도 배포와 데이터에서 함께 묶인다'],
  ['scarcity', '결핍의 경제학', '센딜 멀레이너선', '부족함은 집중을 만들지만 주변 시야를 터널처럼 좁힌다', '장애 중 핫픽스가 복구만 보고 재발 방지와 관측을 놓치는 이유다'],
  ['black-box', '블랙박스 사회', '프랭크 파스콸레', '결정 규칙이 감춰질수록 책임을 묻기 어려워진다', '설명할 수 없는 자동 판정은 디버깅할 수 없는 프로덕션 코드다'],
  ['design-everyday', '일상의 디자인', '도널드 노먼', '실수는 사용자보다 행동을 유도한 설계에서 시작된다', '올바른 호출만 가능한 API가 경고문 많은 API보다 안전하다'],
  ['signal-noise', '신호와 소음', '네이트 실버', '예측은 확률이며 확신이 아니라 갱신의 과정이다', '알림 임계치는 참거짓 판정이 아니라 사전확률을 갱신하는 장치다'],
  ['turning-point', '전환점', '프리초프 카프라', '부분을 떼어 최적화하면 전체의 관계를 놓친다', '서비스 하나의 처리량보다 큐와 재시도의 피드백 고리를 봐야 한다'],
]

export const extraReadingCards = readingSeeds.map(([slug, bookTitle, author, insight, csLink], index) => ({
  id: `read-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
  emoji: ['🧭', '🌱', '🗺️', '🔭', '✅', '🧩', '⚙️', '⏳', '🔒', '🚪', '📡', '🕸️'][index],
  bookTitle,
  author,
  insight: `${insight}. 이 관점은 익숙한 결과를 개인의 실수로만 보지 않고, 결과를 반복해서 만드는 조건과 관계를 다시 보게 합니다.`,
  csLink: `${csLink}. 코드에서는 원인을 한 줄에서 찾기보다 입력·상태·시간·소유권의 연결을 따라가야 같은 실수를 줄일 수 있습니다.`,
  question: `지금 맡은 시스템에서 “${insight}”라는 렌즈로 다시 볼 결정 하나는 무엇입니까?`,
}))

const cinemaSeeds = [
  ['arrival', '컨택트', '시간을 다르게 읽는 언어를 배우는 순간', '이벤트 순서와 인과를 분리해 생각하는 분산 시스템'],
  ['moneyball', '머니볼', '스카우트의 직감과 낯선 지표가 충돌하는 회의', '관행을 대체하려면 지표의 정확도뿐 아니라 조직의 의사결정 경로도 바꿔야 한다'],
  ['spotlight', '스포트라이트', '흩어진 기록이 반복되는 구조를 드러내는 조사', '단건 로그보다 패턴과 누락을 함께 보는 관측가능성'],
  ['sully', '설리: 허드슨강의 기적', '시뮬레이션과 실제 판단의 시간 차이를 검증하는 장면', '사후 재현은 당시의 지연과 불확실성까지 모델링해야 공정하다'],
  ['her', '그녀', '인터페이스가 관계의 기대를 바꾸는 과정', '좋은 API는 기능뿐 아니라 사용자가 기대할 상호작용까지 설계한다'],
  ['minority-report', '마이너리티 리포트', '예측이 사람을 판정으로 밀어 넣는 장면', '확률 모델의 출력을 결정으로 바꿀 때 이의 제기와 감사 경로가 필요하다'],
  ['the-farewell', '페어웰', '같은 사실을 두고 가족 구성원이 다른 책임을 선택하는 순간', '정합성은 하나의 값보다 누가 언제 무엇을 알아야 하는지의 정책이다'],
  ['apollo11', '아폴로 11', '수많은 체크와 교신이 한 번의 착륙을 만드는 기록', '고신뢰 시스템은 영웅 한 명이 아니라 상태 전이와 확인 응답의 연쇄다'],
  ['parasite', '기생충', '보이지 않던 공간이 시스템의 흐름을 뒤집는 순간', '숨은 의존성은 평소엔 조용하다가 부하와 실패 때 아키텍처를 공개한다'],
  ['ford-ferrari', '포드 V 페라리', '조직의 승인 절차와 트랙의 피드백이 충돌하는 장면', '배포 속도는 빌드 시간뿐 아니라 승인 큐와 피드백 지연의 합이다'],
  ['perfect-days', '퍼펙트 데이즈', '매일 같은 루틴이 작은 차이를 받아들이는 방식', '멱등 작업은 반복 가능하지만 관측과 기록은 매 실행의 차이를 남겨야 한다'],
  ['first-man', '퍼스트맨', '시험 실패가 다음 설계의 입력이 되는 과정', '실패를 숨기지 않고 재현 가능한 학습 단위로 바꾸는 것이 회복력이다'],
]

export const extraCinemaCards = cinemaSeeds.map(([slug, filmTitle, scene, systemReading], index) => ({
  id: `film-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
  emoji: ['🌀', '⚾', '📰', '✈️', '🎧', '🔮', '🤝', '🌕', '🏚️', '🏁', '🧹', '🚀'][index],
  filmTitle,
  scene: `${scene}. 인물은 완전한 정보가 아니라 제한된 시간과 서로 다른 이해관계 속에서 다음 행동을 정합니다.`,
  systemReading: `${systemReading}. 장면을 시스템으로 읽으면 성공은 결과 하나가 아니라, 잘못됐을 때 멈추고 되돌아갈 수 있는 경로까지 포함합니다.`,
  question: `이 장면의 선택을 현재 시스템의 설계 리뷰 질문 하나로 바꾸면 무엇입니까?`,
}))

const swipeTopics = [
  ['예약 취소 이벤트를 두 번 받아도 같은 상태로 끝난다', 'cancel-event', 'merge', '정확성'],
  ['외부 결제 타임아웃을 즉시 실패로 저장한다', 'payment-timeout', 'reject', '정확성'],
  ['캐시 키에 사용자 권한 버전을 포함한다', 'permission-cache', 'merge', '계약'],
  ['재시도 횟수가 설정 없이 무한 반복된다', 'infinite-retry', 'reject', '운영'],
  ['페이지 크기 상한을 API 계약으로 검증한다', 'page-limit', 'merge', '계약'],
  ['로그에 요청 본문 전체를 남긴다', 'body-log', 'reject', '운영'],
  ['배치 갱신을 500건 청크와 체크포인트로 나눈다', 'batch-chunk', 'merge', '운영'],
  ['실패를 catch하고 성공 응답을 반환한다', 'swallow-error', 'reject', '계약'],
  ['시간 비교에 주입 가능한 Clock을 쓴다', 'clock', 'merge', '가독성'],
  ['정렬 조건 없이 첫 행을 최신값으로 간주한다', 'unordered-first', 'reject', '정확성'],
  ['파일 업로드 확장자와 실제 MIME을 함께 확인한다', 'mime', 'merge', '계약'],
  ['관리자 기능을 화면에서만 숨긴다', 'ui-auth', 'reject', '정확성'],
  ['이벤트에 스키마 버전과 발생 시각을 넣는다', 'event-version', 'merge', '계약'],
  ['공유 가변 목록을 그대로 반환한다', 'mutable-list', 'reject', '가독성'],
  ['락 획득 실패를 지터가 있는 제한 재시도로 처리한다', 'lock-jitter', 'merge', '운영'],
  ['요청마다 새 스레드 풀을 만든다', 'thread-pool', 'reject', '운영'],
  ['금액을 소수점이 아닌 최소 통화 단위 정수로 저장한다', 'money-unit', 'merge', '정확성'],
  ['모르는 enum 값을 기본 승인으로 바꾼다', 'enum-default', 'reject', '계약'],
  ['삭제 API에 멱등 의미를 문서화하고 구현한다', 'delete-idempotent', 'merge', '계약'],
  ['서킷 브레이커와 호출 타임아웃이 같은 값이다', 'breaker-window', 'question', '운영'],
  ['트랜잭션 밖에서 outbox 이벤트를 저장한다', 'outbox-outside', 'reject', '정확성'],
  ['비교 대상 문자열을 정규화한 뒤 식별자를 만든다', 'normalize-id', 'merge', '정확성'],
  ['모든 예외를 400으로 번역한다', 'all-400', 'reject', '계약'],
  ['낮은 트래픽 API에 복잡한 분산 락을 먼저 도입한다', 'premature-lock', 'question', '지금은 아님'],
]

export const extraSwipeCards = swipeTopics.map(([title, slug, correct, correctToken], index) => ({
  id: `swipe-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
  title,
  code: `// PR #${410 + index}\nResult handle(Request request) {\n    return policy.${slug.replaceAll('-', '_')}(request);\n}`,
  correct,
  correctToken,
  explain: correct === 'merge'
    ? `${title}. 경계 조건을 호출자의 기억에 맡기지 않고 코드와 계약에 올렸습니다. 정상 경로뿐 아니라 반복 실행과 실패 뒤 상태도 예측 가능합니다.`
    : correct === 'reject'
      ? `${title}. 평상시에는 통과할 수 있지만 실패·재시도·권한 경계에서 계약을 깨뜨립니다. 운영에서 되돌릴 수 있는 실패로 바꾸는 보완이 필요합니다.`
      : `${title}. 입력 규모와 장애 예산이 없으면 판정을 확정할 수 없습니다. 처리량, 실패 비용, 되돌리기 경로를 먼저 질문한 뒤 선택하세요.`,
}))

const probeSeeds = [
  ['cold-start', '배포 직후 첫 요청만 8초', '워밍업', '첫 요청 트레이스에서 초기화 구간을 본다'],
  ['duplicate-mail', '일부 고객에게 메일이 두 통', '재전송', '메시지 ID별 소비 횟수를 센다'],
  ['night-latency', '매일 02시에 검색 지연', '공유자원', '같은 시간대 배치와 I/O 대기를 겹쳐 본다'],
  ['one-region', '한 리전만 결제 실패', '설정차이', '리전별 설정 해시를 비교한다'],
  ['large-cart', '장바구니가 클 때만 주문 실패', '크기경계', '품목 수별 응답과 쿼리 수를 그린다'],
  ['stale-role', '권한 변경이 10분 늦게 반영', '캐시', '토큰·캐시 TTL과 변경 시각을 대조한다'],
  ['mobile-loop', '모바일만 로그인 루프', '쿠키정책', '리다이렉트별 쿠키 전송 여부를 본다'],
  ['month-end', '월말 집계가 두 배', '중복실행', '잡 실행 ID와 대상 키를 교차 집계한다'],
  ['unicode-name', '특정 이름만 가입 실패', '정규화', '실패 문자열의 코드포인트를 비교한다'],
  ['slow-delete', '삭제 요청만 점점 느려짐', '연쇄삭제', '삭제 한 건의 잠금과 자식 행 수를 본다'],
  ['missing-metric', '성공률 100%인데 민원 증가', '분모오류', '클라이언트 취소 요청도 분모에 넣어 본다'],
  ['clock-skew', '미래 시각 이벤트가 먼저 처리됨', '시계차이', '생성 노드별 시계 오프셋을 확인한다'],
]

export const extraProbeRounds = probeSeeds.map(([slug, title, answerKey, best], index) => ({
  id: `probe-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
  emoji: ['🥶', '✉️', '🌙', '🌍', '🛒', '🔑', '📱', '📅', '🔤', '🗑️', '📊', '⏱️'][index],
  title,
  situation: `${title}. 평균 지표는 정상이고 재현 조건이 아직 분명하지 않습니다. 단 한 번의 관측으로 다음 조사 범위를 가장 크게 줄여야 합니다.`,
  hypotheses: [
    { key: answerKey, label: `${answerKey} 가설` },
    { key: 'network', label: '네트워크 품질 가설' },
    { key: 'user', label: '사용자 조작 가설' },
  ],
  probes: [
    { key: 'best', label: best, result: `${answerKey} 가설과 정확히 일치하는 패턴이 확인됐습니다.`, eliminates: ['network', 'user'], infoNote: '현상을 가르는 축을 직접 측정해 가장 많은 가설을 제거했습니다.' },
    { key: 'restart', label: '일단 인스턴스를 재시작한다', result: '잠시 조용해졌지만 재현 조건은 남았습니다.', eliminates: [], infoNote: '증상 완화는 관측이 아닙니다. 원인 후보를 줄이지 못했습니다.' },
    { key: 'ask', label: '최근 사용자 한 명에게 다시 시도해 달라고 한다', result: '같은 실패가 반복됐지만 공통 조건은 알 수 없습니다.', eliminates: ['user'], infoNote: '사용자 실수는 약해졌지만 시스템 가설을 구분하지 못했습니다.' },
  ],
  answerKey,
  bestProbeKey: 'best',
  resolution: `${best}라는 관측이 ${answerKey}를 드러냈습니다. 평균을 다시 보는 대신 실패 집단을 나누는 기준을 찾는 것이 이번 판의 핵심입니다.`,
}))

const boundarySeeds = [
  ['cold-chain', '백신 냉장 운송', ['센서 수신', '이상 판정', '격리 지시', '감사 기록']],
  ['water', '정수장 투입 제어', ['수질 측정', '약품 계산', '펌프 명령', '운영 기록']],
  ['museum', '박물관 대여 승인', ['상태 확인', '보험 예약', '운송 승인', '목록 공개']],
  ['fab', '반도체 웨이퍼 공정', ['레시피 잠금', '장비 실행', '측정 반영', '수율 집계']],
  ['wildfire', '산불 대피소 배정', ['수용 확인', '자리 예약', '이동 안내', '가족 통지']],
  ['greenhouse', '온실 관수 자동화', ['습도 읽기', '관수 결정', '밸브 명령', '사용량 기록']],
  ['library', '도서관 상호대차', ['재고 예약', '운송 요청', '도착 확인', '알림']],
  ['harbor', '항만 컨테이너 반출', ['권한 확인', '게이트 승인', '반출 기록', '세관 통지']],
  ['energy', '마이크로그리드 정산', ['계량 수집', '사용량 확정', '요금 반영', '명세 발행']],
  ['rescue', '해상 구조 출동', ['신고 접수', '선박 배정', '출동 명령', '상황 전파']],
]

export const extraBoundaryRounds = boundarySeeds.map(([slug, title, flow], index) => {
  const boundaries = [
    { key: 'all', label: '전 과정을 하나로 묶는다', grouping: `[${flow.join(' + ')}]` },
    { key: 'truth-first', label: '사실 기록을 먼저 확정하고 외부 행동은 재시도한다', grouping: `[${flow[0]} + ${flow[1]}] / [${flow[2]}] / [${flow[3]}]` },
    { key: 'async-all', label: '모두 비동기로 흩어 보낸다', grouping: flow.map((step) => `[${step}]`).join(' / ') },
  ]
  return {
    id: `boundary-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
    emoji: ['🧊', '💧', '🏛️', '💿', '🔥', '🌿', '📚', '⚓', '⚡', '🛟'][index],
    title,
    situation: `${title}의 네 단계를 설계합니다. 외부 장치나 기관은 느리거나 응답 없이 성공할 수 있고, 사실 기록은 유실되면 안 됩니다.`,
    flow,
    failureAt: `${flow[2]} 단계가 타임아웃되어 실행 여부를 바로 알 수 없습니다.`,
    boundaries,
    outcomes: {
      all: { kept: '한 요청처럼 보이는 단순함', lost: '외부 세계는 데이터베이스 롤백을 따르지 않습니다.', scenario: '내부 기록은 되돌렸지만 외부 행동은 이미 실행되어 진실이 둘로 갈렸습니다.' },
      'truth-first': { kept: '사실과 의도를 먼저 남기고 멱등 재시도로 수렴합니다.', lost: '처리 중 상태와 보상 운영이 필요합니다.', scenario: '타임아웃 뒤에도 같은 작업 키로 결과를 확인해 중복 없이 마무리했습니다.' },
      'async-all': { kept: '각 단계의 순간 응답성', lost: '단계 사이 순서와 책임 주체가 사라집니다.', scenario: '마지막 알림은 왔지만 실제 행동과 감사 기록의 순서가 뒤집혔습니다.' },
    },
    recommendedKey: 'truth-first',
    recommendNote: '외부 성공 여부를 모를 때 롤백으로 사실을 지우지 않습니다. 의도와 상태를 먼저 확정하고 멱등키로 수렴하는 경계가 가장 작은 불확실성을 남깁니다.',
  }
})

const caseSeeds = [
  ['cold-room', '얼지 않은 백신', '이중 단위 변환', '센서 값은 정상인데 일부 상자만 효능 검사가 실패한다'],
  ['museum-light', '밤마다 밝아지는 전시실', '예약 작업의 시간대', '폐관 뒤 조명이 켜져 민감한 작품의 누적 노출이 늘어난다'],
  ['fab-queue', '사라진 웨이퍼 17장', '재처리 큐 멱등성', '재공품 목록과 실제 장비 투입 수가 하루마다 벌어진다'],
  ['shelter-map', '지도에는 빈 대피소', '지연 복제본', '현장에서는 만석인데 안내 앱은 계속 자리가 있다고 말한다'],
  ['greenhouse-rain', '비 오는 날의 관수', '날씨 이벤트 순서', '비가 온 직후에도 자동 관수가 가장 오래 실행된다'],
  ['water-alarm', '조용한 탁도 경보', '집계 분모 누락', '민원은 늘지만 운영 화면의 정상률은 100%다'],
]

export const extraCaseFiles = caseSeeds.map(([slug, title, rootCause, tagline], index) => ({
  id: `case-flight-${String(index + 1).padStart(2, '0')}-${slug}`,
  emoji: ['🧪', '💡', '🔬', '🗺️', '🌧️', '🚰'][index],
  title,
  tagline,
  intro: `${tagline}. 닷새 동안 서로 다른 종류의 증거를 열어, 눈에 띄는 현상과 반복을 만든 구조를 구분하세요.`,
  days: [
    { day: 1, kind: '현장 기록', title: '처음 발견된 패턴', content: `피해는 무작위처럼 보이지만 같은 조건에서 반복됩니다. ${tagline}. 정상 집단과 실패 집단을 나눌 축이 필요합니다.` },
    { day: 2, kind: '지표', title: '평균 아래의 두 집단', content: '전체 평균은 허용 범위지만 실패 집단만 분리하면 임계값을 계속 넘습니다. 집계가 사건을 숨기고 있었습니다.' },
    { day: 3, kind: '변경 이력', title: '사건 전날의 작은 배포', content: `사건 전날 변환·스케줄·큐 처리 중 하나가 교체됐습니다. 배포는 성공했지만 이전 데이터와 함께 동작하는 검증은 없었습니다.` },
    { day: 4, kind: '로그', title: '두 번 기록된 하나의 작업', content: `같은 대상 키가 서로 다른 실행 ID로 처리됐습니다. 경고는 있었지만 작업은 모두 성공으로 종료됐습니다.` },
    { day: 5, kind: '코드', title: '근본 원인의 모양', content: `경계 값을 변환하거나 재시도하는 코드에 원본 단위·멱등키·이벤트 순서 검증 중 하나가 빠져 있습니다. 이번 사건의 지문은 “${rootCause}”입니다.` },
  ],
  finale: {
    question: '반복되는 사건의 근본 원인은 무엇입니까?',
    options: [
      { key: 'root', label: rootCause },
      { key: 'traffic', label: '일시적인 트래픽 증가' },
      { key: 'operator', label: '현장 담당자의 단순 조작 실수' },
      { key: 'network', label: '원인 불명의 네트워크 지연' },
    ],
    answerKey: 'root',
    explanation: `정답은 ${rootCause}입니다. 현장·지표·변경·로그·코드는 모두 같은 조건에서 반복되는 구조를 가리킵니다. 나머지 후보는 증상을 설명하지만 동일 대상의 반복 패턴을 설명하지 못합니다.`,
    epilogue: `수정 뒤에는 실패 집단을 따로 보는 지표와 재현 테스트가 추가됐습니다. 이 사건은 합성 훈련 시나리오이며 실제 시설의 운영 지침이 아닙니다.`,
  },
}))

const gameSeeds = {
  'minimal-repro': [
    ['빈 목록에서만 합계가 NaN', '입력을 0개와 1개로 줄이고 초기값 유무를 비교한다'],
    ['윤년 2월 29일 예약 실패', '날짜·시간대·예약 종류 중 하나씩 고정해 날짜 경계를 남긴다'],
    ['이모지가 든 이름만 잘림', '문자열을 한 코드포인트와 한 결합문자로 줄여 바이트/문자 길이를 비교한다'],
    ['세 번째 재시도부터 중복 결제', '외부 변수를 제거하고 동일 멱등키의 요청 횟수만 바꾼다'],
    ['정렬이 가끔 뒤집힘', '동점 두 행과 정렬 키 하나만 남겨 안정 정렬 여부를 확인한다'],
    ['큰 파일의 마지막 줄 누락', '청크 경계 직전·정확히 경계·직후 세 크기로 줄인다'],
    ['DST 전환일 배치가 두 번', '스케줄러 하나와 시간대 하나로 줄여 같은 현지 시각을 재현한다'],
    ['권한 변경 뒤 이전 화면 노출', '사용자 하나·역할 두 개·캐시 한 계층만 남긴다'],
  ],
  'concurrency-sequencing': [
    ['재고 1개에 주문 두 건', '원자적 조건 갱신으로 승자를 한 건만 만든다'],
    ['프로필 수정 이벤트 역전', '엔티티 버전을 비교해 오래된 이벤트를 버린다'],
    ['두 탭에서 같은 쿠폰 사용', '쿠폰 ID의 유일 제약을 최종 판정자로 둔다'],
    ['리더 교체 중 시퀀스 중복', '임기 번호와 로컬 순번을 함께 비교한다'],
    ['업로드 완료 전에 스캔 시작', '완료 이벤트가 임시 객체가 아닌 확정 객체를 가리키게 한다'],
    ['환불과 배송 확정 경합', '상태 전이 조건을 저장소에서 비교 후 갱신한다'],
    ['댓글 삭제 뒤 늦은 수정', '삭제 표식 버전보다 낮은 수정 이벤트를 무시한다'],
    ['월말 집계와 정정 동시 실행', '스냅샷 시점과 정정 반영 차수를 명시한다'],
  ],
  bulkheads: [
    ['썸네일 장애가 상품 API를 고갈', '이미지 호출의 풀과 타임아웃을 상품 조회에서 분리한다'],
    ['메일 지연이 회원가입 응답을 막음', '가입 확정 뒤 outbox로 메일 작업을 격리한다'],
    ['한 고객의 대형 리포트가 전체 큐 점유', '고객별 동시성 상한과 별도 대형 작업 큐를 둔다'],
    ['추천 모델 오류가 홈 전체를 실패', '추천 영역을 실패 가능한 선택 컴포넌트로 둔다'],
    ['느린 파트너가 모든 HTTP 연결 점유', '파트너별 연결 풀과 회로 차단기를 둔다'],
    ['감사 로그 저장소 장애가 결제를 중단', '로컬 내구 큐에 필수 감사 이벤트를 먼저 기록한다'],
    ['백오피스 검색이 주 DB CPU를 소진', '읽기 복제본과 쿼리 예산으로 경계를 긋는다'],
    ['한 리전 재시도가 다른 리전까지 증폭', '리전별 재시도 예산과 전역 상한을 함께 둔다'],
  ],
}

const gameMeta = {
  'minimal-repro': { title: '최소 재현 실험실', emoji: '🧫', minutes: 4 },
  'concurrency-sequencing': { title: '동시성 순서 맞추기', emoji: '🧵', minutes: 5 },
  bulkheads: { title: '벌크헤드 설계실', emoji: '🚪', minutes: 5 },
}

export const newGameCatalog = Object.entries(gameSeeds).map(([id, seeds]) => ({
  id,
  ...gameMeta[id],
  description: id === 'minimal-repro' ? '변수를 덜어 실패를 재현 가능한 한 조각으로 만듭니다.' : id === 'concurrency-sequencing' ? '경합하는 두 사건의 최종 판정자를 고릅니다.' : '한 실패가 자원 전체를 삼키지 못하도록 격리합니다.',
  rounds: seeds.map(([title, recommended], index) => ({
    id: `${id}-${String(index + 1).padStart(2, '0')}`,
    title,
    domain: ['결제', '예약', '콘텐츠', '물류'][index % 4],
    minutes: gameMeta[id].minutes,
    situation: `${title}. 정상 경로는 통과하지만 경계 조건에서만 반복되는 합성 장애 상황입니다.`,
    prompt: id === 'minimal-repro' ? '가장 작은 재현 실험은 무엇입니까?' : id === 'concurrency-sequencing' ? '순서를 보장할 최종 판정자는 무엇입니까?' : '어디에 자원 경계를 세우겠습니까?',
    choices: [
      { key: 'recommended', label: recommended, immediate: '관측할 변수가 줄고 실패 경계가 명확해집니다.', aftermath: '같은 조건을 자동 테스트와 운영 지표로 옮길 수 있습니다.' },
      { key: 'restart', label: '전체 시스템을 재시작해 다시 본다', immediate: '증상이 잠시 사라질 수 있습니다.', aftermath: '재현 조건과 자원 경계가 남아 다음 피크에 반복됩니다.' },
      { key: 'global', label: '모든 요청을 하나의 전역 락으로 감싼다', immediate: '경합은 줄지만 처리량도 함께 사라집니다.', aftermath: '병목과 단일 장애점이 새 근본 원인이 됩니다.' },
    ],
    recommendedKey: 'recommended',
    explanation: `${recommended}. 이번 판은 정답 암기보다 실패를 작고 관측 가능하며 되돌릴 수 있는 범위로 만드는 연습입니다.`,
  })),
}))

const missionSeeds = [
  { slug: 'cold-chain', domain: '콜드체인', emoji: '🧊', difficulty: 'Easy', title: '백신 상자의 마지막 온도', noun: 'Shipment', rule: '섭씨 센서 값과 허용 노출 시간을 함께 판정한다' },
  { slug: 'water-treatment', domain: '정수 처리', emoji: '🚰', difficulty: 'Easy', title: '탁도 경보가 놓친 3분', noun: 'WaterSample', rule: '연속 표본과 결측을 구분해 경보 상태를 전이한다' },
  { slug: 'museum-loan', domain: '박물관 소장품 대여', emoji: '🏛️', difficulty: 'Normal', title: '작품은 떠나도 책임은 남는다', noun: 'LoanRequest', rule: '보험·환경·운송 승인을 독립 조건으로 검토한다' },
  { slug: 'semiconductor-fab', domain: '반도체 팹', emoji: '💿', difficulty: 'Normal', title: '웨이퍼 재처리의 한 번뿐인 기회', noun: 'WaferLot', rule: '공정 순서와 재처리 횟수를 상태 기계로 제한한다' },
  { slug: 'wildfire-shelter', domain: '산불 대피소', emoji: '🔥', difficulty: 'Hard', title: '지도보다 먼저 차는 대피소', noun: 'ShelterAssignment', rule: '예약·입소·이동 중 상태와 수용량 경합을 안전하게 처리한다' },
  { slug: 'greenhouse-control', domain: '스마트 온실', emoji: '🌿', difficulty: 'Hard', title: '비가 오는데 밸브가 열린 이유', noun: 'IrrigationPlan', rule: '센서 시각·예보·수동 우선권을 결정 규칙으로 합성한다' },
]

export const extraMissions = missionSeeds.map((seed, index) => ({
  id: `flight-${seed.slug}-01`,
  stage: index + 1,
  stageTitle: ['읽는 눈', '경계 찾기', '규칙 세우기', '레거시 길들이기', '거대한 구조', '운영의 시간'][index],
  missionType: ['코드 판독', '설계 리뷰', '도메인 로직 구현', '기능 추가', '도메인 로직 구현', '기능 추가'][index],
  difficulty: seed.difficulty,
  scope: index < 2 ? '단일 파일' : index < 4 ? '여러 파일' : '모듈 경계',
  modes: ['developer', 'plannerReview'],
  providedFiles: [],
  domain: seed.domain,
  domainEmoji: seed.emoji,
  emoji: seed.emoji,
  title: seed.title,
  estimatedMinutes: 45 + index * 15,
  briefing: {
    title: `${seed.domain} 시스템을 코드로 읽기`,
    content: `이 미션은 **합성 학습 시나리오**입니다. 실제 ${seed.domain} 시설의 운영·안전 지침이 아닙니다.\n\n먼저 레거시 코드를 읽고 암묵 규칙을 표시한 뒤, 변경 설계를 검토하고 실제 코드를 수정합니다. 핵심 규칙은 “${seed.rule}”입니다.`,
  },
  scenario: `${seed.domain} 운영팀이 예외가 늘어난 기존 판정기를 고쳐 달라고 요청했습니다. 정상 입력의 결과는 유지하면서 경계 입력, 중복 요청, 늦게 도착한 데이터가 안전한 결과로 수렴해야 합니다.`,
  legacyFiles: [{
    path: `src/main/java/training/${seed.noun}.java`,
    content: `package training;\n\n// 합성 훈련 코드 — 실제 ${seed.domain} 운영에 사용하지 마세요.\npublic class ${seed.noun} {\n    public String decide(int value, long observedAt) {\n        if (value > 10) return "WARN";\n        return "OK";\n    }\n}`,
  }],
  requirements: [
    `코드 판독: 현재 구현이 숨기고 있는 ${seed.domain} 가정 세 가지를 변경 요약에 적으세요.`,
    `설계 리뷰: “${seed.rule}” 규칙의 입력·상태·실패 경계를 표로 정리하세요.`,
    `실제 수정: ${seed.noun}의 공개 진입점을 보존하면서 경계 조건과 중복/지연 입력을 처리하세요.`,
    '정상·경계·실패·반복 실행을 포함한 자동 테스트를 추가하세요.',
  ],
  constraints: ['외부 서비스 없이 실행되어야 합니다.', '실제 기관 데이터·연락처·운영 수치를 사용하지 않습니다.', '공개 메서드 시그니처는 유지합니다.'],
  learningGoals: ['레거시 코드에서 암묵 규칙 찾기', '도메인 규칙과 기술 실패를 분리하기', '반복 실행에도 안전한 상태 전이 설계하기'],
  hints: ['정상 사례를 특성화 테스트로 먼저 고정하세요.', '시간과 단위는 원시 숫자 대신 이름 있는 값으로 감싸세요.', '모르는 상태를 성공이나 실패로 성급히 번역하지 마세요.'],
  hiddenCases: [{ title: '같은 입력 재전송', description: '동일 식별자의 요청이 두 번 들어와도 결과와 부수효과가 하나인지 확인합니다.' }, { title: '늦은 관측', description: '더 오래된 observedAt이 최신 상태를 덮지 않는지 확인합니다.' }],
  rubric: [
    { name: '기존 동작 보존', description: '특성화 테스트로 정상 경로를 지켰는가.', weight: 20, visibleToLearner: true },
    { name: '경계 모델링', description: '단위·시간·상태 경계가 코드에 드러나는가.', weight: 30, visibleToLearner: true },
    { name: '실패 안전성', description: '중복과 지연 입력이 안전하게 수렴하는가.', weight: 30, visibleToLearner: true },
    { name: '설명', description: '운영자가 변경 이유와 한계를 이해할 수 있는가.', weight: 20, visibleToLearner: true },
  ],
  plannerReview: {
    brief: `${seed.domain} 변경 요청을 개발하지 않는 선택까지 포함해 검토하세요. 이 콘텐츠는 합성 훈련 자료이며 실제 안전 판단을 대체하지 않습니다.`,
    dimensions: [
      { name: '안전', question: '잘못된 자동 판정보다 보수적 중단이 나은 경계는 어디입니까?' },
      { name: '운영', question: '사람이 개입해야 하는 상태와 책임 주체가 명시됐습니까?' },
      { name: '데이터', question: '단위·시각·출처·신선도를 검증할 수 있습니까?' },
      { name: '제품', question: '코드 변경 없이 절차나 화면 고지로 줄일 위험은 무엇입니까?' },
    ],
    deliverable: '① 현재 가정 ② 옵션 3개(개발하지 않는 옵션 포함) ③ 안전·운영·데이터·제품 트레이드오프 ④ 권고안과 되돌리기 조건을 작성하세요.',
  },
  explainTask: { audience: `${seed.domain} 현장 담당자`, prompt: '바뀐 판정 규칙, 자동화가 멈추는 조건, 사람이 확인할 내용을 기술 용어 없이 설명하세요.' },
  endings: [
    { grade: 'calm', title: '확인 가능한 자동화', teaser: '자동 판정과 사람의 확인 경계가 기록으로 남습니다.' },
    { grade: 'hotfix', title: '경고는 늘었지만', teaser: '예외는 막았으나 규칙이 다시 한 분기 안에 숨어듭니다.' },
    { grade: 'dawn', title: '단위 없는 숫자', teaser: '정상처럼 보인 입력 하나가 오래된 상태를 덮습니다.' },
    { grade: 'hidden', title: '???', teaser: '반복 실행의 진짜 결말은 아직 공개되지 않았습니다.' },
  ],
}))

export const inflightUnitCount =
  extraReadingCards.length + extraCinemaCards.length + extraSwipeCards.length +
  extraProbeRounds.length + extraBoundaryRounds.length + extraCaseFiles.flatMap((caseFile) => caseFile.days).length +
  newGameCatalog.reduce((sum, game) => sum + game.rounds.length, 0) + extraMissions.length
