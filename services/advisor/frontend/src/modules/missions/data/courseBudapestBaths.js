/**
 * Developer Advisor — 코스 "부다페스트 온천 큐"
 * 이 파일은 학습용 근사 데이터다. 실제 온천 운영 절차·혼잡 예측·여행 지침으로 사용하지 않는다.
 * 사실값은 [확인], 시뮬레이션용 수치와 비용은 [학습용]으로 구분했다. 확인일: 2026-09-15.
 * 공식 출처: szechenyibath.hu/pools, /bath-units, /prices, /faq, /water-composition
 *           bkk.hu/en/travel-information/special-and-heritage-transport-services/funicular/
 */

export const courseBudapestBaths = {
  id: 'budapest-baths',
  title: '부다페스트 온천 큐',
  subtitle: '따뜻한 물 앞에서 줄은 왜 생기나',
  theme: '대기열 · 용량 · 경로',
  emoji: '♨️',
  intro: '세체니 온천의 아침 입장부터 풀 혼잡, 표 선택, 이용 예절, 물 성분, 부다 왕궁 오르막까지. 여행자가 마주치는 여섯 장면을 큐와 제약 조건으로 다시 읽는 짧은 코스입니다.',
  spine: ['budapest-1-morning-entry', 'budapest-2-pool-load', 'budapest-3-ticket-plan'],
  applied: ['budapest-4-etiquette', 'budapest-5-water-signal', 'budapest-6-castle-route'],
  missions: [
    { id: 'budapest-1-morning-entry', kind: 'sim', title: '08–09시 입장 큐', minutes: 30 },
    { id: 'budapest-2-pool-load', kind: 'coding', title: '16개 풀의 시간대 혼잡', minutes: 80 },
    { id: 'budapest-3-ticket-plan', kind: 'coding', title: '라커·캐빈·패스트트랙 선택', minutes: 70 },
    { id: 'budapest-4-etiquette', kind: 'game', format: 'swipe', title: '온천 이용 예절 15장', minutes: 20 },
    { id: 'budapest-5-water-signal', kind: 'game', format: 'probe', title: '물 성분 가설 좁히기', minutes: 20 },
    { id: 'budapest-6-castle-route', kind: 'coding', title: '푸니쿨라 vs 도보 경로', minutes: 80 },
  ],
}

// [확인] P1–P16의 온도·용도. capacity와 arrivalWeight는 비교 실습을 위한 [학습용] 근사값이다.
const poolsCsv = `pool,zone,type,tempMinC,tempMaxC,trainingCapacity,arrivalWeight,note
P1,실내,열탕,28,28,24,0.45,[확인] 온도; [학습용] 용량
P2,실내,열탕,30,30,24,0.52,[확인] 온도; [학습용] 용량
P3,실내,열탕,32,32,28,0.62,[확인] 온도; [학습용] 용량
P4,실내,열탕,34,34,28,0.76,[확인] 온도; [학습용] 용량
P5,실내,열탕,36,36,30,0.88,[확인] 온도; [학습용] 용량
P6,실내,열탕,38,38,26,0.95,[확인] 온도; [학습용] 용량
P7,실내,열탕,40,40,20,0.72,[확인] 온도; [학습용] 용량
P8,실내,열탕,34,34,24,0.68,[확인] 온도; [학습용] 용량
P9,실내,열탕,36,36,24,0.73,[확인] 온도; [학습용] 용량
P10,실내,열탕,38,38,22,0.81,[확인] 온도; [학습용] 용량
P11,실내,열탕,40,40,20,0.66,[확인] 온도; [학습용] 용량
P12,실내,냉탕,20,20,16,0.32,[확인] 온도; [학습용] 용량
P13,실내,침수탕,18,18,12,0.25,[확인] 온도; [학습용] 용량
P14,야외,수영,26,28,80,0.70,[확인] 온도; [학습용] 용량
P15,야외,액티비티,30,34,110,1.00,[확인] 온도; [학습용] 용량
P16,야외,열탕,38,38,70,0.98,[확인] 온도; [학습용] 용량`

