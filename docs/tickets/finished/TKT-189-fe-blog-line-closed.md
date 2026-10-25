문서 상태: 작성완료

# TKT-189 `[FE]` 블로그 본선 운행 중단 — 홈·주소 노출 0, 코드 보존(단일 스위치)

- 상태: finished · **P1** · 담당: dev 서브에이전트(**Sonnet**) · 의존: TKT-188 finished. 브랜치 `codex/v0.8.0-live`. **UX 1순위.**
- 근거: PO 2026-10-25 「그리고 큰 결정이야. 블로그는 다시 내려.」 → D-031.
- scope: `frontend/src/data/lines.js`(블로그 노선 플래그·기록선 정의), `frontend/src/components/JunctionMap.vue`·`JunctionMap.e2e.mjs`, `frontend/src/App.vue`(라우팅 가드·네비게이션에서 블로그 진입점 제거), 블로그·스튜디오 E2E 파일(skip 처리만), 새 E2E 1개(`frontend/src/blogClosed.e2e.mjs`). **`frontend/src/styles.css` 는 이번 scope 밖**(TKT-190 이 동시에 수정) — CSS 가 꼭 필요하면 `[구체화 질문]`. **블로그 컴포넌트·데이터·`staticRouting.js` 파싱·`staticWritingState.js` 는 삭제·수정 금지(보존).**

## 완료 조건
1. [x] **단일 스위치**: `lines.js` 에 `BLOG_LINE_OPEN = false`(이름은 자유, 한 곳). 이 값 하나로 홈 노선도 B 역·소역 3(아카이브·글 상세·스튜디오)·노선 목록의 `블로그 본선` 행·기록선 `order` 문구가 함께 사라진다(`환승 홀 → 여행`). `true` 로 바꾸면 지금과 동일하게 돌아온다(E2E 로 양쪽 확인할 필요는 없음 — 코드 경로만 남긴다).
2. [x] **지도**: 기록선은 r16 원칙(환승 홀 직선 통과)대로 남긴다 — 왼쪽 구간은 역·라벨 없이 `M290 360` 에서 시작하는 짧은 꼬리(환승 홀 링 왼쪽), 오른쪽은 지금 그대로(여행 V·노선도). 1440·375 × 다크/라이트에서 글자·노선 겹침 0, 남은 소역 10개의 히트(r=26) 소유권 유지. 꼬리 길이가 어색하면 `[반박]` 으로 대안 좌표를 적고 진행.
3. [x] **주소**: `/blog`·`/blog/<slug>`·`/blog-district`·`/studio` 직접 진입·새로고침·뒤로가기(`popstate`) 모두 **환승 홀**로, 기존 접근 토스트 패턴으로 한 줄 `블로그 노선은 운행을 멈췄습니다`. 정적 공개본(Pages base)과 root base 둘 다. 주소창은 환승 홀 주소로 교체(replace).
4. [x] **다른 진입점 0**: 상단바·환승 홀 목록·여행 화면의 블로그 상호 링크·Advisor 등에서 블로그/스튜디오로 가는 링크가 렌더되지 않는다(렌더 기준 `블로그`·`Writing Studio`·`스튜디오` 텍스트 검색 0 — 단 이 E2E 의 토스트 문구는 예외).
5. [x] **E2E**: 블로그·스튜디오 스위트(`Blog*.e2e.mjs`·`WritingStudio*.e2e.mjs` 등 실제 파일명 확인)는 파일 상단에서 스위치가 꺼져 있으면 `test.skip`(사유 `D-031 블로그 운행 중단`) — 테스트 코드는 지우지 않는다. 신규 `blogClosed.e2e.mjs`: 위 3·4 를 375/1440 에서 단언. `JunctionMap.e2e.mjs` 의 소역 13 → 10 등 기대값은 **스위치 상태에서 계산된 값**으로(구현에 맞추지 말고 이유를 적는다).
6. [x] 게이트: root/Pages-base build, 메인 E2E 전체(Pages-base self-serve 스위트 + root-base SimTone·taxi + ToneTools — `CLAUDE.md`·`.agents/claude-dev.md` 의 실행법), unit 27/27, `git diff --check`, 375/1440 × 다크/라이트 홈 캡처. Advisor 는 무변경이면 build 만.

## 구현 메모
- 이미 `App.vue` 에 `statePage === 'blogArchive' || statePage === 'blogPost' ? 'junction'` 같은 가드 흔적이 있다(3416행 부근) — 같은 자리를 스위치 기반으로 정리.
- 정적 모드의 `STATIC_UNAVAILABLE_PAGES` 처리와 겹치지 않게, 블로그는 "준비 중" 이 아니라 "운행 중단" 으로 따로 다룬다.

