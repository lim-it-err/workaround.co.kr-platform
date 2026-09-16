// 코스 목록·시간표용 요약. 실제 코딩 미션·게임·시뮬 데이터는 각 상세 라우트에서 읽는다.
export const courseVienna1900Catalog = {
  id: 'vienna-1900',
  title: '비엔나 1900',
  subtitle: '그림은 왜 바뀌었나',
  theme: '미술사 · 역사',
  emoji: '🖼️',
  intro: '벨베데레에서 〈키스〉를 봤다면, 질문 하나가 남습니다 — 왜 1908년의 비엔나는 금박을 다시 꺼냈을까. 이 코스는 "그림이 왜 바뀌었나"를 데이터와 코드로 되묻습니다. 기술(안료·원근법), 계보(영향·계승), 분류(양식), 공간(전시실·큐)의 네 축, 열두 미션.',
  missions: [
    ['v1900-a-style-classifier', 'game', '양식 연대 추정기', 20],
    ['v1900-b-pigments', 'coding', '안료 연표가 양식을 바꿨다', 90],
    ['v1900-c-influence-dag', 'coding', '영향 그래프 — 누가 누구를', 90],
    ['v1900-d-perspective', 'game', '원근법의 발명', 25],
    ['v1900-e-klimt-changepoint', 'coding', '한 화가의 변화 — 클림트 변곡점', 80],
    ['v1900-f-belvedere-route', 'coding', '벨베데레를 연대순으로 걷기', 90],
    ['v1900-1-provenance', 'coding', '〈키스〉의 출처를 증명하라', 120],
    ['v1900-2-gold-damage', 'game', '금박 손상 영역 찾기', 20],
    ['v1900-3-secession-hang', 'game', '분리파 전시 큐레이션', 20],
    ['v1900-4-succession', 'game', '합스부르크 계승 규칙', 15],
    ['v1900-5-entry-queue', 'sim', '벨베데레 입장 큐', 30],
    ['v1900-6-salt-mine', 'coding', '할슈타트 소금광산 7,000년', 80],
  ].map(([id, kind, title, minutes]) => ({ id, kind, title, minutes })),
}