// [확인] 2026-09-15 공식 가격표 스냅샷. 실제 구매 전 현재 가격을 다시 확인해야 한다.
const ticketOptionsCsv = `option,dayType,priceHuf,storage,entryLane,trainingWaitMin,note
daily-locker,weekday,13200,locker,standard,18,[확인] 가격; [학습용] 대기
daily-cabin,weekday,14200,cabin,standard,20,[확인] 캐빈 +1000 HUF; [학습용] 대기
fast-locker,weekday,15200,locker,fast,7,[확인] 가격; [학습용] 대기
daily-locker,weekend,14800,locker,standard,24,[확인] 가격; [학습용] 대기
daily-cabin,weekend,15800,cabin,standard,26,[확인] 캐빈 +1000 HUF; [학습용] 대기
fast-locker,weekend,16800,locker,fast,9,[확인] 가격; [학습용] 대기`

// [확인] 푸니쿨라 선로 95m·고저차 50m·운행 약 95초. 나머지 비용은 [학습용] 가중치다.
const castleRoutesCsv = `from,to,mode,distanceM,elevationM,timeMin,moneyHuf,crowdCost,note
Clark Adam tér,Castle station,funicular,95,50,1.58,5000,6,[확인] 거리·고저차·시간; [학습용] 가격·혼잡
Clark Adam tér,Castle gate,walk,650,50,13,0,3,[학습용] 도보 경로
Castle gate,Palace courtyard,walk,240,8,5,0,1,[학습용] 도보 경로
Castle station,Palace courtyard,walk,180,2,4,0,1,[학습용] 도보 경로`

const ENDING = [{ key: 'clean', title: '줄이 숫자로 보였다', text: '한 번의 정답 대신, 예산·시간·불확실성을 함께 보여 주는 작은 결정표가 남았습니다.' }]

