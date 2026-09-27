문서 상태: 작성완료

# REV-TKT-080-r1 — advisor 서비스 계약 마감 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. 리뷰어 일괄 초안은 병행 도착 예정 — PM 직접 게이트로 선판정.
- PM 재실행: gateway `mvn -q clean package`(JDK 21) 성공 · advisor `./run.sh test` ✅ 통과 · `docker compose config --quiet` 성공. compose 실기동·`/api/services/advisor/health` 200 은 구현자 로그(18080 임시 바인딩, 컨테이너 정리) 인정 — 이 머신 Docker daemon 상태로 PM 재현은 생략, **리뷰어 일괄 검증에서 재확인 요청**.
- 파일 목록: `gateway/.../PlatformGatewayApplication.java`, `gateway/src/main/resources/application.yml`, `gateway/src/test/.../PlatformGatewayAdvisorTest.java`(신규), `infra/.env.example`, `infra/docker-compose.yml`. **주의: `services/advisor/service/**`(HealthController.java·run.sh)·README 변경분은 PM 실수로 TKT-123 커밋(dc061a3, `git add services/advisor`)에 선포함됨 — 경계 위반 사후 기록(AS-R007 재발). 이후 PM 은 경로 지정 add 만 쓴다.**
- 질문 답변: 결정 ID 필요 → **D-017** 로 기록(advisor 서버측 Anthropic 직접 호출 예외: mock 기본·키는 env·실패 시 mock 격리, 공개 경로는 D-009 gateway). 실키 full cycle 은 TKT-087 유지.
- 블로커 0. 통과.
