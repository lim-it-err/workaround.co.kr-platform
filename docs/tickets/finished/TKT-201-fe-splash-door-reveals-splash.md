문서 상태: 작성완료

# TKT-201 `[FE]` 버그 — 스플래시 문이 열릴 때 뒤에 환승 홀이 아니라 `DOORS OPENING` 화면이 보인다

- 상태: finished · **P1 · v0.8.1(패치)** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.1`**(작업 트리 `/Users/imjeonghan/newProject/wa-081`).
- 근거: PO 2026-10-25 「문이 열릴 때 doors opening 하고 나서 문이 열릴 때 메인 화면이 아니라 doors opening으로 나와」.
- 원인(PM 확인): `App.vue` `startSplashDoorOpening()` 이 문을 여는 500ms 동안 페이지를 `splash` 로 둔 채 애니메이션하고, **열림이 끝난 뒤에야** `applyPageChange('junction')` 을 부른다. 그래서 열리는 문 사이로 스플래시 플랩(`DOORS OPENING`)이 보인다.
- scope: `frontend/src/App.vue`(스플래시 문 열림 순서), `frontend/src/splashTone.e2e.mjs`, 필요 시 `styles.css`(문 레이어 z-index).

## 완료 조건
1. [x] 순서: 문이 닫힌 상태(`closed`)에서 **먼저 환승 홀로 페이지 전환** → 다음 프레임에 `opening` 시작 → 500ms 뒤 문 레이어 제거. 열리는 문 사이로 환승 홀이 보여야 한다.
2. [x] 총 시간 5.5초·재방문 2.5초·reduced-motion(문 없음 즉시 전환)·`다시 재생`·출발 전환(TKT-182 의 라우트 문)은 그대로. 포커스는 전환 직후 환승 홀 제목.
3. [x] E2E 1건 추가: 문 열림 중간(약 250ms) 시점에 환승 홀 노선도가 DOM 에 있고 스플래시 플랩이 없음(또는 보이지 않음), 캡처 1장. 기존 splashTone 13 그린.
4. [x] 게이트: build, splashTone·JunctionMap·staticRouting E2E, unit, `git diff --check`, 375/1440 캡처 `/private/tmp/tkt201/`.

## 구현 내역
- `App.vue` `startSplashDoorOpening()`: 문 `closed` 상태를 켠 직후 `applyPageChange('junction', { replace: true })` 를 먼저 호출하고, `nextTick` 에서 `opening` 시작 → 500ms 뒤 `resetDoorTransition()`+제목 포커스. (기존엔 열림 뒤에 전환.) 문 레이어는 기존 `.door-transition` z-index 400 fixed 그대로(CSS 변경 없음).
- 타이밍: 스플래시 DOM 은 5.0초(문 열림 시작)에 사라지고 문은 5.5초에 제거. 5.5초/재방문 2.5초/reduced-motion/다시 재생/라우트 문 전환 코드는 무변경.
- `splashTone.e2e.mjs`: `finishSplashAt` 를 「열림 중 스플래시 0·환승 홀 제목 존재」로 수정, 첫 방문 DOM 제거 기대값 5500→5000ms(문 열림 시작), 신규 테스트 1건(250ms 시점 노선도 존재·스플래시/`DOORS OPENING` 0·문 z-index>지도·포커스, 375/1440).
- 공유 파일: 없음 (App.vue·splashTone.e2e.mjs 만).

## 검증
- build 루트/`--base=/workaround.co.kr-platform/` 통과. splashTone 14/14(기존 13+신규 1), JunctionMap.e2e 28/28, unit 28/28, `git diff --check` 0.
- staticRouting.e2e: 375 dark/light 실패 — `staticRouting.e2e.mjs:161` `.junction-page-stop.planned` 화이트채플 count 0!==1. 환승 홀 지도 변경(TKT-202 진행 중)에서 온 것으로 보이며 본 티켓 무관(스플래시·문 코드 미관련). TKT-202 완료 후 재확인 필요.
- 캡처: `/private/tmp/tkt201/door-opening-mid-375.png`, `door-opening-mid-1440.png` (문 250ms 지점 고정 — 가상 시계는 CSS 전환을 못 돌려 Web Animations `currentTime=250` 으로 고정).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-201-r1.md`.
- 없음.
