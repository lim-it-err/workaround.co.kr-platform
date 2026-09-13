문서 상태: 작성완료

# Line V 컬렉션 스펙 — 노선은 상설, 여행은 정류장 (2026-09-13, D-013 실행)

> 발주: PO "여행은 예전 여행도 볼 수 있도록, 추가할 수 있도록. 스페인(2024-09)·아이슬란드(2025-09)도." 근거: D-013, `reports/2026-09-10-voyage-line-ia.md` 권고 B. 구현: TKT-108 `[FE]`.

## 1. 데이터 모델

- `frontend/src/data/voyages/index.js` — `export const VOYAGES = [eastEurope2026, iceland2025, spain2024]` (최신 우선). 각 여행은 파일 1개 (`voyages/east-europe-2026.js` 등). **여행 추가 = 파일 1개 추가 + index 등록** (PO→PM 콘텐츠).
- 여행 공통 필드: `id`(영속, 표시 순번과 분리) · `title` · `period{start,end}` · `status: 'planned'|'boarding'|'arrived'` · `cities[]` · `summary`(한 줄) · 선택: `days[]`·`daySessions[]`·`checklist[]`·`budget`·`decisionTrail[]` 등 기존 VOYAGE 구조 그대로.
- 기존 `voyage.js` 의 `VOYAGE` 는 `voyages/east-europe-2026.js` 로 이동, `VOYAGE` export 는 **호환 별칭**(현재 여행 = status 'boarding' 우선, 없으면 최신)으로 남겨 기존 화면·테스트 회귀 0.
- 저장 키·방문 id: localStorage 키에 여행 id 프리픽스 (`voyage:<id>:...`). 기존 키는 east-europe-2026 으로 1회 이행(마이그레이션 함수 + 테스트).

### 1-1. 지출 필드 (PO 2026-09-14)
- 여행: `budget{plan, ceiling}`(기존) + `prepaid[]`(항공·렌터카 등 사전 결제). 일차: `spend{items:[{label, amount}], total}` (만원 단위, 선택). 기록 화면 헤더에 누적/계획 진행선, 일차 카드 끝에 한 줄.

### 1-2. 여정 노선도·식당·사진 필드 (PO 2026-09-14 → `design/voyage-route-map-spec.md` §3)
- 여행: `cities[{id,name,lat,lon}]`, `legs[{dayIndex,from,to,driveMin}]`. 일차: `meals[]`, `photos[]`, `spend`. 지도는 URL 링크만.

## 2. 화면

- **V 노선 진입 = 여행 목록** (`voyageIndex`): 진행 중 여행 1건은 크게(원칙 2 주인공, "오늘 운행 안내" 바로가기) · 지난 여행은 시각표 행(기간·도시 수·기록 진입) · 예정 여행이 있으면 흐리게. 여행 중에는 목록을 거치지 않고 현재 여행으로 직행(자동), 목록은 상단 링크로.
- **여행 정류장** = 기존 3화면(준비/일일/기록)이 여행 id 를 받는다. `arrived` 여행은 **기록 화면이 기본 진입**, 준비·일일은 읽기 전용 열람.
- 화면 코드 표기: V01/V02/V03 은 화면 코드 그대로 유지, 여행 순번은 표기하지 않는다(정류장 이름 = 여행 제목).
- 노선도: V 지선 부제 = 현재/최근 여행 제목 (lines.js rowStops 를 VOYAGES 에서 파생).

## 3. 지난 여행 시드 (PM 콘텐츠 — 뼈대, 상세는 PO 제공 후)

- `spain-2024-09`: title '스페인', period 2024-09 (일자 미정 → `start:'2024-09-01', end:'2024-09-30', approximate:true`), status 'arrived', summary '내용 준비 중'.
- `iceland-2025-09`: title '아이슬란드', period 2025-09 (approximate), status 'arrived', summary '내용 준비 중'.
- 화면은 `approximate` 면 "2024년 9월"로만 표기한다.

## 4. 완료 판정

1. 여행 목록에서 3건 표시, 진행 중(동유럽) 강조, 지난 2건 행 클릭 시 기록 화면(빈 상태 문구 1줄).
2. 기존 동유럽 화면·데이터 테스트(voyageCoverage 등) 전부 그린, localStorage 이행 테스트 추가.
3. build + 375px 오버플로 0.
