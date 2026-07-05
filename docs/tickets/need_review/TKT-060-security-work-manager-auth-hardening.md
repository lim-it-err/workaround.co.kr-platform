문서 상태: 작성완료

# TKT-060

## 메타데이터

- 제목: Work Manager 인증 하드닝 (토큰 유출/잠금 우회/해시 비교)
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `need_review`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-060-work-manager-auth-hardening`

## 목표

Work Manager 인증 경로의 세 가지 보안 결함을 닫아, 공개 호스팅 전에 익명 권한 상승과 잠금 우회를 막는다. 이 티켓은 공개 호스팅을 여는 보안 hotfix 다.

## 작업 내용

1. [CRITICAL SECURITY] 세션 토큰이 공개 activity feed 로 유출되고 평문으로 저장되는 문제 (#1)
   - `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java:506-512` 의 `authenticateWorkManager` 가 방금 발급한 세션 토큰을 `recordWorkManagerFeed(...)` 의 runId 인자로 그대로 넘긴다. 토큰을 feed/audit item 어디에도 넣지 않는다.
   - `workManagerFeedItem` (`gateway/.../PlatformGatewayApplication.java:1666-1685`) 은 runId 를 응답 payload 에 그대로 담는다. runId 는 토큰과 무관한 랜덤 opaque 식별자(예: 별도 `UUID.randomUUID()`)로 생성한다.
   - 공개 `GET /board` 가 activityFeed 를 반환하는 경로(`gateway/.../PlatformGatewayApplication.java:908`, feed 구성 `:93-96`)로 익명 poller 가 runId 를 읽는다.
   - 실행성 POST 는 토큰만 확인하고 비밀번호 재확인이 없다(`gateway/.../PlatformGatewayApplication.java:105-129`).
   - 저장 파일에 평문 토큰이 남는다(`gateway/data/work-manager-store.json:66`). 로드/세이브 시 토큰 필드를 scrub 한다.
   - 익스플로잇: 익명 board poller 가 runId 를 읽어 30분 TTL 동안 `X-Work-Manager-Token` 으로 replay -> 전체 실행 권한 획득.
   - 수정 방향: (a) 토큰을 feed/audit 어디에도 넣지 않는다, (b) feed runId 는 토큰과 분리된 랜덤 opaque 값, (c) 이미 저장된 store 의 토큰을 로드/세이브 시 제거(scrub)한다.

2. [MAJOR SECURITY] X-Forwarded-For 스푸핑으로 잠금 우회 (#5)
   - `resolveRemoteAddress` (`gateway/.../PlatformGatewayApplication.java:207-215`) 가 `X-Forwarded-For` 헤더를 무조건 신뢰해 첫 값을 클라이언트 IP 로 쓴다.
   - 실패 시도 버킷이 이 값으로 keyed 된다(`gateway/.../PlatformGatewayApplication.java:481-497`). 공격자가 XFF 를 매 요청마다 회전시키면 매번 새 버킷이 생겨 5-strike 잠금이 절대 발동하지 않는다. TKT-033 잠금이 무력화된다.
   - 기본 비밀번호 `xptmxldxptmxld`(QWERTY 에서 "테스트테스트")가 약하다.
   - 수정 방향: XFF 는 설정된 신뢰 프록시에서 온 경우에만 신뢰하고, 아니면 `request.getRemoteAddr()` 를 쓴다. 추가로 전역 backstop(모든 출처 합산 실패 상한 또는 전역 잠금)을 둔다.

3. [MINOR] 비밀번호 해시 비교가 hex 대소문자에 취약 (#13)
   - `matchesWorkManagerPassword` (`gateway/.../PlatformGatewayApplication.java:1867-1875`) 가 hex 문자열 바이트를 `MessageDigest.isEqual` 로 비교한다.
   - `sha256Hex` (`gateway/.../PlatformGatewayApplication.java:1877-1889`) 는 소문자 `%02x` 로 인코딩하므로, 대문자로 설정된 해시는 절대 일치하지 않는다. 현재는 trim 만 하고 case-fold 하지 않는다.
   - 수정 방향: 비교 전 양쪽 hex 를 소문자로 정규화하거나, hex 대신 digest 바이트끼리 직접 비교한다.

## 범위

- 포함: 위 3개 결함의 게이트웨이 수정, 관련 테스트/설정, 기본 비밀번호 강화 반영
- 제외: 프론트엔드 토큰 만료 UX(TKT-061), 전이 매트릭스(TKT-062), 저장소 정합/감사 로그 구조(TKT-063), 동시성/테스트(TKT-064), mojibake 티켓 파일 복구(별도 chore)

## 완료 기준

- 발급된 세션 토큰이 `GET /board` 응답(activityFeed/audit)과 `work-manager-store.json` 어디에도 나타나지 않는다. (런타임 체크: token-leak replay 익스플로잇 재현 불가)
- feed runId 로 얻은 값을 `X-Work-Manager-Token` 으로 replay 하면 401 이 반환된다.
- XFF 헤더를 회전시키며 5회 이상 오답을 보내도, 신뢰 프록시가 아닌 출처에서는 잠금이 발동한다. (런타임 체크: XFF lockout bypass 재현 불가)
- 대문자로 설정한 SHA-256 해시로도 정상 로그인된다.
- 관련 테스트가 추가되고 `mvn -q -pl gateway test`(또는 저장소 표준 명령)가 통과한다.

## 선행 조건

- 없음. `chore` 이므로 버전 상한과 무관하게 `진행 가능` 하다. 단 이 수정 완료는 공개 호스팅 승인의 선행 조건이다.

## 질문/결정 기록

- 결정(2026-07-05, QA): #1 은 CRITICAL SECURITY 로, 공개 호스팅을 막는 최우선 항목이다.
- 열린 질문: 신뢰 프록시 목록을 어떤 설정 키로 둘지(환경변수/`application.yml`). 기본은 로컬 단일 호스트에서 XFF 미신뢰.
- 열린 질문: 기본 비밀번호 교체를 이 티켓에서 강제할지, 배포 선행 조건 문서로 넘길지. 기본은 강한 기본값으로 교체하고 배포 시 재설정 안내.

## 선행 읽기

- `README.md`
- `docs/ticket-policy.md` (게이트웨이 API 계약 + Work Manager 운영 경로)
- `docs/feature-definition.md` (`### 4. Work Manager` 섹션)
- `docs/tickets/finished/TKT-031-v0.4.0-work-manager-board-and-routing.md`
- `docs/tickets/finished/TKT-033-v0.4.0-command-password-gate-and-secret-handling.md`
- `docs/tickets/finished/TKT-034-v0.4.0-work-manager-activity-feed.md`

