문서 상태: 작성완료

# REV-TKT-246-r1 — 통과

- 게이트: TKT-243 과 동일 실행(같은 MissionPage). 결과 카드 375 캡처 확인 — v-html 없음, 404 면 숨김.
- 형식 정합: grade.py status = passed/failed/error/skipped, 카드는 passed·skipped 외를 실패로 — 일치. [구체화 질문] 답변 완료.
- 위험: 미션 탭 진입 시 raw.githubusercontent.com 요청 1회(공개 주소, TKT-239 와 무관).

판정: 블로커 0 → finished.
