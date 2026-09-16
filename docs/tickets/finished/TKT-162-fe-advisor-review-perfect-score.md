문서 상태: 작성완료

# TKT-162 `[FE]` Advisor 리뷰 — 만점(감점 0)이면 "먼저 고칠 것"·재제출을 숨긴다

- 상태: finished (2026-09-16, PM r1 통과) · P2 · 담당: codex-1(Advisor 레인) · 의존: TKT-154 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: `docs/reviews/UX-TKT-154-r1.md` [중요] I1 — `ReviewPage.vue:118,139,145`: `firstFix` reduce 가 감점 0 이어도 첫 항목을 고르고, 리뷰만 있으면 `코드 고쳐서 재제출` 이 주 CTA. 만점 사용자에게 "무엇을 고치라는지" 모호.
- scope: `services/advisor/frontend/src/modules/missions/pages/ReviewPage.vue`, `e2e/review-first-fix.spec.ts`(만점 케이스 추가).

## 완료 조건
1. [x] 모든 루브릭 항목이 배점과 같으면 `먼저 고칠 것` 블록 비노출, 대신 `기준을 모두 충족했습니다` 한 줄.
2. [x] 그 상태의 주 CTA = 코스 다음 항목(코스 문맥) 또는 `배우기로`, `다시 제출` 은 보조(hairline 링크).
3. [x] 감점이 있는 기존 3상태 E2E 회귀 0 + 만점 E2E 1건(합성 리뷰 30/20/20/15/15 만점), 375 첫 스크롤 캡처.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 2026-09-16 codex-1 구현: 미션 루브릭의 모든 항목이 빠짐없이 존재하고 점수가 배점과 정확히 같을 때만 만점 상태로 판정한다. 양의 감점이 없는 항목은 `firstFix` 후보에서 제외했다.
- 만점 상태는 `기준을 모두 충족했습니다`와 코스의 실제 다음 항목(없으면 `배우기로`)을 주 CTA로 올리고, `다시 제출`은 배경 없는 40px hairline 링크로 낮췄다. 하단의 중복 다음 이동은 만점에서 숨겼다.
- 검증: Advisor build 119 modules(청크 경고 0), unit **98/98**, 집중 E2E **4/4**, 전체 Chromium E2E **61/61**. 375 dark 첫 스크롤·1440 light 전체 캡처에서 주 CTA·보조 링크 위계와 overflow 0을 직접 확인했다. Safari/WebKit·VoiceOver·실 Pages는 미검증이며 commit/push 없음.
- 2026-09-16 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-162-r1.md`.
