문서 상태: 작성완료

# TKT-109 `[FE]` 여정 노선도 — 지리 충실형 순환선 + 구간 클릭 일차 카드

- 상태: backlog (TKT-102 r7 목업 승인 후 ready, TKT-108 컬렉션 전환 뒤)
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
