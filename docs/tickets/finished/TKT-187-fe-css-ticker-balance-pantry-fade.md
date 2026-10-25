문서 상태: 작성완료

# TKT-187 `[FE]` CSS 잔손질 — 스플래시 티커 고아 줄 균형 분할 + 자취 밥상 기본 칩 행 스크롤 단서

- 상태: finished · **P2** · 담당: dev 서브에이전트(**Haiku** — 1파일·명세 완전) · 의존: TKT-186·185 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: REV-TKT-186-r2 [제안] S1(375 긴 티커 둘째 줄에 `중…` 고아 줄), REV-TKT-185-r1 [제안] S1(기본 칩 행이 더 스크롤된다는 단서가 잘린 칩뿐).
- scope: `frontend/src/styles.css` **만**. 마크업·JS·E2E 수정 금지(E2E 가 깨지면 그 사실을 질문 섹션에 적고 blocked).

## 완료 조건
1. [x] `.splash-ticker-strip .ticker-copy` 에 `text-wrap: balance` **+ `word-break: keep-all; overflow-wrap: anywhere`(r1 반려 B1 — 단어 중간 분할 금지, 띄어쓰기에서만)** (480px 이하 블록). 375 에서 `갈아타기 최단경로가 삐지지 않게 계산하는 중…` 이 두 줄로 **균형** 분할(둘째 줄이 `중…` 한 단어가 아님). 제목·플랩 y 좌표는 TKT-186 r2 와 동일(차 0).
2. [x] `.pantry-filter-primary > .pantry-filters` 오른쪽 끝에 **페이드 마스크**(예: `mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent)`) — 스크롤이 끝(오른쪽 끝)에 닿았을 때까지도 마스크는 유지해도 된다(단순화 허용). 칩 조작·포커스 링이 가려지지 않게 마스크 폭 ≤ 28px. 375 다크/라이트에서 `15분` 뒤 칩이 잘리는 자리에 페이드가 보인다.
3. [x] 게이트: root/Pages-base build(56), `splashTone.e2e.mjs` 13/13, `Pantry.e2e.mjs` 8/8, unit 27/27, `git diff --check`. 375/1440 × 다크/라이트 캡처 경로를 검증란에.

## 구현 내역

### r1 (반려 → r2)
- `frontend/src/styles.css` 5755–5761: `.splash-ticker-strip .ticker-copy` 에 `text-wrap: balance;` 추가(480px 이하 미디어 블록).
- `frontend/src/styles.css` 5169–5176: `.pantry-filter-primary > .pantry-filters` 에 `mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);` 추가.

### r2 (REV-TKT-187-r1 B1 반영)
- `frontend/src/styles.css` 5763–5764: `.splash-ticker-strip .ticker-copy` 에 `word-break: keep-all;` 와 `overflow-wrap: anywhere;` 추가(단어 중간 분할 금지).

## 검증

### r1 (반려)
- 게이트: root 56, Pages 56, splashTone 13/13, Pantry 8/8, unit 27/27, diff --check ✓
- 실렌더: 375 다크에서 텍스트 주입 시 "갈아 / 타기 최단경로가 삐 / 지지 않게 계산하는 중…" 으로 단어 `삐지지` 분할 발견 → [블로커] B1 반려

### r2 (word-break: keep-all 추가)
- 게이트:
  - root build: 56 modules ✓
  - Pages-base build (`--base=/workaround.co.kr-platform/`): 56 modules ✓
  - `splashTone.e2e.mjs`: 13/13 ✓
  - `Pantry.e2e.mjs`: 8/8 ✓
  - unit tests: 27/27 ✓
  - `git diff --check`: 통과 ✓

- 실렌더(375 다크/라이트, Playwright Range 분석):
  - long1 다크: Line1=`갈아타기 최단경로가`, Line2=`삐지지 않게 계산하는 중…` ✓ (단어 단위 분할)
  - long1 라이트: Line1=`갈아타기 최단경로가`, Line2=`삐지지 않게 계산하는 중…` ✓
  - long2 다크: Line1=`승객들의 한숨을 열차`, Line2=`추진력으로 재활용하는 중…` ✓
  - long2 라이트: Line1=`승객들의 한숨을 열차`, Line2=`추진력으로 재활용하는 중…` ✓
  - 라벨 y: 405.828125 (r1 대비 차 0) ✓
  - 오버플로우: 0 (strip 303px, scroll 303px) ✓
  - 캡처: `/private/tmp/tkt187/r2-long{1,2}-375-{dark,light}.png`

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r2 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-187-r2.md`.
- r1 **반려 → started** (PM, 2026-10-25) — `docs/reviews/REV-TKT-187-r1.md`: [블로커] B1 `삐 / 지지` 단어 중간 줄바꿈 → `word-break: keep-all`.
- r2 `word-break: keep-all; overflow-wrap: anywhere;` 추가 → 단어 단위 분할 확인 ✓
