문서 상태: 작성완료

# TKT-107 `[FE]` 미스터리 트레인 격납고에 화이트채플 캐비닛 추가

- 상태: ready (TKT-078 need_review 진입 시 착수 — 의존성 완화)
- 우선순위: P1 (PO 2026-09-13 "화이트채플도 거기에 들어가게")
- 담당: codex-1 (FE)
- 의존: TKT-078 [INFRA] (Pages 산출물에 whitechapel standalone 포함 — PM 메모 참조)
- 근거: D-012·D-013 (재미 컨테이너는 S 하나)
- scope: `frontend/src/App.vue`(simhub 섹션), `frontend/src/data/lines.js`(S rowStops), `frontend/src/styles.css`

## 목표
격납고(simhub)에 세 번째 캐비닛 **화이트채플**(추리 게임) 카드 — 정적 진입 `entryPath: '/arcade/whitechapel/'` (advisor 와 같은 D-006 방식). 카피는 한 줄, 통계 없음. 추후 플래시 게임(TKT-028)도 같은 카드 패턴으로 들어온다 — 카드 데이터를 배열로.

## 완료 조건
1. 격납고 카드 3개(엘리베이터·택시·화이트채플), 화이트채플 클릭 시 `/arcade/whitechapel/` 진입·복귀.
2. build + 시뮬 회귀 그린, 375px.
