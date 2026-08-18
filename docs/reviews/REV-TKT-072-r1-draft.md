# REV-TKT-072-r1-draft — UI 재구현 S2: 환승 홀 노선도 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/data/lines.js`, `frontend/src/components/JunctionMap.vue`, `frontend/src/App.vue`(junction 섹션 L3213-3228), `frontend/src/styles.css`(L2172-2460 부근). 브랜치 `codex/v0.6.0-line` 위에 2026-08-16 claude가 직접 구현(작업자 산출물 섹션 근거 — PO 지시 예외 적용, 스펙 라인 진행).

## 요약 권고: **반려 (블로커 1건)**

노선도·행 목록 자체의 구조·데이터·인터랙션은 스펙을 충실히 따랐고 다크/라이트 테마도 정상이다. 그러나 **완료 기준에 명시된 "SVG가 좁은 폭에서 가로 스크롤" 요건이 실제로는 작동하지 않는다** — 모바일 폭에서 노선도 우측 절반이 스크롤 불가능하게 잘려 나간다(재현 절차 아래). 나머지는 [중요]/[제안] 수준.

## 실행 검증

- `npm --prefix frontend run build` — **통과**(vite 6.4.3, 615ms, 13 modules, 경고 0).
- 브랜치 `codex/v0.6.0-line` 확인, 작업트리는 이 티켓과 무관한 `services/sample-spring-service/target/`(다른 에이전트의 빌드 산출물, 미커밋) 외 클린.
- 로컬 dev 서버로 실브라우저 검수(다른 세션이 7010 포트를 쓰고 있어 리뷰 전용으로 7012에 별도 기동, 리뷰 종료 후 종료 예정).

## 항목별 대조 (완료 기준 6개)

### ✅ 빌드 통과
위 참조.

### ✅ 첫 화면이 노선도(SVG)+`.route-rows`로 교체, 블로그=본선/시뮬·운영=지선
`App.vue:3213-3228`의 `page === 'junction'` 섹션이 정확히 스펙대로 `.wayfinding`+`<JunctionMap>`+`.junction-note` 3개뿐임을 확인 — 구 `hero-panel`/`line-grid`/`slice-grid`/`rail-strip`은 이 섹션에 없다(다른 페이지(`simhub`/`bloghub`)에 남은 동명 클래스는 별도 페이지 소관이라 무관, 확인함). 브라우저 실측: B(블로그) 굵은 본선 우측, W/R/D/E/T/P 6개 지선이 좌우로 뻗은 노선도가 렌더링됨. `junctionLineStates`(App.vue:603-618)가 `elevatorState`/`taxiState`/`workBoardState`/`publishedBlogPosts` 등 실제 앱 상태에서 파생됨을 코드로 확인 — 하드코딩 아님.

### ⚠ D/P 지선 upcoming 표기 + 클릭 시 안내 (부분 충족, [제안])
`lines.js`에 D(`upcoming:true, targetVersion:'v0.8.0'`)·P(`v0.9.0`)가 정의되어 있고, 노선도·행 목록 모두에 "예정 · v0.8.0"/"예정 · v0.9.0"로 표시됨을 브라우저에서 확인. `JunctionMap.vue:23-25`의 `go()`가 `!line.upcoming`일 때만 emit해 실제로 라우팅되지 않음을 JS로 직접 검증(`document.querySelectorAll('.route-row.upcoming')`를 강제 클릭 → `location.href` 불변).
**다만** 완료 기준 원문은 "클릭 시 라우팅 대신 **'예정' 안내가 뜬다**"인데, 실제 동작은 클릭 시 뜨는 안내가 아니라 **행 자체에 상시 노출된 라벨**이다(클릭하면 그냥 아무 일도 안 일어남 — `<div>`라 포커스/토스트 없음). 결과적으로 사용자 혼란은 없으나(라벨이 항상 보이므로 오히려 더 낫다고 볼 수도 있음), 문구 그대로의 "클릭 트리거 안내"는 아니다. 블로커로 보진 않음 — PM 판단 필요.

