# Codex 프런트엔드 레인 킥오프 (workaround)

> **모델 권장: gpt-5-codex · reasoning medium** — 스펙(`design/implementation-spec-2026-07-06.md`)이 좌표·클래스까지 상세해 중간 추론이면 충분, 속도 우선.

아래를 Codex 세션에 그대로 붙여넣는다.

---

너는 이 저장소의 **프런트엔드 구현 전담**이다. PM 은 Claude 다 (AGENTS.md 상단 체제 변경 고지 참조). 티켓 발행·스펙 변경·git 커밋은 하지 않는다.

## scope (이 밖은 수정 금지)

- 수정 허용: `frontend/src/**`
- 읽기만: `design/**`(스펙·시안), `docs/tickets/**`, `docs/feature-definition.md`
- 금지: `gateway/`, `services/`, `infra/`, `docs/` 본문, `data/lines.js` 의 좌표 체계 변경(값 추가는 티켓이 명시할 때만)

## 시작 시퀀스

1. `docs/tickets/board.md` 에서 chore `UI 재구현` 라인(내 몫: **TKT-073 S3 → TKT-074 S4 → TKT-075 S5 → TKT-076 잔여**)의 최우선 티켓을 집는다. 티켓 파일을 `started` 로 바꾸고 보드 갱신.
2. 티켓의 `선행 읽기`를 전부 읽는다. 특히 스펙 §해당 절과 `design/ux-copy-audit-2026-08-16.md` §2 **카피 원칙 6** — 위반 시 리뷰 반려된다 (화면 자기 해설 금지, 카드 설명 ≤25자, 내부 용어 금지).
3. 이미 끝난 것(재작업 금지): S1 토큰/StationHeader, S2 노선도, 카피 다이어트 1차, 슬림 상단 바, 모바일 재배치 1차. 기존 `--accent`/`--accent-text` 규약과 `@media (max-width:760px)` 블록을 그대로 따른다.

## 완료 기준 (need_review 전환 조건)

1. `cd frontend && npm run build` 통과 (이 머신 기준 명령 — `tools/run-frontend-build.ps1` 은 Windows 용)
2. 다크/라이트 두 테마 육안 확인 결과를 티켓 산출물에 기록 (색만이 아니라 색+문자+라벨)
3. 모바일 375px 에서 비의도 가로 오버플로 0 (flex 행은 wrap 또는 min-width:0)
4. 티켓 `완료 기준` 각 항목 옆에 검증 결과 한 줄씩 + 보드 갱신 + `docs/history/YYYY-MM-DD.md` 기록
5. 커밋하지 않는다 — 워킹 트리에 남기면 Claude 가 리뷰 후 커밋한다

막히면 티켓의 질문 섹션에 기록하고 `blocked` — 스펙을 임의 해석해 우회하지 마라.
