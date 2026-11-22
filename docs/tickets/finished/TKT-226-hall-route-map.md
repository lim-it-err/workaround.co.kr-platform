문서 상태: 작성완료

# TKT-226 `[FE]` 환승 홀 — 출발 안내판 위에 노선도

- 상태: finished · **P1 · v0.9.1** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.1`(작업 트리 `/Users/imjeonghan/newProject/wa-090`, PR #12 에 포함 예정).
- 근거: PO 2026-11-22 「첫 화면이 많이 비어진다고 느끼는건, 위에 노선도가 있으면 될 일로 보여. 노선도를 적당히 그려줘. 자연스럽게 다시 그려도 돼」. 1440 폭에서 안내판(최대 720px, 7행) 아래가 절반 가까이 빈다(캡처 `docs/tickets/captures/TKT-225/first-1440-dark.png`).
- scope: 신규 `frontend/src/components/hall/HallRouteMap.vue`, `frontend/src/components/hall/HallBoard.vue`(배치·행 강조 연동), `frontend/src/data/hallBoard.js`(지도 좌표 데이터 추가만 — 기존 export 변경 금지), `frontend/src/components/HallV09.e2e.mjs`(단언 추가), 캡처. App.vue·styles.css 전역 토큰 수정 금지(토큰은 읽기만). lite 보기(HallLite.vue)는 건드리지 않는다.

## 디자인 (PM 스펙 — 「자연스럽게」의 기준)
지하철 노선도 도식(옥틸리니어: 가로·세로·45° 선만). 검은 바탕 터미널 톤(v0.9 A안)에 맞춰 얇고 정갈하게.

- **위치·크기**: 기본 보기 환승 홀, 부팅 로그가 끝나고 안내판이 나올 때 **안내판 바로 위**, 안내판과 같은 폭(`min(100%, 720px)`). SVG `viewBox` 720×200 기준, 폭에 맞춰 비율 유지. 화면 폭 **900px 이상에서만** 보인다(그 아래는 지금처럼 안내판만 — 모바일에는 기존 노선도 탭이 있다).
- **구성**: 가운데 **환승 홀**(이중 원, 흰색 계열 `--text` 토큰) 에서 5개 노선이 뻗는다. 노선 색은 안내판 노선 글자색과 같은 토큰(HallBoard 의 `t-rec`·`t-learn`·`t-play`·`t-life`·`t-base` 가 쓰는 색을 그대로).
  - 기록선 → 서쪽: 여행
  - 배움선 → 북동쪽(45° 후 동쪽): Advisor → 일일 5지(**점선 구간 + 속 빈 역**, 개통 준비)
  - 놀이선 → 동쪽: 격납고 → 유로트럭
  - 생활선 → 남서쪽: 자취 밥상
  - 기지선 → 남동쪽: 운영 노트
  - 역 이름은 안내판 행선지와 같은 문자열(`HALL_ROWS.destination`). 역 수·이름·상태는 `HALL_ROWS`/`HALL_LINES` 에서 읽는다(단일 소스) — 좌표만 `hallBoard.js` 에 `HALL_MAP` 같은 이름으로 추가.
- **선·역**: 선 두께 5~6, 끝 둥글게. 역 = 바탕색 채운 원 + 노선색 테두리. 환승 홀 원은 조금 크게. 라벨은 안내판과 같은 고정폭 글꼴, 작게(역 이름 12px 상당, 상태는 쓰지 않는다 — 상태는 안내판 몫). 라벨이 선·다른 라벨과 겹치지 않게 배치.
- **움직임**: 안내판이 나타날 때 선이 환승 홀에서 바깥으로 그려지는 효과(stroke-dashoffset, 600ms 안팎, 한 번). 환승 홀 원은 아주 느린 맥박(투명도) — 거슬리지 않는 수준. `prefers-reduced-motion` 이면 둘 다 없음. 재방문(로그 생략)일 때도 선 그리기는 한 번.
- **상호작용**: 역 클릭 = 안내판 해당 행 클릭과 같은 이동(planned 역은 이동 없음). 역에 마우스를 올리면 안내판 해당 행이 강조되고, 안내판 행에 마우스·키보드 포커스가 가면 지도 해당 역이 강조(같은 강조 상태 하나를 공유). 커서는 이동 가능한 역만 pointer.
- **접근성**: 키보드·스크린리더의 주 경로는 안내판이다. 지도 SVG 는 `role="img"` + `aria-label="노선도: 환승 홀에서 기록선·배움선·놀이선·생활선·기지선이 뻗는다"`, 역 요소는 포커스 대상이 아니다(tabindex 없음) — 중복 탭 정지 방지. lite 보기에는 지도 없음.

## 완료 조건
1. [x] 1440·1280·900 폭에서 지도가 안내판 위에 보이고, 1440×900 에서 지도+안내판이 스크롤 없이 한 화면에 들어간다(헤더 포함). 899 이하·375 에서는 지도 없음(기존과 같은 화면).
2. [x] 위 디자인 항목 그대로(노선·역·점선 구간·토큰 색·라벨 겹침 없음·움직임·reduced-motion).
3. [x] 역 클릭 이동, 지도↔안내판 강조 연동 동작. planned 역은 이동 없음.
4. [x] 가로 넘침 0(모든 폭), 콘솔 에러 0, 기존 `HallV09.e2e.mjs` 전부 통과 + 새 단언: 1440 지도 표시·역 6+1개(환승 홀 포함)·여행 역 클릭 시 여행 화면, 899 미표시, reduced-motion 에서 애니메이션 없음.
5. [x] 캡처 `docs/tickets/captures/TKT-226/`: 1440 기본(안내판 단계), 1280, 900, 375(변화 없음 확인), 1440 역 hover 강조 1장.
6. [x] 실행: `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` 후 `NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test frontend/src/components/HallV09.e2e.mjs`(+ 영향 가능한 `JunctionMap.e2e.mjs`). `git diff --check`.

## 구현 메모
- 변경: 신규 `HallRouteMap.vue`; `HallBoard.vue`(지도 배치·`activeId` 하나로 지도↔행 강조 공유·역 클릭은 행 클릭과 같은 `press`, Advisor 는 `location.assign`); `hallBoard.js` 에 `HALL_MAP`(좌표만) 추가; `HallV09.e2e.mjs` 에 3건 추가. 역 이름·tone·planned 는 `HALL_ROWS`/`HALL_LINES` 에서 읽는다.
- 디자인: viewBox 720×200 옥틸리니어, 환승 홀 이중 원 + 5노선 6경로, 선 5.5. 일일 5지 구간은 점선(둥근 점)+점선 테두리 역. 선 그리기는 `.route-draw`(pathLength=1, dashoffset, 0.6s, 1회), 점선 구간은 페이드, 허브 링 6초 투명도 맥박. reduced-motion 이면 전부 none(E2E 로 확인). 900px 미만 `display:none`. 역 `[data-map-station]` 7개(일일 5지 포함) + 허브 1 — 완료 조건의 「6+1」을 「7+허브1」로 해석했다.
- 캡처를 보고 고친 점: 처음 좌표(130~630)는 좌우가 비어 보여 70~660 으로 넓히고 라벨 13px 로 키움. 라벨은 위/아래 번갈아 배치해 선·라벨 겹침 없음(1440·900 육안).
- 검증: 빌드(root·Pages base) 성공 · unit 46/46 · `HallV09.e2e` 21건 중 pass 19·fail 0(2건은 캡처 전용 skip) · `JunctionMap.e2e` 4/4 · `git diff --check` clean. 1440×900 에서 지도+안내판이 스크롤 없이 들어감(E2E 단언), 가로 overflow 0(1440·900·899·375), 콘솔 에러·경고 0.
- 캡처 `docs/tickets/captures/TKT-226/`: `map-1440.png`(기본), `map-1280.png`, `map-900.png`, `map-899.png`·`map-375.png`(지도 없음 확인), `map-hover-1440.png`(유로트럭 역 hover → 역 채움·행 강조). 기존 `board-base-*`·`lite-*`·`log-mid-*` 는 E2E 부산물.
- 확신 없는 점: 라벨 폰트가 SVG 비례 축소라 900px 에서 약 10px 상당으로 작다(스펙 12px 상당은 1440 에서 충족). 노선 이름(기록선 등)은 지도에 넣지 않았다(안내판 몫으로 판단). 테마 green 에선 노선색이 모두 같아 선 구분이 안 된다(기존 토큰 동작).

## 질문/에스컬레이션
[구체화 질문] 지도에 노선 이름(기록선 등)을 선 끝에 작게 넣을까요? 지금은 역 이름만이라 색과 안내판 대조로만 노선을 알 수 있음. 진행은 역 이름만으로 완료.

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-226-r1.md`
