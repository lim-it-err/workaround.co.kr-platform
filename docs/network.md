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

공개 도메인 진입점은 D-011의 Pages+Tunnel 하이브리드를 기본으로 하며 로컬 프리뷰와 분리한다.

```text
Internet -> Cloudflare Pages -> frontend/dist
                            `-> /api/* -> Pages Function
                                           -> Cloudflare Tunnel
                                           -> gateway:8080
```

- `workaround.co.kr`: 대표 도메인
- `workaround.kr`: 대표 도메인으로 리다이렉트
- `www.*`: 대표 도메인으로 리다이렉트
- 정적 페이지는 API 원점 장애와 독립적으로 제공한다.
- Tunnel은 아웃바운드 연결만 만들며 호스트의 80/443과 gateway 포트를 publish하지 않는다.
- `/api/*`는 Pages Function이 고정 환경 변수 `API_ORIGIN`으로만 전달한다.

공개 API 원점의 실행 기준선은 `infra/public-site/docker-compose.public-site.yml --profile tunnel`이다. Pages 빌드·배포 명령과 산출물 경로는 `infra/public-site/README.md`를 따른다.

### Pages와 Tunnel 경계

| 구간 | 기준 |
| --- | --- |
| 브라우저 → Pages | Cloudflare가 정적 TLS와 CDN을 관리한다. |
| Pages Function → API 원점 | `https://api-origin.workaround.co.kr` 고정 원점만 허용한다. |
| Cloudflare edge → Tunnel | named Tunnel 자격 증명을 secret으로 주입한다. |
| cloudflared → gateway | compose 내부 `http://gateway:8080`만 사용한다. |

Pages Function은 hop-by-hop 헤더를 제거하고 API 응답 캐시를 금지한다. API 원점 오류는 `/api/*`의 `503`으로 격리하며 정적 Pages 배포에는 영향을 주지 않는다. 공개 경로는 D-009를 따라 gateway까지만 연결하고 RTX5070 Ollama 주소나 포트를 직접 공개하지 않는다.

하이브리드 기본 경로에는 Cloudflare Origin CA 인증서, 공유기 80/443 포워딩, 공인 IPv4 A 레코드 DDNS가 필요하지 않다. 기존 Caddy와 Origin CA 구성은 삭제하지 않고 로컬/내부 개발 및 비상 롤백 자산으로만 유지한다.

### PO 수작업 체크리스트

1. 두 도메인의 네임서버를 Cloudflare로 이전하고 전파를 확인한다.
2. Pages 프로젝트를 만들고 `workaround.co.kr`을 대표 도메인으로 연결한다.
3. `workaround.kr`과 `www.*`를 대표 도메인으로 리다이렉트한다.
4. Pages production 변수 `API_ORIGIN=https://api-origin.workaround.co.kr`을 설정한다.
5. named Tunnel을 만들고 public hostname을 `http://gateway:8080`에 연결한다.
6. Tunnel 토큰과 `PLATFORM_API_KEY`를 배포 호스트의 secret store에 주입한다.
7. Pages 정적 경로, `/api/health`, 대표 도메인 리다이렉트, API 장애 시 정적 사이트 생존을 검증한다.

### Caddy 로컬/레거시 경로

실 DNS와 인증서 없는 개발 검증은 `--profile local`로 `127.0.0.1:8088`에서 수행한다. 기존 Origin CA 기반 자가 호스팅은 `--profile caddy`로 남겨 두지만 기본 공개 경로가 아니다. 이 레거시 프로필에만 80/443 포워딩, Origin CA 파일, `update-cloudflare-dns.ps1`의 A 레코드 갱신이 필요하다.

실제 secret, Tunnel 토큰, API 토큰, zone ID는 저장소와 로그에 남기지 않는다.

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
