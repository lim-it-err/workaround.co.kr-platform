문서 상태: 작성완료

# TKT-127 `[FE]` 여행 화면 일원화 — 노선도 단일 화면 (오늘·기록 흡수, 출발 전 역)

- 상태: ready · P1 (D-019) · 담당: codex-1 · 의존: TKT-109 finished, TKT-110 finished. 브랜치 codex/v0.7.0-tone. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: D-019, `design/voyage-route-map-spec.md`(§2·§2-1·§4), `design/voyage-collection-spec.md`, 목업 `mockups/voyage-route.html`
- scope: `frontend/src/components/Voyage*.vue`, `components/voyage/**`, `frontend/src/App.vue`(V 진입), `frontend/src/data/voyages/**`(plan/actual 병합 스키마), 테스트

## 목표
1. 여행 선택(108 목록) → **노선도 화면 하나**. 오늘의 여행·여행 기록 화면을 폐기하고 그 내용을 일차 카드 상태(지나온=실제 기록, 오늘=계획+지금 선, 남은=계획 흐리게)로 흡수. 홈·목록의 "준비·오늘·기록" 진입은 "노선도" 하나로.
2. **출발 전 역(DAY 0)**: 체크리스트·예산·결정 트레일·사전 결제를 그 역의 시트로.
3. 모바일 첫 진입: 여행 중이면 지도 접힘 + 오늘 카드 우선(지도 탭으로 펼침). 종착 후엔 기록 상태.
4. 일차 데이터 plan/actual 병합, 저장키 이행(108 패턴). 톤 원칙 1~6 적용(구 역명판·배너 제거).

## 완료 조건
1. `/voyage` → 목록 → 노선도 단일 화면, 옛 오늘/기록 라우트는 노선도의 해당 상태로 리다이렉트. 2. DAY 0 역 시트에 체크리스트·예산 표시·편집 회귀 0. 3. 기존 voyage 테스트 + 109 E2E 그린, 375 오버플로 0.