export const budapestBathsCodingMissions = [
  {
    id: 'budapest-2-pool-load', stage: 1, stageTitle: '온천 안의 흐름', missionType: '데이터 분석', difficulty: 'Normal',
    scope: '단일 모듈 + CSV', modes: ['developer'], domain: '여행 운영', domainEmoji: '🌡️', title: '16개 풀의 시간대 혼잡', estimatedMinutes: 80,
    providedFiles: [{ path: 'data/pools.csv', content: poolsCsv }],
    briefing: { title: '온도표를 혼잡표로 바꾸기', content: '공식 안내의 P1–P16 온도와 용도를 기준으로 삼되, 용량과 도착 가중치는 **학습용 근사값**입니다. 값의 출처 등급을 지운 채 실제 혼잡 예측처럼 보이게 만들지 마세요.' },
    scenario: '시간대별 전체 방문자 수와 풀별 선호 가중치로 예상 점유율을 계산해, 어느 풀이 먼저 붐비는지 설명하는 분석기를 만듭니다.',
    legacyFiles: [{ path: 'src/PoolLoadAnalyzer.java', content: 'public final class PoolLoadAnalyzer {\n  // TODO: source confidence를 보존한 시간대별 점유율을 계산하세요.\n}\n' }],
    requirements: ['P1–P16을 누락 없이 읽고 시간대별 예상 인원을 배분하세요.', '점유율은 expectedVisitors / trainingCapacity로 계산하고 0..1 표시값은 clamp 하되 원본 초과율도 보존하세요.', '사실값 [확인]과 [학습용] 근사값을 결과에서 구분하세요.'],
    constraints: ['Java 17 표준 라이브러리만 사용합니다.', '이 데이터는 실제 운영 절차나 실시간 혼잡 예측이 아닙니다.', '온도 범위를 단일 평균으로 뭉개지 말고 min/max를 보존합니다.'],
    learningGoals: ['출처 등급이 다른 필드를 한 모델에서 안전하게 다루기', '용량 초과를 clamp 뒤에 숨기지 않기', 'CSV 입력·계산·표현 분리'],
    hints: ['표시용 utilization과 판단용 rawUtilization을 분리하세요.', '가중치 합으로 나눈 뒤 전체 방문자 수를 곱하면 배분 합이 보존됩니다.'],
    hiddenCases: [{ title: 'P16 누락', description: '15개라는 오래된 메모를 믿으면 공개 안내의 P16이 빠집니다. 행 수와 식별자 연속성을 함께 검증하세요.' }, { title: '정원 0', description: '잘못된 capacity 0은 나눗셈 전에 거부하고 행 번호를 알리세요.' }],
    rubric: [{ name: '보존 법칙', description: '배분된 방문자 합이 입력 방문자와 일치하는가.', weight: 30, visibleToLearner: true }, { name: '출처 가시성', description: '확인값과 근사값이 결과에서 구분되는가.', weight: 30, visibleToLearner: true }, { name: '초과 처리', description: '표시 clamp와 실제 초과율을 모두 남기는가.', weight: 25, visibleToLearner: true }, { name: '경계 검증', description: '누락·0 용량·범위 온도를 검증하는가.', weight: 15, visibleToLearner: true }],
    explainTask: '가장 붐비는 풀을 한 줄로 요약하되, 실제 혼잡 예보로 오해하지 않게 근거와 한계를 함께 쓰세요.', endings: ENDING,
  },
  {
    id: 'budapest-3-ticket-plan', stage: 2, stageTitle: '입장 전 선택', missionType: '최적화', difficulty: 'Normal',
    scope: '단일 모듈 + CSV', modes: ['developer'], domain: '의사결정', domainEmoji: '🎟️', title: '라커·캐빈·패스트트랙 선택', estimatedMinutes: 70,
    providedFiles: [{ path: 'data/ticket-options.csv', content: ticketOptionsCsv }],
    briefing: { title: '가장 싼 표가 항상 최선은 아니다', content: '가격은 **[확인] 스냅샷**, 대기 시간은 **[학습용] 근사값**입니다. 사용자의 예산, 큰 짐, 기다릴 수 있는 시간을 제약 조건으로 바꾸세요.' },
    scenario: '여행자 조건을 만족하는 표 중 가격과 대기 시간을 함께 비교해, 가능한 선택과 탈락 이유를 반환합니다.',
    legacyFiles: [{ path: 'src/TicketPlanner.java', content: 'public final class TicketPlanner {\n  // TODO: hard constraint와 preference를 분리하세요.\n}\n' }],
    requirements: ['예산·큰 짐 여부·최대 대기 시간을 hard constraint로 적용하세요.', '통과한 옵션은 가격 우선/시간 우선 두 방식으로 각각 정렬하세요.', '선택 불가일 때 예산을 얼마나 늘리거나 대기를 얼마나 허용해야 하는지 최소 완화량을 반환하세요.'],
    constraints: ['가격표는 확인일을 포함한 스냅샷으로 취급합니다.', '캐빈과 패스트트랙을 같은 기능으로 간주하지 않습니다.', '실제 구매 권고 문구를 출력하지 않습니다.'],
    learningGoals: ['필수 조건과 선호를 분리하기', '불가능 결과에도 다음 행동을 제시하기', '변경 가능한 외부 가격을 코드에서 분리하기'],
    hints: ['필터링 뒤 정렬하세요. 가중치 하나로 모든 조건을 섞으면 예산 초과가 다시 살아납니다.'],
    hiddenCases: [{ title: '가능한 표 없음', description: 'null 대신 탈락 사유별 최소 완화량을 보여 주세요.' }, { title: '동점', description: '가격과 대기가 같으면 원본 입력 순서를 유지해 결과를 재현 가능하게 만드세요.' }],
    rubric: [{ name: '제약 분리', description: 'hard constraint와 preference가 분리됐는가.', weight: 35, visibleToLearner: true }, { name: '설명 가능성', description: '선택·탈락 사유가 필드로 남는가.', weight: 30, visibleToLearner: true }, { name: '불가 결과', description: '최소 완화량을 계산하는가.', weight: 20, visibleToLearner: true }, { name: '스냅샷 경계', description: '가격 확인일과 근사 대기를 구분하는가.', weight: 15, visibleToLearner: true }],
    explainTask: '큰 짐 여행자와 가벼운 당일 여행자에게 결과가 왜 다른지 두 문장으로 설명하세요.', endings: ENDING,
  },
  {
    id: 'budapest-6-castle-route', stage: 3, stageTitle: '도시로 확장', missionType: '그래프 탐색', difficulty: 'Hard',
    scope: '그래프 + CSV', modes: ['developer'], domain: '경로 설계', domainEmoji: '🚞', title: '푸니쿨라 vs 도보 경로', estimatedMinutes: 80,
    providedFiles: [{ path: 'data/castle-routes.csv', content: castleRoutesCsv }],
    briefing: { title: '최단 경로는 한 가지가 아니다', content: '푸니쿨라의 95m 선로·50m 고저차·약 95초는 **[확인]**, 가격·혼잡·도보 시간은 **[학습용]**입니다. 시간, 돈, 체력 가운데 사용자가 무엇을 아끼는지에 따라 경로가 달라집니다.' },
    scenario: '부다 왕궁까지의 경로를 시간·비용·고저차·혼잡의 네 비용으로 비교하고 파레토 후보를 반환합니다.',
    legacyFiles: [{ path: 'src/CastleRoutePlanner.java', content: 'public final class CastleRoutePlanner {\n  // TODO: 하나의 마법 점수 대신 파레토 경로를 반환하세요.\n}\n' }],
    requirements: ['각 비용을 더해 시작점부터 안뜰까지 가능한 경로를 찾으세요.', '어느 축에서도 더 낫지 않은 파레토 경로만 남기세요.', '가중치를 받은 경우 선택 경로와 함께 다른 후보를 버린 이유를 반환하세요.'],
    constraints: ['음수 비용 간선은 거부합니다.', '확인값과 학습용 비용의 출처 등급을 보존합니다.', '실제 운행 여부·가격을 단정하지 않습니다.'],
    learningGoals: ['다목적 최적화와 파레토 전선', '단일 점수가 숨기는 선호 드러내기', '그래프 입력 검증'],
    hints: ['A가 모든 비용에서 B 이하이고 하나 이상 작으면 A가 B를 지배합니다.'],
    hiddenCases: [{ title: '가중치 0', description: '어떤 축을 0으로 두더라도 원본 비용은 결과에 남아야 합니다.' }, { title: '도달 불가', description: '빈 목록과 잘못된 입력을 다른 결과로 표현하세요.' }],
    rubric: [{ name: '파레토 정확성', description: '지배된 경로만 제거하는가.', weight: 35, visibleToLearner: true }, { name: '설명', description: '선택과 탈락 이유를 재구성할 수 있는가.', weight: 25, visibleToLearner: true }, { name: '출처 경계', description: '확인값과 학습값을 보존하는가.', weight: 20, visibleToLearner: true }, { name: '그래프 경계', description: '음수·도달 불가·동점을 처리하는가.', weight: 20, visibleToLearner: true }],
    explainTask: '시간 우선 여행자와 비용 우선 여행자에게 서로 다른 경로를 한 문장씩 설명하세요.', endings: ENDING,
  },
]

