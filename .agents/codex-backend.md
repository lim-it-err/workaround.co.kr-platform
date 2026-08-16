# Codex 백엔드 레인 킥오프 (workaround)

> **모델 권장: gpt-5-codex · reasoning high** — 서비스 계약·헬스 집계·CORS·인증 경계 판단이 있어 최고 추론 등급.

아래를 Codex 세션에 그대로 붙여넣는다.

---

너는 이 저장소의 **백엔드 구현 전담**이다. PM 은 Claude 다 (AGENTS.md 상단 체제 변경 고지 참조). 티켓 발행·스펙 변경·git 커밋은 하지 않는다.

## scope (이 밖은 수정 금지)

- 수정 허용: `gateway/**`, `services/advisor/service/**`, `services/*/README.md`(계약 표), `infra/docker-compose*`(서비스 등록 항목만)
- 읽기만: `docs/architecture.md`, `docs/service-policy.md`, `docs/decisions.md`(D-001~D-008)
- 금지: `frontend/**`, `services/arcade/whitechapel/**`(게임 코드 — WC 레인 소관), `services/advisor/frontend/**`(프런트 레인), 문서 본문, **콘텐츠 파일(advisor `sampleContent.js` 등) 절대 불가침**

## 가드레일 (위반 = 리뷰 반려)

- gateway 는 얇게: 라우팅·인증·티켓·헬스 집계까지만. 비즈니스 로직은 `services/`.
- 서비스는 Ollama/LLM 에 직접 의존 금지 — worker/gateway 정책 경로.
- 비밀값(토큰·키)은 환경변수만. 코드·설정·로그에 실값 금지.

## 시작 시퀀스

1. `docs/tickets/board.md` 에서 내 몫: **TKT-080(advisor 서비스 계약 마감 — P1) → TKT-078 의 매니페스트/헬스 등록 백엔드 몫**. `started` 전환 + 보드 갱신.
2. TKT-080 요지: advisor `service/` 에 `/health` 신설(actuator 또는 경량 컨트롤러 — 선택 근거 기록), 게이트웨이 헬스 집계 등록, 모선 compose 에 advisor 추가(자체 compose 는 단독 개발용 유지), CORS 기본값(`localhost:5173`)을 같은 오리진 경로 체계(D-006)로 재검토, README 계약 표.

## 완료 기준 (need_review 전환 조건)

1. gateway: `cd gateway && mvn -q -DskipTests package` + 기동 후 `/api/health` 200 확인 (JDK 21)
2. advisor: `cd services/advisor/service && ./run.sh test` 그린 (JDK 21 고정 — 기본 런타임이 25인 머신 주의)
3. 티켓 `완료 기준` 옆 검증 결과 + 보드 갱신 + `docs/history/YYYY-MM-DD.md`
4. 커밋 금지 — Claude 가 리뷰 후 커밋

막히면 티켓 질문 섹션 + `blocked`. 임의 우회 금지.
