문서 상태: 작성완료

# REV-TKT-235-r1 — 낡은 e2e 17건 정리 (PM, 2026-11-28)

판정: **반려** (블로커 2 — 범위 확장 승인 포함)

## 확인한 것
- 진단 수용: 17건 중 15건은 화면이 아니라 실행 전제 불일치(4175 root preview, root dist, `dist/advisor` 합치기). 파일별 전제를 맞추는 러너 `npm --prefix frontend run e2e:all` 이 이미 있다.
- `[반박]` 수용: **전체 e2e 게이트 = `npm --prefix frontend run e2e:all`** 로 정한다(티켓 재현 명령은 범위가 좁음). REV 와 CLAUDE.md 안내를 이 기준으로 바꾼다(PM).
- light → dark 치환, Runtime 배포 레일 2건 삭제(히어로 테스트와 중복) 수용.

## 지적
- `[블로커]` 대문자 간판 테스트에 `JSON` 허용을 넣지 말 것 — 원칙을 약화한다. 원인인 운영 노트 문구는 PM 이 콘텐츠로 고쳤다(「결과 JSON 을」 → 「결과 파일을」, `frontend/src/data/workNotes/operatingModel.js`, 작업 트리에 반영됨). → 허용 목록에서 `JSON` 제거.
  → 반영: ToneTools 대문자 간판 검사를 원래 정규식 그대로 복원(JSON 허용·주석 삭제). `e2e:all` 2회 통과.
- `[블로커]` 러너에서 HallV09 2건 상시 실패 — **scope 확장 승인**: `frontend/scripts/run-e2e.mjs` 의 `prepareStage` 에 루트 `VERSION` 복사 한 줄. → `e2e:all` fail 0.
  → 반영: `scripts/run-e2e.mjs` prepareStage 에 `cp(repo/VERSION, stage/VERSION)` 한 줄. HallV09 2건 통과. (추가: TKT-237 의 `localhost:8080/health` 조회가 Voyage 왕복에 콘솔 오류를 만들어 해당 테스트에 route stub 추가 — 티켓 구현 메모 ⑤)
- `[제안]` skip 사유가 화면에 남도록(테스트 이름 또는 skip 메시지) — 이미 적었다면 그대로.
  → 반영: skip 이유는 테스트 skip 메시지로 출력된다(변경 없음).

## 재검증 조건
- `npm --prefix frontend run e2e:all` 2회 fail 0, unit, `git diff --check`.