### ❌ [블로커] 모바일 375px에서 SVG 가로 스크롤이 작동하지 않음 — 우측 절반이 스크롤 불가로 잘림
**재현**: 브라우저 뷰포트를 375×812로 리사이즈 → 환승 홀 페이지 진입 → `.map-scroll` 섹션까지 스크롤.
**증상**: 노선도가 Work Manager/Runtime Board/환승 홀 중심점까지만 보이고 블로그 본선·Elevator/Taxi/발견/취향 라벨 전부가 화면 오른쪽 밖으로 잘려 보이지 않는다(스크린샷 확보). 좌우로 스와이프해도 반응 없음.
**근본 원인 (JS로 직접 확인)**: `.map-scroll`(`frontend/src/styles.css:2185-2188`)이 `overflow-x:auto`를 갖고 있지만, `.route-map`(`:2190-2195`)의 `min-width:820px` 때문에 `.map-scroll` 자신이 **flex 자식 기본값(`min-width:auto`)으로 인해 820px까지 그냥 늘어나 버린다** — `overflow-x:auto`가 자기 폭을 넘는 콘텐츠가 없으니 스크롤바를 만들 필요가 없다고 판단하는 것. 그 결과 부모 `.map-panel`(`:2174-2182`, `display:flex; flex-direction:column`)도 같이 842px로 늘어나고, 이 초과분은 `<main>`의 `overflow-x:hidden`에 의해 그냥 잘려서 안 보이게 된다(페이지 전체가 가로 스크롤되지도 않음 — `document.documentElement.scrollWidth === innerWidth === 375`로 확인).
직접 확인한 값: `ms.scrollWidth === ms.clientWidth === 820`(스크롤할 여지 자체가 없음), `ms.scrollLeft = 300` 대입해도 `0`으로 그대로(무시됨).
**완료 기준 원문과의 충돌**: "SVG가 좁은 폭에서 가로 스크롤되고, `.route-rows` 목록이 모바일/접근성 폴백 이동 링크로 동작한다" — 뒷부분(행 목록)은 정상이지만 앞부분(SVG 가로 스크롤)은 사실이 아니다. 노선도의 60% 가량(본선 전체+정차역 3개+지선 4개 라벨)이 모바일에서 존재 자체를 알 수 없다.
**참고**: `@media (max-width:760px)`(`:2420-2453`)의 `.map-scroll{order:2}`/`.route-rows{order:1}` 재배치 자체는 의도대로 동작(행 목록이 지도보다 먼저 나옴, TKT-076 선행분과 정합) — 이 재배치 로직의 버그가 아니라, 그 아래 지도 블록 자체의 폭 계산이 깨진 것.
**추정 수정 방향(참고용 — 코드는 건드리지 않음)**: `.map-scroll`(과 필요시 `.map-panel`)에 `min-width: 0`을 추가해 flex 자식이 뷰포트 폭으로 실제로 수축되도록 해야 `overflow-x:auto`가 의도대로 로컬 스크롤 영역을 만든다. 이 저장소 다른 곳(`registerFormSql` 등)에서도 비슷한 flex-overflow 패턴이 있는지는 미확인.

### ✅ (코드 확인, 라이브 미검증) `prefers-reduced-motion`에서 pulse 정지
`styles.css:2410-2415` — `@media (prefers-reduced-motion:reduce) { .route-map .pulse { animation:none; opacity:0.5; } }` 존재, 스펙과 일치. **다만 이 리뷰 도구가 OS 레벨 reduced-motion 에뮬레이션을 지원하지 않아 실브라우저로 직접 트리거해 보지는 못했다** — 코드 판독만으로 인정. PM 또는 다음 라운드에서 실기기(Chrome DevTools rendering 탭의 "Emulate CSS prefers-reduced-motion")로 1회 확인 권장.

### ✅ 홀에 Work 5레인/Elevator dispatch/명령 버튼 미노출
`page==='junction'` 섹션에 이런 요소 없음을 마크업으로 확인. `get_page_text` 전체 텍스트에도 티켓번호·명령 버튼류 문자열 없음.

## [중요] RouteRow.vue가 별도 컴포넌트로 분리되지 않음 — 티켓의 명시적 범위와 불일치
티켓의 "범위 › 포함" 목록과 작업 내용 §6은 `RouteRow.vue` 신설을 명시한다("`JunctionMap.vue`(인라인 SVG)·`RouteRow.vue` 구현"). 실제로는 `RouteRow.vue` 파일이 존재하지 않고, 행 목록(`.route-rows`) 렌더링이 `JunctionMap.vue:91-114`에 인라인으로 합쳐져 있다(`grep -r RouteRow frontend/src` 결과 0건).
기능 자체는 스펙대로 동작하므로 완료 기준(사용자 관찰 가능한 동작) 위반은 아니지만, 두 가지 이유로 [중요]로 본다: ① 티켓 "범위" 섹션이 명시한 산출물이 실제로 없고, "작업자 산출물" 기록에도 이 이탈이 disclosure되지 않았다(같은 기록에서 Sim Hub 처리 방식 변경은 명시적으로 disclosure한 것과 대비됨). ② `## Notes`가 "`data/lines.js`는 S5(TKT-075)에서 JunctionMap/RouteRow/LineCard/Wayfinding 공유 단일 소스로 이어진다"고 전제하는데, RouteRow가 컴포넌트로 없으면 S5의 분해 대상 자체가 없다 — S5 착수 전에 PM이 이 전제를 재확인해야 한다.

## [제안]
- 파이썬/JS 수준은 아니지만: `.route-row`가 upcoming일 때 `<div>`로 렌더되면서도 `@click="go(line)"`가 그대로 바인딩되어 있다(무해하지만 불필요 — `go()` 내부 가드로 방어되긴 함).
- `styles.css`의 `.map-panel`/`.map-scroll` 규칙에 이번 발견을 계기로 회귀 테스트(예: viewport 375 스냅샷 또는 `scrollWidth>clientWidth` 단언)를 추가하면 재발 방지에 도움될 것.

## 상태 제안 (판정은 PM)
블로커 1건(모바일 SVG 가로 스크롤 불가)으로 완료 기준 미충족 — **started로 반려 권장**. 재개 조건: `.map-scroll`(및 필요 시 상위 flex 체인)에 폭 축소를 막는 `min-width:auto` 기본값을 오버라이드해 실제로 스크롤 가능하게 만들고, 375px에서 전체 7개 노선이 스크롤로 도달 가능함을 재확인. [중요](RouteRow.vue 분리 여부)는 이번 라운드에서 같이 정리하거나, PM이 S5(TKT-075)로 명시적으로 이월할지 결정 필요.
