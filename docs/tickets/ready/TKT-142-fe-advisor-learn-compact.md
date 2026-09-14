문서 상태: 작성완료

# TKT-142 `[FE]` Advisor 배우기 — 첫 화면 축약(코스·이어 하던 것·필터), 목록은 펼침 뒤

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-129 finished. 브랜치 `codex/v0.7.0-tone`. 병합 뒤 반영 가능. **UX 1순위·[반박] 의무.**
- 근거: PO 2026-09-14 [PM 의문] 5 승인.
- scope: `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue`, `store/learnCatalog.js`(필요 시), `e2e/learn-index.spec.ts`. 콘텐츠 3파일 불가침.

## 목표
첫 화면 = 코스 2행 + `이어 하던 것`(있을 때) + 필터 4축 + `전체 181개 보기` 한 줄. 통합 목록은 필터를 하나라도 고르거나 `전체 보기` 를 누른 뒤 노출(30개 점진 유지). 딥링크 `/learn#practice` 등은 해당 필터가 걸린 상태로 목록 즉시 노출(129 계약 유지).

## 완료 조건
1. [ ] 375 첫 화면 스크롤 길이 현행 대비 1/3 이하(수치 기록), 목록 0개 노출.
2. [ ] 필터 선택·전체 보기·해시 딥링크 3경로 E2E. 129 E2E 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
