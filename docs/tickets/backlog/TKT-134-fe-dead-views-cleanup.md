문서 상태: 작성완료

# TKT-134 `[FE]` 죽은 뷰·프로토타입 블록 정리 — 렌더되지 않는 영어 눈썹 제거

- 상태: backlog · P3 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`.
- 근거: `docs/reviews/REV-TKT-128-r1.md` [제안], REV-TKT-128-r2.
- scope: `frontend/src/App.vue`(junction 프로토타입 블록 `QA Route`·`UI-v0.5.0 Junction`·`Prototype Lines`·`UX Pivot`·`Mobile Route`), `frontend/src/components/{VoyageDailyView,VoyageArchiveView}.vue`(외부 참조 0), `VoyageDaySession.vue`(참조 2 — 사용처 확인 후 판단), 관련 테스트

## 목표
정적 경로 8곳 어디에도 렌더되지 않는 템플릿·컴포넌트를 삭제해 원칙 4 잔존을 소스에서도 0 으로. 기능 변화 0.

## 완료 조건
1. [ ] 삭제 후 build·unit·E2E 그린, 8경로 렌더 diff 0(스크린샷 비교 또는 innerText 동일).
2. [ ] `grep -rn "\b[A-Z]{4,}\b"` 템플릿 잔존 목록이 데이터 토큰·약어(SVG·HTML·JSON·URL)만 남음.

## 질문/에스컬레이션
- 없음.

## PM 추가 (2026-09-14, REV-TKT-120-r1)
- `frontend/src/components/taxiDispatch.e2e.mjs` 복귀 단계가 TKT-114 에서 제거된 격납고 `.sim-annex` 를 찾아 실패 — 현재 격납고 구조(히어로·행)에 맞게 selector 갱신. 시뮬 로직 단언은 그대로.
