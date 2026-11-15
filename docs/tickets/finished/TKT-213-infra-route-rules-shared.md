문서 상태: 작성완료

# TKT-213 `[INFRA]` 배포 경로 규칙 공용 모듈 — prepare·smoke 중복 제거

- 상태: finished · **P2 · v0.8.3** · 담당: dev 서브에이전트(**Haiku 5.5**) · 브랜치 `codex/v0.8.3`(작업 트리 `/Users/imjeonghan/newProject/wa-083`).
- 근거: REV-TKT-160-r1 [제안] — 어떤 경로를 복제(200)하고 어떤 경로를 404 셸로 둘지 규칙이 `prepare-github-pages.mjs` 와 `smoke-pages.mjs` 에 따로 있어, 한쪽만 고치면 점검이 거짓 결과를 낸다.
- scope: 신규 `infra/public-site/route-rules.mjs`, `prepare-github-pages.mjs`·`smoke-pages.mjs`(공용 모듈 사용으로만 수정).

## 완료 조건
1. [x] `route-rules.mjs` 가 메인 경로(staticRouting.js)·Advisor 경로(routes.js) 추출, 블로그 스위치 판단, 제외 목록(`/runtime`·`/ets2/dev`·`/blog*`·`/studio`)을 한 곳에서 export. 두 스크립트는 이것만 쓴다(정규식·목록 중복 0).
2. [x] 결과 동일: prepare 후 복제 경로 목록이 변경 전과 같음(전후 출력 비교), `smoke-pages.mjs` 라이브(v0.8.2) 기본 모드 그린.
3. [x] `node --check` 두 스크립트, unit, `git diff --check`. (unit 은 아래 검증의 기존 실패 1건 참고)

## 구현 내역
- 신규 `infra/public-site/route-rules.mjs`: `extractMainRoutePaths`·`extractAdvisorRoutePaths`(원천 정규식 그대로), `LOCKED_PATHS`(`/runtime`·`/ets2/dev`·`/blog`·`/studio`), `isExcludedMainPath`(루트·`/blog*`·LOCKED), `copiedMainPaths`, `copiedPaths`(메인 + `/advisor` 접두 Advisor), `readBlogLineOpen`(lines.js `BLOG_LINE_OPEN`), `BLOG_MOCKUP_FILES`·`isBlogMockupFile`.
- `prepare-github-pages.mjs`: 경로 추출·제외 규칙·블로그 스위치 판단 제거 → route-rules import. 목업 삭제(rmSync)·복제·검증 로직은 그대로. `projectRoot`/`fileURLToPath` 제거.
- `smoke-pages.mjs`: 경로 추출·`copiedMainPaths` 로컬 정의 제거 → route-rules import (`LOCKED_PATHS`·`copiedMainPaths`·`extractAdvisorRoutePaths`). 스모크 전용 `ADVISOR_MAIN_PATHS`(`/today`·`/learn`·`/history`) 는 점검 샘플이라 그대로 둠.
- 동작 차이 주의: Advisor 경로 추출은 prepare 규칙(bare `x` 도 `/x` 로 취급)으로 통일. 현재 routes.js 는 전부 `/`로 시작하므로 결과 동일. 향후 bare 경로가 생기면 smoke 쪽 결과가 달라질 수 있음(현재 없음).
- 공유 파일 없음. 작업 트리의 `frontend/src/App.vue`·`frontend/src/data/pantry/*`·`Pantry.vue` 변경은 다른 작업자 것이라 건드리지 않음. frontend/dist 미사용(빌드는 `/private/tmp/tkt213/` 출력).

## 검증
- 전후 비교(`/private/tmp/tkt213/`): before 는 변경 전 스크립트·before-dist 빌드, after 는 변경 후 스크립트·after-dist 빌드(advisor-dist 공용). `prepare-before.txt` 와 `prepare-after.txt` 를 `before-dist`/`after-dist` 치환 후 diff → **동일**(복제 17개 경로 목록 `/advisor/courses … /work` 동일, 삭제된 목업 4개 `blog-archive.html`·`blog-post.html`·`writing-studio.html`·`blog-hub.html` 동일, 참조 5/3 동일).
- `node --check` route-rules.mjs · prepare-github-pages.mjs · smoke-pages.mjs: 통과.
- `git diff --check`: 통과(출력 없음).
- `node infra/public-site/smoke-pages.mjs` 라이브 기본 모드: **19/19 통과** (exit 0).
- unit `cd frontend && node --test $(find src -name "*.test.mjs")`: 34 중 33 통과 / **1 실패** — `frontend/src/data/pantry/pantry.test.mjs:37` `TKT-206` "세트마다 태그가 12개 이상" (`autumn-sunday: 태그 10개`). 원인은 작업 트리의 pantry 데이터 미커밋 변경(TKT-212 등 다른 작업자) 으로 보이며 이 티켓 범위 밖. 이 티켓 변경(infra/public-site)은 frontend unit 과 무관.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-213-r1.md`.
- 없음.
