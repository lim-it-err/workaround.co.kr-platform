문서 상태: 작성완료

# REV-TKT-222 — 집 PC 공개 전 보안 보강 (r1 반려 → r2 **통과**)

- 판정: PM(Claude Opus 5.5), 2026-11-21 · 구현: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v1.0.0`.

## r1 — 반려 [블로커]
- compose 의 `${VAR:?}` 가 프로필과 무관하게 파일 전체 보간 때 평가되어, `.env.example` 복사본만으로 `up -d web`·`down` 이 실패(PM 재현). → 게이트웨이 기동 검증에 맡기도록 되돌림.

## r2 — PM 직접 실행 (맥 Docker)
- `mvn -q package`(JDK 21) 통과, 테스트 12/0.
- (1) `.env.example` 복사본만: `up -d --build web` → `/health` 200, `down` 성공.
- (2) `--profile api` + 빈 값: gateway 로그 `IllegalStateException: 운영(APP_ENV=home)에서는 PLATFORM_API_KEY 가 비었거나 기본값…`, web `/health` 200.
- (3) 임시 랜덤 값(검증 뒤 `.env` 삭제): GET `/api/health`·`/api/services`·`/api/runtime` 200 · POST `/api/health`, work-manager board·auth·commands, GET·POST `/api/tickets`, `/api/services/…` 프록시, `//api/tickets`, `/api/health/../tickets` → 전부 403. `X-Forwarded-For: 127.0.0.1` 위조로 work-manager 접근 → 403.
- `git diff --check` 통과. diff 의 40자 해시는 기존 기본값 상수의 이동(새 비밀값 아님).

## 지적
- [제안] 빈 값일 때 gateway 가 `restart: unless-stopped` 로 계속 재시작한다(무해하나 로그 소음). `on-failure:3` 검토.
- [제안] 생성자 boolean 더미 오버로드 구조 정리(동작 무관).
- [중요·후속] 공개 화면의 Work Manager 가 `/api/work-manager/*` 403 을 받는다 — 공개 빌드에서 조작 탭 숨김(운영 노트만) 후속 FE 티켓(v1.0.0).
