문서 상태: 작성완료

# 네트워크 정책

## 로컬 기본 형태

MVP 스택은 Docker Compose 기반 로컬 개발을 기본으로 한다.

- `frontend`
- `gateway`
- `redis`
- `sample-spring-service`
- `ion2-worker`
- `elevator-service`

외부 RTX5070 Ollama 서버는 기본 compose 스택에 포함하지 않는다.

## HTTP 우선

서비스 간 통신은 기본적으로 HTTP 를 사용한다.

```text
frontend -> gateway -> services
worker -> gateway or services
worker -> external Ollama
```

- `v0.2.0` 에서는 `sample-spring-service` 와 기본 포털 연결을 확인한다.
- `v0.3.0` 에서는 `elevator-service` 가 23층, 4대 실시간 군집 제어 상태를 제공한다.
- `v0.4.0` 에서는 같은 포털 안의 Work Manager 조회/명령 경로를 확장한다.

## 공개 사이트 진입점

공개 도메인 진입점은 로컬 프리뷰와 분리한다.

```text
Internet -> Cloudflare proxy -> Caddy (80/443)
                              |- /arcade/* -> Caddy static files
                              |- /api/*    -> gateway:8080
                              `- /*        -> public-site:8010
```

- `workaround.co.kr`: 대표 도메인
- `workaround.kr`: 대표 도메인으로 리다이렉트
- `www.*`: 대표 도메인으로 리다이렉트

공개 ingress의 실행 기준선은 `infra/public-site/docker-compose.public-site.yml --profile cloudflare` 이다. 실제 DNS와 인증서 없이 검증할 때는 `--profile local` 을 사용하고 `Host` 헤더로 두 도메인의 라우팅과 리다이렉트를 확인한다.

### Cloudflare 프록시와 오리진 TLS

| 방식 | 장점 | 제약 |
| --- | --- | --- |
| Cloudflare Origin CA 인증서 + `Full (strict)` | stock Caddy 이미지로 동작하고 HTTP 챌린지 노출이 필요 없다. Cloudflare와 오리진 사이도 인증서를 검증한다. | 브라우저가 오리진에 직접 접속하면 Origin CA를 신뢰하지 않는다. zone별 인증서/키를 안전하게 배치해야 한다. |
| 공개 CA 인증서 + `Full (strict)` | Cloudflare 우회 직접 접속에서도 일반 브라우저가 인증서를 신뢰한다. | 프록시가 켜진 상태의 Caddy 자동 ACME는 DNS-01이 필요하다. Cloudflare DNS 모듈을 포함한 Caddy 커스텀 이미지와 최소 권한 API 토큰 운영이 추가된다. |

현재 권고는 **Cloudflare Origin CA 인증서 + `Full (strict)`** 이다. `workaround.co.kr` 과 `workaround.kr` 은 서로 다른 zone이므로 각 zone의 apex와 `www`를 포함한 인증서/키를 따로 발급한다. 실제 파일은 `infra/public-site/secrets/` 또는 호스트의 별도 비밀 경로에 두고 Git에 추가하지 않는다.

Caddy 자동 ACME가 필요해지면 stock 이미지에서 임의로 HTTP-01을 시도하지 않는다. `caddy-dns/cloudflare` 모듈을 포함한 검증된 이미지로 전환하고, Cloudflare API 토큰을 런타임 secret으로 주입해 DNS-01 챌린지를 사용한다.

### PO 수작업 체크리스트

1. 두 도메인의 네임서버를 Cloudflare가 제시한 값으로 이전하고 전파를 확인한다.
2. 각 zone의 apex A 레코드를 오리진 공인 IPv4로 만들고 프록시를 `ON`으로 둔다. `www`는 같은 대상의 CNAME 또는 동등한 프록시 레코드로 둔다.
3. 공유기/NAT에서 TCP 80, 443을 오리진 호스트로 포워딩하고 호스트 방화벽도 같은 포트만 허용한다.
4. 각 zone에서 Origin CA 인증서를 발급해 Caddy 호스트에 배치하고 Cloudflare SSL/TLS 모드를 `Full (strict)`로 설정한다.
5. 유동 IP 갱신용 API 토큰을 두 zone의 `Zone / DNS / Edit` 최소 권한으로 발급한다. 토큰과 zone ID는 저장소가 아닌 환경 변수 또는 secret store에 둔다.
6. 공개 전 `PLATFORM_API_KEY` 등 기본/예시 비밀값을 운영값으로 교체하고 `infra/public-site/verify-public-site.ps1`로 TLS와 리다이렉트 증거를 수집한다.

### 유동 IPv4 갱신

`infra/public-site/update-cloudflare-dns.ps1` 는 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID_CO_KR`, `CLOUDFLARE_ZONE_ID_KR` 환경 변수로 두 apex A 레코드를 생성 또는 갱신하고 프록시를 켠다. `PUBLIC_IPV4`가 없으면 외부 조회로 현재 IPv4를 얻는다. 토큰에는 DNS 편집 이외 권한을 주지 않고 로그에도 남기지 않는다.

공개 경로는 D-009를 따른다. Caddy는 `/api/*`를 gateway로만 전달하고 RTX5070 Ollama의 주소나 포트를 직접 공개하지 않는다.

## 게이트웨이 라우팅

서브서비스는 기본적으로 아래 경로로 노출한다.

```text
/api/services/{serviceId}/**
```

예:

```text
GET /api/services/elevator-service/api/state
```

위 경로는 게이트웨이가 `elevator-service` 의 `/api/state` 로 전달한다.

## elevator-service 프록시 계약

`v0.3.0` 기준 프론트는 아래 프록시 경로를 사용한다.

```text
GET  /api/services/elevator-service/api/state
POST /api/services/elevator-service/api/passenger
POST /api/services/elevator-service/api/demand
POST /api/services/elevator-service/api/call
POST /api/services/elevator-service/api/step
POST /api/services/elevator-service/api/reset
```

- `POST /api/passenger`: 승객 1명을 생성한다. hall call 1건이 아니라 `originFloor`, `destinationFloor`, `direction` 을 가진 사람 1명이다.
- `POST /api/demand`: `quiet`, `normal`, `busy` 프리셋과 `0..100` 강도를 갱신한다.
- `POST /api/call`: 기존 프록시를 깨지 않기 위한 레거시 호환 경로다. 내부적으로는 승객 1명을 만든다.
- `POST /api/step`: 자동 루프가 기본인 현재 모델에서 디버그/개발용 보조 제어다.
- `GET /api/state`: `position`, `currentLoad`, `passengers[]`, `waitingPassengers[]`, `floorQueues[]`, `demand`, `summary` 를 포함한 스냅샷을 반환한다.

예시 payload:

```json
{
  "floor": 12,
  "direction": "down"
}
```

## 메타 조회 경로

게이트웨이는 아래 메타 경로도 제공할 수 있다.

```text
/api/services
/api/health
/api/runtime
/api/work-manager/board
```

- `/api/runtime`: 노드 타깃, offload 규칙, Ollama 저하 정책 descriptor
- `/api/work-manager/board`: `docs/tickets/board.md` 와 티켓 파일을 읽어 `backlog`, `started`, `need_review`, `finished` 컬럼 데이터와 보조 feed 를 조합한 조회 경로
- `POST /api/work-manager/auth`: 공유 비밀번호 검증 후 짧은 세션 토큰 발급
- `POST /api/work-manager/tickets/{ticketId}/transition`, `POST /api/work-manager/commands`: `X-Work-Manager-Token` 이 있을 때만 허용

## 외부 Ollama

Ollama 는 환경 변수로 설정한다.

```text
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

기본값은 같은 Windows 호스트의 Ollama 를 Docker Compose 컨테이너에서 본다는 전제다.
별도 RTX5070 장비를 쓰면 고정 IP 또는 별도 호스트명으로 바꾼다.

Ollama 가 내려가 있어도 플랫폼 전체가 죽으면 안 된다.
이 경우 헬스 상태는 `degraded` 또는 `unavailable` 로 표현한다.

## 비밀값

실제 비밀값은 커밋하지 않는다.
`.env.example` 같은 예시 파일만 저장한다.
