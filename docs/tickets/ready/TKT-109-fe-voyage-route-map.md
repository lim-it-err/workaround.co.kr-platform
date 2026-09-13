문서 상태: 수정중

# TKT-109 `[FE]` 여정 노선도 — 지리 충실형 순환선 + 구간 클릭 일차 카드

- 상태: started (PO 2026-09-14 "홈페이지 다 목업으로 대체" — r7 목업 `mockups/voyage-route.html` 이 스펙, 브랜치 codex/v0.7.0-tone; TKT-108 finished 후 착수)
- 우선순위: P1
- 담당: codex-1 (FE)
- 관련 스펙: `design/voyage-route-map-spec.md` (단일 진실), `design/voyage-collection-spec.md` §1-2
- scope: `frontend/src/components/voyage/**`(신규 VoyageRouteMap.vue 등), `frontend/src/data/voyages/**`, `frontend/src/styles.css`, 테스트

## 목표
스펙 §1~§4(1~5번). 회고 모드(§4-6)·노선망(§4-7)은 후속 분할.

## 완료 조건
1. 9개 도시 실좌표 SVG, 구간=일차, 지나온/남은/현재 위치 표현.
2. 구간 hover 툴팁·click 카드, 역 click 도시 카드, 카드↔지도 양방향 연동, 키보드 접근.
3. meals/spend/photos 렌더(빈 데이터 안전), 구글 지도 링크는 새 탭.
4. 기존 여행 화면·테스트 회귀 0, build, 375px.

## 구현 메모

- 인라인 SVG `<text>` 안에 HTML 태그 금지(`<tspan>` 만). 툴팁 `pointer-events:none`, 선 `pointer-events:stroke`.
