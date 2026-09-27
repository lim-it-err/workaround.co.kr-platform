문서 상태: 작성완료

# TKT-158 `[콘텐츠]` Advisor 스와이프 카드 20장 — Java 21·Spring Boot 3

- 상태: finished (2026-09-16, PM r1 통과) · P3 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 미기동으로 codex-1 수행. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: U-37·D-023. 스와이프(코드 한 조각 → 판정 → 이유)는 [유지] 판정. 현재 카드는 일반 CS 중심 — Advisor 의 원 목적(Java 21 도메인 코딩)에 맞는 덱이 없다.
- scope: **새 파일** `data/swipeCardsJava21.js`, `games/practiceCatalog.js` 등록(새 게임 1개), E2E.

## 카드 규칙
코드 ≤8줄 · 판정(좋다/고친다) · 이유 한 문장 · 해설 ≤2문장. 정답 편향 금지(좋다 10 : 고친다 10). 주제: record·sealed·switch 패턴 매칭·virtual threads·`@Transactional` 경계·Optional 남용·불변 컬렉션·`var` 남용.

## 완료 조건
1. [x] 연습 목록 +1 게임, 20장 완주 E2E, 완료 후 한 줄 결과·오늘 복귀.
2. [x] 각 카드의 코드가 컴파일 가능한지 자체 검토 결과(불가 시 의도된 오류로 표시) 티켓에.
3. [x] 46+ 그린.

## 구현 기록
- `swipeCardsJava21.js`에 record·sealed·switch 패턴·virtual threads·`@Transactional`·Optional·불변 컬렉션·`var` 8주제 20장을 추가했다. 판정은 `좋다` 10장·`고친다` 10장이고 코드 8줄 이하·이유 1문장·해설 2문장 이하를 단위 테스트로 고정했다.
- `java21-spring3-swipe`를 독립 연습 게임으로 등록했다. 범용 연습 화면은 이 덱의 `좋다/고친다` 선택지를 읽고, 세션 20장을 모두 풀면 `20장 중 n장의 판정을 맞혔습니다.` 한 줄과 `오늘로 돌아가기`를 보여 준다.
- 통합 인덱스는 전체 206개·독립 연습 153판으로 갱신했다. 보호 콘텐츠 3파일은 수정하지 않았다.

## 카드별 컴파일 자체 검토
- `java21-record-money` — 컴파일 가능(문맥 타입·import 충족 기준).
- `java21-record-list-alias` — 컴파일 가능; 가변 별칭은 실행 의미 결함.
- `java21-record-jakarta-validation` — Spring Boot 3 Jakarta Validation import 기준 컴파일 가능.
- `java21-sealed-payment` — Java 21 sealed·record 계층으로 컴파일 가능.
- `java21-sealed-nonsealed-hole` — 컴파일 가능; 의도와 다른 확장성 문제.
- `java21-switch-record-pattern` — Java 21 record pattern·sealed 완전성 기준 컴파일 가능.
- `java21-switch-null-explicit` — 두 상수 enum 문맥에서 컴파일 가능.
- `java21-switch-dominated-pattern` — **의도된 컴파일 오류**; `Object`가 뒤 `String` case를 지배함.
- `java21-virtual-executor` — Java 21 virtual-thread executor·`CompletableFuture.join` 기준 컴파일 가능.
- `java21-virtual-synchronized-io` — 컴파일 가능; Java 21 carrier 고정 위험.
- `java21-virtual-threadlocal-buffer` — 컴파일 가능; 대용량 ThreadLocal 메모리 문제.
- `spring3-tx-order-outbox` — Spring repository 문맥 기준 컴파일 가능.
- `spring3-tx-private-self-call` — 컴파일 가능; 프록시 우회 실행 의미 결함.
- `spring3-tx-remote-call` — 컴파일 가능; 로컬 DB·원격 결제 원자성 결함.
- `java21-optional-boundary` — repository·예외 타입 문맥 기준 컴파일 가능.
- `spring3-optional-entity-field` — 컴파일 가능; JPA 매핑 부적합.
- `java21-immutable-copyof` — Java 21 `List.copyOf` 기준 컴파일 가능.
- `java21-unmodifiable-view` — 컴파일 가능; 원본 변경이 비치는 뷰 문제.
- `java21-var-obvious-constructor` — Java 21 로컬 변수 추론으로 컴파일 가능.
- `java21-var-hidden-result` — 반환 타입에 `isRetryable` 계약이 있는 문맥에서 컴파일 가능.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 구현 검증: Advisor unit **98/98**, Chromium E2E **60/60**(신규 20장 완주 1건 포함), production build **119 modules**, `git diff --check` 통과. 보호 콘텐츠 3파일 diff 0. Safari/WebKit·VoiceOver·실 Pages는 미검증. commit/push 없음.
- 2026-09-16 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-158-r1.md`.
