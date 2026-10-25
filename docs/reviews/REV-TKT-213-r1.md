문서 상태: 작성완료

# REV-TKT-213-r1 — 배포 경로 규칙 공용 모듈 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Haiku 5.5). 브랜치 `codex/v0.8.3`.
- 게이트(직접): `node --check` 3파일, prepare 전후 출력 diff 0(복제 17·삭제 목업 4 동일), 구현자 라이브 스모크 19/19, `git diff --check`. unit 1 실패는 TKT-212 진행 중 콘텐츠(범위 밖).
- [제안] 스모크 전용 `ADVISOR_MAIN_PATHS` 가 남아 있다 — Advisor 대표 경로 3개 확인용이라 수용.
