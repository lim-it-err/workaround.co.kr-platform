문서 상태: 작성완료

# TKT-075

## 메타데이터

- 제목: UI 재구현 S5 - App.vue 컴포넌트 분해 정리
- 우선순위: P2
- 대상 버전: `chore`
- 상태: `backlog`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-075-ui-rebuild-s5-component-decomposition`

## 목표

슬라이스 S5를 구현한다. 약 4,352줄 단일 SFC 인 `frontend/src/App.vue`(스크립트 ~2,500 + 템플릿 ~1,840)를 스펙 §5 제안대로 점진 분해한다. 남은 페이지 뷰 셸을 `components/pages/*` 로 분리하고, 재사용 프리미티브(Roundel/LineCard/Wayfinding/ArrivalBar)와 컴포저블(useTheme/useBlogStore/useFlapBoard/useClock/useRuntimeState)을 추출하며, `data/lines.js` 를 단일 소스로 확립하고, `App.vue` 를 셸+라우팅으로 축소한다. 동작 회귀 없음이 수용 기준인 리팩터 슬라이스다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §5(App.vue 컴포넌트 분해 제안), §6(S5). 신설 디렉터리: `frontend/src/components/`(공용), `frontend/src/components/pages/`(페이지 뷰), `frontend/src/composables/`, `frontend/src/data/`.

1. 이미 도입된 프리미티브 정리 (스펙 §5 P1). StationHeader.vue(S1/TKT-071), StatusBadge.vue(S3/TKT-073), JunctionMap.vue + RouteRow.vue(S2/TKT-072)는 앞선 슬라이스에서 이미 `components/` 에 존재한다. 임포트 경로/props 를 정돈하고 중복을 제거한다.
2. 남은 프리미티브 추출 (스펙 §5 P1-4/6). `components/Roundel.vue`(노선 문자 배지 34/24px, `.roundel`/`.roundel.sm`, 배경=노선 코어색·흰 문자), `components/LineCard.vue`(§3.2, S4 simhub 실사용분을 프리미티브로 승격), `components/Wayfinding.vue`(§3.5A, 환승 홀 현재 위치 줄), `components/ArrivalBar.vue`(§3.5B, `.arrival-grid` 도착 정보 바)를 추출한다.
3. 페이지 뷰 셸 분리 (스펙 §5 P2). App.vue 의 각 `page` 분기를 `components/pages/*` 로 분리한다: `JunctionView.vue`, `SimHubView.vue`, `ElevatorStationView.vue`, `TaxiLabView.vue`, `WorkManagerView.vue`(내부 추가 분해 여지: `WorkLaneBoard`/`TicketDetailPanel`/`CommandGate`/`ActivityFeed`), `BlogHubView.vue`/`BlogArchiveView.vue`/`BlogPostView.vue`/`WritingStudioView.vue`, `RuntimeBoardView.vue`, `SplashBoard.vue`(스플래시 + 플랩 컨테이너 격리 — 플랩 엔진 로직은 TKT-070 소관, 컨테이너만 분리).
4. 데이터 단일 소스 (스펙 §5 P3-15). `data/lines.js`(S2/TKT-072 신설분)를 노선 단일 소스로 확립한다(코드/명/색토큰/페이지/상태/좌표/upcoming). JunctionMap·RouteRow·LineCard·Wayfinding 가 모두 이 배열을 구독하게 정리한다(D/P 추가는 이 파일 한 곳만 수정).
5. 컴포저블 추출 (스펙 §5 P3). `composables/useTheme.js`(테마 토글/localStorage `THEME_STORAGE_KEY`), `composables/useBlogStore.js`(posts/active slug/studio view, 기존 `BLOG_*_STORAGE_KEY`), `composables/useFlapBoard.js`(플랩 엔진 — TKT-070 과 조율, 지금은 자리/인터페이스만), `composables/useClock.js`, `composables/useRuntimeState.js` 로 상태/로직을 옮긴다.
6. App.vue 축소 (스펙 §5-20). `App.vue` 를 라우팅(`page` 스위치) + 전역 셸(테마/헤더/트랜지션)만 남긴다.
7. 분해 원칙 (스펙 §5 마지막). 각 슬라이스가 필요로 하는 컴포넌트만 추출한다는 원칙에 따라, S5는 남은 페이지 뷰 셸 분리 + `data/lines.js` 확립 + 남은 프리미티브/컴포저블 추출에 집중한다. 동작·시각 회귀가 없어야 한다.

## 범위

- 포함: `components/`·`components/pages/`·`composables/`·`data/` 디렉터리 확립, 남은 프리미티브(Roundel/LineCard/Wayfinding/ArrivalBar) 추출, 페이지 뷰 셸 분리, 컴포저블(useTheme/useBlogStore/useFlapBoard/useClock/useRuntimeState) 추출, `data/lines.js` 단일 소스화, `App.vue` 셸+라우팅 축소.
- 제외: 새 시각/동작 변경(리팩터 슬라이스이므로 기능 추가·UI 변경 금지), 플랩 엔진 로직 재작성(→ TKT-070), 모바일 재배치(→ TKT-076/S6), 색 토큰/헤더/노선도/블로그·시뮬 스킨(→ TKT-071~074 에서 이미 처리).

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- `App.vue` 가 라우팅 + 전역 셸(테마/헤더/트랜지션)만 남고, 각 페이지가 `components/pages/*` 뷰로 분리된다.
- Roundel/LineCard/Wayfinding/ArrivalBar 프리미티브와 useTheme/useBlogStore/useFlapBoard/useClock/useRuntimeState 컴포저블이 추출된다.
- `data/lines.js` 가 JunctionMap/RouteRow/LineCard/Wayfinding 공유 단일 소스로 동작한다.
- 전 페이지에서 동작·시각 회귀가 없다(스플래시→홀 전환, 각 승강장, 블로그, 테마 토글, 노선도 이동 모두 이전과 동일).

## 선행 조건

- `TKT-071`, `TKT-072`, `TKT-073`, `TKT-074`(S1~S4) 모두 선행. 프리미티브(StationHeader/StatusBadge/JunctionMap/RouteRow/LineCard)와 `data/lines.js` 초안이 앞선 슬라이스에서 도입된 뒤에야 남은 분해가 의미를 가진다.

## 질문/결정 기록

- 결정(스펙 §5): 한 번에 전면 재작성하지 않고 우선순위(P1 프리미티브 → P2 페이지 뷰 → P3 컴포저블/데이터)로 점진 분해. S1/S2/S3 에서 자연 도입된 프리미티브는 재추출하지 않는다.
- 결정: S5는 리팩터 슬라이스 — 수용 기준은 "동작 회귀 없음". 새 기능/시각 변경을 섞지 않는다.
- 결정(스펙 §5-18): `useFlapBoard.js` 는 자리/인터페이스만. 실제 플랩 엔진은 TKT-070 과 조율.

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (특히 §5/§6)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`

## 작업자 산출물

- 브랜치 이름
- 분리한 컴포넌트/뷰/컴포저블/데이터 파일 목록
- `App.vue` 축소 전후 줄 수 요약
- 회귀 없음 검수 결과(페이지별)
- 검증 결과(run-frontend-build)

## 검토 메모

- 없음

## Notes

- 플랩 엔진 로직은 TKT-070(실제 split-flap 모션) 소관이다. 본 티켓은 `SplashBoard.vue` 컨테이너 격리와 `useFlapBoard.js` 자리 확보까지만 하고, 두 티켓이 같은 파일을 동시에 크게 건드리지 않도록 조율한다.
- `data/lines.js` 는 S2 에서 신설되어 여기서 단일 소스로 확립된다. D/P 등 노선 추가·좌표 갱신 비용을 이 한 파일로 모으는 것이 분해의 핵심 이득이다.
