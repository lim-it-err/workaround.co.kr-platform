문서 상태: 작성완료

# TKT-193 `[INFRA]` 일일 배치 — Batch API 로 공용 콘텐츠 사전 생성 → 정적 JSON/KV

- 상태: backlog · P2 · 담당: dev 서브에이전트(Sonnet) · 의존: TKT-191. 설계 `docs/llm-gate.md` §2·§6.
- scope: `infra/llm-gate/**`(Cron 트리거·배치 제출/수거), 결과 소비 측은 별도 티켓.

## 완료 조건
1. [ ] Worker Cron(하루 1회, KST 새벽)이 기능 표의 `batch: true` 기능을 Message Batches API 로 제출·수거, 결과를 KV(또는 R2 JSON)에 날짜 키로 저장.
2. [ ] 비용은 예산 차단기에 합산(배치 단가). DRY_RUN 기본.
3. [ ] 실패 시 전날 결과 유지·알림.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
