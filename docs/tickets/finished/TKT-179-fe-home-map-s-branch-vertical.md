문서 상태: 작성완료

# TKT-179 `[FE]` 홈 노선도 — 실험선 S 이후 유로트럭을 **수직 지선**으로

- 상태: finished (2026-10-25, PM r2 통과)· **P1** · 담당: codex-1 · 의존: TKT-168 finished·174 need_review(소역 2개 좌표 공유). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.** D-015 최종(r16 직선 통과) 유지 — 실험선 본선은 그대로, 지선만 추가.
- 근거: PO 2026-10-05 "실험선이 너무 수평적인데, 실험선의 정류장 중 미스터리 트레인 이후에 유로트럭은 수직선 어때?"
- scope: `frontend/src/data/lines.js`(S 역 `mapStops` 중 `유로트럭`·`유로트럭 개발자` 좌표·지선 path), `frontend/src/components/JunctionMap.vue`(지선 path 렌더 — 본선과 같은 색·굵기, 역 점 규칙 동일), `JunctionMap.e2e.mjs`(겹침 검사에 지선 포함), `frontend/public/mockups/home.html`(r17 — 같은 기하로 목업 동기화, PM 검수용).

## 기하 (viewBox 720×720, r16 좌표계)
- S 역(미스터리 트레인) 중심 (501.4, 218.6). 지선 path `M501.4 218.6 L501.4 96` — S 에서 **수직 위로**. 선 두께·색은 실험선과 동일, 끝은 둥근 캡.
- 지선 소역(r2 PM 결정): `유로트럭` (501.4, 150) · `유로트럭 개발자` (501.4, 105). 라벨은 왼쪽(`anchor: 'end'`, labelX 487, labelY 각각 154·109). 개발자 소역은 D-022 문법(흐림 + 토스트 `개발자 페이지 · 로컬 전용`) 유지.
- 기존 대각 소역(격납고·엘리베이터·택시·화이트채플)은 본선에 그대로. S 라벨 `미스터리 트레인`·A 역(437.8,282.2)·허브 이름(360,306)과의 겹침 0 을 E2E 로.
- 375 에서 소역은 목록이 대신하므로(현행) 지선 역시 `display:none` 규칙 동일.

## 완료 조건
1. [x] 1440: 지선·소역 2개 렌더, 글자/선 겹침 0(기존 JS bbox 검사 확장), 클릭 → `/ets2`·개발자 토스트.
2. [x] 375: 노선도 겹침 0, 목록 행에 두 소역 순서(유로트럭 → 유로트럭 개발자) 유지.
3. [x] `home.html` r17 동기화 + Junction E2E·unit 그린. 스크린샷 4장.

## 구현 내역
- 실험선 S 중심의 수직 지선은 유지하면서 두 지선 소역을 `(501.4,150)`·`(501.4,105)`로 벌리고 라벨을 `labelX 487`·`anchor: end`로 왼쪽 배치했다. 대각 본선·다른 역 점과의 시각·클릭 충돌을 해소했다.
- 큰 역 뒤의 세부 역 레이어에 소역 13개 전부 `r=20` 투명 히트 원을 추가했다. E2E는 halo 유무로 노선 교차 검사를 면제하지 않으며, 데스크톱의 모든 소역 라벨 중심에서 최상위 클릭 소유자가 자기 역인지 검사한다.
- `home.html` r17을 r2 좌표와 왼쪽 라벨 기하로 맞췄다. 899px 이하에서는 지선·소역을 숨기고 목록의 `유로트럭 → 유로트럭 개발자` 순서가 계속 대신한다.
- 공유 파일: `frontend/src/data/lines.js`, `frontend/src/components/JunctionMap.vue`, `frontend/src/components/JunctionMap.e2e.mjs`, `frontend/src/data/junction.test.mjs` (TKT-174 및 앞선 need_review 변경과 같은 파일).

## 검증
- `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/`: 각각 55 modules, 성공.
- `node --test src/components/JunctionMap.e2e.mjs` (번들 Playwright): 375/1440 × dark/light 4/4. 글자·노선 교차 0, 소역 13개 `r≥20`, 데스크톱 라벨 클릭 소유권 전부 일치, 가로 overflow 0, `/ets2` 이동·개발자 토스트 성공.
- 전체 unit: 27/27 성공. `git diff --check` 성공. 목업 `<script>` 0.
- 실렌더 4장 직접 확인: `/private/tmp/tkt179-r2/junction-{375,1440}-{dark,light}.png`. 데스크톱 왼쪽 라벨·지선 간격과 모바일 목록 대체, 양 테마 겹침 0을 확인했다.

## 질문/에스컬레이션
- `[해소]` r1의 오른쪽 라벨 교차 반박은 PM의 왼쪽 배치 결정(`anchor: end`, `labelX 487`)으로 해소했다. r2 E2E는 halo 글자도 교차 검사에서 제외하지 않고 라벨 중심 클릭 소유권을 직접 확인한다.

- `[디자이너 의견]` (codex-8, 2026-10-05): 좌표 충돌 반박에 동의하나 halo만으로 해소되지는 않았다. 1440 양테마에서 유로트럭 라벨 내부 (620.08,270.19)를 누르면 겹친 엘리베이터 원이 클릭을 받아 서버 시뮬 안내가 나온다. 개발자 라벨에도 본선이 비친다. 수직 분기를 유지하며 본선/역 점을 피하는 라벨 위치의 PM 재합의를 요청한다. 두 소역 높이15px은 기존174 I3의 잔존이므로 hit 영역 담당도 함께 정해 달라. 근거·28캡처: `docs/reviews/UX-TKT-179-r1.md` (B0/I2/S0). 판정·기하·상태는 변경하지 않았다.

## 리뷰 기록
- r1 PM 반려 2건을 r2에서 해소하고 need_review로 재전환(2026-10-25).

## PM 반려 (2026-10-24, r1) — `docs/reviews/REV-TKT-179-r1.md`
- [중요] I1 라벨 왼쪽(anchor end, labelX 487)·소유권 E2E · [중요] I2 소역 투명 히트 원 r≥20 + 지선 소역 간격 150/105.
- 2026-10-25 PM: **r2 통과 → finished** — `docs/reviews/REV-TKT-179-r2.md`. 소역 히트 40px 은 TKT-184.
