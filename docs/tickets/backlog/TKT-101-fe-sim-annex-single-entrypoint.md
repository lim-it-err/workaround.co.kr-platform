문서 상태: 작성완료

# TKT-101 `[FE]` 시뮬 묶음 — 노선도 단일 진입 "미스터리 트레인" (D-012)

- 상태: ready
- 우선순위: P1 (PO 지시 2026-09-09)
- 담당: codex-1 (FE)
- 의존: 없음 (TKT-100 과 파일 겹침 주의 — 순차 권장)
- 관련 결정: `docs/decisions.md` D-012
- scope: `frontend/src/data/lines.js`, `frontend/src/App.vue`(simhub 섹션·노선 상태·클릭 내비), `frontend/src/styles.css`

## 목표

PO: "elevator simulator 랑 taxi district lab 는 그냥 약간 재미있는 공간 느낌으로 묶어서 — 노출을 많이 하지 말고 하나의 entrypoint 로. 제목명은 기믹으로(영화·노래·은유)."

1. **노선도에서 E·T 지선 제거** → 단일 지선 **S "미스터리 트레인"** (page: `simhub`) 하나만 남긴다. 명칭 근거·대안은 D-012.
2. 지선 표기는 은근하게: sub 라벨 `심야 임시 운행`. 정식 노선들과 동급으로 광고하지 않는다 (숨은 재미 공간의 톤).
3. **simhub 페이지 = 격납고**: 헤더를 "미스터리 트레인"으로, banner-stats 통계 타일 제거(카피 다이어트), 엘리베이터·택시 2장의 카드만 (이후 아케이드 합류 여지).
4. `/elevator` `/taxi` 직접 URL 은 유지 (딥링크 회귀 금지) — 노선도·route-rows 노출만 제거.

## 완료 조건

1. 환승 홀 노선도·route-rows 에 E·T 가 없고 S 지선 1개 클릭 시 simhub 진입.
2. simhub 에서 두 시뮬 진입·복귀 정상, `/elevator` `/taxi` 딥링크 정상.
3. build 그린 + 시뮬 관련 기존 테스트 그린.

## 구현 메모

- `lines.js` 가 노선 단일 소스 — E·T 항목 삭제, S 항목 신설(빈 우상단 슬롯 좌표 재사용: E 자리 `M300 230 L440 158 H600` 권장, T 자리는 비워 P 와 간격 확보).
- 노선색: 기존 `--line-e`/`--line-t` 토큰은 각 시뮬 페이지 내부용으로 보존, S 지선은 중립/신규 토큰 1개.
- App.vue lineStatuses 의 E·T 행 제거, S 행 1개로 요약 (`격납고 2대 대기` 수준의 짧은 카피).

## 질문/에스컬레이션

(비어 있음)

## 리뷰 기록

(비어 있음)
