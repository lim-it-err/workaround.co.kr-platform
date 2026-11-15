문서 상태: 작성완료

# TKT-214 `[FE]` 티커 고정 문구 문자열 참조 + 스플래시 E2E 난수 고정 (TKT-207 뒤)

- 상태: finished · **P2 · v0.8.3** · 담당: dev 서브에이전트(Haiku 5.5) · 의존: **TKT-207 finished**(스플래시 코드가 옮겨진 뒤) · 브랜치 `codex/v0.8.3`.
- 근거: REV-TKT-205-r1 [제안](고정 문구를 `POOL[19]` 인덱스로 참조 — 풀 순서가 바뀌면 다른 문구가 고정), TKT-206 실행 중 `splashTone` "실난수 4환경 문구 시간 확보" 1회 실패(재현 안 됨).
- scope: `frontend/src/data/splashTicker.js`, `frontend/src/splashTone.e2e.mjs`.

## 완료 조건
1. [x] 고정 문구는 원문 문자열로 정의하고, 풀에 그 문자열이 있는지 단위 테스트로 확인(없으면 실패).
2. [x] "실난수" 테스트는 이름 그대로 실난수를 쓰되, 실패 시 사용한 시드를 출력하고 그 시드로 재현할 수 있게(`SPLASH_SEED` 환경변수). 실패 원인을 찾으면 고치고 기록.
3. [x] splashTone 10회 연속 그린 로그, `e2e:all`, unit, `git diff --check`.

## 구현 내역
- `frontend/src/data/splashTicker.js`: `FIXED_SPLASH_TICKER` 를 `SPLASH_TICKER_POOL[19]` 인덱스 참조에서 원문 문자열 `'관리자 몰래 내맘대로 홈페이지 로딩하는 중.'` 상수로 바꿨다(풀 20번째 원문과 같은 글자·같은 마침표). 풀 내용·선택 로직은 그대로.
- `frontend/src/data/splashTicker.test.mjs` (신규): 고정 문구가 원문과 같은지, 풀에 정확히 한 번 있는지 확인.
- `frontend/src/splashTone.e2e.mjs`:
  - 시드: `SPLASH_SEED`(0 이상 2^32 미만 정수)가 있으면 그 값, 없으면 실행마다 `crypto.randomInt` 로 새 시드. 잘못된 값이면 시작 시 에러.
  - 브라우저: `setup` 의 실난수 경로(`randomValue: null`)에서 `page.addInitScript` 로 `Math.random` 을 mulberry32 시드 난수로 교체.
  - 단위 "실난수" 케이스도 같은 시드 난수를 쓴다. 실난수 테스트 두 개는 실패 메시지 끝에 `재현: SPLASH_SEED=<값>` 을 붙이고, 4환경 테스트는 성공 로그에도 시드를 찍는다.
  - 기대값은 바꾸지 않았다.
- 1회 실패 원인: 재현되지 않아 원인을 특정하지 못했다. 이번 변경은 "실패해도 같은 난수열로 다시 돌릴 수 있게" 만든 것이다. 실패 시 시드를 받아 `SPLASH_SEED=<값>` 으로 재실행하면 된다.
- 공유 파일: 없음. App.vue·시뮬·밥상 파일은 건드리지 않았다.

## 검증
- unit: `cd frontend && node --test $(find src -name "*.test.mjs")` → tests 39 / pass 39 / fail 0.
- E2E: `E2E_WORK_DIR=/private/tmp/tkt214-e2e npm --prefix <wa-083>/frontend run e2e:all -- splashTone` 10회 연속 → 10회 모두 exit 0, 각 `pass 14 / skip 0 / fail 0`.
- `git -C <wa-083> diff --check` → 출력 없음(통과).
- 전체 `e2e:all`(필터 없음)은 돌리지 않았다. 필터 실행만 기록한다.
- 시각 확인(375/1440 실렌더)은 이 티켓 범위 밖 변경(문자열 값 동일·테스트 전용)이라 새로 찍지 않았다.

## 질문/에스컬레이션
- 없음. 다만 "1회 실패" 원인은 재현되지 않아 특정하지 못했다(위 구현 내역 참조).

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-214-r1.md`.
- 없음.
