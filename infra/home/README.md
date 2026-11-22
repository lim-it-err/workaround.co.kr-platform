# 집 PC(.100) 웹 — Docker Compose + Cloudflare Tunnel

`.100`(Windows + Docker Desktop/WSL2)에서 메인 사이트와 Advisor 를 직접 서빙하고, Cloudflare Tunnel 로 바깥 도메인에 내보낸다. 공개 포트는 열지 않는다(터널은 아웃바운드 연결만). 근거: `docs/decisions.md` D-037.

## 구성

| 서비스 | 역할 | 기본 |
|---|---|---|
| `web` | Caddy 가 정적 사이트(`/`)와 Advisor(`/advisor/`)를 서빙, SPA 폴백, `/health`, `/api/*` → `gateway:8080`. `127.0.0.1:8090` 에만 바인드 | 켜짐 |
| `gateway` | 기존 `gateway/` 빌드. `/api/*` 대상 | 꺼짐 (`--profile api`) |
| `cloudflared` | 터널 커넥터 (이미지 태그 고정) | 꺼짐 (`--profile tunnel`) |

gateway 가 꺼져 있으면 허용된 `/api` 경로는 502 이고, 화면은 정적 폴백으로 동작한다.

### `/api` 공개 범위 (TKT-222)

Caddy 는 `GET`·`HEAD` 의 `/api/health`·`/api/services`·`/api/runtime` 만 게이트웨이로 보내고, 나머지 `/api/*`(모든 POST, `work-manager`, `tickets`, `services/{id}/**` 프록시)는 **403** 이다. Work Manager·티켓 API 가 필요해지면 Cloudflare Access 뒤 별도 호스트로 분리한다(이번 범위 밖). `api` 프로필을 켜기 전에 `.env` 의 `PLATFORM_API_KEY`·`WORK_MANAGER_PASSWORD_SHA256` 두 값이 필수이며, 없으면 gateway 컨테이너만 기동 실패한다(web 은 그대로 산다). 게이트웨이는 `APP_ENV=home` 에서 기본 키·기본 해시면 시작 단계에서 실패한다. `X-Forwarded-For` 는 web 컨테이너 고정 IP(`172.31.80.10`)가 보낸 것만 신뢰한다. lab 실시간 API 는 이 구성 밖이다.

## 사전조건

- Docker Desktop(WSL2 백엔드)이 떠 있고 `docker compose version` 이 동작한다.
- 저장소가 `.100` 에 clone 되어 있다. 이 폴더(`infra/home`)에서 명령을 실행한다.

## 1. `.env` 만들기

PowerShell:

```powershell
cd infra\home
Copy-Item .env.example .env
```

bash:

```bash
cd infra/home && cp .env.example .env
```

터널 없이 로컬 확인만 하면 `.env` 를 손대지 않아도 된다. `TUNNEL_TOKEN` 은 `.env` 에만 넣고 어디에도 커밋하지 않는다(`.gitignore` 에 `infra/home/.env`).

## 2. 올리기

```
docker compose up -d --build
```

(PowerShell·bash 동일.) 첫 빌드는 npm 설치 때문에 몇 분 걸린다. API 까지 켜려면 `docker compose --profile api up -d --build`.

### 빌드 — 정적 모드와 버전 (TKT-223)

web 이미지의 메인 프런트는 base 가 `/` 인데도 **`VITE_STATIC_MODE=true` 로 빌드**한다. 앞 화면은 base 가 `/` 면 라이브 모드(`/api/*` 호출)로 켜지는데, 기본 구성에는 게이트웨이가 없어 Caddy 가 403·502 만 돌려주기 때문이다. 정적 모드로 빌드하면 GitHub Pages 와 같은 화면이 된다(게이트웨이를 화면에 연결하는 일은 별도 결정). 블로그 스위치가 닫혀 있으면 이미지 빌드 중 `mockups/` 의 블로그 목업도 Pages 처럼 지운다.

부팅 로그의 버전은 저장소 루트 `VERSION` 파일에서 자동으로 읽는다(버전 올리기는 `VERSION` 한 곳). `.env` 의 `RELEASE_VERSION` 은 덮어쓸 때만 넣고, 바꾼 뒤에는 `docker compose build web` 으로 다시 빌드한다. `VERSION` 도 없으면 「workaround 기동」만 나온다.

## 3. 상태 확인

PowerShell:

```powershell
docker compose ps
curl.exe http://127.0.0.1:8090/health        # ok
curl.exe -I http://127.0.0.1:8090/advisor/today
```

bash:

```bash
docker compose ps
curl http://127.0.0.1:8090/health            # ok
curl -I http://127.0.0.1:8090/advisor/today
```

`web` 이 `healthy` 이면 정상이다. 브라우저에서 `http://127.0.0.1:8090/` 를 연다.

## 4. 업데이트

```
git pull
docker compose up -d --build
```

## 5. 터널 켜기

### PO 가 Cloudflare 쪽에서 할 일 (1회)

1. Cloudflare Zero Trust > Networks > Tunnels 에서 터널을 만든다(커넥터 유형: Docker).
2. 화면에 나온 토큰을 `infra/home/.env` 의 `TUNNEL_TOKEN=` 뒤에 붙인다.
3. 같은 터널의 **Public Hostname** 에 공개할 호스트명을 추가하고 서비스를 `http://web:80` 으로 지정한다. (`web` 은 compose 네트워크 안의 이름이다.)

### 켜기

```
docker compose --profile tunnel up -d
```

API 도 함께: `docker compose --profile api --profile tunnel up -d`. 터널 로그는 `docker compose logs -f cloudflared` 로 본다. 끌 때는 `docker compose --profile tunnel down`.

## 알아둘 점

- **`.100` 이 꺼지거나 Docker 가 내려가면 이 주소의 사이트는 내려간다.** 비상 주소는 GitHub Pages(`https://lim-it-err.github.io/workaround.co.kr-platform/`)이고 그대로 배포된다(`.github/workflows/deploy-github-pages.yml`).
- 공개 제외 경로(블로그 닫힘·`/runtime`·`/ets2/dev` 등)는 이 구성에서 따로 막지 않고 앱의 SPA 라우팅이 처리한다. Pages 배포의 경로 규칙은 `infra/public-site/route-rules.mjs` 가 정본이다.
- 호스트 포트는 루프백에만 열린다. LAN 에서 직접 접속할 수는 없다.
