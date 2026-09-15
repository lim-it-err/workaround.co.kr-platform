문서 상태: 작성완료

# TKT-158 `[콘텐츠]` Advisor 스와이프 카드 20장 — Java 21·Spring Boot 3

- 상태: ready · P3 · 담당: codex-6/codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: U-37·D-023. 스와이프(코드 한 조각 → 판정 → 이유)는 [유지] 판정. 현재 카드는 일반 CS 중심 — Advisor 의 원 목적(Java 21 도메인 코딩)에 맞는 덱이 없다.
- scope: **새 파일** `data/swipeCardsJava21.js`, `games/practiceCatalog.js` 등록(새 게임 1개), E2E.

## 카드 규칙
코드 ≤8줄 · 판정(좋다/고친다) · 이유 한 문장 · 해설 ≤2문장. 정답 편향 금지(좋다 10 : 고친다 10). 주제: record·sealed·switch 패턴 매칭·virtual threads·`@Transactional` 경계·Optional 남용·불변 컬렉션·`var` 남용.

## 완료 조건
1. [ ] 연습 목록 +1 게임, 20장 완주 E2E, 완료 후 한 줄 결과·오늘 복귀.
2. [ ] 각 카드의 코드가 컴파일 가능한지 자체 검토 결과(불가 시 의도된 오류로 표시) 티켓에.
3. [ ] 46+ 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
