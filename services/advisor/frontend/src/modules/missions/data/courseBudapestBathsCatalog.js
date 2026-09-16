// 코스 목록·시간표용 요약. 실제 미션·게임·시뮬 데이터는 각 상세 라우트에서 읽는다.
export const courseBudapestBathsCatalog = {
  id: 'budapest-baths',
  title: '부다페스트 온천 큐',
  subtitle: '따뜻한 물 앞에서 줄은 왜 생기나',
  theme: '대기열 · 용량 · 경로',
  emoji: '♨️',
  intro: '세체니 온천의 아침 입장부터 풀 혼잡, 표 선택, 이용 예절, 물 성분, 부다 왕궁 오르막까지. 여행자가 마주치는 여섯 장면을 큐와 제약 조건으로 다시 읽는 짧은 코스입니다.',
  missions: [
    ['budapest-1-morning-entry', 'sim', '08–09시 입장 큐', 30],
    ['budapest-2-pool-load', 'coding', '16개 풀의 시간대 혼잡', 80],
    ['budapest-3-ticket-plan', 'coding', '라커·캐빈·패스트트랙 선택', 70],
    ['budapest-4-etiquette', 'game', '온천 이용 예절 15장', 20],
    ['budapest-5-water-signal', 'game', '물 성분 가설 좁히기', 20],
    ['budapest-6-castle-route', 'coding', '푸니쿨라 vs 도보 경로', 80],
  ].map(([id, kind, title, minutes]) => ({ id, kind, title, minutes })),
}
