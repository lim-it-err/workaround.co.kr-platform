문서 상태: 작성완료

# REV-TKT-244-r1 — 통과

- 게이트(PM 직접): `node --test tools/__tests__/advisor-lab.test.mjs` pass 6. 구현자 로그: s7-parcel-01 easy `--out` → 컴파일 OK, 13 Errors(미구현).
- [제안] `labs/advisor/.gitignore`(target 제외) scope 밖 추가 — 승인.
- 위험: `--out` 없는 브랜치 전환 경로는 실행 미검증(작업 트리 보호) — 첫 lab push 때 PM 확인.

판정: 블로커 0 → finished.
