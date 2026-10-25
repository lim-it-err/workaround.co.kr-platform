문서 상태: 작성완료

# REV-TKT-196-r1 — 블로그 중단 후속 — 목업 공개 제외·빠른 환승 클래스 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 브랜치 `codex/v0.8.2`.
- 게이트(PM 직접): `npm run e2e:all` 97 pass / 18 skip / 0 fail(188s) · `git diff --check`.
- 확인: prepare 후 `dist/mockups` 에 블로그 3종·`writing-studio.html` 없음(원본 `frontend/public/mockups` 는 보존). 빠른 환승 인라인 style 0, 클래스 `mobile-quick-nav--blog-closed`.
- 조건 2(지도)는 TKT-202 로 이관 완료.
