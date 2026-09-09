// Line V (Voyage) — 동유럽 노선 콘텐츠 (D-010, TKT-084)
// 출처: 2026-07 일정 설계 대화에서 확정된 안. 콘텐츠는 PM(Claude) 전담.
// 이 파일이 준비/일일 안내/기록 화면의 단일 데이터 소스다.

export const VOYAGE = {
  id: 'east-europe-2026',
  title: '중부유럽 순환선',
  subtitle: '프라하 → 체스키크룸로프 → 할슈타트 → 잘츠부르크 → 바하우 → 비엔나 → 부다페스트 → 브르노 → 프라하',
  period: { start: '2026-09-08', end: '2026-09-18', nights: 9, days: 11 },
  status: 'preparing', // preparing | boarding(여행 중) | arrived(종료·기록)

  flights: {
    outbound: { code: 'OZ545', from: 'ICN', to: 'PRG', date: '2026-09-08', dep: '10:45', arr: '16:45', note: '직항 13시간 · 인천 T2 → 프라하 T1' },
    inbound: { code: 'OZ546', from: 'PRG', to: 'ICN', date: '2026-09-17', dep: '18:50', arr: '13:10+1', note: '직항 11시간 20분 · 9/18 인천 도착' },
    rationale: '직항 선택: 환승 실패 모드가 없다. 경유 최저가 대비 차액은 안정성의 값.'
  },

  rental: {
    pickup: { date: '2026-09-09', time: '16:30', place: '프라하 시내 지점 (중앙역 인근)' },
    dropoff: { date: '2026-09-16', time: '도착 즉시 (15:45 목표)', place: '프라하 시내 지점 — 숙소 체크인 전, 짐 실은 채 반납' },
    car: '오토미션 확정 · 보험(유리·타이어·도난) 포함',
    vignette: ['오스트리아 10일 디지털', '헝가리 D1 10일권', '체코 구간(브르노–프라하) 포함 여부 확인'],
    openIssue: '반납 시각 정책 — 업체가 초과 시 하루치 부과형이면 8일 계약(16:30↔18:00)으로. 유예형 업체면 16:30↔18:00 예약.'
  },

  // 운영 원칙 — 이 여행의 규칙 (길잡이 화면의 상단 고정)
  principles: [
    { key: 'drive', label: '운전 상한', text: '하루 3시간 30분 이내, 2시간마다 휴식. 예외는 단 하루(9/16, 분할 5시간대).' },
    { key: 'crowd', label: '혼잡 회피', text: '명소는 개장 직후 또는 저녁. 유명 카페 대신 조용한 클래식 카페. 공연·인파 밀집은 뺀다.' },
    { key: 'pace', label: '체력 배분', text: '하루 주요 관광 1~2개 + 카페 휴식 60~90분. 오전 이동이면 오후 휴식, 그 반대도.' },
    { key: 'luggage', label: '짐 보안', text: '이동일은 이동만 — 관광은 짐을 숙소에 둔 상태로. 차내 짐 노출 창은 관리형 주차장에서만, 귀중품은 몸에.' },
    { key: 'buffer', label: '출국일 무운전', text: '차는 전날 반납. 출국일은 운전 제로 + 버퍼 5시간.' }
  ],

  days: [
    {
      date: '2026-09-08', dow: '화', city: '프라하', stay: '프라하', driveMin: 0,
      am: '기내',
      pm: '16:45 프라하 도착 → 숙소 체크인',
      eve: '가벼운 저녁, 일찍 휴식 — 시차 적응이 이날의 유일한 임무',
      tip: '야경 욕심은 내지 않는다. 첫날 일찍 자는 것이 나머지 8일을 산다.'
    },
    {
      date: '2026-09-09', dow: '수', city: '프라하', stay: '프라하', driveMin: 10,
      am: '트램 22번으로 프라하성 위쪽 진입 → 프라하성·성 비투스 대성당 (개장 직후, 내리막 동선)',
      pm: '말라스트라나 점심 → 카페 휴식 90분 → 카를교·구시가 (낮엔 통과하는 느낌으로)',
      eve: '16:30 렌터카 인수 → 숙소 주차 → 휴식·저녁 → 19:15 야경: 강변 매직아워 → 20:00 카를교',
      tip: '일몰 19:20. 매직아워(19:20~19:50)가 완전 야경보다 예쁘다 — 하늘의 푸른빛 + 조명.'
    },
    {
      date: '2026-09-10', dow: '목', city: '체스키크룸로프', stay: '체스키크룸로프', driveMin: 150,
      am: '08:00 짐 싣고 출발 (운전 2시간 30분)',
      pm: '체크인 → 체스키크룸로프 성·망토 다리 전망',
      eve: '구시가 골목·블타바 강변 — 당일치기 단체가 빠지는 18시 이후가 마법의 시간',
      tip: '숙박자의 특권은 저녁이다.'
    },
    {
      date: '2026-09-11', dow: '금', city: '할슈타트 → 잘츠부르크', stay: '잘츠부르크', driveMin: 210,
      am: '07:30 출발 → 09:30 할슈타트 도착 (운전 2시간 10분) — 호수·마을, 단체 관광 전 시간대',
      pm: '점심 후 잘츠부르크 이동 (1시간 20분) → 체크인 → 미라벨 정원',
      eve: '구시가·게트라이데 거리, 잘자흐 강변 저녁',
      tip: '할슈타트는 경유가 정답 — 왕복 별도 방문 대비 운전 1시간 45분 절약. 주차 중 짐은 트렁크에, 겉에서 안 보이게.'
    },
    {
      date: '2026-09-12', dow: '토', city: '바하우 → 비엔나', stay: '비엔나', driveMin: 195,
      am: '카페 토마셀리 등에서 잘츠부르크 마무리 → 11:00 출발',
      pm: '멜크(바하우 밸리) 점심·강변 산책 (2시간 15분 + 1시간) → 비엔나 도착·체크인, 차량은 호텔 주차 후 이틀간 봉인',
      eve: '케른트너 거리·링 야경 산책',
      tip: '바하우 점심은 멜크 수도원 부지 내면 차와 가깝고 체류가 짧다.'
    },
    {
      date: '2026-09-13', dow: '일', city: '비엔나', stay: '비엔나', driveMin: 0,
      am: '쇤브룬 궁전 — 서두르지 않고, 정원 열차 포함. 내부가 붐비면 정원 위주',
      pm: '카페 슈페를 또는 프뤼켈 (자허·첸트랄의 줄 대신) → 숙소 휴식',
      eve: '링 주변 산책 또는 일찍 휴식 — 운전 없는 날',
      tip: '쇤브룬 내부는 개장 직후 첫 타임이 답. 정원은 무료·넓어서 사람이 흩어진다.'
    },
    {
      date: '2026-09-14', dow: '월', city: '비엔나 → 부다페스트', stay: '부다페스트', driveMin: 160,
      am: '벨베데레 상궁 (클림트)',
      pm: '14:00 출발 (운전 2시간 40분) → 부다페스트 체크인',
      eve: '★ 다뉴브 야경 크루즈 — 소형 보트 프로그램. 국회의사당·세체니 다리',
      tip: '크루즈는 인파에서 격리되는 방식의 야경이다. 대형 말고 소형.'
    },
    {
      date: '2026-09-15', dow: '화', city: '부다페스트', stay: '부다페스트', driveMin: 0,
      am: '세체니 온천 — 08~09시 입장이 혼잡 회피의 정답 (수영복 원단 래시가드 가능, 면 티셔츠 불가)',
      pm: '어부의 요새·마차시 성당·부다 왕궁 언덕 (푸니쿨라 이용)',
      eve: '여유 저녁 — 다음 날 장거리 전 짐 정리',
      tip: '온천으로 하루를 열고 오후에 언덕. 여행 후반 회복 반나절.'
    },
    {
      date: '2026-09-16', dow: '수', city: '브르노 경유 → 프라하', stay: '프라하', driveMin: 335,
      am: '09:00 출발 — 이날의 최대 변수는 도로가 아니라 출발 시각이다 (운전 3시간 20분)',
      pm: '브르노 점심 (관광 없이 식사만, 노출 1시간 이내) → 13:30 출발 → 15:45 프라하 도착 → 렌터카 반납(짐 실은 채) → 체크인',
      eve: '마지막 밤 — 비셰흐라드 노을 (현지인 산책 코스, 성벽 위 전경) 또는 못 가본 곳',
      tip: '유일한 5시간대 운전일. 출국 전날이라 지연돼도 치명적이지 않다 — 이날 쓰라고 아껴둔 카드.'
    },
    {
      date: '2026-09-17', dow: '목', city: '프라하 → 귀국', stay: '기내', driveMin: 0,
      am: '늦은 아침·짐 정리 → 체크아웃, 짐은 호텔 보관 → 몸만 가볍게 카페. 카를교를 제대로 보려면 08시 전 — 텅 비어 있다',
      pm: '14:30 짐 찾기 → 택시(볼트/우버, 30~40분) → 15:30 공항 → 15:50 체크인',
      eve: '18:50 OZ546 출발',
      tip: '택스 리펀 물품이 있으면 캐리어 맨 위에 + 30분 일찍. 공항버스는 짐 동선 때문에 이 일정엔 안 맞다.'
    },
    {
      date: '2026-09-18', dow: '금', city: '인천', stay: '—', driveMin: 0,
      am: '—', pm: '13:10 인천 도착', eve: '—', tip: ''
    }
  ],

  // 준비 구간 체크리스트 (개찰구 앞 화면)
  checklist: [
    { id: 'flight', label: '항공권 OZ545/OZ546 — 좌석·수하물 조건 재확인', done: false },
    { id: 'rental', label: '렌터카 — 오토 확정 · 반납 시각 정책(유예형/하루치형) 확인 후 계약 형태 결정', done: false },
    { id: 'vignette', label: '비네트 — 오스트리아 10일 · 헝가리 D1 10일 · 체코 포함 여부', done: false },
    { id: 'stay-prg1', label: '프라하 1차 (9/8~10, 2박) — 신시가 · 지하주차 · 엘리베이터 · 렌터카 지점 인근', done: false },
    { id: 'stay-ck', label: '체스키크룸로프 (9/10, 1박) — 전용 주차 + 객실까지 계단 확인, 짐은 방으로', done: false },
    { id: 'stay-szg', label: '잘츠부르크 (9/11, 1박) — 전용 주차 + 미라벨/신시가권', done: false },
    { id: 'stay-vie', label: '비엔나 (9/12~14, 2박) — 호텔 주차(이틀 봉인) + U4 접근성', done: false },
    { id: 'stay-bud', label: '부다페스트 (9/14~16, 2박) — 전용 주차 필수 · 페스트 5~6구 (세체니 M1·크루즈 선착장권)', done: false },
    { id: 'stay-prg2', label: '프라하 2차 (9/16, 1박) — 체크아웃 후 15시까지 짐 보관 + 택시 편한 위치', done: false },
    { id: 'insurance', label: '여행자보험 2인', done: false },
    { id: 'szechenyi', label: '세체니 준비물 — 수영복 원단 상의 OK, 면 티셔츠·전신 수트 불가', done: false }
  ],

  budget: {
    currency: 'KRW', unit: '만원',
    items: [
      { label: '항공 (직항 왕복)', amount: 340, fixed: true },
      { label: '렌터카 (보험 포함)', amount: 110, fixed: true },
      { label: '숙소 9박 + 주차', amount: 220 },
      { label: '유류·통행료·비네트', amount: 28 },
      { label: '식비', amount: 80 },
      { label: '입장료·크루즈·온천', amount: 30 },
      { label: '시내교통·택시', amount: 13 },
      { label: '예비비', amount: 35 }
    ],
    plan: 850, ceiling: 950,
    note: '아끼는 순서: 숙소 등급 → 식비 → 입장료. 야경 크루즈와 비엔나 카페는 안 건드린다.'
  },

  sourceNote: {
    title: '2026년 7월 여행 설계 대화',
    url: 'https://claude.ai/share/62c3c876-4a3e-4075-93b6-0eade9626cc7',
    label: '당시 검토안',
    checkedAt: '2026-08-17',
    notice: '가격·별점·영업시간은 당시 비교값입니다. 예약과 출발 직전에 공식 채널에서 다시 확인하세요.'
  },

  decisionTrail: [
    {
      id: 'departure-day-drive', status: 'superseded',
      problem: '출국일 부다페스트→프라하공항 7시간 운전',
      choice: '9/16 프라하로 미리 돌아와 차를 반납하고, 출국일은 무운전으로 둔다.',
      why: '지연을 만회할 수 없는 출국일에 운전 상한 5시간을 넘기지 않기 위해 폐기했다.'
    },
    {
      id: 'reverse-loop', status: 'alternative',
      problem: '완전 역순안: 프라하에서 부다페스트부터 이동',
      choice: '최종안은 기존 순환 감각을 유지한다.',
      why: '첫 운전일 5시간 20분, 휴식 포함 약 6시간이 되어 동행 체력 상한을 넘는다.'
    },
    {
      id: 'vienna-first', status: 'alternative',
      problem: '비엔나 선행안',
      choice: '장거리를 3시간 20분+2시간 40분으로 나누는 대안으로만 남긴다.',
      why: '운전은 나뉘지만 원래 동선이 크게 바뀌고 서쪽으로 되돌아가는 흐름이 생긴다.'
    },
    {
      id: 'brno-overnight', status: 'superseded',
      problem: '브르노 1박으로 부다페스트→프라하를 분할',
      choice: '브르노는 9/16 점심 경유로만 쓴다.',
      why: '운전 분할만을 위한 숙박보다 부다페스트 2박과 숙소 이동 1회 절감의 가치가 컸다.'
    },
    {
      id: 'hallstatt-transfer', status: 'current',
      problem: '할슈타트를 잘츠부르크 왕복으로 볼지',
      choice: '체스키크룸로프→잘츠부르크 이동에 흡수한다.',
      why: '왕복 관광보다 운전 약 1시간 45분을 줄이고 오전 인파도 피할 수 있다.'
    },
    {
      id: 'salzburg-vienna-budapest', status: 'current',
      problem: '도시별 체류 길이와 공연 밀도',
      choice: '잘츠부르크 1박, 비엔나 2박, 부다페스트 2박으로 확정했다.',
      why: '혼잡한 공연은 빼고 궁전·카페·온천과 회복 시간을 남겼다.'
    },
    {
      id: 'rental-timing', status: 'reverify',
      problem: '9/9 인수와 9/16 반납의 24시간 과금',
      choice: '16:30 인수 후 9/16 도착 즉시 반납을 기본으로 비교한다.',
      why: '반납이 인수 시각보다 늦으면 하루치가 붙는 업체가 있어 7일/8일 계약을 견적에서 다시 비교해야 한다.'
    },
    {
      id: 'flight-choice', status: 'current',
      problem: '아시아나 직항과 핀에어 야간 출발·75분 환승',
      choice: '동행 여행에서는 아시아나 직항을 선택했다.',
      why: '프리미엄 이코노미 수면 장점보다 짧은 환승 실패와 수하물 연결 위험을 줄이는 쪽을 택했다.'
    },
    {
      id: 'slow-travel', status: 'alternative',
      problem: '도시 수를 줄인 장기 체류형 대안',
      choice: '프라하 3박→비엔나 4박→프라하 2박, 전 구간 기차.',
      why: '깊이는 늘지만 어머니와 여러 도시를 함께 보는 이번 여행의 목표와 달라 대안으로 남겼다.'
    }
  ],

  budgetScenarios: [
    { id: 'budget-750', status: 'alternative', total: 750, lodgingParking: 135, variable: 165, note: '숙소 등급과 식비를 먼저 낮추는 절약안. 계단·교통 1회 같은 조건을 감수한다.' },
    { id: 'budget-800', status: 'alternative', total: 800, lodgingParking: 175, variable: 175, note: '위치·주차·조식의 균형이 가장 좋은 당시 추천안.' },
    { id: 'budget-850', status: 'current', total: 850, lodgingParking: 220, variable: 180, note: '현재 계획선. 기존 세부 항목 합계 856만 원은 이 범위 안의 추정 오차로 본다.' },
    { id: 'budget-950', status: 'current', total: 950, lodgingParking: 240, variable: 210, reserve: 50, note: '보험 보강·가격 변동·돌발 상황을 흡수하는 안전 상한.' }
  ],

  lodgingCandidates: [
    {
      id: '750-prague-first', status: 'reverify', tier: 750, city: '프라하 1차', nights: 2,
      name: 'Hotel Caesar Prague', priceRange: '2박 약 30만 원',
      parking: '주차 가능 여부·요금 예약 전 확인', elevator: '엘리베이터 재확인',
      transit: '신시가 중심·트램 인접', luggage: '차량 진입 가능한 입구 확인',
      reason: '조용한 신시가에서 첫날과 렌터카 동선을 함께 잡는 후보.', caution: '당시 검토안 — 실시간 가격·재고 아님'
    },
    {
      id: '750-cesky', status: 'reverify', tier: 750, city: '체스키크룸로프', nights: 1,
      name: 'Pension Pod Skalkou', priceRange: '1박 약 10만 원',
      parking: '당시 무료 주차 안내', elevator: '엘리베이터 없음·1층 객실 요청',
      transit: '구시가 도보 약 5분', luggage: '짐은 반드시 객실로 이동',
      reason: '주차와 구시가 접근을 저렴하게 맞춘 후보.', caution: '계단·1층 객실 가능 여부 재확인'
    },
    {
      id: '750-salzburg', status: 'reverify', tier: 750, city: '잘츠부르크', nights: 1,
      name: 'Hotel Heffterhof', priceRange: '1박 약 18만 원',
      parking: '당시 무료 주차 안내', elevator: '엘리베이터 재확인',
      transit: '버스로 구시가·당시 교통권 제공', luggage: '체크인 즉시 객실 보관',
      reason: '도심 밖 주차 편의와 대중교통을 교환하는 후보.', caution: '교통권 제공 조건 재확인'
    },
    {
      id: '750-vienna', status: 'reverify', tier: 750, city: '비엔나', nights: 2,
      name: 'Hotel Kaiserhof Wien', priceRange: '2박 약 42만 원',
      parking: '인근 제휴 주차·요금 확인', elevator: '엘리베이터 재확인',
      transit: '카를스플라츠 도보권·U4 직행', luggage: '이틀간 차를 꺼내지 않는 조건',
      reason: '쇤브룬 이동과 도심 산책을 함께 잡는 후보.', caution: '주차 포함 여부 재확인'
    },
    {
      id: '750-budapest', status: 'reverify', tier: 750, city: '부다페스트', nights: 2,
      name: 'Benczúr Hotel', priceRange: '2박 약 22만 원',
      parking: '당시 자체 주차 안내', elevator: '엘리베이터 재확인',
      transit: '6구·세체니 도보 약 10분', luggage: '출발 전날 밤 차량 적재 금지',
      reason: '세체니 접근성이 좋은 절약안.', caution: '주차 보안·예약 가능 여부 재확인'
    },
    {
      id: '750-prague-last', status: 'reverify', tier: 750, city: '프라하 2차', nights: 1,
      name: 'Exe City Park', priceRange: '1박 약 14만 원',
      parking: '차량 반납 뒤 입실', elevator: '엘리베이터 재확인',
      transit: '중앙역 인접·택시 승차 용이', luggage: '체크아웃 후 15시까지 보관 확인',
      reason: '반납·짐 보관·공항 택시 흐름을 단순화하는 후보.', caution: '짐 보관 마감 시각 재확인'
    },
    {
      id: '800-prague-first', status: 'reverify', tier: 800, city: '프라하 1차', nights: 2,
      name: 'MOSAIC HOUSE Design Hotel', priceRange: '2박 약 40만 원',
      parking: '주차 대수 제한·선예약 필요', elevator: '엘리베이터 재확인',
      transit: '신시가·트램 접근', luggage: '차량 인수 전까지 호텔 보관',
      reason: '조식과 신시가 접근의 균형이 좋은 후보.', caution: '주차 재고·요금 재확인'
    },
    {
      id: '800-cesky', status: 'reverify', tier: 800, city: '체스키크룸로프', nights: 1,
      name: 'Boutique Hotel Romantic', priceRange: '1박 약 13만 원',
      parking: '당시 무료 주차 안내', elevator: '객실 접근 계단 확인',
      transit: '구시가 도보 수분', luggage: '짐은 객실로 이동',
      reason: '주차·조식·구시가 접근을 균형 있게 잡은 후보.', caution: '엘리베이터·객실 층 재확인'
    },
    {
      id: '800-salzburg', status: 'reverify', tier: 800, city: '잘츠부르크', nights: 1,
      name: 'Hotel Via Roma', priceRange: '1박 약 22만 원',
      parking: '당시 안뜰 무료 주차 안내', elevator: '엘리베이터 재확인',
      transit: '구시가 도보·트램권', luggage: '체크인 즉시 객실 보관',
      reason: '1박 일정에서 주차와 구시가 접근을 모두 챙긴 후보.', caution: '교통패스·주차 조건 재확인'
    },
    {
      id: '800-vienna', status: 'reverify', tier: 800, city: '비엔나', nights: 2,
      name: 'Lindner Am Belvedere', priceRange: '2박 약 52만 원',
      parking: '당시 자체 주차장 안내', elevator: '엘리베이터 재확인',
      transit: '벨베데레 인접·트램권', luggage: '체크아웃 뒤 바로 출발 가능한 동선',
      reason: '9/14 벨베데레 후 부다페스트 출발에 맞춘 후보.', caution: '호텔명·운영 브랜드·주차 요금 재확인'
    },
    {
      id: '800-budapest', status: 'reverify', tier: 800, city: '부다페스트', nights: 2,
      name: 'Mamaison Andrássy', priceRange: '2박 약 30만 원',
      parking: '전용·제휴 주차 확인', elevator: '엘리베이터 재확인',
      transit: '6구 안드라시·M1 약 150m', luggage: '주차 후 이틀간 차내 짐 없음',
      reason: '세체니와 강변 이동을 대중교통으로 잇는 후보.', caution: '주차 형태·요금 재확인'
    },
    {
      id: '800-prague-last', status: 'reverify', tier: 800, city: '프라하 2차', nights: 1,
      name: 'Hotel Century Old Town', priceRange: '1박 약 19만 원',
      parking: '차량 반납 뒤 입실', elevator: '엘리베이터 재확인',
      transit: '중앙역과 구시가 사이', luggage: '오후 15시까지 보관 확인',
      reason: '마지막 산책과 공항 택시를 모두 단순하게 만드는 후보.', caution: '짐 보관·택시 정차 조건 재확인'
    },
    {
      id: '850-prague-first', status: 'reverify', tier: 850, city: '프라하 1차', nights: 2,
      name: 'NH Collection Carlo IV', priceRange: '2박 약 50만 원',
      parking: '당시 자체 개러지 안내', elevator: '엘리베이터 확인',
      transit: '중앙역 인근·렌터카 지점권', luggage: '도착일과 인수 전 보관 용이',
      reason: '공항 도착·관광·렌터카 인수를 한 권역에 묶는 후보.', caution: '개러지 재고·요금 재확인'
    },
    {
      id: '850-cesky', status: 'reverify', tier: 850, city: '체스키크룸로프', nights: 1,
      name: 'Hotel Bellevue', priceRange: '1박 약 18만 원',
      parking: '당시 주차 지원 안내', elevator: '객실 접근 계단 확인',
      transit: '구시가 안쪽', luggage: '짐을 객실로 올릴 수 있는지 확인',
      reason: '짧은 체류에서 구시가 접근을 최우선한 후보.', caution: '차량 진입·주차장 거리 재확인'
    },
    {
      id: '850-salzburg', status: 'reverify', tier: 850, city: '잘츠부르크', nights: 1,
      name: 'Sheraton Grand Salzburg', priceRange: '1박 약 35만 원',
      parking: '당시 지하 개러지 안내', elevator: '엘리베이터 확인',
      transit: '미라벨 정원 인접', luggage: '체크인 즉시 보관',
      reason: '1박 업그레이드로 미라벨 동선을 가장 짧게 만드는 후보.', caution: '개러지·객실 가격 재확인'
    },
    {
      id: '850-vienna', status: 'reverify', tier: 850, city: '비엔나', nights: 2,
      name: 'Radisson Blu Das Triest', priceRange: '2박 약 60만 원',
      parking: '주차 운영 여부 재확인', elevator: '엘리베이터 재확인',
      transit: '4구 비드너·카를스플라츠/U4권', luggage: '이틀간 차량 봉인',
      reason: '쇤브룬·링·카페 이동의 균형을 노린 당시 후보.', caution: '당시 호텔명·현재 영업 상태 재확인'
    },
    {
      id: '850-budapest', status: 'reverify', tier: 850, city: '부다페스트', nights: 2,
      name: 'Corinthia Budapest', priceRange: '2박 약 44만 원',
      parking: '당시 자체 개러지 안내', elevator: '엘리베이터 확인',
      transit: '대로변·트램/M1 접근', luggage: '차내 짐 없이 주차',
      reason: '온천·휴식 가치를 숙소에서도 이어가는 후보.', caution: '스파 이용·개러지 요금 재확인'
    },
    {
      id: '850-prague-last', status: 'reverify', tier: 850, city: '프라하 2차', nights: 1,
      name: 'Cosmopolitan Prague', priceRange: '1박 약 20만 원',
      parking: '차량 반납 뒤 입실', elevator: '엘리베이터 확인',
      transit: '구시가 초입·택시 접근', luggage: '체크아웃 후 15시까지 보관 확인',
      reason: '마지막 밤의 산책과 출국일 짐 흐름을 잇는 후보.', caution: '짐 보관·택시 정차 조건 재확인'
    }
  ],

  sourceCoverage: [
    { id: 'final-schedule', topic: '최종 11일 오전·오후·저녁', status: 'current', surface: 'V02 일정·상세', implemented: true },
    { id: 'route-alternatives', topic: '역순·비엔나 선행·브르노 숙박·점심 경유', status: 'superseded', surface: 'V01 왜 이 노선인가', implemented: true },
    { id: 'stay-lengths', topic: '도시별 체류 길이 결정', status: 'current', surface: 'V01 결정 기록', implemented: true },
    { id: 'concert-cut', topic: '공연 제외와 1·2·2박 결정', status: 'superseded', surface: 'V01 결정 기록', implemented: true },
    { id: 'crowd-rest', topic: '혼잡 회피·카페 휴식·체력 상한', status: 'current', surface: 'V01 운영 원칙·V02 상세', implemented: true },
    { id: 'flight', topic: '항공편 비교·직항 선택·시차 적응', status: 'current', surface: 'V01 결정 기록·V02 1일차', implemented: true },
    { id: 'rental', topic: '전날 수령·숙소·주차·24시간 과금', status: 'reverify', surface: 'V01 결정 기록·V02 2일차', implemented: true },
    { id: 'luggage', topic: '차내 짐 보안·관리 주차·출국일 보관', status: 'current', surface: 'V01 운영 원칙·숙소·V02 상세', implemented: true },
    { id: 'bath', topic: '세체니 복장·시간·예약', status: 'reverify', surface: 'V01 체크·V02 일정', implemented: true },
    { id: 'budgets-hotels', topic: '750/800/850/950 예산·숙소 18개', status: 'reverify', surface: 'V01 예산·숙소', implemented: true },
    { id: 'night-view', topic: '프라하 매직아워·완전 야경·단축안', status: 'reverify', surface: 'V02 2일차 상세', implemented: true },
    { id: 'slow-travel', topic: '기차 중심 장기 체류 대안', status: 'alternative', surface: 'V01 왜 이 노선인가', implemented: true }
  ],

  daySessions: [
    {
      id: 'day-1', dayIndex: 0, date: '2026-09-08', status: 'current', title: '도착·회복',
      success: '무리 없이 숙소에 도착하고 다음 날 쓸 컨디션을 남긴다.',
      timeline: [
        { time: '16:45', title: '프라하 도착', detail: '입국 심사와 수하물 수령. 서두르지 않는다.' },
        { time: '17:45~18:30', title: '택시 이동', detail: '확인한 승차 지점에서 신시가 숙소 주소를 보여준다.' },
        { time: '18:30~19:00', title: '체크인', detail: '차량 진입 가능한 입구에서 짐부터 객실로 옮긴다.' },
        { time: '19:00 이후', title: '가벼운 저녁·수면', detail: '숙소 가까운 곳만 이용한다. 야경은 기본안에서 뺀다.' }
      ],
      checklist: {
        airport: ['수하물 수령', 'eSIM·로밍 연결', '현금·카드 분산', '숙소 주소 저장', '택시 승차 지점', '체크인 마감'],
        hotel: ['다음 날 트램 22 승차 위치', '렌터카 지점과 서류', '지하주차장 진입 방법']
      },
      branches: [
        { situation: '정상', action: '체크인 후 가까운 저녁, 바로 휴식.' },
        { situation: '수하물 지연', action: '분실 접수번호를 받고 필수품만 구입. 야외 일정 없음.' },
        { situation: '입국 지연', action: '숙소에 도착 시각을 알리고 저녁은 공항이나 숙소에서 단축.' },
        { situation: '어머니 피로', action: '식사는 포장·룸서비스로 바꾸고 산책은 취소.' }
      ],
      optional: '컨디션이 좋을 때만 바츨라프 광장 주변을 10~20분 걷고, 조금이라도 피곤하면 즉시 취소한다.'
    },
    {
      id: 'day-2', dayIndex: 1, date: '2026-09-09', status: 'reverify', title: '프라하·차량 인수·야경',
      success: '내리막 관광과 두 번의 휴식을 지키고, 차량을 밝을 때 입고한 뒤 야경을 선택한다.',
      timeline: [
        { time: '08:30', title: '트램 22 이동', detail: '성 위쪽에서 시작해 오르막 걷기를 없앤다.' },
        { time: '09:00~11:30', title: '프라하성·성 비투스', detail: '개장 직후 관람하고 오래 줄 서는 구간은 줄인다.' },
        { time: '11:30~13:00', title: '말라스트라나 점심', detail: '성에서 내려오며 식사해 동선을 되돌리지 않는다.' },
        { time: '13:00~14:30', title: '카페 의무 휴식', detail: '조용한 곳에서 60~90분 앉아 있는다.' },
        { time: '14:30~16:00', title: '카를교·구시가지', detail: '카를교는 오래 머무는 목적지가 아니라 건너며 보는 구간.' },
        { time: '16:30 전후', title: '렌터카 인수', detail: '중앙역·숙소 인근 지점에서 점검 후 숙소 지하주차장에 입고.' },
        { time: '17:30~19:00', title: '휴식·저녁', detail: '야경 전에 90분 이상 앉거나 눕는다.' },
        { time: '19:15~21:00', title: '강변·카를교 야경', detail: '스메타나 제방에서 조명이 켜지는 과정을 보고 카를교로 이동.' }
      ],
      checklist: {
        rental: ['오토미션·보험 범위', '국경 통과 허용', '비네트 포함 여부', '기존 손상 촬영', '반납 지점 영업시간'],
        night: ['실제 일몰 재확인', '걷기 2km 상한', '귀가 택시 경로', '다음 날 출차 동선']
      },
      branches: [
        { situation: '정상', action: '19:30~20:00 매직아워, 20:00~20:40 완전 야경.' },
        { situation: '피로', action: '강변 30분만 보고 복귀. 못 본 야경은 9/16로 넘긴다.' },
        { situation: '16:30 수령·8일 계약', action: '매직아워와 저녁 여유를 지키되 하루치 비용을 견적에서 확인.' },
        { situation: '18:00 수령·7일 계약', action: '추가 요금을 아끼되 매직아워를 포기할 수 있음을 비교.' }
      ],
      reverify: '실제 일몰과 차량의 24시간 과금·유예·영업시간은 출발 직전 또는 계약 화면에서 확인한다.'
    }
  ]
}
