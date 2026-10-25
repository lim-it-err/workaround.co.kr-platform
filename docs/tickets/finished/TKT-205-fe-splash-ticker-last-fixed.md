문서 상태: 작성완료

# TKT-205 `[FE]` 스플래시 티커 — 마지막(4번째) 문구를 `관리자 몰래 내맘대로 홈페이지 로딩하는 중.` 으로 고정

- 상태: finished · **P1 · v0.8.2** · 담당: dev 서브에이전트(Haiku) · 브랜치 `codex/v0.8.2`(작업 트리 `/Users/imjeonghan/newProject/wa-082`) · **TKT-196 끝난 뒤 착수(같은 App.vue)**.
- 근거: PO 2026-10-25 「무조건 시작 안내 문구 마지막 4번째는 관리자 몰래 오픈하는 중(지금 있는 거)로 고정해줘」 → 정정 「4번째 칸에만. 재방문에서는 새로운 2개 그냥 보여줘」.
- scope: `frontend/src/data/splashTicker.js`(고정 문구 상수·선택 함수), `frontend/src/App.vue`(`rotateSplashTicker` 의 마지막 틱 처리), `frontend/src/splashTone.e2e.mjs`.

## 완료 조건
1. [x] 첫 방문·`다시 재생` 의 4번째(마지막, 4,500ms) 티커는 항상 `관리자 몰래 내맘대로 홈페이지 로딩하는 중.`(풀 20번 원문 그대로). 1~3번째는 지금처럼 무작위이되 이 문구는 나오지 않는다.
2. [x] **4번째 칸에만 적용.** 재방문(2.5초, 2개)은 지금처럼 무작위 2개(고정 문구도 무작위로 나올 수 있음). reduced-motion 은 첫 방문과 같은 순서라 4번째 칸이 고정 문구, 5번째 틱이 있으면 다시 무작위.
3. [x] 풀 39개·1.5초 간격·직전 반복 금지·타이머 정리 계약 유지.
4. [x] E2E: 첫 방문·다시 재생·reduced-motion 의 4번째 티커 = 고정 문구, 1~3번째에 고정 문구 0. 재방문은 고정 없음(기존 단언 유지). `npm --prefix frontend run e2e:all` 그린, unit, `git diff --check`.

## 구현 내역
- `frontend/src/data/splashTicker.js`: `FIXED_SPLASH_TICKER = SPLASH_TICKER_POOL[19]`(원문 참조, 손으로 옮기지 않음). `pickSplashTicker(previous, shown, random, tickerIndex, isReturnVisit)` 시그니처 확장. 첫 방문(`tickerIndex===3`)은 고정 문구 반환·shown 에 추가, 첫 방문 0~2 는 후보에서 고정 제외, 재방문·5번째 이후는 기존 무작위(고정 포함). 풀 39·직전 반복 금지·shown 초기화 로직 유지.
- `frontend/src/App.vue`: `splashTickerIndex` 추가. `playSplashFlap` 에서 0 으로 리셋(첫 방문·다시 재생·reduced-motion 모두 이 경로), `rotateSplashTicker` 가 틱마다 인덱스를 증가시키며 `isReturnVisitSplash` 를 넘긴다. 다시 재생은 `setSplashVisitMode(false)` 를 거치므로 4번째 고정이 적용된다.
- `frontend/src/splashTone.e2e.mjs`: 첫 방문·다시 재생·reduced-motion 4번째 = 고정, 1~3번째 ≠ 고정, 재방문 2개 전부 ≠ 고정 단언 추가. 기존 단언·기대값은 바꾸지 않았다.
- 공유 파일: 없음.

## 검증
- `node --test $(find src -name "*.test.mjs")` (frontend): pass 34 / fail 0.
- `node scripts/run-e2e.mjs` (= `npm --prefix frontend run e2e:all` 본체, 빌드 advisor·pages·root 후 전체): 전체 통과 — pass 97 / skip 18 / fail 0. 파일별: blogClosed 16, Ets2Dev 6, Ets2Live 4, JunctionMap 4, Pantry 8, VoyageAdvisorTransfer 2, VoyageCollection 2, VoyageReplay 3, VoyageRouteMap 4, VoyageSettlement 1, WorkNotes 8, splashTone 14, staticRouting 5, SimTone 5, taxiDispatch 5, ToneTools 10, BlogTone·WritingStudio·ToneTools 일부 skip(skip 사유는 이번에 확인하지 않음).
- `splashTone.e2e.mjs` 단독 3회 추가 실행: 3회 모두 14/0/0. 실난수 4환경 테스트 포함 연속 4회 green.
- `git diff --check`: 출력 없음(exit 0).
- 실렌더 스크린샷은 찍지 않았다. 변경이 문구 텍스트 교체뿐이고 레이아웃 코드는 건드리지 않았다.

### 실패했던 "실난수 4환경 문구 시간 확보" 테스트에 대해
- 이번 워킹트리 상태에서는 실패가 재현되지 않았다(4회 green). 테스트 기대값·단언은 바꾸지 않았다.
- 실패 원인을 특정하지 못했다. 이전 실행 로그가 남아 있지 않아 원인 판정은 하지 않는다. 확인된 사실: 이 테스트의 단언(풀 포함·읽힘 시간·간격·중복) 중 고정 문구와 관련된 것은 없다. 실난수는 4환경 중 1~3번째에서 고정을 제외하므로 새 변경으로 인해 나올 수 있는 중복·직전 반복 경로는 기존 `shown`·`previous` 체크로 막힌다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-205-r1.md`.
- 없음.