## 작업자 산출물

- 브랜치 이름: `codex/tkt-060-work-manager-auth-hardening`
- 토큰 유출 차단 방식 요약(feed `runId` 를 세션 토큰과 분리된 opaque 값으로 발급하고, 저장소 로드/세이브 시 token 계열 필드와 기존 unsafe `runId` 를 scrub 하도록 정리)
- XFF 신뢰 정책 요약(`WORK_MANAGER_TRUSTED_PROXIES` 에 등록한 프록시에서 온 요청만 `X-Forwarded-For` 를 신뢰하고, 그 외에는 `request.getRemoteAddr()` 기준 잠금 + 전역 실패 backstop 적용)
- 해시 비교 수정 요약(SHA-256 hex 문자열 비교를 digest 바이트 비교로 교체해 대문자 해시도 허용)
- 테스트/런타임 검증 결과
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-gateway-tests.ps1` 통과 (7 tests)
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1` 통과
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-docs-encoding.ps1` 통과

## 검토 메모

- `PlatformGatewayApplication` 에 신뢰 프록시 설정, 전역 auth backstop, opaque feed `runId`, persisted store scrub, hex digest byte 비교를 반영했다.
- `PlatformStoreWorkManagerTest` 에 토큰 replay 차단, 전역 잠금, 대문자 해시 허용, untrusted XFF 무시 케이스를 추가했다.
- `gateway/README.md`, `docs/ticket-policy.md` 에 deny-by-default 해시와 trusted proxy 운영 규칙을 반영했다.

## PR 준비 메모

- 제목: `[chore] harden Work Manager auth token handling and proxy lockout`
- 본문 요약: 공개 activity feed/store 에서 세션 토큰이 유출되던 경로를 차단하고, `X-Forwarded-For` 신뢰 범위를 설정 기반으로 제한했다. 추가로 전역 실패 backstop 과 대문자 SHA-256 해시 허용 테스트를 보강했다.
- 검증 체크리스트: `run-gateway-tests.ps1`, `run-frontend-build.ps1`, `check-docs-encoding.ps1`
- 미검증 항목: 없음

## Notes

- 오케스트레이터가 이 티켓을 가장 먼저 `ready` 로 승격한다. 공개 호스팅 전 최우선 순위다.
- #1 은 CRITICAL SECURITY(익명 권한 상승) 이므로 다른 Work Manager 티켓보다 앞선다.
- mojibake 티켓(TKT-031~034) 파일 복구는 이 티켓 범위가 아니라 별도 chore 다.