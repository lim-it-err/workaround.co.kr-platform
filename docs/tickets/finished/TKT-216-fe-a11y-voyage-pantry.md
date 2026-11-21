문서 상태: 작성완료

# TKT-216 `[FE]` 접근성 패치 — 숨은 파일 입력·모바일 지도 도시 타깃·밥상 끝 칩 가시성 (+ 밥상 main 중첩)

- 상태: finished · **P1 · v0.8.4** · 담당: dev 서브에이전트(**Sonnet 5.5**) · 브랜치 `codex/v0.8.4`(작업 트리 `/Users/imjeonghan/newProject/wa-084`).
- 근거: codex-9 `docs/reviews/UX-A11Y-2026-10.md` I1·I2·I3 [중요] + S2 일부, 라이브 v0.8.2 기준 Chromium 재현. v0.8.3(`1b47b02`)에서 해당 코드 변경 없음.
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/Pantry.vue`, `frontend/src/styles.css`(해당 블록만), 관련 E2E(`VoyageRouteMap.e2e.mjs`·`Pantry.e2e.mjs`).
- 범위 밖: S1(운영 노트 desktop 힌트)·S2 환승 홀/여행 h1 — v0.9 블랙 디자인에서 화면 골격과 함께 정리. VoiceOver·Safari 실기기 — codex-9 재검수.

## 목표
키보드·터치 사용자가 여행·자취 밥상에서 보이지 않는 곳으로 포커스를 잃거나, 너무 작은 타깃을 눌러야 하는 문제 3건을 없앤다. 보이는 디자인은 바꾸지 않는다.

## 완료 조건
1. [x] **I1** `/voyage` 백업 복원·사진 추가의 숨은 `input[type=file]`(`VoyageRouteMap.vue:985`, `:1147`)이 Tab 순서에 없다(`tabindex="-1"` 등). 보이는 `백업 복원`/사진 버튼이 유일한 진입점이며, 버튼으로 파일 선택이 그대로 열린다. 기존 `setInputFiles` E2E 유지 + 「백업 복원 다음 Tab 이 1×1 입력이 아니다」 E2E 추가.
2. [x] **I2** 375px `/voyage` 노선도 펼침 상태에서 각 도시 상세 링크의 실제 조작 영역(getBoundingClientRect 또는 투명 hit 영역) 세로 ≥ 40px. 도시 간 hit 영역 겹침 0(인접 도시 중심 클릭이 각자 자기 도시로 간다). 표시 점·글자 크기는 바꾸지 않는다. 1440 기존 동작 불변. E2E 로 375 측정 단언.
3. [x] **I3** 375px `/pantry` 깨끗한 저장소에서 Tab 으로 기본 칩 끝(현재 마지막 칩)까지, Shift+Tab 으로 처음 칩까지 이동할 때 포커스된 칩의 사각형이 스크롤 행 사각형 안에 **완전히** 들어오고, 칩 중심 `elementFromPoint` 가 그 칩이다. 실시간(가짜 시계 없이) 500ms 대기 후 측정. `mask:none` 단언만으로 통과 처리 금지. 1440 불변.
4. [x] **S2 일부** 밥상 화면 접근성 트리의 `main` 이 1개(App.vue `<main>` 안의 `Pantry.vue:257` `<main>` → `section` 등). `aria-labelledby="pantry-title"` 유지.
5. [x] 게이트: `npm --prefix frontend run build`, unit 전체, `npm --prefix frontend run e2e:all` 기준선(99 pass / 18 skip / 0 fail) 이상, `git diff --check`. 375/1440 다크 캡처 각 화면 1장씩 `docs/history` 또는 티켓에 경로 기록.

## 구현 메모
- I3 원인 추정: 칩 행이 `overflow-x` 스크롤인데 오른쪽에 `태그 더 보기` 토글이 겹쳐 마지막 칩이 토글 뒤로 들어간다(칩 x240.55~295, 행 오른쪽 248.34). 행 끝 여백(scroll-padding-inline-end / 패딩 스페이서)과 포커스 시 `scrollIntoView({inline:'nearest'})` 계열 중 덜 침습적인 쪽. 재현 스크립트 `docs/reviews/UX-A11Y-2026-10-assets/pantry-focus.cjs`.
- I2: SVG 안 각 도시 `<a>` 에 투명 `rect` hit 영역(가로는 라벨 폭, 세로 ≥40px 를 viewBox 축소 비율로 환산)을 두는 방식 권장. 지도 아래 목록을 새로 만드는 안은 디자인 변경이라 이번 범위 아님.
- 콘텐츠 문자열은 바꾸지 않는다.

## 구현 내역
- `VoyageRouteMap.vue`: (I1) 숨은 파일 입력 2곳 `tabindex="-1" aria-hidden="true"`. (I2) 도시 `<a>` 안에 투명 `path.route-station__hit` 추가 — 도시별 상자(가로 112·세로 120 viewBox 단위 → 375px 에서 47×45~51px)를 이웃 도시와의 수직이등분선으로 잘라 겹침 0, 같은 좌표의 프라하·프라하 복귀는 위/아래로 갈라 각자 ≥45px. 원인: 기존 `.route-station{pointer-events:bounding-box}` 가 점+라벨 상자(세로 15~23px)라 작고 이웃과 겹쳤다 → `max-width:899px` 에서만 `a` 의 bounding-box 를 끄고 hit·점·라벨만 누르게 함. `min-width:900px` 는 hit `display:none` + 기존 bounding-box 그대로(1440 불변). 점·글자 크기·색·문구 변경 없음.
- `Pantry.vue`: (I3) 칩 행 `@focusin` → 키보드(`:focus-visible`) 포커스일 때만 칩이 행 사각형(안쪽 6px) 안에 들어오게 `scrollLeft` 보정. 원인은 마스크·토글 겹침이 아니라 Chromium 이 일부만 보이는 칩(25분 이내·비오는날·다이어트·한잔)을 스크롤하지 않는 것. 마우스 클릭은 건드리지 않음(mousedown 중 행 이동으로 click 어긋남 방지). (S2) 루트 `<main>` → `<section>`, `aria-labelledby="pantry-title"` 유지.
- E2E: `VoyageRouteMap.e2e.mjs` +2(I1 Tab·파일선택 열림, I2 375 hit 세로≥40·격자 표본 겹침 0·각 도시 영역 중심 elementFromPoint/클릭이 자기 도시 상세), `Pantry.e2e.mjs` +3(I3 375·1440 Tab/Shift+Tab 전 구간 칩⊂행·중심 hit, 실시간 끝 500ms 대기; S2 main 1개).
- 공유 파일: 없음. (작업 트리의 `design/mockups-v0.9/hall-12.html` 은 다른 작업자 미커밋, 건드리지 않음.)

## 검증
- `npm run build`(root) · `npm run build -- --base=/workaround.co.kr-platform/` 둘 다 통과. unit `node --test $(find src -name "*.test.mjs")` 46 pass / 0 fail. `git diff --check` 통과.
- `npm run e2e:all`: **104 pass / 18 skip / 0 fail** (기준선 99/18/0 + 신규 5). 로그 `/private/tmp/tkt216/e2e-all.log`. (참고: 이 worktree 는 `services/advisor/frontend/node_modules` 가 없어 러너가 요구하는 playwright 경로를 임시 심볼릭 링크로 만들었다가 지움.)
- 측정(375, Chromium): 도시 hit 크기(가로×세로 px) 프라하 47.3×45.6 · 체스키 47.3×50.7 · 할슈타트 47.3×50.7 · 잘츠부르크 47.3×50.7 · 바하우 47.3×50.7 · 비엔나 47.3×50.7 · 부다페스트 47.3×50.7 · 브르노 47.3×50.7 · 프라하 복귀 47.3×45.6. 격자 표본 겹침 0. 수정 전 라벨 상자 세로 15~23px.
- 밥상 끝 칩 `한잔`(실시간 500ms 후): 375 칩 [193.5,107,248.3,147] ⊂ 행 [25,107,248.3,147], 중심 hit=칩 · 1440 칩 [941.5,123,996.3,163] ⊂ 행 [338,123,996.3,163], 중심 hit=칩. 수정 전 라이브 재현은 375 `한잔` x246.5~301.3 vs 행 오른쪽 248.3(가려짐).
- 캡처(다크): `/private/tmp/tkt216/pantry-last-chip-375-dark.png`, `pantry-last-chip-1440-dark.png`, `voyage-map-375-dark.png`, `voyage-map-1440-dark.png`. 375 지도·칩 행 실렌더 확인 — 점·글자·색·문구 전후 동일.

## 질문/에스컬레이션
- [반박·확인 요청] 375px 에서 도시 hit(세로 ≥45px) 가 짧은 구간(DAY 4 할슈타트→잘츠부르크 등)의 선 위를 덮어 그 구간은 **포인터로 직접 누르기 어렵다**(키보드·일차 탭으로는 가능). 도시 40px 타깃 요건과 구간 선 타깃은 같은 공간을 다툰다. 대안: 지도 아래 구간 목록(디자인 변경이라 이번 범위 밖) — PM 판단 필요.
- [확신 없음] 프라하 점 중앙은 프라하 복귀(큰 점)가 받는다(기존 동작 동일); 프라하 상세는 점 위쪽·라벨 쪽을 눌러야 열린다.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-11-15) — `docs/reviews/REV-TKT-216-r1.md`.
