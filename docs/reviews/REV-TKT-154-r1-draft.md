문서 상태: 작성완료

# REV-TKT-154-r1-draft — Advisor 리뷰 화면: 먼저 고칠 것 1개·상태별 CTA (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-154(UX-ADVISOR-2026-09-14 Review 개선). 의존 TKT-130 finished 확인.

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `git diff -- services/advisor/frontend/src/modules/missions/pages/ReviewPage.vue`를 직접 읽고 상태별 CTA 3분기를 코드로 확인: `제출하러 가기`(미제출) / `코드 고쳐서 재제출`(재제출 필요, 2곳) — 조건 분기가 실제로 존재.
- Advisor build 117 modules 경고 0, unit은 TKT-152 리뷰의 [참고]와 동일(practiceCatalog 무관 불안정 제외 91/91).
- Advisor 전체 E2E **54/54 통과**, 그중 `review-first-fix.spec.ts` 3건("미제출 리뷰는 제출 CTA만", "제출 후 첫 화면은 점수·최대 감점 항목·재제출 CTA를 375px 안에", "실제 다음 코스 항목만 다음 미션이라 부르고 목록 복귀는 배우기로") 전부 통과 — 티켓이 말한 "신규 3건"과 정확히 일치.
- 콘텐츠 불가침 3파일 diff 0 확인(`git status`).

## 완료 조건 대조

1. **미제출: 재제출/다음 미션 비노출, 제출하러 가기** — `review-first-fix.spec.ts` 첫 테스트로 확인.
2. **다음 미션 목적지가 실제 다음일 때만 그 라벨, 아니면 배우기로** — 세 번째 테스트로 확인.
3. **375 첫 스크롤에 점수·고칠 것·CTA 모두** — 두 번째 테스트로 확인.
4. **E2E 3건, 46+ 그린** — 54/54로 상회 확인.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.** (TKT-152의 지연 로드 변경과 같은 파일을 공유하므로 커밋 시 경계 확인 필요 — 티켓 자체가 이미 "TKT-152 변경 보존" 명시.)
