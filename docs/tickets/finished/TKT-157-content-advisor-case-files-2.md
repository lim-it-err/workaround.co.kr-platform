문서 상태: 작성완료

# TKT-157 `[콘텐츠]` Advisor 사건 파일 신규 2편 — 중복 결제·환율 캐시

- 상태: finished (2026-09-16, PM r1 통과) · P3 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: U-37·D-023. 사건 파일 8편(5일 단서·마지막 날 판정) 구조는 유지 가치 확인(UX-ADVISOR Case [유지]).
- scope: **새 파일** `data/caseFilesSeries2.js`, `data/sampleCaseFiles.js` 는 `extraCaseFiles` 패턴으로 import 한 줄만 추가(기존 편 수정 금지), E2E.

## 편 구성 규칙
5일 단서 · 미끼(red herring) ≥2 · 단서는 전부 사실 · 근본 원인 1개 · 해설에 원인 코드/설정 한 줄. 합성 데이터이며 실제 기관·서비스와 무관함을 파일 머리에.

## 주제 2편
1. **두 번 결제된 비네트** — 결제 재시도·멱등키 부재·타임아웃 이중 처리.
2. **환율이 밤새 바뀐다** — 캐시 TTL·타임존·배치 순서.

## 완료 조건
1. [x] `/learn#cases` 목록 +2, 각 편 5일 몰아보기 → 판정 → 해설 E2E 1건씩.
2. [x] 기존 8편 diff 0, 46+ 그린.

## 질문/에스컬레이션
- 없음.

## 구현 내역
- 합성 데이터임을 파일 머리에 명시한 `caseFilesSeries2.js`에 `두 번 결제된 비네트`와 `환율이 밤새 바뀐다`를 추가했다. 각 편은 5일 단서·사실인 미끼 2개 이상·단일 정답·해설의 원인 코드/설정 한 줄을 갖춘다.
- `sampleCaseFiles.js`는 기존 8편 배열을 건드리지 않고 import 1줄과 마지막 spread 1곳만 추가했다. 단위 테스트가 기존 8개 ID 순서와 신규 2편의 후행 결합을 고정한다.
- `/learn#cases`를 사건 파일 필터로 연결했다. 신규 사건은 기존 연습 카탈로그의 사건 게임에도 포함되므로 사건 파일 10편·연습 133판·통합 인덱스 186개로 정합화했다.
- 신규 E2E 3건은 목록 +2와 각 편의 5일 몰아보기 → 정답 판정 → 해설/에필로그, 375px overflow 0을 검증한다.
- 공유 파일: `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue`
- 공유 파일: `services/advisor/frontend/src/modules/missions/store/__tests__/learnCatalog.spec.js`
- 공유 파일: `services/advisor/frontend/e2e/learn-index.spec.ts`
- 공유 파일: `services/advisor/frontend/e2e/core-flows.spec.ts`
- 공유 파일: `services/advisor/frontend/e2e/advisor-surfaces.spec.ts`

## 검증
- `npm run test:unit` — 16 files, **95/95 통과**.
- `npm run test:e2e -- --workers=1` — Chromium **59/59 통과**.
- `npm run build` — **118 modules**, 경고 0.
- 375px 다크 실렌더 2장을 육안 확인했고 두 편 모두 판정·해설이 가로 넘침 없이 읽힌다.
- 보호 콘텐츠 3파일 `git diff --exit-code` 통과. `sampleCaseFiles.js` diff는 import 1줄과 spread 1곳뿐이다.
- 미검증: Safari/WebKit·VoiceOver·실 Pages. commit/push 없음.

## 리뷰 기록
- 없음.
- 2026-09-16 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-157-r1.md`.