## 구현 내역
공유 파일: 없음 — `frontend/src/styles.css` 는 TKT-190(Haiku) 몫이라 건드리지 않았다. `docs/tickets/board.md` 만 TKT-190 과 함께 만졌다(각자 자기 줄만).

- `frontend/src/data/lines.js`: **단일 스위치 `export const BLOG_LINE_OPEN = false`**(14행, 설명 주석 포함). 블로그 역 정의는 `BLOG_STATION` 상수로 분리해 보존하고(좌표·소역 3·sublinks 그대로) 기록선 `stations` 에 `...(BLOG_LINE_OPEN ? [BLOG_STATION] : [])` 로 끼운다. 기록선 `order` = 닫힘 `환승 홀 → 여행` / 열림 `환승 홀 → 블로그 → 여행`. 기록선 `paths` = 닫힘 `M290 360 L630 360`(환승 홀 링 왼쪽에서 42 단위 보이는 꼬리) / 열림 `M90 360 L630 360`(기존).
- `frontend/src/components/JunctionMap.vue`: SVG `aria-label` 이 "…여덟 정류장" 으로 박혀 있어 정류장 수를 노선 정의에서 세어 "일곱 정류장"/"여덟 정류장" 이 되게 했다(그 외 무변경 — 닫히면 B 역·소역 3·목록 행은 데이터에서 빠져 자동으로 사라진다).
- `frontend/src/App.vue`
  - `BLOG_LINE_PAGES`(bloghub·blogArchive·blogPost·writingStudio) + `isBlogClosedPage()` — 스위치 기반 단일 판정.
  - `readInitialPage()`: 직접 진입(새로고침 포함)이 닫힌 블로그 주소면 `junction` 으로, 마운트 직후 `syncLiveLocation({replace:true})` 가 주소를 환승 홀로 **교체**하고 `showBlogClosedNotice()` 를 한 번 띄운다. `readInitialBlogSlug()` 는 닫힌 주소의 slug 를 무시.
  - `handleLocationPopState()`: 닫힌 블로그 주소로 돌아오면 `junction` + 주소 replace + 안내. (3416행 부근의 `blogArchive/blogPost → junction` 흔적은 열림 상태 동작 보존을 위해 그대로 두고, 닫힘은 `normalizeLivePage` 가 흡수.)
  - `normalizeLivePage()` / `openPage()`: 닫힌 화면은 환승 홀로 정규화하는 방어 가드(UI 에서는 진입점이 없어 도달하지 않음).
  - 안내: 기존 `.junction-access-toast`(role=status, aria-live=polite, 2.5초) 패턴 재사용 — 환승 홀 섹션에 `<p data-blog-closed-notice>` 로 `블로그 노선은 운행을 멈췄습니다`. 위치는 데스크톱 화면 하단 중앙(`--toast-y: calc(100vh - 84px)`), 모바일은 기존 CSS 가 하단 고정. 정적 모드 `STATIC_UNAVAILABLE_PAGES`("정적 공개본에서는 사용할 수 없음")와 별개 경로.
  - 모바일 빠른 환승(`.mobile-quick-nav`, ≤760px)의 `아카이브` 버튼 = 블로그 진입점이어서 `v-if="BLOG_LINE_OPEN"`. 남은 2버튼이 3열 그리드에서 좌측에 쏠리지 않게 닫힘일 때만 인라인 `gridTemplateColumns: repeat(2, …)` (CSS 파일을 못 건드려 인라인 — 아래 제안 참고).
