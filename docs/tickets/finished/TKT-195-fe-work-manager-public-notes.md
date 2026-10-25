문서 상태: 작성완료

# TKT-195 `[FE]` Work Manager 잠금 해제 + 공개 "운영 노트" 화면

- 상태: finished · **P1** · 담당: dev 서브에이전트(**Sonnet**) · 의존: **TKT-189 finished 뒤 착수**(같은 `App.vue`·`lines.js`·`JunctionMap`). 브랜치 `codex/v0.8.0-live`. **UX 1순위.**
- 근거: PO 2026-10-25 「현재 이 얘기들을 홈페이지 관리창에다가 내용 올려. 누가 봐도 되니까 그냥 올려도 돼. 기존에 잠금은 풀어.」 → D-033.
- 콘텐츠: `frontend/src/data/workNotes/operatingModel.js`(PM 작성, **불가침** — 문구 수정 금지, 이상하면 `[반박]`).
- scope: `frontend/src/App.vue`(work 페이지), `frontend/src/staticRouting.js`(정적 잠금 목록에서 `work` 제거 — 이 한 줄만), `frontend/src/data/lines.js`(기지선 W 역 상태 문구·잠금 표시), `frontend/src/components/JunctionMap.vue`(잠금 판정이 W 를 막지 않게, 필요 시), 신규 `frontend/src/components/WorkNotes.vue` + `WorkNotes.e2e.mjs`, 영향받는 기존 E2E 기대값, `frontend/src/styles.css`(새 컴포넌트 스타일).

## 완료 조건
1. [x] **잠금 해제**: 정적 공개본(Pages base)에서 환승 홀 W 역·노선 목록 `Work Manager` 행이 흐림·`보호 구역`·접근 토스트 없이 열린다. W 상태 문구는 `운영 노트`. Runtime Board 는 기존 잠금 유지(이 티켓 범위 밖).
2. [x] **운영 노트가 주인공**: `/work` 첫 화면은 `OPERATING_NOTES` 를 렌더 — 절마다 제목·상태 배지(`확정`/`제안`/`할 일`)·한 줄 요지·흐름(`flow` 가 있으면 화살표로 이어진 한 줄, 375 에서는 세로)·요점 목록. 맨 위에 갱신일(`OPERATING_NOTES_UPDATED`). 톤 원칙: 면은 조작부에만, 주인공 1, 노선색(W)은 선·배지에만, 영어 간판 0(제품·서비스명 `Cloudflare`·`GitHub`·`Tailscale` 등 고유명사는 허용).
3. [x] **실행 기능은 그대로 보호**: 기존 검토 대기·버전·명령 실행·인증 영역은 운영 노트 **아래**로 내린다. 정적 공개본에서는 백엔드가 없으므로 그 영역은 `집 PC 연결 시 사용` 한 줄로 접힌다(데이터 요청 0, 오류 0). 라이브(root base, gateway 있음)에서는 기존 동작·비밀번호 게이트 유지 — **명령 실행 권한은 풀지 않는다.**
4. [x] **주소**: `/work` 직접 진입·새로고침이 정적 공개본에서 환승 홀로 튕기지 않고 운영 노트를 연다.
5. [x] **E2E**: `WorkNotes.e2e.mjs` — 375/1440 × 다크/라이트에서 절 10개 제목 렌더, 상태 배지, 가로 overflow 0, 정적 모드 API 요청 0, W 역 클릭 → `/work`. 기존 E2E 중 W 잠금을 전제한 기대값(JunctionMap·staticRouting·ToneTools 등)은 새 상태에서 계산한 값으로(이유 기록).
6. [x] 게이트: root/Pages-base build, 메인 E2E 전체(블로그 skip 포함 현재 기준), unit, `git diff --check`, 375/1440 × 다크/라이트 캡처 `/private/tmp/tkt195/`.

