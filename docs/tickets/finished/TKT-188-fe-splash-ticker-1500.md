문서 상태: 작성완료

# TKT-188 `[FE]` 스플래시 티커 주기 1.3초 → 1.5초 (PO 확정)

- 상태: finished · **P1** · 담당: dev 서브에이전트(**Haiku** — 상수 1개 + E2E 기대값) · 의존: TKT-186·187 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: PO 2026-10-25 "1.5초로 해줘" — REV-TKT-186-r2 `[PM 의문]` 선택지 (b).
- scope: `frontend/src/App.vue`(`SPLASH_TICKER_INTERVAL_MS` 한 줄), `frontend/src/splashTone.e2e.mjs`(`tickerIntervalMs` 와 그에 딸린 개수·시각 기대값·테스트 제목의 초 표기). 다른 파일 금지.

## 완료 조건
1. [x] `SPLASH_TICKER_INTERVAL_MS = 1500`. 다른 SPLASH_* 상수·플랩·문 로직 무변경.
2. [x] 기대 관측(가상 시계): 첫 방문 0/1500/3000/4500ms **4개**(5000ms 문 열림에서 타이머 정리), 재방문 0/1500ms **2개**, `다시 재생` 4개, reduced-motion 은 테스트가 돌리는 시간에 맞춰 개수 재계산(예: `tickerIntervalMs * 3` 진행이면 4개). 간격 단언은 정확히 1500ms.
3. [x] 테스트 제목·라벨의 초 표기(예: `reduced-motion 3.9초`)를 새 값으로 맞춘다. 기대값을 구현에 맞추는 것이 아니라 **위 2의 계산과 일치하는지** 확인하고 적어라.
4. [x] 게이트: root/Pages-base build 56, `splashTone.e2e.mjs` 13/13, unit 27/27, `git diff --check`.

## 구현 내역
- `frontend/src/App.vue` 34줄: `SPLASH_TICKER_INTERVAL_MS = 1300` → `1500`
- `frontend/src/splashTone.e2e.mjs`:
  - 19줄: `tickerIntervalMs = 1300` → `1500`
  - 158~159줄 주석: "1.3초 간격" → "1.5초 간격"
  - 160줄: `maxCount = 5` → `maxCount = 4` (1500ms 기준 5500ms/1500ms ≈ 3.67 → 최대 4개)
  - 376줄: "1.3초마다" → "1.5초마다"
  - 644줄 주석: "1.3초마다" → "1.5초마다"
  - 649줄: `3.9초` → `4.5초` (tickerIntervalMs * 3 = 4500ms)

## 검증
- **게이트**: build(56) ✓, Pages-base(56) ✓, E2E splashTone(13/13) ✓, unit(27/27) ✓, diff --check ✓
- **기대값 계산 확인**: 1500ms 간격으로 첫 방문 0/1500/3000/4500 = 4개, 재방문 0/1500 = 2개, reduced-motion tickerIntervalMs*3=4500ms 진행 후 4개, 라벨 "4.5초" — 모두 일치.
- **maxCount 재검토**: 기존 5는 1300ms 기준 5500/1300=4.23개 예상, 신규 4는 1500ms 기준 5500/1500=3.67개 예상. E2E 커버리지(첫 방문, 재방문, 다시 재생, reduced-motion)에서 모두 4개 이하로 관측되므로 4 적정.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-188-r1.md`.
- 없음.