const etiquette = [
  ['수영장에서는 수영모를 쓴다', '야외 수영장(lap pool)은 수영모가 필요합니다.', 'accept'],
  ['열탕에서도 수영모를 반드시 쓴다', '수영모 의무는 수영장에 한정됩니다.', 'reject'],
  ['풀 밖에서는 슬리퍼를 신는다', '공식 FAQ는 풀 밖 슬리퍼 착용을 안내합니다.', 'accept'],
  ['수영복 대신 평상복으로 입수한다', '입수에는 수영복이 필요합니다.', 'reject'],
  ['큰 여행가방은 캐빈 보관을 검토한다', '공식 FAQ는 캐빈에 여행가방을 둘 수 있다고 안내합니다.', 'accept'],
  ['라커와 캐빈은 같은 크기다', '캐빈은 갈아입고 큰 짐을 둘 수 있는 별도 공간입니다.', 'reject'],
  ['표 가격은 확인일이 지나도 고정이다', '가격은 바뀔 수 있으므로 구매 전 재확인이 필요합니다.', 'reject'],
  ['풀 온도 범위를 먼저 확인한다', 'P1–P16은 용도와 온도가 다릅니다.', 'accept'],
  ['18도 침수탕과 40도 열탕을 같은 풀로 본다', '온도·용도가 달라 같은 선택으로 뭉개면 안 됩니다.', 'reject'],
  ['실시간 운영 공지는 방문 직전에 다시 본다', '정비와 운영 상태는 정적 콘텐츠로 단정할 수 없습니다.', 'accept'],
  ['학습용 혼잡 수치를 실제 예보라고 부른다', '근사 시뮬레이션은 실제 예보가 아닙니다.', 'reject'],
  ['예산과 기다릴 시간을 함께 정한다', '표 선택에는 둘 이상의 제약이 필요합니다.', 'accept'],
  ['패스트트랙이면 캐빈도 자동 포함된다고 가정한다', '입장 방식과 보관 방식은 별도로 확인해야 합니다.', 'reject'],
  ['안내 표지와 현장 직원 지시를 우선한다', '정적 학습 콘텐츠보다 현장 안내가 우선입니다.', 'accept'],
  ['출처와 확인일을 결과에서 보존한다', '변경 가능한 여행 정보는 출처와 시점이 핵심입니다.', 'accept'],
]

