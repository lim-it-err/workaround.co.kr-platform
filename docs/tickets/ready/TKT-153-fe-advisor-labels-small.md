문서 상태: 작성완료

# TKT-153 `[FE]` Advisor 표기 소묶음 — 코스 총시간·첫 시즌 CTA·시즌 빈 상태

- 상태: ready · P3 · 담당: codex-6/codex-1 · 의존: TKT-135·142 finished(142 need_review 면 착수 가능). 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: REV-TKT-129-r1 [제안] `4535분` → `약 76시간`; UX-TONE-FINAL S1(다음 회차 시간이 먼저, 전체 시간은 보조); REV-TKT-135-r1 [제안] 처음 방문 CTA `첫 시즌 시작`; UX-ADVISOR-2026-09-14 Season [개선] — 0값 스탯보다 `오늘 첫 기록 만들기`.
- scope: `LearnPage.vue`·`CourseList.vue`·`CoursesPage.vue`·`CourseDetailPage.vue`(시간 표기), `HistoryPage.vue`(`#season` 빈 상태), 공통 포맷 함수 + unit, E2E.

## 완료 조건
1. [ ] 분→시간 포맷 함수 unit: `0`·`59`·`60`·`90`·`4535` → `0분`·`59분`·`1시간`·`1시간 30분`·`약 76시간`.
2. [ ] 코스 행: 다음 회차 시간(예 `20분`)이 앞·본문 톤, 전체 시간(`약 76시간`)은 뒤·보조 톤. 142 의 첫 화면 축약과 충돌 시 `공유 파일:` 표기.
3. [ ] 시즌 없음: CTA `첫 시즌 시작`; 스탯 전부 0 이면 타일 대신 `오늘 첫 기록 만들기` 행 하나(`/today` 링크).
4. [ ] E2E 2건(코스 행 표기·시즌 빈 상태), 46+ 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
