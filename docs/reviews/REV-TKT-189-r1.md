문서 상태: 작성완료

# REV-TKT-189-r1 — 블로그 본선 운행 중단 (PM 판정: **통과 → finished**, [중요] 1 · [제안] 1 → TKT-196)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현자: dev 서브에이전트(Claude Sonnet).
- 게이트(직접 재실행): Pages-base build 56 · blogClosed **16/16**(root-base 는 `BLOG_CLOSED_ROOT_DIST` 로 별도 빌드 지정) · JunctionMap 4/4 · ToneTools 10 pass/2 skip(root dist) · BlogTone 2 skip · WritingStudio 14 skip · Pantry 8 · splash 13 · staticRouting 4 · Ets2Live 4 · unit 28/28 · `git diff --check`. 구현자 전체 87 pass/18 skip/0 fail 과 일치.
- 실화면: 1440 라이트 홈 — 기록선 `환승 홀 → 여행`, B 역·소역 없음, 꼬리 35px 로 환승 홀 통과 유지. 375 다크 `/blog` 진입 → 환승 홀 + `블로그 노선은 운행을 멈췄습니다` 토스트.
- 범위: 블로그 컴포넌트·데이터·staticRouting·staticWritingState 무변경 확인. `junction.test.mjs` 수정은 스위치로 깨지는 기대값이라 수용.
- **[중요] I1 → TKT-196**: `frontend/public/mockups/blog-*.html`·`writing-studio.html` 이 Pages 산출물로 그대로 공개된다(링크는 없지만 주소로 열림). D-031 "공개 노출 0" 에 맞춰 Pages 준비 단계에서 제외.
- **[제안] S1 → TKT-196**: B 가 빠져 1440 지도 왼쪽이 비었다 — 지도 구도 재조정. 모바일 빠른 환승 2열 인라인 style 을 클래스로.
- 메모: blogClosed 는 root-base dist 가 `frontend/dist-root` 에 없으면 실패한다 — 게이트 실행법에 한 줄 추가(`.agents/claude-dev.md`).