- E2E
  - `BlogTone.e2e.mjs`·`WritingStudio.e2e.mjs`: 파일 상단 `const test = (name, fn) => nodeTest(name, { skip: BLOG_LINE_OPEN ? false : 'D-031 블로그 운행 중단' }, fn)` + `before/after` 조기 return(브라우저·preview 를 띄우지 않음). 테스트 본문 무변경.
  - `ToneTools.e2e.mjs`: 파일 전체가 블로그 스위트가 아니라 `Studio는 720px…` 2건만 `{ skip: STUDIO_SKIP }`. `전 정적 경로 영어 대문자 0` 테스트는 시작 화면이 `/blog` 였는데 이제 환승 홀로 바로 닿아 `환승 홀` 버튼이 없으므로 닫힘일 때 `voyage` 에서 시작(경로 목록의 `/blog`·`/blog-district`·`/studio` 는 그대로 — 이제 환승 홀 리다이렉트 화면을 검사).
  - `JunctionMap.e2e.mjs`: `setup` 이 `/blog` → `환승 홀` 클릭으로 홈에 갔는데 `/blog` 가 환승 홀로 직행(토스트 포함 — 이 스위트는 `.junction-access-toast` 개수를 센다)해 `/voyage` → `환승 홀` 로 변경. **기대값 계산(구현 숫자를 따라 적지 않음)**: 큰 역 = 기록선 B·V + 실험선 A·S·D·P + 기지선 W·R = **8 → B 빼면 7**(행·`.junction-station`·hit 원·모바일 보이는 역 이름·SVG hit 대상 7). 소역 = B 3(아카이브·글 상세·스튜디오) + V 1(노선도) + A 1 + S 6 + W 1 + R 1 = **13 → B 빼면 10**. 노선 선 = 기록선 1 + 실험선 3 + 기지선 1 = **5 그대로**(기록선은 꼬리로 남음). 제한 역 = D + W + R = **3 그대로**. 파일 상단에 같은 계산을 주석으로 남겼고 `BLOG_LINE_OPEN ? 8 : 7`, `? 13 : 10` 으로 양 상태 모두 맞는다. 닫힘 전용 단언 추가: 기록선 `d`=`M290 360 L630 360`, B 역 0, 기록선 그룹 `기록선`/`환승 홀 → 여행`, SVG 설명에 `일곱 정류장`, 홈 텍스트에 `블로그|Writing Studio|스튜디오|아카이브` 0.
  - 신규 `frontend/src/blogClosed.e2e.mjs`: Pages base(`dist`)와 root base(`dist-root`, 다른 위치면 `BLOG_CLOSED_ROOT_DIST`)를 각각 self-serve × 375/1440 = 16건. ① `/blog`·`/blog/<slug>`·`/blog/없는-글`·`/blog-district`·`/studio` 직접 진입 → 환승 홀 + 토스트 한 줄(role/aria-live, 1줄, 화면 안, 주소 교체, 2.5초 뒤 제거, 렌더 텍스트·접근 이름·링크 주소에 `블로그|Writing Studio|스튜디오` 0(토스트 문구만 제외), 블로그 화면 DOM 0) ② 주소 replace(`/voyage` → `/blog` → 뒤로가기 = `/voyage`) ③ popstate(히스토리에 `/blog`·`/blog/x` 끼워 뒤로/앞으로) ④ 여행·자취 밥상·격납고·유로트럭·환승 홀에 진입점 0, 모바일 빠른 환승 `노선도`·`승강장` 2개.
  - `data/junction.test.mjs`: 정류장 기대값을 스위치 기준(`BLOG_LINE_OPEN ? B V A S D P W R : V A S D P W R`)으로, 스위치↔기록선 order/경로/블로그 링크 정의 1건 추가 → unit 27 → **28**.
- 건드리지 않음(보존): 블로그·스튜디오 컴포넌트·데이터, `staticRouting.js`, `staticWritingState.js`, `localStorage` 키, `styles.css`.

## 검증
(S=`/Users/imjeonghan/newProject/workaround.co.kr-platform`, 로그 `/private/tmp/tkt189/gate/*.log`, 실행 스크립트 순서: root 빌드 → ToneTools → dist-root 빌드 → Pages base 빌드 → 나머지 E2E → SimTone/taxi → unit → diff)
- 빌드: `npm --prefix $S/frontend run build` ✓ 56 modules · `… run build -- --base=/workaround.co.kr-platform/` ✓ 56 modules · root `dist-root`(`vite build --outDir /private/tmp/tkt189/dist-root`, 저장소 밖에 둠) ✓ 56 modules. Advisor 는 무변경 — `vite build --base=/workaround.co.kr-platform/advisor/` ✓(VoyageAdvisorTransfer 용 병합 dist 에 사용).
- 메인 E2E 파일별(pass/skip/fail):

| 파일 | 대상 빌드 | pass | skip | fail |
|---|---|---|---|---|
| blogClosed (신규) | Pages+root 둘 다 | 16 | 0 | 0 |
| BlogTone | Pages | 0 | 2 (D-031) | 0 |
| WritingStudio | Pages(격리 preview) | 0 | 14 (D-031) | 0 |
| ToneTools | root `dist` | 10 | 2 (Studio, D-031) | 0 |
| JunctionMap | Pages | 4 | 0 | 0 |
| Ets2Dev | Pages | 6 | 0 | 0 |
| Ets2Live | Pages | 4 | 0 | 0 |
| Pantry | Pages | 8 | 0 | 0 |
| VoyageAdvisorTransfer | Pages+advisor 병합 dist | 2 | 0 | 0 |
| VoyageCollection | Pages | 2 | 0 | 0 |
| VoyageReplay | Pages | 3 | 0 | 0 |
| VoyageRouteMap | Pages | 4 | 0 | 0 |
| VoyageSettlement | Pages | 1 | 0 | 0 |
| splashTone | Pages | 13 | 0 | 0 |
| staticRouting | Pages | 4 | 0 | 0 |
| SimTone | root `dist-root` (`vite preview :4175`) | 5 | 0 | 0 |
| taxiDispatch | root `dist-root` (`vite preview :4175`) | 5 | 0 | 0 |
| 합계 | | 87 | 18 | 0 |

  VoyageAdvisorTransfer 는 `frontend/dist/advisor/` 가 있어야 돈다(Pages 병합 dist). 첫 실행에서 병합 없이 돌려 2건 실패했고(블로그 무관, `dist/advisor/index.html` ENOENT), `VOYAGE_ADVISOR_DIST_ROOT=<병합 dist>` 로 2/2.
