문서 상태: 작성완료

# TKT-219 `[FE]` v0.9 환승 홀 — 부팅 로그 → 출발 안내판(기본) · 화살표 선택 목록(lite)

- 상태: finished · **P1 · v0.9.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.0`.
- 근거: **D-036**(PO 2026-11-15 「A-08 후 A-04」「lite는 입력하게 하지 말고 화살표로」「C-01 기준으로… 잘했어 이대로 하게 해줘」). 시안 `design/mockups-v0.9/hall-12.html` 맨 위 「선택안 미리보기」가 기준 동작.
- scope: 신규 `frontend/src/components/hall/HallBoard.vue`·`HallLite.vue`·`frontend/src/data/hallBoard.js`, `components/pages/JunctionView.vue`(보기에 따라 선택), 신규 E2E `HallV09.e2e.mjs`, 기존 Junction E2E 기대값. `JunctionMap.vue`·`lines.js` 는 지우지 않는다(노선도는 v0.9 다른 티켓에서 재사용 판단).

## 완료 조건
1. [x] **데이터** `hallBoard.js`: 행 = { 노선(5노선: 기록·배움·놀이·생활·기지), 행선지, 상태(운행/개통 준비/샘플/공개/운행 중단), 이동 대상 page }. 시안과 같은 8행 + 순서. 기존 `lines.js` 의 page 키를 재사용. 블로그 행은 `BLOG_LINE_OPEN=false` 일 때 「운행 중단」 흐린 행(누르면 기존 블로그 닫힘 안내 토스트).
2. [x] **기본 — 첫 방문**: 문 열림 직후 부팅 로그가 줄당 90ms(시안 문구 그대로) 흐르고 마지막 줄 뒤 500ms 에 출발 안내판으로 바뀐다. **로그 중 클릭·탭·아무 키 입력이면 즉시 안내판**(D-036 PM 권고). 재방문(스플래시의 기존 재방문 판정 재사용)·`prefers-reduced-motion` 은 로그 없이 안내판부터.
3. [x] **기본 — 출발 안내판**: 표(노선·행선지·상태), 행 전체가 버튼/링크(≥44px), 운행 행은 해당 화면으로 이동, 「개통 준비」 행은 이동 대신 안내 문구. 노선 이름은 노선색 글자. 375 에서 가로 스크롤 0(열 3개가 들어간다).
4. [x] **lite**: 시안 C-01 + 화살표. 제목 「환승 홀」 + 역 이름 6개(여행·Advisor·격납고·유로트럭·자취 밥상·운영 노트)만. **글자 입력 칸 없음.** `role=listbox` + `aria-activedescendant`, ↑↓ 이동(끝에서 순환), Home/End, Enter 진입. 탭/클릭: 한 번 = 선택, 선택된 줄 다시 = 진입. 선택 표시 = 반전 + `▶`. 진입 시 화면 첫 로드 때 목록에 포커스는 주지 않는다(스크린리더 첫 낭독 방해 금지), Tab 으로 들어오면 첫 항목 선택.
5. [x] E2E(375·1440 × 기본·lite): 첫 방문 로그 → 안내판 전환, 입력으로 건너뛰기, 재방문 즉시 안내판, 행 클릭 이동, lite 키보드 ↓↓Enter 로 세 번째 역(격납고) 진입, 탭 두 번 진입, overflow 0, 영어 간판 0(브랜드명 제외). 게이트: build·unit·`e2e:all`·`git diff --check`, 캡처 4장 경로 기록.

## 구현 메모
- 로그 문구의 「workaround 0.9.0」 버전 문자열은 하드코딩 말고 빌드 버전 값이 있으면 그것을, 없으면 `VERSION` 파일 값을 빌드 시 주입.
- 노선 5개 표시는 Q-025 ① 을 PO 가 시안으로 승인한 것으로 본다(PM). 노선 데이터 전면 재편(`lines.js`)은 이 티켓 범위 밖.

## 구현 내역
- 신규 `frontend/src/data/hallBoard.js`(8행·lite 6역·부팅 로그·`takeBootLog`·`resolveHallTarget`), `components/hall/HallBoard.vue`·`HallLite.vue`(스타일은 SFC scoped — 전역 styles.css 무수정), `components/HallV09.e2e.mjs`(18케이스 중 16 실행 + 캡처 2).
- `JunctionView.vue`: 노선도(JunctionMap) 대신 `view` prop 에 따라 HallBoard/HallLite. 이동 불가 안내(「일일 5지 · 개통 준비 중」)는 기존 `.junction-access-toast` 로 2.5초. `JunctionMap.vue`·`lines.js` 는 그대로 둠(참조만 끊김).
- 공유 파일: `App.vue`(JunctionView 에 `:view="view"` 한 줄), `composables/useSplash.js`(`readRecentSplashVisit` 를 클로저 밖으로 꺼내 export — 동작 불변), `vite.config.js`(`__APP_VERSION__` = 루트 `VERSION` 빌드 시 주입, 파일이 없으면 빈 값 → 로그가 「workaround 기동」).
- 재방문 판정: 스플래시가 끝날 때 `splash:seen` 을 새로 쓰므로 마운트 시점에 읽으면 첫 방문도 재방문이 된다 → `hallBoard.js` 모듈 로드(앱 시작) 때 한 번 읽어 둔다. 부팅 로그는 페이지 로드당 한 번만(환승 홀을 다시 열면 안내판부터).
- 시안 그대로: 로그 10줄(줄당 90ms), 마지막 줄 뒤가 아니라 `줄 수×90+500 = 1400ms` 에 안내판(시안 코드 기준 — 완료 조건 문구 「마지막 줄 뒤 500ms」보다 90ms 길다). 로그 중 pointerdown·keydown(capture) 이면 즉시 안내판. 재방문·reduced-motion 은 로그 없이 안내판.
- 안내판: 노선(5색 글자)·행선지·상태, 행=button(Advisor 는 `<a href=…/advisor/>`), 행 높이 48px. 「개통 준비」(일일 5지)=안내 토스트, 블로그=`BLOG_LINE_OPEN=false` 면 흐린 「운행 중단」 행 → 기존 닫힘 안내(`blogClosedNotice`). 시안 `취향·Runtime 은 안내판에 없음` 자기 해설 문구는 넣지 않음.
- lite: 입력 칸 없음, `role=listbox`+`aria-activedescendant`, ↑↓(순환)·Home/End·Enter, 클릭 한 번=선택/다시=진입. 첫 로드엔 포커스·선택 없음, Tab 진입 시 첫 항목 선택. 마우스로 첫 줄을 눌러도 포커스 이벤트가 선택을 먼저 해 버리는 문제는 pointerdown 플래그로 막음(첫 탭=선택만, 테스트 있음). 선택 줄 아래 문구는 선택 후 「○○ 선택 · 한 번 더 누르면 들어갑니다」(터치 안내 겸용).

### 기존 E2E 기대값 교체(삭제 없음)
- `JunctionMap.e2e.mjs`: 노선도 전용 단언(정류장 수·소역·노선 선·SVG hit 원·소역 이름 크기)은 대상이 사라져 의미 없음 → 같은 의도(이동 대상 누락 0, 40px, 글자 대비, 넘침 0, 접근 토스트)를 행 기준 2케이스 × 375/1440 로 교체(라이트 테마 시나리오는 TKT-218 로 이미 없음).
- `blogClosed.e2e.mjs`: 「큰 역 7개」→「행 8개 + 흐린 블로그 행은 button·href 없음·운행 중단」, 블로그 표면 검사는 그 행 하나만 예외(시안 A-04 가 정한 것 — D-031 의 「블로그 진입점 0」과 충돌하므로 PM 확인 요청, 아래 질문).
- `staticRouting.e2e.mjs`(소역·static-server 소역 단언 → 8행·노선도 없음·개통 준비 토스트), `WorkNotes.e2e.mjs`(Runtime 행 토스트 → 안내판에 Runtime 없음), `Pantry.e2e.mjs`·`splashTone.e2e.mjs`·`Ets2Live.e2e.mjs`(셀렉터 `.junction-route-row`/`.junction-map`/소역 → `.hall-row`/`[data-hall-board]`).

## 검증 (2026-11-21, 호스트 느림 — 시간 계열은 가상 시계 사용)
- `npm run build` ✓ · `npm run build -- --base=/workaround.co.kr-platform/` ✓
- unit `node --test $(find src -name "*.test.mjs")`: 46 pass / 0 fail
- `npm --prefix frontend run e2e:all`: **pass 121 / skip 20 / fail 0** (기준선 105/18 → HallV09 +16 pass·+2 skip(캡처 전용, `HALL_SCREENSHOT_DIR` 있을 때만), JunctionMap 8→4, 합 196s). 1차 실행은 e2e 기대값 교체 전 소스라 중단했고 위 숫자는 교체 뒤 전체 재실행. 시간 계열 실패는 없었다.
- `git diff --check` ✓ · 임시 `services/advisor/frontend/node_modules` 링크는 삭제함.
- 캡처(`/private/tmp/tkt219/`): 첫 방문 로그 중간 `log-mid-375.png` `log-mid-1440.png` · 안내판 `board-base-375.png` `board-base-1440.png` · lite 선택 `lite-selected-375.png` `lite-selected-1440.png`(격납고 선택) · lite 첫 진입(Tab) `lite-initial-375.png` `lite-initial-1440.png`.
- 직접 본 것: 375 안내판 가로 넘침 0(`html·body·.page-scroller·.hall` 0), 로그 줄이 375 에서 11px 로 안 잘림. 영어 간판 0(허용: Advisor·workaround·키 이름 Enter). 행 48px·lite 항목 48px. 노선색 5개 서로 다름.
- 원칙 대비: 면은 조작부(안내판 틀 1개)뿐, 주인공 1(표). 시안과 어긋난 점: ① 로그 글자 11px(375) — 시안 13px 은 375 에서 넘쳐 줄임 ② 1440 에서는 표 폭을 720px(lite 560px)로 가운데 모음(시안은 격자 칸 폭) — 빈 면이 큼.

## 질문/에스컬레이션
- [반박] **D-031 vs 시안 A-04 블로그 행**: D-031 은 홈에서 블로그 진입점·텍스트 0 을 요구하고(blogClosed E2E), 시안·티켓은 흐린 「운행 중단」 블로그 행을 요구한다. 티켓대로 구현하고 blogClosed 의 금칙 검사에서 그 행 하나만 예외로 했다. 사용성 면에서는 눌러도 동작이 없는 행이 안내판 8줄 중 1줄을 차지한다 — 빼는 쪽이 낫다고 보면 `HALL_ROWS` 한 줄 삭제 + 예외 코드 제거.
- [구체화 질문] 부팅 로그 버전 문자열: 현재 루트 `VERSION` 이 0.8.3 이라 로그에 「workaround 0.8.3 기동」이 뜬다(0.9.0 아님). 릴리스 시 VERSION 을 올리면 되는지, 시안처럼 0.9.0 고정이어야 하는지.
- [구체화 질문] 시안 로그의 상태(「샘플」「공개」)와 안내판 상태(둘 다 「운행」)가 다르다 — 데이터는 둘 다 시안 그대로 두었다. 유로트럭=샘플 / 운영 노트=공개를 안내판에도 쓸지.
- 확신 없음: lite 에서 Advisor 진입은 `location.assign`(전체 페이지 이동). 부팅 로그를 건너뛰는 입력 감지는 window capture 의 pointerdown·keydown 이라 스크린리더 가상 커서 조작은 감지하지 못할 수 있다(그 경우 1.4초 뒤 자동 전환).

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-11-21) — `docs/reviews/REV-TKT-219-r1.md`.
