문서 상태: 작성완료

# TKT-222 `[INFRA]` 집 PC 공개 전 보안 보강 — `/api` 허용 목록·게이트웨이 기본값 제거

- 상태: finished · **P1 · v1.0.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v1.0.0`(작업 트리 `/Users/imjeonghan/newProject/wa-100`, PR #9 에 포함).
- 근거: PM 보안 점검(2026-11-21, PO 「지금까지 올린거에서 보안이슈는 없지?」). 기본 구성(web 만)은 정적 파일뿐이라 문제없음. **`--profile api` 로 게이트웨이를 켜고 터널로 공개하면** 아래가 바로 인터넷에 열린다.
  1. `infra/home/docker-compose.yml` 이 `PLATFORM_API_KEY: ${PLATFORM_API_KEY:-}` 로 **빈 문자열**을 넘긴다 → `PlatformGatewayApplication.java:222` `requireApiKey` 가 `Objects.equals("", requestKey)` 라 빈 `X-Platform-Key:` 헤더로 티켓 생성·claim·complete 통과 가능. 변수를 아예 안 주면 기본값 `dev-key`(application.yml:10, 공개 저장소).
  2. Work Manager 비밀번호 해시 기본값이 공개 저장소 코드에 박혀 있다(`PlatformGatewayApplication.java:56`) — 약한 비밀번호면 오프라인 대입으로 풀린다. 세션을 얻으면 `/work-manager/commands`·전이가 열린다.
  3. `/api/services/{id}/**` GET·POST 가 내부 서비스로 인증 없이 프록시된다.
  4. Caddy 뒤에서는 모든 요청의 원격 주소가 Caddy 컨테이너 IP 라, 원격 주소 기반 제한(신뢰 프록시 목록)이 의도대로 동작하는지 확인되지 않았다.
- scope: `infra/home/Caddyfile`, `infra/home/docker-compose.yml`, `infra/home/.env.example`, `infra/home/README.md`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java`(키·비밀번호 기본값·검증 부분만), `gateway/src/main/resources/application.yml`, 게이트웨이 테스트.

## 완료 조건 (1~5 모두 충족, 아래 구현 내역·검증)
1. **Caddy 허용 목록**: `/api/*` 전체 프록시 대신 공개 화면이 실제로 쓰는 읽기 경로만(`GET /api/health`·`/api/services`·`/api/runtime` 등 — 프런트 코드에서 실제 호출을 grep 해 목록화하고 티켓에 근거 기록) 통과, 나머지 `/api/*` 는 **403**. 쓰기(POST)는 전부 403. Work Manager·tickets 는 공개 경로에서 닫는다(필요해지면 Cloudflare Access 뒤 별도 호스트로 — 이번 범위 밖, README 에 명시).
2. **게이트웨이 기본값 제거**: `PLATFORM_API_KEY` 가 비었거나 `dev-key` 이고 프로필이 운영(예: `APP_ENV=home` 또는 별도 플래그)이면 **기동 실패**(명확한 로그). `requireApiKey` 는 설정 키가 비어 있으면 항상 거부. Work Manager 비밀번호 해시도 운영에서 기본값이면 기동 실패. 로컬 개발(`dev`) 동작은 지금 그대로.
3. compose: gateway 에 운영 플래그 전달, `PLATFORM_API_KEY`·`WORK_MANAGER_PASSWORD_SHA256` 을 `.env` 에서 필수로(`${VAR:?설명}`). `.env.example` 에 설명만(값 없음), 값 만드는 명령 예시(`openssl rand -hex 32`, 해시 만드는 법).
4. 원격 주소: Caddy 가 넘기는 `X-Forwarded-For` 를 게이트웨이가 믿는 조건을 확인하고, 신뢰 프록시를 web 컨테이너로 한정. 확인 결과를 티켓에.
5. 검증: 게이트웨이 단위 테스트(빈 키·기본 키 거부, 운영 기본값 기동 실패), `mvn -q package`(JAVA 버전은 저장소 기준), Docker 로 `--profile api` 기동 후 허용 경로 200·막힌 경로 403·POST 403 표, `git diff --check`. 맥 Docker 사용 가능(데몬 켜져 있음). 끝나면 `down`.

## 구현 내역
- 공개 `/api` 근거(프런트 grep): `frontend/src/composables/useWorkManager.js` 가 `/api/health`·`/api/runtime`·`/api/services`(GET) 와 `/api/work-manager/*`(board GET, auth·metadata·commands POST), `useElevatorSim.js` 가 `/api/services/elevator-service/api/*`. 이 중 공개 허용은 앞 3개 GET 만. Work Manager·엘리베이터 프록시는 닫힘 — 엘리베이터는 `fallbackState` 로, Work Manager 는 보호 화면이라 공개에서 비활성(화면 동작 미검증 — 아래 확신 없는 점).
- 완료 조건 1: `infra/home/Caddyfile` — `@apiPublic`(GET·HEAD, `/api/health` `/api/services` `/api/runtime`)만 reverse_proxy, 나머지 `/api/*` 는 `respond 403`.
- 2: `PlatformApiController.validateProductionSecrets` — `APP_ENV` 가 home|prod|production 일 때 키가 빈/공백/`dev-key`, 해시가 빈/저장소 기본값이면 `IllegalStateException`(한국어 메시지)로 기동 실패. `requireApiKey` 는 설정 키가 비면 항상 401. dev 는 그대로(`application.yml` 에 `app.env: ${APP_ENV:dev}` 추가).
- 3: compose gateway 에 `APP_ENV: home`, `PLATFORM_API_KEY`·`WORK_MANAGER_PASSWORD_SHA256` 을 `${VAR:-}` 로 두고(r2 수정, 아래 리뷰 기록) 필수 검사는 gateway 기동 실패에 맡김. `.env.example` 에 설명·생성 명령(값 없음). README 에 공개 범위 절 추가.
- 4: Spring 기본은 `remoteAddr` 가 `WORK_MANAGER_TRUSTED_PROXIES` 에 있을 때만 `X-Forwarded-For` 첫 값을 신뢰(기존 코드 확인). Caddy 컨테이너 IP 는 변동되므로 compose 네트워크 `home`(172.31.80.0/24)에 web 을 `172.31.80.10` 고정하고 그 값만 신뢰 목록으로 전달. Caddy 는 `trusted_proxies` 미설정 시 들어온 XFF 를 덮어쓴다(Caddy 문서 기준 — 스푸핑 실측은 하지 않음). Work Manager 가 공개에서 닫혀 있어 현재 실영향은 없고 방어층이다.
- 공유 파일: 없음.

## 검증
- `JAVA_HOME=openjdk-21.0.1 mvn -q package` 통과. 테스트 12건(WorkManager 11 — 신규 4: 빈·기본 키 거부, 빈·기본 해시 거부, 커스텀 허용·dev 유지, 빈 설정 키는 빈 헤더 401 / Advisor 1), 실패 0.
- (r1 검증, r2 에서 대체됨) compose `${VAR:?}` 는 web 단독·down 까지 깨뜨려 반려됨. `.env` 에 `dev-key` → gateway 가 `IllegalStateException: 운영(APP_ENV=home)에서는 PLATFORM_API_KEY ...` 로 종료. 임시 랜덤 값 `.env` → gateway·web 정상 기동.
- 경로표(127.0.0.1:18090, 임시 포트):

| 요청 | 코드 |
|---|---|
| GET /health, /api/health, /api/services, /api/runtime | 200 |
| POST /api/health | 403 |
| GET /api/work-manager/board | 403 |
| POST /api/work-manager/auth, /commands | 403 |
| GET /api/tickets, POST /api/tickets(빈 X-Platform-Key), POST /api/tickets/x/claim | 403 |
| GET·POST /api/services/elevator-service/api/state·action | 403 |
| GET /api/services/, //api/tickets, /api/health/../tickets, /api/health/ | 403 |
| (게이트웨이 직접, 컨테이너망) 빈 키·무키 POST /api/tickets | 401 |

- `git diff --check` 이상 없음. 검증 후 `down`, 임시 `.env` 삭제 확인. UI 변경 없음(실렌더 해당 없음).

## 질문/에스컬레이션
- [PM 의문] 공개 사이트의 Work Manager 화면(`useWorkManager.js`)이 이제 403 을 받는다 — 화면이 오류 문구를 노출하는지 미확인. 공개에서 해당 탭을 숨길지 별도 FE 티켓 권고.

## 리뷰 기록
- r1 [블로커] PM 반려: compose `${VAR:?}` 가 프로필과 무관하게 파싱 단계에서 평가돼 web 단독 기동·`down` 이 `.env.example` 복사본으로 실패.
  - → 반영(r2): `docker-compose.yml` 을 `${PLATFORM_API_KEY:-}`·`${WORK_MANAGER_PASSWORD_SHA256:-}` 로 되돌림. 값이 비면 `APP_ENV=home` 기동 검증이 gateway 만 죽인다. README·`.env.example` 에 「api 프로필 전 두 값 필수, 없으면 gateway 기동 실패」 명시. 생성자 오버로드 정리는 하지 않음(선택 사항).
- r2 검증(임시 `.env`, 끝나고 삭제): (1) `.env.example` 복사본으로 `up -d --build web` → /health 200, `down` 성공. (2) `--profile api` + 빈 값 → gateway `IllegalStateException(PLATFORM_API_KEY ...)` 로 종료, web /health 200(/api/health 는 gateway 없어 502). (3) 임시 랜덤 값 → 경로표 재실행: 허용 3개 GET 200, POST·work-manager·tickets·services 프록시·`//api/tickets` 전부 403 (기존 표와 동일). `git diff --check` 이상 없음, `down` 후 `.env` 삭제 확인.
- r2 **통과 → finished** (PM, 2026-11-21) — `docs/reviews/REV-TKT-222-r2.md`.
