문서 상태: 작성완료

# TKT-130 `[FE]` Advisor 흐름 결함 — Probe 순서·기내 빈 상태 복구·결과→기록

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-121 need_review 시. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-surfaces-spec.md` §3·§5 단계 4, `docs/reviews/UX-ADVISOR-2026-09-14.md` §3 우선순위 3·5
- scope: `services/advisor/frontend/src/modules/missions/pages/{ProbeGamePage,InflightPage,ReviewPage,PracticeGamePage}.vue`, 관련 store·테스트(콘텐츠 파일 불가침)

## 목표
1. Probe: 상황 → 관측 → **결과 옆 가설** → 결말 순서로 재배치. 학습 규칙(가설 선택 후 결말)은 보존, 위로 되돌아가라는 안내 제거.
2. 기내: 빈 결과(예: `3분·운영`)에 실제 원인에 맞는 `시간 늘리기` / `조건 초기화` 를 제공, 빈 상태에서 바로 복구.
3. 결과/리뷰 완료 화면: `기록에 저장됨` + `내 기록 보기`, 시즌 변화도 같은 요약에.

## 완료 조건
1. [ ] Probe 15판 E2E 1건: 관측 후 다음 행동이 스크롤 없이 인접.
2. [ ] 기내 빈 상태 → 복구 1회 조작으로 결과 ≥1.
3. [ ] 리뷰 완료 → 기록까지 1회 이하 동작.
4. [ ] unit/E2E 회귀 그린, 375/1440.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
