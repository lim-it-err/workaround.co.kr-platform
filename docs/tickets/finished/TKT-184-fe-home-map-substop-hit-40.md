문서 상태: 작성완료

# TKT-184 `[FE]` 홈 노선도 소역 히트 원 — 1440 에서 40px 이상(r=26)

- 상태: finished · **P1** · 담당: codex-1 · 의존: TKT-179 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: REV-TKT-179-r2 — 투명 히트 원 r=20 은 1440 에서 31.5px(SVG 스케일 0.79). UX-179 I2 의 40px 요구 미충족(PM 티켓 오기 "r≥20").
- scope: `frontend/src/components/JunctionMap.vue`(소역 히트 원 r → 26), `JunctionMap.e2e.mjs`(1440 소역 13개 bbox ≥40 단언, 인접 소역 히트 원 겹침 시 레이어 우선 규칙 유지).

## 완료 조건
1. [x] 1440 다크/라이트 소역 13개 히트 bbox ≥40×40, 라벨 중심 클릭 소유권 13/13 유지, 글자·노선 겹침 0.
2. [x] Junction E2E·unit 그린.

## 구현 내역
- 소역의 투명 히트 원을 `r=26`으로 키웠다. 확대된 원끼리 겹치는 구간에서도 뒤쪽 원이 앞쪽 라벨 클릭을 가리지 않도록 히트 원 레이어를 먼저, 소역 점·라벨 레이어를 나중에 그렸다.
- E2E에 소역 13개의 `r≥26`·`pointer-events: all`과 1440 실렌더 bbox `40×40px 이상` 단언을 추가했다. 기존 라벨 중심 클릭 소유권 13/13 및 세부 역이 큰 역보다 앞서는 규칙도 유지한다.
- 공유 파일: `frontend/src/components/JunctionMap.vue`, `frontend/src/components/JunctionMap.e2e.mjs` (TKT-179의 미커밋 변경 위에 후속 보완).

## 검증
- `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/`: 각각 55 modules, 성공.
- `node --test src/components/JunctionMap.e2e.mjs`: 375/1440 × dark/light 4/4. 1440 소역 13개 bbox 40×40px 이상, 라벨 클릭 소유권 13/13, 글자·노선 겹침 0, 가로 overflow 0.
- 전체 unit 27/27, `git diff --check` 성공.
- 실렌더 4장 직접 확인: `/private/tmp/tkt184-check/junction-{375,1440}-{dark,light}.png`. 양 테마에서 지도·라벨·노선 시각 회귀가 없음을 확인했다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-184-r1.md`.
- 없음.
