문서 상태: 작성완료

# TKT-221 `[FE]` v0.9 환승 홀 손질 — 블로그 행 제거·부팅 로그 버전은 릴리스 버전으로

- 상태: finished · **P1 · v0.9.0** · 담당: dev 서브에이전트(Haiku 5.5 — 명세 완전) · 브랜치 `codex/v0.9.0`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: REV-TKT-219-r1 [중요]·[PM 의문], PO 2026-11-21 「둘 다 권하는대로 해」.
- scope: `frontend/src/data/hallBoard.js`, `frontend/src/components/hall/HallBoard.vue`(필요 시), `frontend/vite.config.js`, `.github/workflows/deploy-github-pages.yml`(환경값 한 줄), `infra/home/web.Dockerfile` 은 **건드리지 않는다**(v1.0.0 브랜치), E2E(`HallV09.e2e.mjs`·`blogClosed.e2e.mjs` 의 블로그 행 예외 제거), `frontend/src/components/JunctionMap.e2e.mjs`·`frontend/src/components/WorkNotes.e2e.mjs`·`frontend/src/staticRouting.e2e.mjs`(행 수·상태 기대값만, 단언 삭제 금지 — PM 승인 2026-11-21).

## 완료 조건
1. 출발 안내판에서 블로그 「운행 중단」 행 삭제(7행). `blogClosed.e2e.mjs` 의 그 행 예외 코드 제거 — 블로그 문구 0 단언이 예외 없이 통과. 블로그 복귀(`BLOG_LINE_OPEN=true`) 때 행이 다시 생기게 할 필요 없음(복귀 시 별도 티켓).
2. 안내판 상태를 부팅 로그와 맞춤: 유로트럭 「샘플」, 운영 노트 「공개」(상태색은 운행과 같은 초록).
3. 부팅 로그 버전: `__APP_VERSION__` 을 루트 `VERSION` 대신 **빌드 환경값 `RELEASE_VERSION`**(예: `0.9.0`)에서 읽는다. 값이 없으면 버전 없이 `workaround 기동`. 배포 워크플로 빌드 단계에 `RELEASE_VERSION` 을 PR 제목/브랜치가 아닌 **고정 방식**으로 주는 방법: 워크플로 `env` 에 저장소 변수 `vars.RELEASE_VERSION` 를 쓰고 없으면 빈 값. E2E 는 값 있음/없음 두 경우.
4. 게이트: build, unit, `e2e:all`(기준 121/20/0), `git diff --check`, 375 캡처 2장(안내판·로그) 경로.

## 질문/에스컬레이션
- PM 승인 2026-11-21: 위 3개 E2E 스위트 scope 확장 승인. 기대값만 변경(행 8→7, 운영 노트 운행→공개, 흐린 행 1→0). blocked 해제.
- [구체화 질문] e2e:all 에서 TKT-221 범위 밖 스위트 3개가 red (111 pass / 20 skip / 10 fail, 기준 121/20/0). 전부 이 티켓이 요구한 변경(블로그 행 제거·유로트럭 「샘플」·운영 노트 「공개」)이 옛 기대값을 깨는 것이다. 범위 밖이라 손대지 않았다. 아래 중 승인 여부를 PM 이 정해 달라.
  - `frontend/src/components/JunctionMap.e2e.mjs` 121·122행: `.hall-row` 8 → 7, `:is(a, button)` 8 → 7 (주석 120행 「흐린 블로그 1」 정정).
  - `frontend/src/components/WorkNotes.e2e.mjs` 176행: 운영 노트 `.hall-status` 기대값 `운행` → `공개` (+ 174행 주석).
  - `frontend/src/staticRouting.e2e.mjs` 157행 `.hall-row` 8 → 7, 159행 `.hall-row.is-dim` 1 → 0 (블로그 행이 없어졌다, 행 주석 정정), 156행 주석 「여덟 행」 정정.
  - 위 3건을 scope 에 추가해도 되는지, 아니면 별도 티켓으로 뺄지.
- [구체화 질문] 부팅 로그 버전 E2E 는 `RELEASE_VERSION` 환경값을 읽어 기대값을 고른다(값 없음 → `workaround 기동`, 값 있음 → `workaround <값> 기동`). 값 있음 경로는 아직 돌리지 않았다. 필요하면 `RELEASE_VERSION=0.9.0` 으로 HallV09·blogClosed 를 한 번 더 돌린다.

## 리뷰 기록
- (대기)

## 구현 내역
- `frontend/src/data/hallBoard.js`: 블로그 행 삭제(7행), 유로트럭 `샘플`, 운영 노트 `공개`(tone ok), `BLOG_LINE_OPEN` import 제거.
- `frontend/src/components/hall/HallBoard.vue`: `is-dim` 바인딩·CSS, `t-dim` 제거(흐린 행이 없어짐).
- `frontend/vite.config.js`: `__APP_VERSION__` 을 루트 `VERSION` 대신 `process.env.RELEASE_VERSION`(없으면 빈 값)에서 주입.
- `.github/workflows/deploy-github-pages.yml`: Pages 빌드 단계에 `RELEASE_VERSION: ${{ vars.RELEASE_VERSION }}`.
- `frontend/src/components/HallV09.e2e.mjs`: 7행·샘플·공개, 블로그 닫힘 시나리오 제거, 부팅 로그 버전 단언을 RELEASE_VERSION 에 맞춤.
- `frontend/src/blogClosed.e2e.mjs`: 블로그 행 예외(`assertClosedBlogRow`, `[data-hall-row="blog"]` 제거) 삭제, 행 수 7.

## 검증
- `npm --prefix frontend run build` 통과, `-- --base=/workaround.co.kr-platform/` 통과.
- unit `node --test` 46 pass / 0 fail.
- `e2e:all` 1차 111/20/10 (범위 밖 3스위트 red) → PM 승인 후 기대값 수정, 2차 **121 pass / 20 skip / 0 fail** (기준 121/20/0 과 같다, 수 변화 없음). HallV09 16/2/0, blogClosed 16/0/0, JunctionMap 4/0/0, WorkNotes 9/0/0, staticRouting 5/0/0.
- `git diff --check` 통과.
- 375 캡처: `docs/tickets/captures/TKT-221/board-base-375.png`(출발 안내판), `log-mid-375.png`(부팅 로그). 1440·lite 캡처도 같은 폴더.
- `RELEASE_VERSION=0.9.0` 값 있음 경로: 빌드 번들에 `workaround 0.9.0 기동` 렌더 확인, HallV09 18/0/0 통과.
- 임시 링크 `services/advisor/frontend/node_modules` 는 제거했다.
- 확신 없는 점: 375 로그 캡처는 로그 중간 한 장뿐이다(완료 상태 로그는 HallV09 기본 테스트가 단언으로 검증).

## 리뷰 기록
- r1 대기 (need_review 전환 2026-11-21).
- r1 **통과 → finished** (PM, 2026-11-21) — `docs/reviews/REV-TKT-221-r1.md`.
