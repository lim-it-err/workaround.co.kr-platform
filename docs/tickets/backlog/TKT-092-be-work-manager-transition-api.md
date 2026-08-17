# TKT-092
## 메타데이터
- 제목: Work Manager 전이 API — need_review→backlog 반려 전이 서버 계약 (062 의 BE 몫 분리)
- 우선순위: P2 / 상태: `ready` / 담당: `[BE]`
- scope: `gateway/**`
- 근거: codex-1 의 TKT-062 차단 보고 (gateway 전이 매트릭스가 [FE] 금지 범위) — PM 분할 2026-08-18
## 목표
게이트웨이 전이 매트릭스에 `need_review → backlog`(반려) 전이를 추가하고 감사 로그·테스트 포함. UI 계약(응답 스키마)을 티켓에 기록해 [FE] 후속(062)이 그대로 붙게 한다.
## 완료 게이트
- gateway 테스트 그린 + 전이 매트릭스 회귀(허용/금지 케이스) + 계약 기록
