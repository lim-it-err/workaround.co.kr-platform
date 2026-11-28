문서 상태: 작성완료

# TKT-239 `[FE]` Advisor 공개 페이지는 방문자의 localhost 를 부르지 않는다

- 상태: ready · **P1 · v0.9.3** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.3`.
- 근거: REV-TKT-235-r2 `[중요]`(구현자 발견) — TKT-237 모드 판별이 공개 Pages 에서도 방문자 PC 의 `http://localhost:8080/health` 를 조회한다. 콘솔에 `ERR_CONNECTION_REFUSED`, 브라우저에 따라 「로컬 네트워크 기기 접근」 권한 창이 뜰 수 있다. 같은 문제가 원래부터 `store/missions.js` 의 제출·리뷰·채팅 API 호출에도 있다(`API_BASE` 기본값이 localhost, 실패하면 조용히 mock).
- scope: `services/advisor/frontend/src/modules/missions/store/advisorMode.js`(+ `__tests__/advisorMode.spec.js`), `store/missions.js`(백엔드 호출 앞 가드만), `services/advisor/frontend/e2e/advisor-mode-badge.spec.ts`(단언 추가). 그 외 금지.

## 완료 조건
- [ ] 1. `advisorMode.js` 에 `canContactBackend()` — `VITE_ADVISOR_API` 를 명시했거나, 화면이 `localhost`·`127.0.0.1`·`[::1]` 에서 열렸을 때만 true. 
- [ ] 2. false 면 `/health` 조회를 하지 않고 바로 「배포 · 연습 리뷰」(네트워크 요청 0). `missions.js` 의 백엔드 호출(제출·리뷰·채팅 프리뷰 등 `API_BASE` 쓰는 곳 전부)도 시도하지 않고 바로 지금의 mock 경로로.
- [ ] 3. 로컬(`./local.sh`, 127.0.0.1:5173)에서는 지금과 똑같이 동작.
- [ ] 4. 단위 테스트: 호스트별(`localhost`/`127.0.0.1`/`lim-it-err.github.io`)·env 명시 여부별 판별, false 일 때 fetch 가 한 번도 불리지 않음.
- [ ] 5. e2e: 공개 호스트를 흉내 낼 수 없으면 단위 테스트로 갈음하고 이유를 적는다. 기존 advisor `npx playwright test` 전체 통과, `vitest run`(기존 platformTheme 1건 외 통과), `vite build --base=/workaround.co.kr-platform/advisor/`, `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
