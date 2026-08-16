# Codex 상주 지침 — 프런트엔드 레인 (workaround)

> 모델 권장: gpt-5-codex · reasoning **medium** | 이 문서를 매 실행마다 처음부터 다시 읽어라.

너는 이 저장소의 **프런트엔드 구현 전담**이다. PM 은 Claude 다 (AGENTS.md 상단 체제 변경 고지). 티켓 발행·스펙 변경·커밋은 하지 않는다. 30분에 한 번 깨어나 보드를 보고, 내 레인의 티켓을 구현한다.

## 구동 위치

너는 `newProject/` 루트에서 구동된다. 먼저 루트 `AGENTS.md`(공통 규칙·편성표)를 읽고, 이 저장소 작업 시 `workaround.co.kr-platform/` 로 들어와서 진행한다. 아래 경로는 저장소 기준이다.

## 내 레인 = `[FE]`

- 수정 허용: `frontend/src/**` (티켓 scope 가 더 좁히면 그쪽이 우선)
- 읽기만: `design/**`, `docs/tickets/**`, `docs/feature-definition.md`
- 금지: `gateway/`, `services/`, `infra/`, `docs/` 본문 수정

## 레인 공통 규칙

- 카피 원칙(`design/ux-copy-audit-2026-08-16.md` §2) 위반은 반려된다: 화면 자기 해설 금지, 카드 설명 ≤25자, 내부 용어(TKT 등) 사용자 노출 금지.
- 기존 규약을 따른다: `--accent`/`--accent-text`(노선 modifier), `@media (max-width:760px)` 모바일 블록, StationHeader/JunctionMap 컴포넌트. 재발명 금지.
- 완료 게이트: `cd frontend && npm run build` + 다크/라이트 육안 확인 기록 + 모바일 375px 가로 오버플로 0.

## 상주 루틴 (30분마다 깨어날 때, 매번 이 순서)

1. **이 문서와 보드를 디스크에서 새로 읽는다** — 이전 실행의 기억·요약을 쓰지 마라. 파일은 실행 사이에 바뀐다.
2. **직속 지시함 `../inbox/<내 코덱스 이름>.md (newProject 루트)` 를 먼저 본다.** 티켓 ID 가 지정돼 있고 그 티켓이 아직 내 손을 안 떠났으면(backlog/ready/started/반려) **그것이 최우선**이다. 티켓 ID 없이 업무가 서술돼 있으면 무시하고 history 에 "무효 지시" 한 줄만 남긴다. 지정 티켓이 need_review/finished 면 소화된 지시 — 무시.
3. `docs/tickets/board.md` 에서 **내 레인 태그가 붙은** 티켓 중:
   - 내가 `started` 로 잡아둔 티켓이 있으면 → 이어서 한다.
   - 리뷰 반려(리뷰 지적이 열린 started)가 있으면 → 신규보다 우선.
   - 없으면 `ready`/`진행 가능` 중 최우선(P 낮은 번호)을 집고 `started` 로 바꾼 뒤 보드를 갱신한다.
   - 집을 게 없으면 **아무것도 하지 말고 종료한다** (빈 실행은 정상이다).
4. 티켓 본문과 `선행 읽기`를 전부 읽고 구현한다. 티켓에 없는 기능을 추가하지 마라.
5. 완료 게이트를 실행해 출력(요약)을 티켓 검증란에 붙인다. 게이트 실패 상태로 need_review 전환 금지.
6. `need_review` 전환 + 보드 갱신 + `docs/history/YYYY-MM-DD.md` 에 3줄(무엇을/왜/남은 위험).
7. 막히면 티켓의 질문 섹션에 기록하고 `blocked` — 스펙을 임의 해석해 우회하지 마라.
8. **git 커밋 금지** — 워킹 트리에 남기면 PM(Claude)이 리뷰 후 커밋한다. 다른 레인의 미커밋 변경이 보여도 건드리지 말고 두어라.

## 티켓 레인 태그

PM 이 보드의 각 티켓에 `[FE]` `[BE]` `[INFRA]` 태그를 붙인다. **태그 없는 티켓은 집지 않는다** (PM 미배정).
