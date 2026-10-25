문서 상태: 작성완료

# TKT-159 `[INFRA]` 메인 E2E 통합 러너 — `npm run e2e:all` 한 명령

- 상태: finished · **v0.8.2** · **P1** · 담당: dev 서브에이전트 · 의존: 없음. 브랜치 **`codex/v0.8.2`**(작업 트리 `/Users/imjeonghan/newProject/wa-082`). **[반박]·[구체화 질문] 의무.**
- 근거: AS-R009 §후속 — "E2E 정적 origin/base 계약이 파일마다 달라 한 명령으로 재현이 어렵다, 릴리스 전 스크립트로 고정 권고". 현재 PM 게이트는 스위트별 4종 base 를 손으로 맞춘다(Pages-base self-serve 8 · WritingStudio `dist-base` preview 4174 · SimTone/taxi `dist-root` preview 4175 · ToneTools root dist). 사이트 `CLAUDE.md` 절차 참조.
- scope: `frontend/package.json` scripts(`e2e:all`·`e2e:pages`·`e2e:root`·`e2e:studio`), `frontend/scripts/run-e2e.mjs`(신규), `.gitignore`(`.DS_Store`·`frontend/dist-base/`·`frontend/dist-root/`), `docs/workflow.md` 절. 테스트 파일 자체는 수정하지 않는다(146 과 충돌 방지).

## 목표
한 명령이 ①Pages-base dist 빌드(+advisor `advisor/` base 빌드·복사) ②`dist-base`·`dist-root` 빌드 ③preview 4174·4175 기동 ④스위트별 올바른 base 로 `node --test`(`NODE_PATH=services/advisor/frontend/node_modules` 자동) ⑤종료 시 preview 정리 ⑥요약 표(스위트·pass/fail·소요) 를 수행한다. 포트 점유 시 즉시 실패·이유 출력.

## 완료 조건
1. [x] `npm --prefix frontend run e2e:all` 한 번으로 현재 메인 E2E 전체(블로그·Studio skip 포함) 재현(로그: `/private/tmp/tkt159-run1.log`·`run2.log`).
2. [x] 스위트 하나가 실패하면 exit ≠0, 요약에 파일명·실패 테스트명.
3. [x] 두 번 연속 실행 그린(preview 정리 확인), 소요 시간 기록.
4. [x] Advisor Playwright 는 범위 밖(별도 명령) — 문서에 두 명령 순서만.

## 구현 내역
- `frontend/scripts/run-e2e.mjs` 신규, `package.json` scripts `e2e:all` / `e2e:pages` / `e2e:root` / `e2e:studio`(= `--only`), 추가 옵션 `--skip-build`·`--keep-stage`·파일명 일부 필터. `.gitignore` 에 `.DS_Store`·`frontend/dist-root/`·`frontend/dist-base/`. `docs/workflow.md` 신설(아래 §E2E 절).
- 동작: ①Advisor(`/workaround.co.kr-platform/advisor/`)·Pages-base·root-base 를 **`/private/tmp/tkt159/build-*`** 에 빌드(작업 트리 `frontend/dist` 는 건드리지 않음 — 병렬 빌드와 충돌 없음) ②Advisor 를 Pages 빌드의 `advisor/` 로 병합 ③테스트가 `../dist/` 를 하드코딩해 **stage 사본**(`/private/tmp/tkt159/stage/frontend`: src·scripts 사본 + node_modules 심볼릭)을 만들고 그 `dist` 를 그룹별로 교체: Pages-base → 14개 파일(blogClosed 는 `BLOG_CLOSED_ROOT_DIST`=root 빌드), root dist → ToneTools, 그 뒤 root-base preview 4175(`--strictPort`) → SimTone·taxiDispatch. 마지막에 stage dist 를 Pages-base 로 복구. ④파일마다 `node --test --test-reporter=tap`(NODE_PATH=Advisor node_modules 자동), 로그는 `/private/tmp/tkt159/logs/`. ⑤종료·SIGINT·예외에서 preview 정리. ⑥요약 표(파일·pass/skip/fail·소요)와 실패 테스트명, 실패 또는 스위트 오류(테스트 0개·비정상 종료)이면 exit 1.
- WritingStudio 는 자체 격리 preview(랜덤 포트, stage dist)라 별도 4174 불필요 → `dist-base` 빌드 생략(.gitignore 항목만 유지).
- 공유 파일: `.gitignore`(타 티켓과 겹칠 수 있음). 테스트 파일은 수정하지 않음(실패 주입은 임시 편집 후 원복).

## 검증
- `npm --prefix $W/frontend run e2e:all` 1회차: **pass 96 / skip 18 / fail 0, 190.4s** (벽시계 3분14초, 빌드 3.4s 포함). 2회차: **pass 97 / skip 18 / fail 0**, 186.5s(벽시계 3분10초) — 1·2회차 차이 1은 병행 중인 TKT-177 이 `staticRouting.e2e.mjs` 에 테스트를 추가한 것. 종료 후 `lsof -i :4175` 0건(preview 정리 확인). skip 18 = BlogTone 2 + WritingStudio 14 + ToneTools Studio 2(D-031).
- 의도적 실패: VoyageSettlement 의 `assert.equal` → `notEqual` 임시 변경 후 `e2e:all -- VoyageSettlement` → exit 1, 요약 `실패:` 절에 파일명과 `날짜상 종료한 boarding 여행 결산: …` 테스트명 출력. 원복 후 `git diff` 0.
- 포트 4175 점유 상태에서 `e2e:root` → 빌드 전에 즉시 실패(이유와 `lsof` 안내), exit 1.
- unit `node --test src/**/*.test.mjs` 29 pass / 0 fail. `git diff --check` 클린.
- UI 변경 없음(375/1440 실렌더 해당 없음).

## 질문/에스컬레이션
- [구체화 질문] 티켓에는 `docs/workflow.md` 에 절을 추가하라고 되어 있으나 이 브랜치에 파일이 없어 **신설**했다(E2E 절 한 개). 기존 워크플로 문서가 다른 이름으로 있다면 옮겨 주길.
- [구체화 질문] 기대치 "105 pass"와 실측 96~97 이 다르다. 러너 누락이 아니라 파일별 합이다(18개 파일 전부 실행). 105 의 근거 집계가 서브테스트/스위트 포함이었는지 확인 바람.
- [반박·경미] 러너는 stage 사본에서 테스트를 돌리므로 실패 경로가 `/private/tmp/tkt159/stage/...` 로 보인다. 작업 트리 `dist` 직접 사용을 원하면(병행 빌드가 없는 CI 등) 옵션 추가 가능.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-159-r1.md`.
- 없음.
