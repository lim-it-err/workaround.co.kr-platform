// 오늘 화면의 추천 링크를 만들기 위한 최소 메타데이터.
// 카드/사건의 본문은 배우기·게임 상세 라우트에서만 읽는다.
export const routineCards = {
  readingCards: [
    ['read-ggs-01', '총, 균, 쇠', '🌾'],
    ['read-kahneman-01', '생각에 관한 생각', '🧠'],
    ['read-blackswan-01', '블랙 스완', '🦢'],
    ['read-selfish-01', '이기적 유전자', '🧬'],
    ['read-levitin-01', '정리하는 뇌', '🗂'],
    ['read-clausewitz-01', '전쟁론', '⚔️'],
    ['read-nudge-01', '넛지', '👉'],
    ['read-antifragile-01', '안티프래질', '🌪'],
  ].map(([id, bookTitle, emoji]) => ({ id, bookTitle, emoji })),
  cinemaCards: [
    ['film-martian-01', '마션', '🥔'], ['film-apollo13-01', '아폴로 13', '🔧'],
    ['film-snowpiercer-01', '설국열차', '🚂'], ['film-interstellar-01', '인터스텔라', '🕰'],
    ['film-flight-01-arrival', '컨택트', '🌀'], ['film-flight-02-moneyball', '머니볼', '⚾'],
    ['film-flight-03-spotlight', '스포트라이트', '📰'], ['film-flight-04-sully', '설리: 허드슨강의 기적', '✈️'],
    ['film-flight-05-her', '그녀', '🎧'], ['film-flight-06-minority-report', '마이너리티 리포트', '🔮'],
    ['film-flight-07-the-farewell', '페어웰', '🤝'], ['film-flight-08-apollo11', '아폴로 11', '🌕'],
    ['film-flight-09-parasite', '기생충', '🏚️'], ['film-flight-10-ford-ferrari', '포드 V 페라리', '🏁'],
    ['film-flight-11-perfect-days', '퍼펙트 데이즈', '🧹'], ['film-flight-12-first-man', '퍼스트맨', '🚀'],
  ].map(([id, filmTitle, emoji]) => ({ id, filmTitle, emoji })),
}

export const routineCases = [
  ['case-vanishing-points-01', '사라지는 적립금', 5],
  ['case-all-red-morning-01', '모든 신호가 빨간불이 된 아침', 5],
  ['case-flight-01-cold-room', '얼지 않은 백신', 5],
  ['case-flight-02-museum-light', '밤마다 밝아지는 전시실', 5],
  ['case-flight-03-fab-queue', '사라진 웨이퍼 17장', 5],
  ['case-flight-04-shelter-map', '지도에는 빈 대피소', 5],
  ['case-flight-05-greenhouse-rain', '비 오는 날의 관수', 5],
  ['case-flight-06-water-alarm', '조용한 탁도 경보', 5],
].map(([id, title, dayCount]) => ({ id, title, days: Array(dayCount).fill(null) }))
