# TKT-087

## 메타데이터
- 제목: advisor 실 LLM provider — Claude Haiku 연동 (M2)
- 우선순위: P1 (PO: "haiku 붙이도록 푸시") / 상태: `blocked` / 문서 상태: 작성완료
- 담당: `[BE]` / scope: `services/advisor/service/**` (콘텐츠 파일 불가침)
- 근거: advisor `docs/M2-BACKEND-PLAN.md`, 기존 `claude` 프로필(ANTHROPIC_API_KEY) 골격

## 목표
advisor 의 mock 프로필과 대등하게 **Haiku(claude-haiku-4-5) 프로필**을 실동작시킨다: 미션 리뷰·시나리오 생성 경로가 Haiku 를 호출, 실패 시 mock 폴백 + "모델 초안" 표기 유지.

## 완료 게이트
- `service/run.sh test` 그린 (Anthropic 호출은 계약 테스트 — 기존 dev-011 패턴 재사용)
- `ADVISOR_PROFILE=claude ANTHROPIC_API_KEY=... ./run.sh demo` 로 full cycle 1회 성공 로그 (키는 PO 가 주입, 저장소 미포함)

## 구현/검증 기록
- `claude` 프로필의 출제·리뷰·채팅 경로를 `claude-haiku-4-5-20251001`로 통일하고, Anthropic 네트워크·HTTP·구조화 응답 실패(`LlmException`) 시 동일 타입의 mock fixture로 폴백하도록 라우팅했다.
- 응답 DTO와 프런트엔드 파일은 변경하지 않아 기존 "모델 초안" 표시 계약을 유지했다.
- 2026-08-17: 샌드박스 밖 JDK 21에서 `service/run.sh test` 34건 통과(실패 0, 오류 0). Haiku 3개 role 설정, 강제 tool-use 구조화 응답, mock 폴백 계약 테스트를 포함한다.
- `ADVISOR_PROFILE=claude`가 `run.sh start`에도 적용되도록 했고, 키 미주입 시 비밀값 없이 즉시 거부하는 가드를 확인했다.

## 질문/결정 기록
- 2026-08-17 `[codex-2]` 차단: 실행 환경에 `ANTHROPIC_API_KEY`가 없고 advisor 서버도 떠 있지 않아 실 Anthropic full cycle 1회 게이트만 수행할 수 없다. PO가 세션 환경에 키를 주입하고 `ADVISOR_PROFILE=claude ./run.sh start`로 서버를 기동한 뒤, 별도 셸에서 `ADVISOR_PROFILE=claude ./run.sh demo` 실행을 허용해 주면 즉시 재검증한다. 키는 파일·로그·티켓에 기록하지 않는다.
