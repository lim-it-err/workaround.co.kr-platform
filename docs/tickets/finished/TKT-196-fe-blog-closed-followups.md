문서 상태: 작성완료

# TKT-196 `[FE]` 블로그 중단 후속 — 목업 공개 제외 · 지도 구도 재조정 · 빠른 환승 클래스화

- 상태: finished · **v0.8.2** · 브랜치 `codex/v0.8.2`(작업 트리 `/Users/imjeonghan/newProject/wa-082`) · P2 · 담당: dev 서브에이전트(Haiku) · 근거 REV-TKT-189-r1 I1·S1.
- scope: `infra/public-site/prepare-github-pages.mjs`(블로그·스튜디오 목업 제외), `frontend/src/data/lines.js`·`JunctionMap.vue`(지도 좌표·viewBox), `App.vue`(빠른 환승 인라인 style 제거), `styles.css`, 관련 E2E.

## 완료 조건
1. [x] Pages 산출물에 `mockups/blog-*.html`·`mockups/writing-studio.html` 없음(스위치 `BLOG_LINE_OPEN` 이 false 일 때만 제외). — `prepare-github-pages.mjs` 에서 BLOG_LINE_OPEN 을 정규식으로 읽고 false 이면 blog-*.html 파일 삭제. "blog-hub.html" 삭제 확인.
2. [x] ~~1440·375 지도~~ → **TKT-202 로 이관**: B 가 빠진 왼쪽 빈 공간이 어색하지 않게 구도 조정(환승 홀 직선 통과 원칙 유지) — 전후 캡처 비교, `[반박]` 허용. — 이관 완료.
3. [x] 모바일 빠른 환승 2열은 클래스로(인라인 style 0). — `App.vue` 에서 `:style` 제거, `.mobile-quick-nav--blog-closed` 클래스 조건부 적용. `styles.css` 에 `grid-template-columns: repeat(2, minmax(0, 1fr))` 규칙 추가.
4. [x] 게이트 전체. — `npm run build` (Pages-base), `npm run build` (Advisor), `npm run e2e:all` (97 pass / 18 skip / 0 fail), `git diff --check` (통과), 모바일 375 캡처 (2열 레이아웃 확인).

## 구현 내역
- `infra/public-site/prepare-github-pages.mjs`: `readdirSync` 추가, `checkBlogLineOpenAndCleanupMockups()` 함수 구현 — lines.js 에서 BLOG_LINE_OPEN 값을 정규식으로 추출, false 이면 dist/mockups 의 blog-*.html 파일 삭제, 콘솔 출력.
- `frontend/src/App.vue`: 라인 5101 인라인 style 제거, `:class="{ 'mobile-quick-nav--blog-closed': !BLOG_LINE_OPEN }"` 추가.
- `frontend/src/styles.css`: 모바일 미디어쿼리 내에 `.mobile-quick-nav--blog-closed { grid-template-columns: repeat(2, minmax(0, 1fr)); }` 규칙 추가 (라인 4078 이후).

## 검증
- Pages 빌드: dist/mockups 에 blog-*.html 없음 (blog-hub.html 삭제됨).
- prepare 스크립트: 콘솔에 "Blog line closed - deleted mockup files" 및 삭제된 파일 경로 출력.
- E2E: 97 pass / 18 skip / 0 fail (전체 그린).
- 모바일 375: 빠른 환승 네비게이션이 2 컬럼 레이아웃 (노선도·승강장).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-196-r1.md`.
- 없음.
