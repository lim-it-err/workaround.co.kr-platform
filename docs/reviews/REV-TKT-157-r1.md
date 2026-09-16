문서 상태: 작성완료

# REV-TKT-157-r1 — Advisor 사건 파일 신규 2편 [콘텐츠] (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-16. 리뷰어 초안 없음 — PM 직접(콘텐츠: 규칙 대조).
- PM 게이트(2026-09-16 아침, 워킹 트리 = 147r2·157·158 + 미커밋 146·134·152~156): 메인 Pages-base build 49 · unit 25/25 · splash **7/7**(최악 난수 케이스 포함)·Junction 4·staticRouting 4·Blog 2·RouteMap 4 · WritingStudio **11/13**(375 dark/light `.writing-room` 간헐 1px overflow — 코드 결함, TKT-164 로 병합 전 처리) · ToneTools 12/12 · Advisor build 119(경고 0) · unit **98/98** · Playwright **60/60**.
- 규칙 대조: 두 편(`두 번 결제된 비네트`·`환율이 밤새 바뀐다`) 모두 5일 단서·`options`·단일 `answerKey`(`unstable-idempotency-key`·`warm-before-import`)·해설의 원인 한 줄. 파일 머리에 합성 데이터 명시. 기존 8편 파일은 import 1줄 + spread 1곳만(diff 확인). `/learn#cases` 10편, 통합 인덱스 카운트 갱신은 158 과 함께 206.
- 커밋: Advisor 묶음(152~158).
