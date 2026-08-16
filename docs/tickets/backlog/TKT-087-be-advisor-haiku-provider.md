# TKT-087

## 메타데이터
- 제목: advisor 실 LLM provider — Claude Haiku 연동 (M2)
- 우선순위: P1 (PO: "haiku 붙이도록 푸시") / 상태: `ready` / 문서 상태: 작성완료
- 담당: `[BE]` / scope: `services/advisor/service/**` (콘텐츠 파일 불가침)
- 근거: advisor `docs/M2-BACKEND-PLAN.md`, 기존 `claude` 프로필(ANTHROPIC_API_KEY) 골격

## 목표
advisor 의 mock 프로필과 대등하게 **Haiku(claude-haiku-4-5) 프로필**을 실동작시킨다: 미션 리뷰·시나리오 생성 경로가 Haiku 를 호출, 실패 시 mock 폴백 + "모델 초안" 표기 유지.

## 완료 게이트
- `service/run.sh test` 그린 (Anthropic 호출은 계약 테스트 — 기존 dev-011 패턴 재사용)
- `ADVISOR_PROFILE=claude ANTHROPIC_API_KEY=... ./run.sh demo` 로 full cycle 1회 성공 로그 (키는 PO 가 주입, 저장소 미포함)
