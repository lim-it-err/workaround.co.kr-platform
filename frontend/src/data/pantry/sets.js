/**
 * 자취 밥상 — 한 상 세트 + 페어링 (PM 전담 콘텐츠, design/pantry-spec.md §2·§4)
 * pairing.type: 맥주 | 소주 | 막걸리 | 하이볼 | 와인 | 사케 | 무알코올. alt 는 무알코올 대안(항상 존재).
 * v2 (2026-10-05, PO "재밌는 멘트·토글 늘리기"): mood 는 한 줄 분위기, quip 은 한 줄 농담(차림 상세 상단), tags 는 재료·상황·술 태그(TKT-180 칩).
 */

export const PANTRY_SETS = [
  {
    id: 'autumn-sunday', title: '가을 일요일 한 상', mood: '창문 열고 찌개 끓이는 냄새로 하루를 닫는 날',
    when: ['weekend', 'cold', 'autumn'], minutes: 30, cost: 6000,
    main: 'kimchi-jjigae', sides: ['egg-roll'], soup: null,
    quip: '일요일 저녁 김치찌개는 월요일에 대한 가장 정중한 항의다.',
    tags: ['김치', '돼지고기', '계란', '국물', '주말', '가을', '소주'],
    pairing: { drink: '소주 (참이슬 오리지널 또는 진로)', type: '소주', why: '김치찌개의 신맛과 기름기를 소주의 깔끔한 알코올감이 끊어 준다. 한 잔이면 충분한 조합.', alt: '보리차 — 찌개 짠맛을 씻는다' },
    shopping: ['신김치', '돼지 앞다리 150g', '두부 한 모', '계란 3개', '대파'],
    note: '찌개는 두 끼 분량으로 끓여 내일 라면 사리.'
  },
  {
    id: 'rain-jeon', title: '비 오는 날 전 한 판', mood: '빗소리에 기름 튀는 소리를 얹는 날',
    when: ['rain', 'weekend'], minutes: 25, cost: 4000,
    main: 'kimchi-jeon', sides: ['gamja-jeon'], soup: null,
    quip: '비 오는 날 전 부치는 건 과학이다 — 빗소리와 기름 튀는 소리의 주파수가 비슷하다는 설이 있다. 믿지는 말고 부치자.',
    tags: ['김치', '감자', '부침', '비오는날', '막걸리'],
    pairing: { drink: '막걸리 (장수 또는 지평)', type: '막걸리', why: '전의 기름을 막걸리의 탄산과 단맛이 씻고, 신김치와 유산균 산미가 같은 방향이다. 국적이 맞는 조합.', alt: '식혜 — 단맛·탄산감이 막걸리 자리를 대신한다' },
    shopping: ['신김치', '부침가루', '감자 2개', '식용유'],
    note: '반죽은 묽게. 얇게 부칠수록 바삭하다.'
  },
  {
    id: 'ten-min-egg-rice', title: '10분 계란 볶음밥', mood: '찬밥과 계란만 있어도 되는 날',
    when: ['weekday', 'late', 'broke'], minutes: 10, cost: 2500,
    main: 'gyeran-fried-rice', sides: ['oi-muchim'], soup: null,
    quip: '냉장고에 계란 두 개가 남아 있다면 당신은 아직 굶지 않는다. 이것이 자취의 제1법칙.',
    tags: ['계란', '찬밥', '파', '10분', '냉장고털이', '맥주'],
    pairing: { drink: '라거 맥주 (테라·카스 355ml)', type: '맥주', why: '파기름의 고소함에 가벼운 라거의 탄산이 입을 리셋한다. 무거운 술은 볶음밥을 이긴다.', alt: '탄산수 + 레몬 — 같은 역할' },
    shopping: ['계란 2개', '대파', '오이 1개', '찬밥'],
    note: '밥은 팬에 눌리는 소리가 날 때까지 건드리지 않는다.'
  },
  {
    id: 'budae-night', title: '야식 부대찌개', mood: '늦게 들어온 날, 냄비 하나로 끝내는 위로',
    when: ['late', 'rain', 'cold'], minutes: 20, cost: 5500,
    main: 'budae', sides: [], soup: null,
    quip: '편의점 재료만으로 완성되는 유일한 찌개. 부대찌개는 한국이 만든 가장 성공적인 오픈소스다.',
    tags: ['스팸', '소시지', '라면', '김치', '야식', '편의점', '소주'],
    pairing: { drink: '소맥 (소주 1 : 맥주 4)', type: '소주', why: '짜고 매운 국물에는 도수를 낮춘 소맥이 국물 온도와 맞물린다. 소주 단독보다 편하다.', alt: '제로 콜라 — 스팸·소시지의 짠맛과 탄산의 궁합' },
    shopping: ['스팸 소', '소시지 2개', '라면 사리', '신김치', '체다 슬라이스'],
    note: '편의점 재료만으로 완성되는 유일한 찌개.'
  },
  {
    id: 'hangover', title: '해장 한 상', mood: '어제의 나를 용서하는 뜨끈한 국',
    when: ['hangover', 'weekend'], minutes: 20, cost: 3000,
    main: 'kongnamul-guk', sides: ['egg-roll'], soup: null,
    quip: '콩나물국 끓일 때 뚜껑을 열면 비린내가 난다. 어젯밤 일도 자꾸 열어 보면 비린내가 난다.',
    tags: ['콩나물', '계란', '국물', '해장', '무알코올'],
    pairing: { drink: '없음 — 오늘은 국물이 술이다', type: '무알코올', why: '해장에 해장술은 페어링이 아니라 반복이다.', alt: '이온음료 또는 따뜻한 보리차' },
    shopping: ['콩나물 한 봉', '멸치 다시팩', '계란 3개', '대파'],
    note: '콩나물은 뚜껑을 열지 않아야 비린내가 없다.'
  },
  {
    id: 'payday-samgyeop', title: '월급날 삼겹살', mood: '집에서 굽는 게 제일 싸고 제일 맛있는 날',
    when: ['payday', 'weekend'], minutes: 25, cost: 9000,
    main: 'samgyeop', sides: ['oi-muchim'], soup: 'doenjang-jjigae',
    quip: '월급날 삼겹살 250g은 통장 잔고에 대한 가장 합리적인 투자다. 환기는 굽기 전에.',
    tags: ['삼겹살', '파', '상추', '된장', '주말', '월급날', '소주'],
    pairing: { drink: '소주 (진로 이즈백) 또는 흑맥주 (기네스)', type: '소주', why: '삼겹살 기름에는 소주가 정석, 흑맥주의 볶은 맥아 향은 구운 고기 껍질의 캐러멜 향과 동조한다.', alt: '보리차 — 기름진 입을 헹군다' },
    shopping: ['삼겹살 250g', '대파 1대', '상추', '쌈장', '오이', '된장', '두부'],
    note: '팬을 충분히 달군 뒤 올려야 눌어붙지 않는다. 환기는 굽기 전에.'
  },
  {
    id: 'tofu-kimchi-drink', title: '두부김치와 한잔', mood: '안주가 곧 저녁이 되는 평일 밤',
    when: ['weekday', 'late', 'autumn'], minutes: 15, cost: 4500,
    main: 'tofu-kimchi', sides: [], soup: null,
    quip: '두부김치의 영양 구성은 의외로 훌륭하다. 그러니까 이건 식사다. 술은 반찬이다.',
    tags: ['두부', '김치', '돼지고기', '한잔', '가을', '막걸리'],
    pairing: { drink: '막걸리 또는 소주', type: '막걸리', why: '볶은 김치의 단맛·신맛에 막걸리의 산미와 탄산이 맞고, 두부의 담백함이 술의 쓴맛을 받쳐 준다.', alt: '보리차 또는 옥수수차' },
    shopping: ['두부 한 모', '신김치', '돼지고기 100g'],
    note: '두부는 데치기보다 팬에 굽는 편이 식어도 맛있다.'
  },
  {
    id: 'weekday-doenjang', title: '평일 된장찌개 집밥', mood: '반찬 하나 국 하나면 충분한 저녁',
    when: ['weekday', 'autumn', 'cold'], minutes: 25, cost: 4500,
    main: 'godeungeo', sides: ['jang-jorim'], soup: 'doenjang-jjigae',
    quip: '고등어 굽는 냄새는 옆집에 "나 오늘 제대로 먹는다"고 알리는 가장 확실한 방법이다.',
    tags: ['고등어', '된장', '두부', '메추리알', '집밥', '평일', '사케'],
    pairing: { drink: '청하 또는 사케 (준마이, 차게)', type: '사케', why: '고등어의 기름과 비린 향을 쌀술의 깔끔한 산미가 정리한다. 된장의 감칠맛과 사케의 감칠맛이 같은 결.', alt: '녹차 — 생선 기름을 잡는다' },
    shopping: ['냉동 고등어 1토막', '된장', '두부', '애호박', '메추리알 1봉', '간장'],
    note: '장조림은 주말에 만들어 두면 평일 3일이 편하다.'
  },
  {
    id: 'summer-bibim', title: '더운 날 비빔국수', mood: '불 앞에 오래 서고 싶지 않은 날',
    when: ['hot', 'weekday'], minutes: 15, cost: 3000,
    main: 'bibim-guksu', sides: ['egg-roll'], soup: null,
    quip: '비빔국수의 비결은 면을 찬물에 세 번 헹구는 것. 네 번째부터는 그냥 당신이 더운 것이다.',
    tags: ['소면', '오이', '계란', '고추장', '더운날', '10분', '하이볼'],
    pairing: { drink: '하이볼 (산토리 또는 짐빔 + 토닉)', type: '하이볼', why: '매콤새콤한 양념에 하이볼의 탄산과 위스키의 바닐라 향이 대비된다. 맥주보다 덜 배부르다.', alt: '탄산수 + 라임' },
    shopping: ['소면', '오이', '계란', '고추장', '식초'],
    note: '면은 삶은 뒤 찬물에 세 번 헹궈야 쫄깃하다.'
  },
  {
    id: 'guest-dakgalbi', title: '친구 온 날 닭갈비', mood: '한 팬에서 나눠 먹는 게 손님상',
    when: ['weekend', 'guest', 'payday'], minutes: 30, cost: 8000,
    main: 'dakgalbi', sides: ['oi-muchim'], soup: null,
    quip: '닭갈비의 진짜 메인은 마지막 볶음밥이다. 닭은 밥을 위한 양념 운반체일 뿐.',
    tags: ['닭', '양배추', '고구마', '떡', '손님', '주말', '맥주'],
    pairing: { drink: '라거 맥주 (클라우드·하이네켄) 또는 소맥', type: '맥주', why: '달고 매운 양념에는 차가운 라거의 탄산이 가장 정직하다. 남은 양념에 밥을 볶을 때는 소맥.', alt: '제로 사이다' },
    shopping: ['닭다리살 250g', '양배추', '고구마', '떡', '고추장', '카레가루', '오이'],
    note: '마지막 볶음밥까지가 닭갈비다 — 밥 한 공기를 남겨 둔다.'
  },
  {
    id: 'diet-salad', title: '가벼운 저녁 샐러드', mood: '어제 많이 먹었으면 오늘은 비우는 날',
    when: ['weekday', 'hot', 'diet'], minutes: 10, cost: 4500,
    main: 'chicken-salad', sides: ['cheese-omelet'], soup: null,
    quip: '샐러드에 드레싱을 미리 뿌리면 숨이 죽는다. 다이어트 결심도 미리 말하면 숨이 죽는다.',
    tags: ['닭가슴살', '채소', '계란', '치즈', '다이어트', '10분', '와인'],
    pairing: { drink: '드라이 화이트 와인 (소비뇽 블랑, 한 잔)', type: '와인', why: '닭가슴살·발사믹의 산미에 화이트의 산미가 동조하고, 오믈렛의 치즈에는 와인의 미네랄감이 맞는다.', alt: '탄산수 + 레몬' },
    shopping: ['닭가슴살 1팩', '샐러드 믹스', '방울토마토', '계란 3개', '체다 슬라이스'],
    note: '드레싱은 먹기 직전에 — 미리 뿌리면 숨이 죽는다.'
  },
  {
    id: 'sundubu-quick', title: '순두부찌개 15분', mood: '뜨거운 걸 빨리 먹고 싶은 가을 저녁',
    when: ['weekday', 'cold', 'autumn', 'hangover'], minutes: 15, cost: 3500,
    main: 'sundubu', sides: ['gimbap-simple'], soup: null,
    quip: '고추기름 내는 30초가 시판 찌개와의 차이다. 인생도 대개 그 30초에서 갈린다.',
    tags: ['순두부', '계란', '참치', '김', '해장', '15분', '가을', '소주'],
    pairing: { drink: '소주 한 잔 또는 없음', type: '소주', why: '고추기름의 매운 향에 소주가 맞지만, 평일이면 김밥과 찌개만으로 완결된다.', alt: '보리차' },
    shopping: ['순두부 1팩', '계란', '대파', '김 2장', '참치캔', '단무지'],
    note: '고추기름을 먼저 내는 30초가 시판 찌개와의 차이.'
  },
  {
    id: 'hwe-payday', title: '월급날 회무침', mood: '마트 회 한 팩이면 집이 횟집',
    when: ['payday', 'weekend', 'guest'], minutes: 15, cost: 10000,
    main: 'hwe-muchim', sides: [], soup: null,
    quip: '회는 사 온 당일에, 무침은 먹기 직전에. 미루면 둘 다 변한다.',
    tags: ['회', '오이', '양파', '소면', '월급날', '손님', '사케'],
    pairing: { drink: '사케 (준마이, 차게) 또는 청하', type: '사케', why: '초고추장의 단맛·신맛에 차가운 쌀술의 깔끔함이 회의 감칠맛을 살린다. 소주보다 덜 거칠다.', alt: '탄산수 + 유자청 조금' },
    shopping: ['마트 모둠회 소', '초고추장', '오이', '양파', '깻잎', '소면'],
    note: '회는 사 온 당일, 무침은 먹기 직전에.'
  }
]

export function findSet(id) {
  return PANTRY_SETS.find((set) => set.id === id) || null
}