- unit: `node --test $(find src -name "*.test.mjs")` **28/28**(기존 27 + `junction.test.mjs` 신규 1건 — 위 구현 내역). `git -C $S diff --check` clean(미추적 신규 파일은 행말 공백 직접 확인).
- 변이 점검: `isBlogClosedPage` 를 일부러 무력화(`return false && …`)해 빌드·`blogClosed.e2e.mjs` 를 돌리니 12/16 실패(직접 진입·replace·popstate 12건; 진입점 없음 4건은 데이터 측면이라 통과) → 원복 후 16/16. 신규 E2E 가 가드를 실제로 검증한다.
- Advisor(`services/advisor/frontend/src`)에는 `/blog`·`/studio`·`블로그`·`Writing Studio` 참조가 0(grep) — 링크 무변경.
- 실렌더 캡처 `/private/tmp/tkt189/`: 홈 `junction-375-dark.png`·`junction-375-light.png`·`junction-1440-dark.png`·`junction-1440-light.png`(Pages base, 전체 페이지), root base 홈 `home-root-375.png`·`home-root-1440.png`, `/blog` 진입 토스트 `blog-entry-toast-pages-375.png`·`…-1440.png`·`blog-entry-toast-root-375.png`·`…-1440.png`.
- 실렌더 판단: 1440·375 홈에서 기록선 왼쪽 꼬리가 환승 홀 링 왼쪽으로 짧게 나오고 링을 직선 통과 — 어색하지 않다(375 에서 보이는 꼬리 길이 약 15~17px, 1440 에서 약 35px; `[반박]` 없음). 지도 글자 겹침 0·노선이 글자 bbox 를 지나는 점 0·소역 hit(r=26) 소유권(1440 라벨 중심 클릭 = 자기 역)·가로 overflow 0·40px 조작 영역·영어 간판 0 은 JunctionMap/ToneTools E2E 가 단언하고 통과. 토스트는 1440 하단 중앙/375 하단 가로 꽉 참, 한 줄 `블로그 노선은 운행을 멈췄습니다`(줄바꿈 없음 — E2E 가 줄 수 < 1.5 단언).

## 질문/에스컬레이션
- `[반박]`·`[구체화 질문]` 없음. 아래는 판정을 막지 않는 관찰·제안이다.
- [제안] 모바일 빠른 환승 2열은 CSS 를 못 건드려 인라인 `style` 로 처리했다. `styles.css` 에 `.mobile-quick-nav` 2열 변형 클래스를 두는 쪽이 낫다면 후속 CSS 티켓에서 교체(해당 줄은 App.vue 5092행 부근, `BLOG_LINE_OPEN` 분기 하나).
- [제안] 지도 구도: B 가 빠져 viewBox 왼쪽 절반(x<290)이 R·D·P 라벨 외에 비었다(1440 에서 지도가 오른쪽으로 쏠려 보임, 375 는 지도 아래 여백이 큼). 좌표·hit 단언이 엮여 있어 이번엔 viewBox 를 바꾸지 않았다 — PM 이 구도를 다듬을지 판단.
- [PM 의문] `frontend/public/mockups/`(`blog-archive.html`·`blog-hub.html`·`blog-post.html`·`writing-studio.html`, `home.html`·`index.html` 의 블로그 링크)가 Pages 산출물에 그대로 실려 `/mockups/blog-*.html` 로 공개된다 — 이번 scope 밖이라 두었다. "홈·주소 노출 0" 의 의도에 목업 페이지까지 포함되는지 PM 확인 필요.
- 참고: `App.vue` `lineCards`(500~600행)에 `bloghub` 카드가 있으나 `lineCards` 자체가 어디서도 쓰이지 않는 죽은 코드라 손대지 않았다.
- 참고: `BLOG_LINE_OPEN=true` 복귀 시 `blogClosed.e2e.mjs` 는 자동 skip, 블로그·스튜디오 E2E 는 자동 재활성, `JunctionMap.e2e`/`junction.test` 는 8·13 기대값으로 전환된다. README·feature-definition 의 블로그 서술은 D-031 대로 PM 몫.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-189-r1.md`.
- 없음.
