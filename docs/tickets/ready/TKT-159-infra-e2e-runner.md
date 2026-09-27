문서 상태: 작성완료

# TKT-159 `[INFRA]` 메인 E2E 통합 러너 — `npm run e2e:all` 한 명령

- 상태: ready · **P1** · 담당: codex-2 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. **[반박]·[구체화 질문] 의무.**
- 근거: AS-R009 §후속 — "E2E 정적 origin/base 계약이 파일마다 달라 한 명령으로 재현이 어렵다, 릴리스 전 스크립트로 고정 권고". 현재 PM 게이트는 스위트별 4종 base 를 손으로 맞춘다(Pages-base self-serve 8 · WritingStudio `dist-base` preview 4174 · SimTone/taxi `dist-root` preview 4175 · ToneTools root dist). 사이트 `CLAUDE.md` 절차 참조.
- scope: `frontend/package.json` scripts(`e2e:all`·`e2e:pages`·`e2e:root`·`e2e:studio`), `frontend/scripts/run-e2e.mjs`(신규), `.gitignore`(`.DS_Store`·`frontend/dist-base/`·`frontend/dist-root/`), `docs/workflow.md` 절. 테스트 파일 자체는 수정하지 않는다(146 과 충돌 방지).

## 목표
한 명령이 ①Pages-base dist 빌드(+advisor `advisor/` base 빌드·복사) ②`dist-base`·`dist-root` 빌드 ③preview 4174·4175 기동 ④스위트별 올바른 base 로 `node --test`(`NODE_PATH=services/advisor/frontend/node_modules` 자동) ⑤종료 시 preview 정리 ⑥요약 표(스위트·pass/fail·소요) 를 수행한다. 포트 점유 시 즉시 실패·이유 출력.

## 완료 조건
1. [ ] `npm --prefix frontend run e2e:all` 한 번으로 현재 58/58 재현(로그 첨부).
2. [ ] 스위트 하나가 실패하면 exit ≠0, 요약에 파일명·실패 테스트명.
3. [ ] 두 번 연속 실행 그린(preview 정리 확인), 소요 시간 기록.
4. [ ] Advisor Playwright 는 범위 밖(별도 명령) — 문서에 두 명령 순서만.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
