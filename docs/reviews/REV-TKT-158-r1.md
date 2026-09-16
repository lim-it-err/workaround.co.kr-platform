문서 상태: 작성완료

# REV-TKT-158-r1 — Advisor 스와이프 카드 20장 Java 21·Spring Boot 3 [콘텐츠] (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-16. 리뷰어 초안 없음 — PM 직접.
- PM 게이트(2026-09-16 아침, 워킹 트리 = 147r2·157·158 + 미커밋 146·134·152~156): 메인 Pages-base build 49 · unit 25/25 · splash **7/7**(최악 난수 케이스 포함)·Junction 4·staticRouting 4·Blog 2·RouteMap 4 · WritingStudio **11/13**(375 dark/light `.writing-room` 간헐 1px overflow — 코드 결함, TKT-164 로 병합 전 처리) · ToneTools 12/12 · Advisor build 119(경고 0) · unit **98/98** · Playwright **60/60**.
- 규칙 대조: 20장, 판정 `좋다` 10 · `고친다` 10(unit 고정), 코드 ≤8줄·이유 1문장·해설 ≤2문장, 카드별 `compileStatus`/`compileNote` 필드로 컴파일 자체 검토 기록(의도된 오류 1: `java21-switch-dominated-pattern`). 표본 2장(record 컴팩트 생성자 / 가변 목록 별칭) 내용 정확. 독립 게임 `java21-spring3-swipe` 등록, 완주 후 한 줄 결과·`오늘로 돌아가기`.
- [제안] 카드 `explain` 이 Spring 프록시·carrier 고정 같은 실행 의미를 다루는데 화면에는 코드만 보인다 — 다음 덱부터 `topic` 을 행 kicker 로 노출 검토.
- 커밋: Advisor 묶음(152~158).
