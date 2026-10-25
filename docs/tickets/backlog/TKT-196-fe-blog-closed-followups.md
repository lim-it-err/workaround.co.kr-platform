문서 상태: 작성완료

# TKT-196 `[FE]` 블로그 중단 후속 — 목업 공개 제외 · 지도 구도 재조정 · 빠른 환승 클래스화

- 상태: backlog(195 뒤 ready) · P2 · 담당: dev 서브에이전트(Sonnet) · 근거 REV-TKT-189-r1 I1·S1.
- scope: `infra/public-site/prepare-github-pages.mjs`(블로그·스튜디오 목업 제외), `frontend/src/data/lines.js`·`JunctionMap.vue`(지도 좌표·viewBox), `App.vue`(빠른 환승 인라인 style 제거), `styles.css`, 관련 E2E.

## 완료 조건
1. [ ] Pages 산출물에 `mockups/blog-*.html`·`mockups/writing-studio.html` 없음(스위치 `BLOG_LINE_OPEN` 이 false 일 때만 제외).
2. [ ] ~~1440·375 지도~~ → **TKT-202 로 이관**: B 가 빠진 왼쪽 빈 공간이 어색하지 않게 구도 조정(환승 홀 직선 통과 원칙 유지) — 전후 캡처 비교, `[반박]` 허용.
3. [ ] 모바일 빠른 환승 2열은 클래스로(인라인 style 0).
4. [ ] 게이트 전체.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
