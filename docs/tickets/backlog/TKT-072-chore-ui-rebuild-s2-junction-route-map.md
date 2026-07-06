문서 상태: 작성완료

# TKT-072

## 메타데이터

- 제목: UI 재구현 S2 - 환승 홀 노선도(시안 C) JunctionMap/RouteRow
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `backlog`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-072-ui-rebuild-s2-junction-map`

## 목표

슬라이스 S2를 구현한다. 환승 홀(Main Junction) 첫 화면을 시안 C의 노선도로 전면 교체한다. `frontend/src/data/lines.js`(노선 단일 소스) + `JunctionMap.vue` + `RouteRow.vue` 를 만들어, 블로그를 굵은 본선(trunk), 시뮬레이터/운영을 지선(branch)으로 그리고, D(Discovery)·P(Palate)를 미개통 지선(upcoming)으로 추가한다. 홀은 "요약 + 선택 + 이동"만 유지한다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §3.3(JunctionMap/RouteRow), §4(junction), §5(data/lines.js), §6(S2), §7.

1. 노선 단일 소스 (스펙 §3.3 데이터 소스 / §5-15). `frontend/src/data/lines.js` 를 신설하고 노선 배열을 정의한다. 항목 스키마: `{ code, letter, name, nameKo, color:'--line-x', page, status, kind:'trunk'|'branch', node:{x,y}, path, terminus, stops, upcoming, targetVersion }`. B 는 `kind:'trunk'`, 지선은 `kind:'branch'`, D/P 는 `upcoming:true`(D `targetVersion:'v0.8.0'`, P `targetVersion:'v0.9.0'`). JunctionMap/RouteRow/(및 후속 LineCard/Wayfinding)가 이 배열을 공유한다. **D/P 추가는 이 파일 한 곳만 수정**하도록 설계한다.
2. JunctionMap SVG (스펙 §3.3). `frontend/src/components/JunctionMap.vue` 에 인라인 SVG(CSS 아님)로 노선도를 렌더한다. 좌표계 `viewBox="0 0 1000 460"`, 현재 위치(환승 홀) 노드 `(300,230)`. 노선 경로 `<path class="rl rl-{x}">`(stroke=노선 코어색, 본선 B `stroke-width:11`, 지선 `stroke-width:6`)를 §3.3 좌표표대로:
   - B 본선 `M300 230 H852`(종점 스튜디오 `(772,230)` 이중원 + 캡 `M840 214 V246`)
   - W `M300 230 L180 140 H96` 종점 `(96,140)`
   - R `M300 230 L180 320 H96` 종점 `(96,320)`
   - D `M300 230 L440 96 H600` 종점 `(600,96)` (신규)
   - E `M300 230 L440 158 H600` 종점 `(600,158)`
   - T `M300 230 L440 302 H600` 종점 `(600,302)`
   - P `M300 230 L440 364 H600` 종점 `(600,364)` (신규)
3. 본선 정차역·종점·지선 chip (스펙 §3.3). 본선 정차역 `<circle class="stn" r="7.5">` + 하단 라벨(`.name.name-c`/`.sub.sub-c`): 공개 아카이브 `(472,230)`(name y≈268, sub y≈286), 글 상세 `(620,230)`, Writing Studio 종점 `(772,230)`은 `.term` 이중원(바깥 r=11 + 안쪽 fill:var(--line-b) r=4). 지선 종점 노드 `<circle class="lchip" r="13" fill="var(--line-{x})">` + `.lchip-txt` 흰 문자 D/E/T/P/W/R, 옆에 `.name`(기능명) + `.sub`(상태/요약, D=`예정 · v0.8.0`, P=`예정 · v0.9.0`).
4. 현재 위치 마커 (스펙 §3.3). `(300,230)`에 `.pulse`(r=17, 노란 확산 링 애니메이션) + `.xfer`(r=12, stroke:var(--text) 이중 환승역 원) + 중심점(fill:var(--text) r=3.5) + `<text class="name name-c" y="178">환승 홀</text>` + `<text class="sub sub-c" y="196">Main Junction</text>`.
5. 노선도 CSS (스펙 §3.3, 시안 C route-map 블록 이식·토큰만 A로 치환). `.map-panel`(border/`--radius-lg`/`--panel`/`--shadow`/`overflow-x:auto`), `.route-map`(width:100%; min-width:820px), `.rl`(fill:none; stroke-linecap/join:round; stroke-width:6)·`.rl-b`(11), `.stn`/`.term`(fill:var(--map-node); stroke:var(--line-b))·`.xfer`(stroke:var(--text))·`.lchip`(stroke:var(--map-node)), `.pulse`(stroke:var(--safety) + keyframes `mapPulse` scale 0.55→1.55 opacity 1→0), `.name`/`.sub`/`.linetag`. `prefers-reduced-motion` 시 `.pulse { animation:none; opacity:0.5; }`.
6. RouteRow 목록 (스펙 §3.3). `frontend/src/components/RouteRow.vue` + `.route-rows`(border-top:2px solid var(--text)) 병기. 이 목록이 접근성/모바일 폴백이자 실제 이동 링크다. `a.route-row.primary`(블로그 본선, `--tick:var(--line-b)`, 가장 큼: `.tick`/`.rr-main`(strong=roundel+명, small=요약, `.rr-stops`)/`.rr-status`/`.rr-go →`), E/T/W/R 각각 `--tick` 노선색 `a.route-row`, D/P 는 `a.route-row.upcoming`(opacity:0.6, status="예정", `--tick` 노선색 유지, 클릭 시 라우팅 대신 정의서/로드맵 "예정" 안내). `.route-row { display:grid; grid-template-columns:6px 1fr auto auto; gap:18px; align-items:center; border-bottom:1px solid var(--line); }` hover `background:var(--panel-soft)`, `.tick { background:var(--tick); }`.
7. junction 페이지 교체 (스펙 §4 junction). 현재 App.vue L3007~3151 의 `hero-panel` + `line-grid`(line-card) + `slice-grid` + `rail-map-panel`(rail-strip 미니맵) + `mobile-panel` 를 다음으로 바꾼다: (a) 상단 Wayfinding 한 줄(§3.5A, `.wayfinding` 현재 위치 · 환승 홀 + 환승 가능 roundel), (b) 본체를 JunctionMap SVG + `.route-rows` 목록으로 교체(`line-grid`/`rail-strip` 제거), (c) 블로그 본선 요약(공개/초안/최근 발행)은 route-row.primary 의 small/rr-stops 로 축약(대형 대시보드 금지), (d) `slice-grid`(오케스트레이터 티켓 힌트)는 사용자-facing 홀에서 제거하거나 `/test` 로 이관, (e) 하단 `.junction-note` 고정 문구 "홀에서는 이동만, 조작은 각 승강장에서", (f) D/P 지선을 노선도·목록에 upcoming 으로 추가.
8. 경계 준수 (스펙 §0/§4, `docs/feature-definition.md`). 노선도는 "이동"만. 클릭 시 각 페이지로 라우팅(홀에서 조작 없음). Work 5레인 전체 보드/Elevator dispatch 그리드/실질 명령 버튼을 홀에 직접 펼치지 않는다.

시안 재사용 포인터(스펙 §7): 시안 C `.route-map` CSS 블록(L343~370) + `<svg class="route-map">` DOM(L807~861) + `.route-rows`/`.route-row`(CSS L373~398, DOM L870~919) + `.map-caption`(L863~868). D/P 는 §3.3 좌표표대로 신규 `<path>`/`<circle class="lchip">`/`route-row.upcoming` 2개를 추가한다. Wayfinding 은 시안 A `.wayfinding`(L356~372, DOM L859~871) 또는 시안 C `.here-line`(L320~333).

## 범위

- 포함: `frontend/src/data/lines.js` 신설(노선 단일 소스, D/P upcoming 포함), `JunctionMap.vue`(인라인 SVG)·`RouteRow.vue` 구현, junction 페이지의 `line-grid`/`rail-strip` → 노선도 + 행 목록 교체, Wayfinding 한 줄 추가, `slice-grid` 제거/이관, `.junction-note` 고정 문구.
- 제외: 색 토큰/타이포/StationHeader(→ TKT-071/S1 선행), 블로그 페이지 A 처리·상태 배지(→ TKT-073/S3), 시뮬레이터/운영 본문 스킨(→ TKT-074/S4), 페이지 뷰 컴포넌트 전면 분리(→ TKT-075/S5), D/P 실제 페이지 구현(각 기능 티켓 TKT-065 등). 홀에서의 실제 조작 노출 금지.

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- 환승 홀 첫 화면이 노선도(SVG) + `.route-rows` 목록으로 바뀌고, 블로그가 굵은 본선·시뮬/운영이 지선으로 보인다.
- D/P 지선이 노선도·목록에 `upcoming`(예정 · v0.8.0/v0.9.0)으로 나타나고, 클릭 시 라우팅 대신 "예정" 안내가 뜬다.
- SVG가 좁은 폭에서 가로 스크롤되고, `.route-rows` 목록이 모바일/접근성 폴백 이동 링크로 동작한다.
- `prefers-reduced-motion` 에서 pulse 애니메이션이 멈춘다(정지/결과만).
- 홀에는 Work 5레인/Elevator dispatch/명령 버튼이 직접 노출되지 않는다(요약+이동만).

## 선행 조건

- `TKT-071`(S1: 토큰/타이포/StationHeader) 선행. 노선 코어/틴트 토큰과 `--accent` 규약, `--map-node`/`--safety` 토큰이 있어야 노선도 색이 성립한다.

## 질문/결정 기록

- 결정(2026-07-05, 사용자): 환승 홀만 시안 C 노선도. 블로그=본선, 시뮬/운영/실험=지선.
- 결정(스펙 §3.3): 구현은 인라인 SVG + 데이터 배열(`data/lines.js`) 기반. 정적 좌표 baseline(viewBox 0 0 1000 460, 환승 홀 300,230)을 그대로 제공하므로 추측 없이 착수한다.
- 결정(스펙 §5-15): D/P 추가 시 좌표 갱신 비용을 줄이기 위해 노선 정의를 `data/lines.js` 한 곳에 모은다.
- 결정(경계): 노선도는 이동만. 조작은 각 승강장에서.

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (특히 §3.3/§4 junction/§5/§6/§7)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`

## 작업자 산출물

- 브랜치 이름
- `data/lines.js` 스키마/항목 요약(D/P upcoming 포함)
- JunctionMap 렌더 방식(SVG 좌표/pulse/reduced-motion) 요약
- route-rows 폴백·라우팅 동작 요약
- 검증 결과(run-frontend-build)

## 검토 메모

- 없음

## Notes

- `data/lines.js` 는 S5(TKT-075)에서 JunctionMap/RouteRow/LineCard/Wayfinding 공유 단일 소스로 이어진다. 여기서 스키마를 확정하면 후속 분해가 쉬워진다.
- D/P 의 실제 승강장 페이지는 별도 기능 티켓(예: Discovery TKT-065)에서 다룬다. 본 티켓은 노선도 진입점/예정 표기까지만.
