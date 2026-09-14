문서 상태: 작성완료

# TKT-127 `[FE]` 여행 화면 일원화 — 노선도 단일 화면 (오늘·기록 흡수, 출발 전 역)

- 상태: `finished` (REV-TKT-127-r1 통과, PM 2026-09-14)
- 스펙: D-019, `design/voyage-route-map-spec.md`(§2·§2-1·§4), `design/voyage-collection-spec.md`, 목업 `mockups/voyage-route.html`
- scope: `frontend/src/components/Voyage*.vue`, `components/voyage/**`, `frontend/src/App.vue`(V 진입), `frontend/src/data/voyages/**`(plan/actual 병합 스키마), 테스트

## 목표
1. 여행 선택(108 목록) → **노선도 화면 하나**. 오늘의 여행·여행 기록 화면을 폐기하고 그 내용을 일차 카드 상태(지나온=실제 기록, 오늘=계획+지금 선, 남은=계획 흐리게)로 흡수. 홈·목록의 "준비·오늘·기록" 진입은 "노선도" 하나로.
2. **출발 전 역(DAY 0)**: 체크리스트·예산·결정 트레일·사전 결제를 그 역의 시트로.
3. 모바일 첫 진입: 여행 중이면 지도 접힘 + 오늘 카드 우선(지도 탭으로 펼침). 종착 후엔 기록 상태.
4. 일차 데이터 plan/actual 병합, 저장키 이행(108 패턴). 톤 원칙 1~6 적용(구 역명판·배너 제거).

## 완료 조건
1. `/voyage` → 목록 → 노선도 단일 화면, 옛 오늘/기록 라우트는 노선도의 해당 상태로 리다이렉트. 2. DAY 0 역 시트에 체크리스트·예산 표시·편집 회귀 0. 3. 기존 voyage 테스트 + 109 E2E 그린, 375 오버플로 0.

## 구현 결과

- `/voyage`의 현재 여행 직행과 목록의 모든 여행 선택을 `VoyageRouteMap` 한 화면으로 일원화했다. 기존 `prep`·`daily`·`archive` 진입 요청도 각각 DAY 0·오늘·마지막 기록 일차로 흡수한다.
- 모바일 여행 중 첫 진입은 오늘 카드가 먼저이며 노선도는 접힌다. 데스크톱은 지도와 일차 카드를 나란히 유지한다. 지난 일차는 실제 식사·지출·사진과 브라우저 자동 저장 메모·다녀옴 표시, 오늘은 계획+지금 선+기록, 미래는 흐린 계획으로 구분했다.
- DAY 0에 체크리스트 편집, 예산, 사전 결제, 결정 기록을 모았다. 구 `voyage:<id>:archive` 메모·스탬프는 `voyage:<id>:days`의 날짜별 actual 기록으로 한 번 이행하며 새 값을 덮어쓰지 않는다.
- 데이터 파일의 모든 `days[]`에 `plan`·`actual`을 보장하는 `defineVoyage` 정규화 계층을 추가하고 기존 필드는 호환용으로 유지했다.
- 구 역명판 코드·전폭 `StationHeader`를 제거하고 여행명·현재 상태·일차 카드가 먼저 읽히는 텍스트+선 구조로 바꿨다. 내용이 없는 지난 여행도 같은 상단 탐색 구조의 빈 기록 화면으로 연결한다.

## [구체화 질문] 구현 경계

- 홈의 `준비·오늘·기록` 서브링크 문구는 이 티켓 scope 밖 `frontend/src/data/lines.js`이며, 이미 finished 판정된 TKT-111의 커밋 범위다. 세 링크는 현재도 모두 `/voyage` 단일 화면으로 합류하므로 동작은 충족했고, 문구를 겹쳐 수정하지 않았다. 보드상 후행 TKT-112(여행 목록+노선도 톤 정합)에서 `노선도` 하나로 정리하는 경계가 맞는지 PM 확인이 필요하다.
- 별도 `/voyage/today`·`/voyage/archive` 공개 URL은 기존 코드에 존재하지 않았다. 완료 조건의 “옛 라우트”는 `VoyageView.openVoyage(..., requestedView)`의 내부 `prep/daily/archive` 진입으로 해석해 각각 통합 화면 상태로 리다이렉트했다.

## 검증

- Pages base build: `npm run build -- --base=/workaround.co.kr-platform/` 통과(48 modules).
- 전체 프런트 unit: 19/19 통과. 여행 데이터·컬렉션·저장 이행·노선도 단위 검증 포함.
- Chromium: `VoyageRouteMap` 375 dark·1440 light 2/2, `VoyageCollection` 375 dark·1440 light 2/2 통과. API 요청·브라우저 오류/경고·375px 가로 overflow 0.
- 실제 캡처로 375px 첫 화면의 오늘 카드 우선/지도 접힘, DAY 0 전체 시트, 1440px 지도·일차 카드 병렬 배치를 직접 확인했다.
- Safari/WebKit·실제 GitHub Pages 배포는 미검증. commit/push 없음.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-127-r1.md`. 홈 서브링크·지도 접힘 정책은 112.
