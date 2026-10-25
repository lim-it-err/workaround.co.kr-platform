문서 상태: 작성완료

# REV-TKT-160-r1 — Pages 배포 후 스모크 job (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 브랜치 `codex/v0.8.2`.
- 게이트(PM 직접): `npm run e2e:all` 97 pass / 18 skip / 0 fail(188s) · `git diff --check`.
- 로컬 실행: `smoke-pages.mjs --expect-copies=false`(현재 라이브 v0.8.1) 19/19 통과. 기본 모드는 v0.8.2 배포(복제) 뒤 그린이어야 함 — 첫 Actions 실행에서 확인.
- 워크플로 검토: 권한 `contents: read`, 새 외부 액션 0, push 시 `inputs` 비어 build·deploy 정상, `smoke_url` 지정 시 스모크만. 배포는 되돌리지 않고 job 만 red.
- [제안] 경로 제외 규칙이 prepare 와 중복 — 공용 모듈화는 다음 패치.
