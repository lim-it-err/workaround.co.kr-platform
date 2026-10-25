문서 상태: 작성완료

# TKT-197 `[FE]` 운영 노트 375 압축 — 흐름 한 문장·절 접기·상단바 제목

- 상태: ready · P1 · 담당: dev 서브에이전트(Sonnet) · 근거 REV-TKT-195-r1 I1. 브랜치 `codex/v0.8.0-live`.
- scope: `frontend/src/components/WorkNotes.vue`·`WorkNotes.e2e.mjs`, `frontend/src/styles.css`, `frontend/src/App.vue`(work 상단바 제목 한 곳).

## 완료 조건
1. [ ] 375 에서 흐름은 화살표로 이어진 문장이 줄바꿈되는 형태(단계별 세로 목록 아님).
2. [ ] 절은 `<details>` 접기 — 첫 절만 펼침, 제목 줄에 상태 배지 유지. 1440 은 지금처럼 모두 펼침.
3. [ ] 375 운영 노트 전체 높이 ≤ 2,000px(접힌 상태), 상단바 제목 `운영 노트`.
4. [ ] 게이트: build, WorkNotes·staticRouting·JunctionMap·ToneTools E2E, unit, `git diff --check`, 375/1440 캡처.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
