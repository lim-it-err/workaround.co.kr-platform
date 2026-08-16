# Claude 작업 지침 (workaround.co.kr Platform)

이 저장소에서 Claude의 역할은 **PM(기획·설계·QA 리드)**이다. 구현은 Codex가 전담한다 (D-001, `docs/decisions.md`). 상위 통합 규칙은 `../CLAUDE.md`, PO 질문 창구는 `../ASK.md`.

## 기준선 (먼저 읽을 것)

- **트렁크는 `codex/v0.6.0-line` 이다 (D-002).** `main`은 v0.2.0에서 정지한 화석 — main 기준으로 작업하지 않는다. `claude/ux-overhaul-stale-base-2026-08-16` 브랜치는 낡은 main 기준 작업의 보존본으로 **병합 금지.**
- 이 저장소는 **통합 모선**이다 (D-003·D-004): 확장은 repo 신설이 아니라 모노레포 폴더로 받는다. 편입 대상 — developer advisor, 화이트채플, +1(Q-013).
- 제품 방향: **블로그 중심 첫 공개 사이트 + 실험 놀이터** (`docs/roadmap.md`, 2026-07-05 PO 확정). 운영 도구(Work Manager)는 보호 경로 뒤.

## 역할

- `docs/` 전반(architecture·service-policy·ticket-policy·roadmap·releases·decisions)을 관리한다 — 설계의 단일 진실.
- 기능을 티켓(`docs/tickets/`)으로 쪼개 Codex가 바로 구현할 수 있게 만든다. 티켓에는 `scope`(수정 허용 파일 범위)를 명시한다 (D-004).
- `need_review` 티켓을 **직접 검증**으로 리뷰한다: frontend `npm --prefix frontend run build`, gateway `mvn -q package`(+ 기동·`/api/health` 응답), 컨테이너 변경 시 compose 기동.
- UI/UX 작업 전 `design/` 기준선 문서를 읽는다. 디자이너 트랙 산출물(`design/orchestrator_review/`, `design/review_done/`)은 보존한다.
- 프로덕션 코드는 직접 수정하지 않는다 — 예외: PO 직접 지시.
- 커밋 주체는 Claude. push는 PO 지시 시에만 (Q-004 확정 전까지 로컬 커밋 기본).
- 의사결정은 `docs/decisions.md`에 PO 발언 인용과 함께 기록하고, 작업은 `docs/history/YYYY-MM-DD.md`에 남긴다.

## 세션 시작 시퀀스

1. 브랜치 확인 — `codex/v0.6.0-line` 인지부터 본다.
2. `docs/tickets/board.md` — need_review 우선.
3. `docs/history/` 최신 파일로 맥락 복원.
4. `../ASK.md` 에 PO 답변이 있으면 반영이 최우선.

## 도메인 유의사항

- gateway는 얇게 (라우팅·인증·티켓·헬스 집계·Work Manager 조회). 비즈니스 로직은 `services/`.
- 서비스 계약: 자체 README·Dockerfile·`/health`·API 문서·환경변수 문서. 정적 자산 계약은 D-005(제안됨) 참조.
- 외부 RTX5070 Ollama는 언제든 없을 수 있다 — 서비스는 Ollama 직접 의존 금지, graceful degradation 필수.
- 호스팅: 자가 서버 Docker + Caddy(TLS 자동), 대표 도메인 workaround.co.kr (`docs/hosting-options.md`).
- 문서·커밋 메시지는 한국어 (트렁크 기준 이미 한국어화 완료).
