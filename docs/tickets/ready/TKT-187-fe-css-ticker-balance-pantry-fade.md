문서 상태: 작성완료

# TKT-187 `[FE]` CSS 잔손질 — 스플래시 티커 고아 줄 균형 분할 + 자취 밥상 기본 칩 행 스크롤 단서

- 상태: ready · **P2** · 담당: dev 서브에이전트(**Haiku** — 1파일·명세 완전) · 의존: TKT-186·185 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: REV-TKT-186-r2 [제안] S1(375 긴 티커 둘째 줄에 `중…` 고아 줄), REV-TKT-185-r1 [제안] S1(기본 칩 행이 더 스크롤된다는 단서가 잘린 칩뿐).
- scope: `frontend/src/styles.css` **만**. 마크업·JS·E2E 수정 금지(E2E 가 깨지면 그 사실을 질문 섹션에 적고 blocked).

## 완료 조건
1. [ ] `.splash-ticker-strip .ticker-copy` 에 `text-wrap: balance` (480px 이하 블록). 375 에서 `갈아타기 최단경로가 삐지지 않게 계산하는 중…` 이 두 줄로 **균형** 분할(둘째 줄이 `중…` 한 단어가 아님). 제목·플랩 y 좌표는 TKT-186 r2 와 동일(차 0).
2. [ ] `.pantry-filter-primary > .pantry-filters` 오른쪽 끝에 **페이드 마스크**(예: `mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent)`) — 스크롤이 끝(오른쪽 끝)에 닿았을 때까지도 마스크는 유지해도 된다(단순화 허용). 칩 조작·포커스 링이 가려지지 않게 마스크 폭 ≤ 28px. 375 다크/라이트에서 `15분` 뒤 칩이 잘리는 자리에 페이드가 보인다.
3. [ ] 게이트: root/Pages-base build(56), `splashTone.e2e.mjs` 13/13, `Pantry.e2e.mjs` 8/8, unit 27/27, `git diff --check`. 375/1440 × 다크/라이트 캡처 경로를 검증란에.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
