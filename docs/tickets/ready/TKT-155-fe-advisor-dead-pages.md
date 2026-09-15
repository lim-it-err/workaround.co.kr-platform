문서 상태: 작성완료

# TKT-155 `[FE]` Advisor 죽은 페이지·컴포넌트 정리 (3표면 이후)

- 상태: ready · P3 · 담당: codex-6/codex-1 · 의존: TKT-129·135 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: D-020 이후 `/routine /season /games /inflight …` 는 redirect 다(`routes.js:35~60`). `RoutinePage.vue`·`SeasonPage.vue`·`HomePage.vue`·`RecordsPage.vue` 등 도달 불가 페이지가 소스에 남아 원칙 4(렌더 안 되는 것) 잔존·번들 비대. TKT-134(메인) 와 같은 패턴.
- scope: `services/advisor/frontend/src/modules/missions/pages/**`, `components/**`, 관련 spec — 참조 0 인 것만.

## 완료 조건
1. [ ] 라우트에서 도달 불가한 페이지·전용 컴포넌트·spec 삭제 목록(파일별 참조 grep 결과)을 티켓에. `/routine/swipe` 처럼 살아 있는 하위 라우트는 보존.
2. [ ] alias 7개 E2E 유지, Playwright 46+·unit 그린, build 모듈 수 감소치 기록.
3. [ ] 3표면 375/1440 렌더 diff 0(innerText 동일).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
