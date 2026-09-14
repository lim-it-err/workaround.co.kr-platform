문서 상태: 작성완료

# TKT-138 `[FE]` v0.7.0 릴리스 게이트 블로커 — taxi E2E 구 selector, 블로그 최근 글 제목 hit area

- 상태: ready · P1 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. **병합 전 필수** (AS-R009 §병합 전 닫아야 할 항목 2·3).
- scope: `frontend/src/components/taxiDispatch.e2e.mjs`(복귀 단계 selector만, 시뮬 로직 단언 무변경), `frontend/src/App.vue`·`styles.css`(블로그 허브 최근 글 제목 링크), `BlogTone.e2e.mjs`(단언 추가)

## 목표
1. `taxiDispatch.e2e.mjs:112` 가 TKT-114 에서 제거된 격납고 `.sim-annex` 를 기다려 4/5 red → 현행 격납고(`.tone-sim-page`, 히어로·행) 기준 복귀 단언으로 교체, **5/5 green**. 메인 전체 E2E 45/45.
2. `UX-TKT-113-r1 I1`: 블로그 허브 최근 글 제목 링크(`blog-text-link`) 실측 25.98px(모바일)/31.36px(데스크톱) → **실제 hit area ≥40px**(행 전체 이동 또는 padding/min-height), BlogTone E2E 에 375/1440 단언.

## 완료 조건
1. [ ] `NODE_PATH=services/advisor/frontend/node_modules node --test src/components/taxiDispatch.e2e.mjs` 5/5, 메인 전체 `*.e2e.mjs` 45/45(Pages-base dist).
2. [ ] 최근 글 제목 링크 bbox 높이 ≥40 (375·1440) E2E 단언, 시각 변화는 hairline·면 규칙 유지.
3. [ ] build·unit 그린. `공유 파일:` 기록.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
