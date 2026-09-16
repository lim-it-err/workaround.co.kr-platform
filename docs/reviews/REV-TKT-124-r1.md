문서 상태: 작성완료

# REV-TKT-124-r1 — Advisor 코스 컨테이너(코스=정류장, 형식 3종) (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **66/66**(12 files), build **116 modules**. 구현자 Playwright 30/30 인정. 콘텐츠 3파일 diff 없음. 121 이 먼저 커밋돼 공유 파일(`LearnPage`·`MissionPage`·`ReviewPage`·`PracticeGamePage`·`routes.js`·`missions.js`) 경계 깨끗함 — `공유 파일:` 기록 규칙 첫 적용.
- 실화면(127.0.0.1:5173, 390 dark / 1440 light):
  - **배우기** 상단에 `코스` 절: `A01 소프트웨어 설계 · 기본 코스 · 39개`, `A02 미술사 · 역사 · 비엔나 1900 · 12개` hairline 행 + `전체 화면으로`(`/courses`). 기존 미션 필터는 `기존 미션 빠르게 찾기` 아래 유지(129 범위).
  - **코스 상세** `/courses/vienna-1900`: 소개문(123 콘텐츠) + `미션 시각표 12개` — 형식 배지 코딩 6·게임 5·시뮬 1, 행 높이 66px 균일, 1440 라이트에서 넓은 채움 면 0, overflow 0. 대문자 영어 간판 0.
  - **진입·복귀**: 코딩 `/missions/v1900-b-pigments`(제목 `안료 연표가 양식을 바꿨다`) → `← 비엔나 1900 코스` 로 코스 상세 복귀. 게임은 `/games/practice/v1900-*`. 시뮬 `/courses/vienna-1900/sim/v1900-5-entry-queue` — 시간대 select·창구/사전 예약 range·`대기열 돌려보기`(h48) → 결과(평균 대기 0.8분·도착 72·처리 16·최장 0.8분·혼합 처리시간 35초), 격납고 배차 엔진 재사용 설명 한 줄.
- 완료 조건 4개(목록 2코스·형식 배지/진입/복귀·unit/E2E+코스 테스트 3·375/1440) 충족.
- [제안] 초기 번들 503kB(minified) — 코스 콘텐츠 로더가 초기 번들에 포함. 코스가 늘면 route 단위 lazy-load 로 분리 — TKT-129 메모.
- [제안] 시뮬 결과의 `생각해 볼 질문` 절이 비어 보임(내용 없이 제목만) — 123 콘텐츠의 `reflect` 항목 연결 여부를 130 에서 확인.
- 커밋 범위: `services/advisor/frontend/{e2e/course-container.spec.ts, src/modules/missions/{components,games,pages,routes.js,store}}`.