## 질문/에스컬레이션
- [PM 의문] 모바일(375) 운영 노트가 약 4700px 로 길다(절 10개 + 세로 흐름). 접힘(절별 details)을 쓰지 않은 건 "첫 화면의 주인공" 때문 — 길다고 판단하면 후속으로 목차 또는 접기 제안.
- [PM 의문] 토프바는 여전히 `운영 관제실`(page title), 본문 h1 은 `운영 노트`. 둘이 어긋나 보이면 토프바 제목을 바꾸는 후속이 필요(scope 밖이라 손대지 않음).
- [반박] 없음. 콘텐츠 문구 수정 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-195-r1.md`. [중요] 375 길이·상단바 제목 → TKT-197.
- 없음.

## 구현 내역
- `staticRouting.js`: `STATIC_UNAVAILABLE_LIVE_PAGES` 에서 `work` 만 제거 → 주소 직접 진입·새로고침·popstate 가드가 자동으로 `/work` 를 연다(TKT-189 블로그 가드 무변경).
- `data/lines.js`: W 역 `status: '운영 노트'`, `access: 'protected'` 제거. 기지선 안내문 `Work → Runtime`(보호 구역 문구 제거, Runtime 은 역 단위로 잠금 유지). JunctionMap.vue 는 무변경(`access` 로 판정하므로).
- 신규 `components/WorkNotes.vue`: 갱신일·절 10개(제목·상태 배지·lead·flow·points). 1440 flow 는 화살표 한 줄, 375 는 세로. 면 없음, W 색은 좌측 선·확정 배지·화살표에만.
- `App.vue`(work 섹션): `<WorkNotes />` 를 맨 위에, 정적 모드는 `집 PC 연결 시 사용` 한 줄(실행 영역 미렌더·API 0), 라이브는 기존 검토 대기·버전·명령·인증 그대로 아래(비밀번호 게이트 무변경). 기존 hero 의 h1 → h2(문서에 h1 하나).
- `styles.css`: `.work-notes*`, `.work-ops-collapsed`, hero h2 규칙.
- 기대값 변경(이유): `staticRouting.test.mjs`(work 가 더는 정적 잠금 아님), `staticRouting.e2e.mjs`(work 는 운영 노트로 열림·runtime 만 환승 홀 복귀), `JunctionMap.e2e.mjs`(restricted 3→2, W 행 토스트 검증을 Runtime 행으로, 기지선 묶음 opacity 0.55/0.8→1 + R 역 개별 opacity 로 이동 — 이전 값은 W 잠금 전제).
- 공유 파일: `frontend/src/App.vue`, `frontend/src/data/lines.js`, `frontend/src/styles.css`(TKT-189 변경과 공존, 이미 반영분 위에서 수정).
- 확신 없는 점: 1440 flow "한 줄"은 960px 컨테이너에서 가장 긴 흐름(방문자 요청 경로)이 간신히 맞는다 — 콘텐츠가 길어지면 줄바꿈된다(E2E 가 잡는다). 라이브 모드 `/work` 는 ToneTools E2E 로만 확인(실 gateway 미기동).

## 검증
- build: root / Pages-base 모두 성공. unit 28 pass 0 fail. `git diff --check` 0.
- 메인 E2E(pass/skip/fail): BlogTone 0/2/0 · Ets2Live 4/0/0 · Ets2Dev 6/0/0 · JunctionMap 4/0/0 · Pantry 8/0/0 · VoyageCollection 2/0/0 · VoyageReplay 3/0/0 · VoyageRouteMap 4/0/0 · VoyageSettlement 1/0/0 · VoyageAdvisorTransfer 2/0/0(Advisor 병합 dist) · WorkNotes 8/0/0(신규) · WritingStudio 0/14/0 · splashTone 13/0/0 · staticRouting 4/0/0 · blogClosed 16/0/0(root dist 외부) · ToneTools 10/2/0(root dist, skip=Studio D-031) · SimTone 5/0/0 · taxiDispatch 5/0/0(root dist-root 4175).
- 캡처 `/private/tmp/tkt195/`: `work-{375,1440}-{dark,light}.png`, `home-{375,1440}-{dark,light}.png`. 실제 렌더를 직접 확인(1440 흐름 한 줄·화살표, 375 세로, 영어 간판은 고유명사만).
