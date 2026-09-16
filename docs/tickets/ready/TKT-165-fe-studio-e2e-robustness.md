문서 상태: 작성완료

# TKT-165 `[FE]` 글쓰기 E2E 견고화 — 순간 상태 대기 제거·자체 preview 포트 격리

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-164 finished. 브랜치 `codex/v0.7.0-tone`. 제품 코드 무변경(테스트·러너만). TKT-159(통합 러너, codex-2)와 겹치면 `공유 파일:` 표기.
- 근거: REV-TKT-164-r1 — 공유 포트 4174 배치 루프에서 375 두 건이 run2~5 연속 red, 격리 포트에서는 3/3 그린. `WritingStudio.e2e.mjs:111` 의 `저장 중…` **순간 상태** `waitForFunction` 은 부하 시 상태가 먼저 지나가면 30초 타임아웃으로 실패한다. 기본 URL 이 고정 포트 4174 라 다른 워커의 preview·`pkill vite preview` 와 충돌한다.
- scope: `frontend/src/components/WritingStudio.e2e.mjs`(순간 상태 대기 → 최종 상태 또는 이벤트 훅 대기), `frontend/scripts/`(스위트가 자체 preview 를 임의 포트로 띄우고 종료 시 PID 로 정리 — `STUDIO_TEST_URL` 미지정 시), 같은 패턴의 다른 `*.e2e.mjs` 점검.

## 완료 조건
1. [ ] `저장 중…` 류 순간 상태 대기 0건(목록을 티켓에), 최종 상태 대기로 대체.
2. [ ] 기본 실행이 고정 포트에 의존하지 않음(임의 포트·PID 정리), 두 터미널 동시 실행 3회 모두 13/13.
3. [ ] 제품 코드 diff 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
