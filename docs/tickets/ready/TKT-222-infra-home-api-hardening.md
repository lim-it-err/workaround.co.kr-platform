문서 상태: 작성완료

# TKT-222 `[INFRA]` 집 PC 공개 전 보안 보강 — `/api` 허용 목록·게이트웨이 기본값 제거

- 상태: ready · **P1 · v1.0.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v1.0.0`(작업 트리 `/Users/imjeonghan/newProject/wa-100`, PR #9 에 포함).
- 근거: PM 보안 점검(2026-11-21, PO 「지금까지 올린거에서 보안이슈는 없지?」). 기본 구성(web 만)은 정적 파일뿐이라 문제없음. **`--profile api` 로 게이트웨이를 켜고 터널로 공개하면** 아래가 바로 인터넷에 열린다.
  1. `infra/home/docker-compose.yml` 이 `PLATFORM_API_KEY: ${PLATFORM_API_KEY:-}` 로 **빈 문자열**을 넘긴다 → `PlatformGatewayApplication.java:222` `requireApiKey` 가 `Objects.equals("", requestKey)` 라 빈 `X-Platform-Key:` 헤더로 티켓 생성·claim·complete 통과 가능. 변수를 아예 안 주면 기본값 `dev-key`(application.yml:10, 공개 저장소).
  2. Work Manager 비밀번호 해시 기본값이 공개 저장소 코드에 박혀 있다(`PlatformGatewayApplication.java:56`) — 약한 비밀번호면 오프라인 대입으로 풀린다. 세션을 얻으면 `/work-manager/commands`·전이가 열린다.
  3. `/api/services/{id}/**` GET·POST 가 내부 서비스로 인증 없이 프록시된다.
  4. Caddy 뒤에서는 모든 요청의 원격 주소가 Caddy 컨테이너 IP 라, 원격 주소 기반 제한(신뢰 프록시 목록)이 의도대로 동작하는지 확인되지 않았다.
- scope: `infra/home/Caddyfile`, `infra/home/docker-compose.yml`, `infra/home/.env.example`, `infra/home/README.md`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java`(키·비밀번호 기본값·검증 부분만), `gateway/src/main/resources/application.yml`, 게이트웨이 테스트.

## 완료 조건
1. **Caddy 허용 목록**: `/api/*` 전체 프록시 대신 공개 화면이 실제로 쓰는 읽기 경로만(`GET /api/health`·`/api/services`·`/api/runtime` 등 — 프런트 코드에서 실제 호출을 grep 해 목록화하고 티켓에 근거 기록) 통과, 나머지 `/api/*` 는 **403**. 쓰기(POST)는 전부 403. Work Manager·tickets 는 공개 경로에서 닫는다(필요해지면 Cloudflare Access 뒤 별도 호스트로 — 이번 범위 밖, README 에 명시).
2. **게이트웨이 기본값 제거**: `PLATFORM_API_KEY` 가 비었거나 `dev-key` 이고 프로필이 운영(예: `APP_ENV=home` 또는 별도 플래그)이면 **기동 실패**(명확한 로그). `requireApiKey` 는 설정 키가 비어 있으면 항상 거부. Work Manager 비밀번호 해시도 운영에서 기본값이면 기동 실패. 로컬 개발(`dev`) 동작은 지금 그대로.
3. compose: gateway 에 운영 플래그 전달, `PLATFORM_API_KEY`·`WORK_MANAGER_PASSWORD_SHA256` 을 `.env` 에서 필수로(`${VAR:?설명}`). `.env.example` 에 설명만(값 없음), 값 만드는 명령 예시(`openssl rand -hex 32`, 해시 만드는 법).
4. 원격 주소: Caddy 가 넘기는 `X-Forwarded-For` 를 게이트웨이가 믿는 조건을 확인하고, 신뢰 프록시를 web 컨테이너로 한정. 확인 결과를 티켓에.
5. 검증: 게이트웨이 단위 테스트(빈 키·기본 키 거부, 운영 기본값 기동 실패), `mvn -q package`(JAVA 버전은 저장소 기준), Docker 로 `--profile api` 기동 후 허용 경로 200·막힌 경로 403·POST 403 표, `git diff --check`. 맥 Docker 사용 가능(데몬 켜져 있음). 끝나면 `down`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- (대기)
