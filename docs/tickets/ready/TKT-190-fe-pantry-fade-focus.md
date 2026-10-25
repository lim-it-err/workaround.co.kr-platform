문서 상태: 작성완료

# TKT-190 `[FE]` 자취 밥상 기본 칩 행 페이드 — 키보드 포커스 시 마스크 해제

- 상태: ready · **P1** · 담당: dev 서브에이전트(**Haiku** — CSS 1~2규칙) · 의존: TKT-187 finished. 브랜치 `codex/v0.8.0-live`.
- 근거: codex-9 `docs/reviews/UX-TKT-186-r1.md` [중요] I1 — 375/1440 다크·라이트에서 마지막 칩(`집밥`)에 Tab 이동하면 칩 오른쪽 약 27px 가 28px 페이드 안에 들어가 **글자·포커스 링이 함께 흐려진다**. TKT-187 조건 2("포커스 링이 가려지지 않게")를 폭 제한만으로는 못 지켰다 — PM 판정 누락.
- scope: `frontend/src/styles.css` **만**(+ 티켓 파일·보드). 마크업·JS·E2E 금지.

## 완료 조건
1. [ ] `.pantry-filter-primary > .pantry-filters:focus-within` 에서 `mask-image`·`-webkit-mask-image` 를 `none` 으로 — 행 안 칩에 키보드 포커스가 있는 동안 페이드 해제. 마우스 클릭만으로는 `:focus-visible` 이 아닐 수 있으니 `:focus-within` 으로 충분(단순화 허용).
2. [ ] 실렌더: 375 다크/라이트에서 기본 행을 끝까지 가로 스크롤한 뒤 마지막 칩에 Tab 포커스 → 글자·포커스 링이 흐리지 않음(캡처 `/private/tmp/tkt190/`). 포커스가 없을 때는 페이드 유지.
3. [ ] 게이트: root/Pages-base build 56, Pantry E2E 8/8, splashTone 13/13, unit 27/27, `git diff --check`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
