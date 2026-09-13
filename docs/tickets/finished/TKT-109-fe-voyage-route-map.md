문서 상태: 작성완료

# TKT-109 `[FE]` 여정 노선도 — 지리 충실형 순환선 + 구간 클릭 일차 카드

- 상태: `finished` (REV-TKT-109-r1 통과, PM 2026-09-14)
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

## 구현 결과

- 동유럽 9개 정차역을 실제 위도·경도의 정방형 투영으로 배치하고, 8개 이동 구간을 일차·운전 시간·거리 데이터와 연결했다. 지나온 구간은 실선, 현재 구간과 역은 안전색, 남은 구간은 점선으로 구분하며 선택 일차 구간을 함께 강조한다.
- 기존 오늘의 여행 지침서에 `여정 노선도` 진입을 추가했다. 노선도에서 구간을 고르면 같은 일차의 세로 시간표가 열리고, 일차 탭을 고르면 지도 구간 강조가 역으로 바뀐다. SVG 링크는 키보드 Enter로도 작동한다.
- 역을 고르면 해당 도시의 숙박·식사와 구글 지도 링크를, 정차역을 고르면 상세 설명·식사·금액·사진을 데스크톱 우측 패널/모바일 하단 시트로 보여 준다. 링크는 새 탭으로 열고 사진·금액·상세 세션이 없는 일차도 빈 상태나 기본 시간표로 안전하게 렌더한다.
- DAY 1~6의 승인된 식사·지출·사진 빈 상태와 항공·렌터카 선결제, 실제 이동 구간을 여행 데이터에 반영했다. 2026-09-14 기준 계기판은 740/1,515km, 523/856만원으로 표시한다.
- 375px에서 지도→일차 카드 세로 흐름, 900px 이상에서 좌우 2열, 지도 라벨 배경 halo와 서쪽 끝 라벨 안쪽 배치로 작은 화면·라이트 테마의 가독성을 보강했다.

## 질문/결정 기록

- `[구체화 질문][구현 메모]` 티켓 scope에는 하위 `components/voyage/**`만 있고 사용자가 노선도에 들어가는 부모 연결점은 빠져 있었다. 도달할 수 없는 화면은 UX 완료 조건을 충족하지 못하므로 `VoyageDailyView.vue`에 버튼·조건부 렌더·스크롤 복원만 최소 접착부로 추가했다. 다른 여행 화면 책임은 바꾸지 않았다.
- 열린 질문 없음.

## 완료 게이트

- `npm --prefix frontend run build` — 통과, 57 modules.
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 통과, 57 modules.
- `node frontend/src/components/voyage/voyageRoute.test.mjs` 및 기존 정적·여행·SIM 단위 회귀 — 16/16 통과. 9역·실좌표 투영·구간 상태·740/1,515km·523.871/856만원·빈 데이터 시간표를 검증했다.
- `node --test frontend/src/components/VoyageRouteMap.e2e.mjs` — Chromium 2/2 통과. 375×812 dark·1440×900 light에서 지도/카드 배치, 9역·8구간, 구간 키보드 선택, 역 클릭, 상세 Escape, 구글 지도 새 탭, API 요청·브라우저 오류·가로 overflow 0을 확인했다.
- `node --test frontend/src/components/VoyageCollection.e2e.mjs` — Chromium 2/2 통과. 현재 여행 직행·3건 목록·지난 기록 회귀 0.
- 375px dark와 1440px light의 본 화면·상세 패널 캡처를 직접 확인했다. 최초 캡처의 잘츠부르크 라벨 잘림을 안쪽 배치와 배경 halo로 수정한 뒤 재검증했다.

## 작업자 산출물

- 브랜치: `codex/v0.7.0-tone`
- 커밋/푸시: 없음(PM 전담).
- 주요 파일: `frontend/src/components/voyage/VoyageRouteMap.vue`, `voyageRoute.js`, 관련 unit/E2E, `frontend/src/components/VoyageDailyView.vue`, `frontend/src/data/voyages/east-europe-2026.js`.

## 검토 메모

- DAY 7 이후의 meals/spend/photos는 아직 승인 데이터가 없어 기본 일정과 `기록 없음`/빈 사진 상태로 표시한다. 임의 콘텐츠는 추가하지 않았다.
- `프라하` 출발·복귀는 같은 실좌표에서 내부 점과 외부 링으로 구분한다.
- Safari/WebKit 실기와 실제 GitHub Pages 배포는 미검증이다.
- 공유 워킹트리의 TKT-102·codex-8 UX 산출물은 수정하지 않았다.

## PR 준비 메모

- 제목: `feat(voyage): add interactive geographic route map`
- 본문 요약: 실제 좌표 기반 9역 순환선과 일차별 구간·세로 시간표·도시/정차역 상세를 연결하고 여행 지출·식사 데이터를 빈 상태 안전하게 표시한다.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-109-r1.md`. 후속: TKT-127 일원화.
