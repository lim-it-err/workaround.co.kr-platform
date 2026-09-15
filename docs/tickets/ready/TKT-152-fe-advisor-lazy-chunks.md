문서 상태: 작성완료

# TKT-152 `[FE]` Advisor 초기 청크 lazy-load — 502kB 경고 해소

- 상태: ready · P2 · 담당: codex-6/codex-1 · 의존: TKT-129 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: REV-TKT-129-r1 [제안], 빌드 경고 `502.28kB` (TKT-143 에서도 잔존).
- scope: `services/advisor/frontend/src/modules/missions/routes.js`(라우트별 동적 import), `vite.config.*`(manualChunks 최소), 로딩 중 표시.

## 목표
`/today` 첫 진입 JS 를 줄인다. 게임 엔진 4종·코스·사건 파일은 해당 라우트에서만 로드. 로딩 중은 스켈레톤 면이 아니라 hairline 한 줄 텍스트(`불러오는 중`).

## 완료 조건
1. [ ] 초기 진입 청크 합계 ≤250kB(minified, gzip 전 — 빌드 로그 인용), 빌드 경고 0.
2. [ ] Playwright 46/46·unit 81/81, alias 7개 회귀 0.
3. [ ] 375 `/today` → `/learn` → 코스 상세 전환에서 빈 화면 플래시 없음(스크린샷 3장).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
