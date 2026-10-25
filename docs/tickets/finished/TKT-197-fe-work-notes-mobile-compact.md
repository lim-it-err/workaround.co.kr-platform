문서 상태: 작성완료

# TKT-197 `[FE]` 운영 노트 375 압축 — 흐름 한 문장·절 접기·상단바 제목

- 상태: finished · **v0.8.2** · P1 · 담당: dev 서브에이전트(Sonnet) · 근거 REV-TKT-195-r1 I1. 브랜치 **`codex/v0.8.2`**(작업 트리 `/Users/imjeonghan/newProject/wa-082`).
- scope: `frontend/src/components/WorkNotes.vue`·`WorkNotes.e2e.mjs`, `frontend/src/styles.css`, `frontend/src/App.vue`(work 상단바 제목 한 곳).

## 완료 조건
1. [x] 375 에서 흐름은 화살표로 이어진 문장이 줄바꿈되는 형태(단계별 세로 목록 아님).
2. [x] 절은 `<details>` 접기 — 첫 절만 펼침, 제목 줄에 상태 배지 유지. 1440 은 지금처럼 모두 펼침.
3. [x] 375 운영 노트 전체 높이 ≤ 2,000px(접힌 상태), 상단바 제목 `운영 노트`.
4. [x] 게이트: build, WorkNotes·staticRouting·JunctionMap·ToneTools E2E, unit, `git diff --check`, 375/1440 캡처.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-197-r1.md`.
- 없음.

## 구현 내역
- `WorkNotes.vue`: 절을 `<details>`(제목 줄 `<summary>` + 상태 배지)로. 폭 ≥900 은 모두 펼침, 그 미만은 첫 절만 펼침(`matchMedia`). 상단바 제목 `운영 노트`(`App.vue` work 한 곳).
- `styles.css`(WorkNotes 선택자만): 흐름 `li` 를 인라인으로 바꿔 화살표로 이어진 문장이 줄바꿈(`word-break: keep-all`로 단어 중간 분할 방지). 375 는 제목 줄 44px·＋/－ 표시, 1440 은 표시 숨김.
- `WorkNotes.e2e.mjs`: 절 펼침 상태, 흐름 인라인·세로 목록 아님, 375 높이 ≤2000 단언.
- 공유 파일: 없음. 콘텐츠 파일 무변경.

## 검증
- build root·Pages-base OK. E2E WorkNotes 8/8·staticRouting·JunctionMap·splashTone 합 30/30, ToneTools 10/10(root dist 후 Pages-base 로 복원). unit 29/0. `git diff --check` 통과.
- 캡처 `/private/tmp/tkt197/work-{375,1440}-{dark,light}.png`: 375 접힌 상태 노트 높이 약 1,000px(페이지 1,263px). 375 1행 `맥북에서 개발·판정·커밋 → GitHub 작업`, 2행 `브랜치 → main 병합 → 공개 사이트 배포`. 가로 overflow 0, 영어 간판 0.
- [PM 의문] 1440 에서 모든 절이 펼쳐진 채 접기 표시가 없다(요구대로). 접힘 토글이 필요하면 별도 티켓.
