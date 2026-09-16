문서 상태: 작성완료

# REV-TKT-138-r1-draft — v0.7.0 릴리스 게이트 블로커: taxi selector·hit-area 일괄 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-138(taxi E2E 구 selector 복귀 + 블로그 제목 hit-area + PM 추가 40px 일괄).

## 요약 권고: **[블로커] 1건 — started 반려 권장**

티켓 자체가 claim한 게이트(taxi 5/5, 블로그 hit-area, unit/build)는 전부 재현되지만, **이번 티켓이 `WritingStudio.vue`에 추가한 `.writer-bar button { min-width:40px }` 규칙이 기존에 항상 그린이던 Writing Studio 회귀 스위트를 375px에서 실제로 깨뜨린다.** 코드 훑기가 아니라 `WritingStudio.e2e.mjs`를 직접 재실행하고 실패 지점을 라이브 DOM 측정으로 재확인했다.

## 실행 검증

- `pwd` 확인 후 `/Users/imjeonghan/newProject/workaround.co.kr-platform/frontend`(및 `services/advisor/frontend`)에서 실행. 브랜치 `codex/v0.7.0-tone`.
- 메인 Node unit(`staticRouting`·`staticWritingState`·`junction`·`voyageCollection`·`voyageCoverage`·`voyageStorage`·`taxiDispatch`·`voyageRoute`) — **21/21 통과**.
- `npm run build`(root) / `npx vite build --base=/workaround.co.kr-platform/`(Pages-base) — **각 49 modules 통과**.
- Advisor `npx vitest run` — **81/81 통과**(14 files). `npm run build`(root)/`--base=/workaround.co.kr-platform/advisor/` — **각 110 modules 통과**.
- `taxiDispatch.e2e.mjs`(root-base preview, 고정 포트 4175 — 이 파일은 `TAXI_TEST_URL` 미설정 시 `127.0.0.1:4175`를 하드코딩해 자체 호스팅하지 않으므로 `vite preview --outDir dist-root --port 4175`를 직접 기동) — **5/5 통과**. 실 30초 무인 관찰 서브테스트 포함.
- `WritingStudio.e2e.mjs`(Pages-base preview, 고정 포트 4174 — 마찬가지로 자체 호스팅 없음, `vite preview --outDir dist-base --base=/workaround.co.kr-platform/ --port 4174` 기동) — **7/9 통과, 2건 실패**(아래 [블로커] 참조).
- `BlogTone.e2e.mjs` 2/2, `JunctionMap.e2e.mjs` 4/4, `VoyageCollection.e2e.mjs` 2/2, `splashTone.e2e.mjs` 6/6, `ToneTools.e2e.mjs` 12/12 — 전부 자체 호스팅 파일이라 `dist/`를 각 파일이 요구하는 base로 교체해 가며 순차 실행, 전부 통과. (최초 5개를 한 `node --test` 호출에 같이 넘겼을 때 `VoyageRouteMap.e2e.mjs` 2개만 실패 — 아래 [제안, 범위 밖] 참조. `BlogTone`/`splashTone`을 별도 프로세스 두 개로 동시에 돌렸을 때 일시적으로 전실패했으나 순차 재실행 시 전부 통과 — 리소스 경합으로 판단, 코드 결함 아님.)
- Advisor 전체 `npx playwright test` — **46/46 통과**(`course-container`·`final-ux-b1-i1` 포함, TKT-143 몫과 공유).

## [블로커] `.writer-bar` 375px 가로 overflow 2px — 신규 hit-area 규칙이 유발

