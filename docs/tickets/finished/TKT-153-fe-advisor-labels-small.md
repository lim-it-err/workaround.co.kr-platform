문서 상태: 작성완료

# TKT-153 `[FE]` Advisor 표기 소묶음 — 코스 총시간·첫 시즌 CTA·시즌 빈 상태

- 상태: finished (2026-09-15, PM 통과) · P3 · 담당: codex-1 · 의존: TKT-135·142 finished(142 need_review 면 착수 가능). 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: REV-TKT-129-r1 [제안] `4535분` → `약 76시간`; UX-TONE-FINAL S1(다음 회차 시간이 먼저, 전체 시간은 보조); REV-TKT-135-r1 [제안] 처음 방문 CTA `첫 시즌 시작`; UX-ADVISOR-2026-09-14 Season [개선] — 0값 스탯보다 `오늘 첫 기록 만들기`.
- scope: `LearnPage.vue`·`CourseList.vue`·`CoursesPage.vue`·`CourseDetailPage.vue`(시간 표기), `HistoryPage.vue`(`#season` 빈 상태), 공통 포맷 함수 + unit, E2E.

## 완료 조건
1. [x] 분→시간 포맷 함수 unit: `0`·`59`·`60`·`90`·`4535` → `0분`·`59분`·`1시간`·`1시간 30분`·`약 76시간`.
2. [x] 코스 행: 다음 회차 시간(예 `20분`)이 앞·본문 톤, 전체 시간(`약 76시간`)은 뒤·보조 톤. 142 의 첫 화면 축약과 충돌 시 `공유 파일:` 표기.
3. [x] 시즌 없음: CTA `첫 시즌 시작`; 스탯 전부 0 이면 타일 대신 `오늘 첫 기록 만들기` 행 하나(`/today` 링크).
4. [x] E2E 2건(코스 행 표기·시즌 빈 상태), 46+ 그린.

## 구현 기록
- `formatDuration`을 공통화해 60분 미만·시간+분·24시간 이상 근삿값을 한 계약으로 표시했다. 코스 목록은 저장된 완료 상태에서 아직 끝내지 않은 다음 회차를 찾아 본문 톤으로 먼저, 전체 시간과 개수는 보조 톤으로 뒤에 둔다. 코스 상세도 같은 포맷을 쓴다.
- 시즌이 아예 없을 때는 `첫 시즌 시작`, 시작했지만 합계가 0인 활성 시즌은 0값 4줄과 빈 최근 기록 대신 면 없는 `오늘 첫 기록 만들기` 한 줄만 보여 `/today`로 연결한다. 지난 시즌 읽기 전용·종료 시즌·대기 적립 흐름은 기존 표시를 유지했다.
- 티켓의 `HistoryPage.vue (#season)`은 현 라우트에서 `RecordsPage.vue`가 실제 `SeasonPage.vue`를 임베드하는 구조이므로, 사용자에게 렌더되는 `SeasonPage.vue`에 적용했다.
- 공유 파일: `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue` (TKT-142 첫 화면 축약 구조 보존).

## 검증 기록
- `npm run build`: 115 modules, 경고 0.
- `npm run test:unit`: 15 files, 87/87. 신규 시간 포맷 경계값 5건과 코스 게임 완료 후 다음 회차 전진 1건 포함.
- `npm run test:e2e`: Chromium 54/54. 신규 `label-bundle.spec.ts` 2건 포함.
- 375px 다크·1440px 라이트 실렌더 4장을 직접 확인했다. 코스 행은 다음 시간이 먼저 읽히고 전체 시간은 보조 톤이며, 시즌 첫 기록 행은 hairline 1행·가로 overflow 0이다.
- 보호 콘텐츠 `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js` diff 0, `git diff --check` 통과.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-153-r1.md`.
