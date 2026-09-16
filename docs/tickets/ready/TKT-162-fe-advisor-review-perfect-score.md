문서 상태: 작성완료

# TKT-162 `[FE]` Advisor 리뷰 — 만점(감점 0)이면 "먼저 고칠 것"·재제출을 숨긴다

- 상태: ready · P2 · 담당: codex-1(Advisor 레인) · 의존: TKT-154 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: `docs/reviews/UX-TKT-154-r1.md` [중요] I1 — `ReviewPage.vue:118,139,145`: `firstFix` reduce 가 감점 0 이어도 첫 항목을 고르고, 리뷰만 있으면 `코드 고쳐서 재제출` 이 주 CTA. 만점 사용자에게 "무엇을 고치라는지" 모호.
- scope: `services/advisor/frontend/src/modules/missions/pages/ReviewPage.vue`, `e2e/review-first-fix.spec.ts`(만점 케이스 추가).

## 완료 조건
1. [ ] 모든 루브릭 항목이 배점과 같으면 `먼저 고칠 것` 블록 비노출, 대신 `기준을 모두 충족했습니다` 한 줄.
2. [ ] 그 상태의 주 CTA = 코스 다음 항목(코스 문맥) 또는 `배우기로`, `다시 제출` 은 보조(hairline 링크).
3. [ ] 감점이 있는 기존 3상태 E2E 회귀 0 + 만점 E2E 1건(합성 리뷰 30/20/20/15/15 만점), 375 첫 스크롤 캡처.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