export const budapestBathsSwipeCards = etiquette.map(([title, explain, correct], index) => ({
  id: `budapest-etiquette-${String(index + 1).padStart(2, '0')}`,
  deck: 'budapest-4-etiquette',
  title,
  code: `여행 메모 ${String(index + 1).padStart(2, '0')}: ${title}`,
  correct,
  correctToken: correct === 'accept' ? '유지' : '수정',
  explain,
}))

export const budapestBathsProbeRounds = [{
  id: 'budapest-5-water-signal', emoji: '🧪', title: '어떤 성분 차이가 물의 정체를 가를까',
  situation: '라벨이 떨어진 세 물 샘플 중 하나가 세체니 온천수입니다. [확인] 공식 성분표는 칼슘·마그네슘·중탄산염·나트륨·황산염과 유의한 불소·메타붕산을 언급합니다. 한 번만 측정할 수 있습니다.',
  hypotheses: [{ key: 'thermal', label: '♨️ 세체니 온천수' }, { key: 'tap', label: '🚰 일반 수돗물' }, { key: 'salt', label: '🧂 단순 소금물' }],
  probes: [
    { key: 'panel', label: '칼슘·마그네슘·중탄산염·황산염 묶음을 측정한다', result: '여러 이온이 함께 검출되고 불소·메타붕산 신호가 남았습니다.', eliminates: ['tap', 'salt'], infoNote: '여러 성분의 조합이 세 가설을 가장 많이 가릅니다.' },
    { key: 'sodium', label: '나트륨만 측정한다', result: '나트륨이 검출됐습니다.', eliminates: [], infoNote: '세 가설 모두 나트륨을 포함할 수 있어 정보가 거의 없습니다.' },
    { key: 'temperature', label: '지금 온도만 잰다', result: '세 샘플 모두 실온입니다.', eliminates: [], infoNote: '운반 뒤 온도는 수원 성분을 설명하지 못합니다.' },
  ],
  answerKey: 'thermal', bestProbeKey: 'panel',
  resolution: '단일 성분보다 함께 나타나는 성분 묶음이 가설을 더 많이 줄입니다. 이 게임은 성분표 읽기 연습이며 의료 효능 판단이 아닙니다.',
}]

export const budapestBathsSims = [{
  id: 'budapest-1-morning-entry', title: '08–09시 입장 큐', emoji: '⏱️', engine: 'taxi-dispatch',
  brief: '08시와 09시의 학습용 도착률을 같은 고정 시드로 비교하세요. 도착 인원, 처리 인원, 남은 인원과 정규화 이용률을 함께 보고 창구 수를 늘렸을 때 대기가 어떻게 달라지는지 확인합니다.',
  arrivals: [{ hour: '08', perMin: 1.8 }, { hour: '09', perMin: 2.6 }],
  counters: 2, serviceSecPerVisitor: 50, prebookedRatio: 0.25, seed: 20260915,
  questions: ['도착 인원은 처리 인원보다 작아질 수 있는가?', '창구 2개와 3개 중 평균 대기가 더 짧은 쪽은?', '이용률을 0..1로 정규화해도 초과 수요가 숨지 않는가?'],
  reflectNote: '도착률·서비스 시간은 [학습용] 근사값입니다. 같은 조건은 고정 시드로 같은 결과를 냅니다.',
  note: '실제 입장 혼잡이나 운영 절차를 예측하지 않습니다. [확인] 공식 운영 정보는 방문 전에 다시 확인하세요.',
}]

export const budapestBathsContent = {
  course: courseBudapestBaths,
  codingMissions: budapestBathsCodingMissions,
  swipeCards: budapestBathsSwipeCards,
  probeRounds: budapestBathsProbeRounds,
  sims: budapestBathsSims,
}

export default budapestBathsContent
