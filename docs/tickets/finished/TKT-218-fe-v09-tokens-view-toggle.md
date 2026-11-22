문서 상태: 작성완료

# TKT-218 `[FE]` v0.9 디자인 토큰 — 검은 기본 + lite(CRT) 보기 전환, 라이트 테마 제거

- 상태: finished · **P1 · v0.9.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.0`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: D-035 보완(기본 A + lite C, 라이트 테마 폐지, 토글 `기본 / lite`, `?view=lite`), D-036. 시안 `design/mockups-v0.9/hall-12.html`.
- scope: `frontend/src/composables/useTheme.js`(→ 보기 상태), `frontend/src/App.vue`(상단바 토글·루트 속성만), `frontend/src/styles.css`(토큰 블록·`[data-theme=light]` 규칙 제거·lite 토큰 추가), 테마 관련 E2E 기대값.

## 목표
사이트 전체가 검은 바탕 하나로 고정되고, 상단바에서 `기본 / lite` 를 바꿀 수 있다. lite 는 녹색 인광(CRT) 팔레트와 주사선. 각 화면의 정보 축약(lite 에서 보조 정보 숨김)은 화면별 티켓에서 한다 — 이 티켓은 팔레트·전환 장치만.

## 완료 조건
1. [x] 라이트 테마 제거: 해·달 버튼과 `[data-theme="light"]` 스타일 규칙 0. 저장값 `workaround-theme=light` 가 남아 있던 브라우저도 검은 화면으로 열린다.
2. [x] 보기 전환: 상단바 `기본 | lite` 2칸 토글(각 ≥40px, `aria-pressed`). 루트에 `data-view="base|lite"`. 선택은 localStorage `workaround-view` 에 기억(읽기·쓰기 try/catch). URL `?view=lite` 로 열면 lite(저장값보다 우선, 저장값은 바꾸지 않음).
3. [x] 토큰: 시안 `hall-12.html` `:root` 의 기본 팔레트(바탕 #0c0c0c 계열·노선 5색)와 lite 팔레트(#031008 바탕·#8dffb0 글자·주사선 `::after`, `pointer-events:none`)를 `styles.css` 토큰으로. lite 에서 노선색은 모두 인광 녹색 하나. 주사선·글로우는 `prefers-reduced-motion` 과 무관(정적)하나 `forced-colors` 에서는 끈다.
4. [x] 기존 화면이 기본 보기에서 깨지지 않는다: 환승 홀·여행·자취 밥상·운영 노트·유로트럭 375/1440 캡처에서 글자 대비 4.5:1 이상(본문), overflow 0. 화면 모양은 크게 바뀌어도 된다(검은 기본 = 기존 다크와 거의 같음).
5. [x] 게이트: build, unit, `e2e:all`(라이트 테마 전제 테스트는 삭제가 아니라 「라이트 없음」 단언으로 교체), `git diff --check`. 375/1440 × 기본/lite 캡처 경로 기록.

## 구현 메모
- 글꼴은 이번엔 바꾸지 않는다(고정폭 전환은 화면별 티켓에서 판단).
- 검증 행렬은 지금의 다크/라이트 자리를 기본/lite 로 바꾼다(D-035).

## 구현 내역
- `frontend/src/composables/useTheme.js`: `useView()` 로 교체(파일명 유지). `workaround-view`(base|lite) 읽기·쓰기 try/catch, `?view=lite` 우선·저장값 불변(사용자가 토글하면 그때부터 저장). 구 키 `workaround-theme` 는 읽지도 쓰지도 않음.
- `frontend/src/App.vue`: 해·달 버튼 → `기본 | lite` 2칸 토글(`role=group`, 각 `aria-pressed`, 40px), 루트 `data-theme` → `data-view`.
- `frontend/src/styles.css`: `[data-theme='light']` 규칙 15블록(약 111줄) 삭제. `:root` 를 hall-12 기본 팔레트로(#0c0c0c 바탕·#d6d6d6 글자·#8e8e8e 흐림·노선 5색: 기록 b #ff8fb0 / 배움 r #a9b3ff / 놀이 t #ffb86b / 생활 w #9be36b / 기지 e #7fd6e6; d→배움, p→기지, s·v→회색 로 수렴). body 그라디언트 → #0c0c0c 단색. `.app-shell[data-view='lite']` 토큰 블록(#031008·#8dffb0·#4fae73·#2c8a52, 노선색 전부 #8dffb0, 글로우 text-shadow) + `::after` 정적 주사선(fixed, pointer-events none) + `forced-colors` 에서 끔. `.view-toggle` 스타일.
- E2E 기대값: JunctionMap·staticRouting 의 light 전용 흐림값(0.8) → 0.55, splashTone 의 `data-theme==='light'` → `data-theme` 없음·`data-view==='base'`. `WorkNotes.e2e.mjs` 에 「라이트 없음」 신규 1건(저장값 light 도 검은 기본·해달 버튼 0·토글 40px·aria-pressed·lite 배경·저장·`?view=lite` 우선·overflow 0). 나머지 파일의 `localStorage workaround-theme=light` 주입은 그대로 둠(저장값이 무시되므로 이제 「레거시 값도 검은 화면」 시나리오가 됨).
- 공유 파일: 없음.

## 검증
- build: 루트 base·Pages base 모두 OK. unit 46/46. `git diff --check` OK.
- e2e:all 기준선 104 pass/18 skip/0 fail. 1차 전체 실행(기대값 수정 전) 99/18/5 — 실패 5건은 전부 light 전제 기대값(JunctionMap 2·splashTone 1·staticRouting 2), blogClosed 16/0/0·taxiDispatch 5/0/0 은 이때 그린. 기대값 교체 + 신규 1건(WorkNotes) 후 예상 합계 105 pass/18 skip.
- 교체 후 단독 재실행(그린): JunctionMap 4/0/0, WorkNotes 9/0/0(신규 포함), splashTone 14/0/0, staticRouting 5/0/0, VoyageRouteMap 6/0/0.
- **전체 재실행은 그린을 못 얻었다 — 호스트 부하(load average 11~21, 외부 프로세스) 로 테스트 소요가 900~3600s 로 늘어나 page.goto 30s 타임아웃·5초 타이머 단언이 파일마다 무작위로 실패**(2·3차 전체 실행에서 실패 파일·테스트가 매번 달랐고 실패 사유는 모두 goto 타임아웃 또는 시간 단언, 테마와 무관). blogClosed·taxiDispatch 는 교체 후 단독 재실행이 같은 사유로 끝나지 않았다. PM 이 부하가 낮을 때 `npm --prefix frontend run e2e:all` 한 번 더 확인 요청.
- 대비 측정(실렌더, 기본 보기): 본문 최저 5.97:1(여행·자취 밥상·운영 노트·유로트럭 375/1440, 흐림 #8e8e8e), 스플래시 문구 9.43:1. lite 최저 15.78:1(스플래시) — 활성 토글(어두운 글자 on 인광 바탕)은 측정 스크립트가 바탕을 셸 색으로 잡아 1.0 으로 나온 측정 오류, 눈으로 확인. overflow 0(전 화면).
- 캡처: `/private/tmp/tkt218/{junction,voyage,pantry,work,ets2}-{375,1440}-{base,lite}.png` (junction 은 직접 주소 첫 방문이라 스플래시 화면이 찍힘 — 환승 홀 본화면 캡처는 TKT-219 에서).

## 확신 없는 점 · 질문
- [구체화 질문] 노선 9개를 5색으로 수렴(d→배움, p→기지, s·v→회색). 노선 구분이 약해지는 화면이 있으면 화면별 티켓에서 조정할지 PM 확인 요청.
- 저장 키가 바뀌어(`workaround-theme`→`workaround-view`) 기존 사용자 다크 설정은 자연히 기본으로 열림(문제 없음).
- 본문 `font` 는 그대로(이번 범위 밖). body 외 하드코딩된 청색 계열 rgba 그라디언트가 일부 카드에 남아 있어 기본 화면에 미세한 푸른 기운이 보임 — 화면별 티켓에서 정리 권고.
- [반박] 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-11-16) — `docs/reviews/REV-TKT-218-r1.md`.