- **재현**: `NODE_PATH=... node --test src/components/WritingStudio.e2e.mjs`(Pages-base 프리뷰 대상) → `375px dark`/`375px light` 두 서브테스트 모두 `AssertionError: 2 !== 0`(`WritingStudio.e2e.mjs:88`, `overflow()` 헬퍼가 `.writing-room`을 검사하는 지점).
- **라이브 재확인**: 같은 Pages-base 빌드를 브라우저로 열어 `document.querySelector('.writing-room')`을 직접 측정 — `scrollWidth 323 / clientWidth 321` → 정확히 2px 초과, 테스트 실패와 일치. `.writer-bar` 자체가 초과 요소(`scrollWidth 323 / clientWidth 321`).
- **원인**: [foo.ts](frontend/src/components/WritingStudio.vue:639) `.writer-bar button { flex: none; min-width: 40px; min-height: 40px; ... }` — 이번 티켓이 PM 추가 항목("모바일 스튜디오 발행·글 도구 너비 37.6/37.9 → ≥40")을 반영하며 추가한 규칙. 375px 폭에서 `← 블로그`(59px)·`미리보기`(61px)·`발행`(40px)·`＋`(40px)·`⋯`(40px) 5개 버튼 + `gap:4px` + 가변 spacer(`writer-document`, 이미 0px까지 수축)를 합쳐도 컨테이너보다 2px 넓어진다. 기존(개정 전) 버튼 폭은 37.6~37.9px였으므로 이 2.x px 차이가 그대로 넘친 것 — 40px 확장이 목적을 달성하는 대신 인접 화면의 오래된 "가로 overflow 0" 불변식을 깬 사례.
- **영향 범위**: WritingStudio는 이번 티켓 scope에 없는 **기존에 항상 그린이던 회귀 스위트**다(TKT-097/100/101/105/110 등 수십 라운드에 걸쳐 9/9 유지). 이번 세션 내내 "가로 overflow 0"는 모든 티켓이 예외 없이 지켜온 완료 조건이었다.
- **판단**: 형식적으로는 티켓 자체의 완료 조건(자기 scope의 40px 달성)은 만족하지만, 적대적 관점에서 보면 **부작용으로 인접 화면의 하드 불변식을 깨는 스펙 우회**에 해당해 [블로커]로 본다. 고치는 방향은 PM 판단이지만, 후보로는 ①`.writer-bar` 컨테이너에 `gap` 축소 또는 `flex-wrap` 허용, ②`← 블로그`/`미리보기` 텍스트 버튼의 좌우 padding을 1~2px 줄여 여유 확보, ③375px 전용으로 `min-width`를 39px 근사치로 낮추되 시각적 클릭 영역은 CSS `::before` 확장 히트박스로 보완(터치 판정 영역은 늘리되 레이아웃 폭은 그대로) 등이 있다.

## [제안, 이 티켓 범위 밖] `VoyageRouteMap.e2e.mjs` 2건 실패 — 날짜 종속 하드코딩, TKT-138과 무관

배치 검증 도중 `VoyageRouteMap.e2e.mjs`(375·1440 두 조합)가 `getByText('740km')` 대기 중 30초 타임아웃으로 재현 가능하게 실패했다. 격리 재실행으로도 동일하게 재현되어 리소스 경합이 아님을 확인했다. 원인을 코드로 추적:

- `src/components/voyage/VoyageRouteMap.vue:36`의 `findTripDayIndex(props.voyage)` 호출이 `dateKey` 인자를 넘기지 않아 [foo.ts](frontend/src/components/voyage/voyageRoute.js:41) `findTripDayIndex(voyage, dateKey = localDateKey())`의 기본값, 즉 **`new Date()`(실제 오늘 날짜)**를 그대로 쓴다.
- 여행 데이터가 실제 진행 중인 여행(2026-09-08~18)이라 "달린 거리"(`completedDistance`, `routeGauges()`)가 실제 달력 날짜에 따라 매일 값이 바뀐다. 테스트는 특정 시점에 유효했던 "740km"를 하드코딩했고, `page.clock`으로 시간을 고정하지 않는다(파일 전체에 `clock`/`pauseAt` 호출 없음 확인).
- 즉 이 실패는 TKT-138/139/140/143 어느 것의 코드 변경과도 무관하며, **오늘(2026-09-15) 날짜가 임계값을 넘기면서 우연히 지금 이 검증 시점에 발현**된 것으로 보인다. 이 4개 티켓 중 어느 것도 voyage 관련 파일을 건드리지 않았음을 `git diff --stat`으로 확인했다.
- 이 배치의 통과 판정에는 영향을 주지 않는 것으로 처리했으나, **날짜가 더 지나면 이 테스트는 계속 깨질 것**이므로 별도로 `page.clock.install()`류의 시각 고정을 넣거나 상대값(예: "충분히 큰 수" 또는 데이터에서 직접 계산한 기대값) 검증으로 바꾸는 후속 조치가 필요하다 — PM/PO 판단 요청.

## 상태 제안 (판정은 PM)

**[블로커] 1건 — started 반려 권장.** 나머지 게이트는 전부 그린이라 WritingStudio 2px 여유만 확보하면 재제출 가능한 좁은 범위의 반려로 보인다.
