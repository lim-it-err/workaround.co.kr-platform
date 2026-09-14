문서 상태: 작성완료

# TKT-130 `[FE]` Advisor 흐름 결함 — Probe 순서·기내 빈 상태 복구·결과→기록

- 상태: finished (2026-09-14, REV-TKT-130-r1 통과) · P2 · 담당: codex-1 · 의존: TKT-121 need_review 시. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-surfaces-spec.md` §3·§5 단계 4, `docs/reviews/UX-ADVISOR-2026-09-14.md` §3 우선순위 3·5
- scope: `services/advisor/frontend/src/modules/missions/pages/{ProbeGamePage,InflightPage,ReviewPage,PracticeGamePage}.vue`, 관련 store·테스트(콘텐츠 파일 불가침)

## 목표
1. Probe: 상황 → 관측 → **결과 옆 가설** → 결말 순서로 재배치. 학습 규칙(가설 선택 후 결말)은 보존, 위로 되돌아가라는 안내 제거.
2. 기내: 빈 결과(예: `3분·운영`)에 실제 원인에 맞는 `시간 늘리기` / `조건 초기화` 를 제공, 빈 상태에서 바로 복구.
3. 결과/리뷰 완료 화면: `기록에 저장됨` + `내 기록 보기`, 시즌 변화도 같은 요약에.

## 완료 조건
1. [x] Probe 15판 E2E 1건: 관측 후 다음 행동이 스크롤 없이 인접.
2. [x] 기내 빈 상태 → 복구 1회 조작으로 결과 ≥1.
3. [x] 리뷰 완료 → 기록까지 1회 이하 동작.
4. [x] unit/E2E 회귀 그린, 375/1440.
5. [x] 기록 열람은 닉네임 없이 가능.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## PM 추가 (2026-09-14, REV-TKT-121-r1 이관)
4. `/history` 첫 진입의 닉네임 모달("기록에 이름을 남깁니다")을 `✕` 로 닫으면 `/today` 로 이동한다(실측) — 닫아도 **기록에 머문다**. 닉네임은 열람이 아니라 제출 시점에 요구. 완료 조건 5 로 추가: 기록 열람은 닉네임 없이 가능.

## 구현 내역 (2026-09-14, codex-1)

- 일일 Probe를 `상황 → 관측 → 관측 결과 + 인접 가설 → 결말` 순서로 재배치했다. 관측 후 결과/가설 묶음을 화면 안으로 최소 이동하고, 역방향 안내를 제거했다.
- 연습 카탈로그의 Probe 15판도 관측 결과만 먼저 공개하고 가설을 지목한 뒤에만 결말·정보량을 보여주도록 분리했다. 완료 기록은 가설 선택까지 끝난 시점에만 남긴다.
- 기내 빈 상태는 현재 조건으로 더 긴 시간에 결과가 생기면 `시간 늘리기`, 완료/취향 조건이 원인이면 `조건 초기화`를 보여준다. 어느 CTA든 한 번 조작 후 추천이 1개 이상 생긴다.
- 리뷰 완료 요약에 `기록에 저장됨`, 이번 시즌 변화, `내 기록 보기`를 한 영역에 묶었다. `/history`의 열람용 닉네임 게이트를 제거해 익명 상태에서도 기록 표면에 머문다. 닉네임 제출 게이트는 변경하지 않았다.
- 공유 파일: `ReviewPage.vue`, `PracticeGamePage.vue` (TKT-124와 겹침; 착수 시 TKT-124 need_review였고 작업 중 PM r1 통과·커밋됨). `HistoryPage.vue`, `InflightPage.vue`, `ProbeGamePage.vue`도 선행 TKT-121 변경 위에서 후속 결함만 수정했다.
- 콘텐츠 파일 `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`는 수정하지 않았다.

## 검증

- `npm run test:unit`: 12 files, 66/66 통과.
- `npx playwright test`: Chromium 35/35 통과. 전용 E2E 5건은 일일 Probe 인접성, Probe 연습 15판 전체의 관측→가설→결말, 기내 `시간 늘리기`·`조건 초기화`, 리뷰→기록 1회 이동, 익명 기록 열람을 포함한다.
- `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/advisor/`: 각 116 modules 통과.
- 375px 다크 일일 Probe·기내 빈 상태와 1440px 라이트 Probe 연습·리뷰 완료 요약을 직접 확인했다. E2E에서 375/1440 가로 overflow 0을 확인했다.
- `git diff --check` 통과, 불가침 콘텐츠 3파일 diff 없음. commit/push 없음.

## 남은 위험

- 기존 초기 JS 청크 503.14kB(minified, 278.85kB gzip) 경고는 유지된다. 기능·Pages 빌드는 통과했으며 lazy-load 분리는 TKT-129 후속 메모 범위다.
- Safari/WebKit과 실제 GitHub Pages 배포는 미검증이다.

## PR 준비 메모

- 제목 초안: `[advisor] Probe·기내·리뷰의 다음 행동 복구`
- 포함: Advisor `ProbeGamePage`·`PracticeGamePage`·`InflightPage`·`ReviewPage`·`HistoryPage`, 전용 E2E, 티켓·보드·이력.
- 제외: 콘텐츠 파일, TKT-129 통합 인덱스, TKT-122 시즌 수명주기, commit/push.
5. 코스 시뮬 결과 화면의 `생각해 볼 질문` 절이 제목만 있고 비어 보인다(`/courses/vienna-1900/sim/v1900-5-entry-queue` 실측) — 123 콘텐츠의 reflect 문항을 연결하거나 절을 숨긴다.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-130-r1.md`. PM 추가 5번(시뮬 빈 절)은 착수 뒤 추가분 → TKT-131 로 이관.
