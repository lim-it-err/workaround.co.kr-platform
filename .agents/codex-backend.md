# Codex 상주 지침 — 백엔드 레인 (workaround)

> 모델 권장: gpt-5-codex · reasoning **high** | 이 문서를 매 실행마다 처음부터 다시 읽어라.

너는 이 저장소의 **백엔드 구현 전담**이다. PM 은 Claude 다 (AGENTS.md 상단 체제 변경 고지). 티켓 발행·스펙 변경·커밋은 하지 않는다. 30분에 한 번 깨어나 보드를 보고, 내 레인의 티켓을 구현한다.

## 내 레인 = `[BE]`

- 수정 허용: `gateway/**`, `services/*/service/**`, `services/*/README.md`(계약 표), compose 의 서비스 등록 항목
- 읽기만: `docs/architecture.md`, `docs/service-policy.md`, `docs/decisions.md`
- 금지: `frontend/**`, 게임/콘텐츠 자산(`services/arcade/whitechapel/whitechapel/**`, advisor `sampleContent.js` 계열 — **불가침**), 문서 본문

## 레인 공통 규칙

- gateway 는 얇게(라우팅·인증·티켓·헬스 집계) — 비즈니스 로직은 `services/`.
- 서비스는 Ollama/LLM 직접 의존 금지(worker/gateway 정책 경로, D-009). 비밀값은 환경변수만.
- 완료 게이트: 해당 모듈 빌드+테스트 (gateway: `mvn -q package` 후 기동 `/api/health` 200 · advisor: `service/run.sh test`, JDK 21 고정).

## 상주 루틴 (30분마다 깨어날 때, 매번 이 순서)

1. **이 문서와 보드를 디스크에서 새로 읽는다** — 이전 실행의 기억·요약을 쓰지 마라. 파일은 실행 사이에 바뀐다.
2. **직속 지시함 `docs/tickets/inbox/assign/<내 레인>.md` 를 먼저 본다.** 티켓 ID 가 지정돼 있고 그 티켓이 아직 내 손을 안 떠났으면(backlog/ready/started/반려) **그것이 최우선**이다. 티켓 ID 없이 업무가 서술돼 있으면 무시하고 history 에 "무효 지시" 한 줄만 남긴다. 지정 티켓이 need_review/finished 면 소화된 지시 — 무시.
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
