# 공개 사이트 배포 번들

공개 경로의 기본안은 D-011에 따른 **Cloudflare Pages + Cloudflare Tunnel** 하이브리드다. Vue 정적 산출물은 Pages가 서빙하고, Pages Function의 `/api/*` 요청만 Tunnel을 통해 `gateway:8080`으로 전달한다. 호스트의 80/443 포트와 집 공인 IP는 공개하지 않는다.

여행 기간의 우선 공개 경로는 GitHub Pages다. Cloudflare 계정 구성을 기다리지 않고 <https://lim-it-err.github.io/workaround.co.kr-platform/>에 정적 프런트를 배포하며, Cloudflare 구성은 후속 대표 도메인 작업으로 유지한다.

## 구성

- `.github/workflows/deploy-github-pages.yml`: `main` push·수동 실행용 GitHub Pages 빌드/배포
- `prepare-github-pages.mjs`: project base 정적 자산 검증, SPA `404.html`, `.nojekyll`, 배포 메타데이터 생성
- `build-pages.ps1`: `frontend`를 빌드하고 Pages 라우트 파일을 `frontend/dist`에 복사
- `deploy-pages.ps1`: Wrangler로 Pages 산출물과 Function을 배포
- `pages/functions/api/[[path]].js`: 고정된 `API_ORIGIN`으로만 전달하는 `/api/*` 프록시
- `pages/_routes.json`: Function 실행 범위를 `/api/*`로 제한
- `docker-compose.public-site.yml`: `tunnel`, `local`, `caddy` 프로필
- `Caddyfile.local`, `Caddyfile`: 로컬/내부 개발 및 레거시 자가 호스팅용 Caddy 구성
- `update-cloudflare-dns.ps1`: 레거시 Caddy 공개 방식을 위한 DDNS 도구

## GitHub Pages 여행 우선 경로

워크플로는 기본 Cloudflare 빌드 계약(`/`)을 바꾸지 않고 GitHub Pages 빌드에만 `/workaround.co.kr-platform/` base를 주입한다.

```text
npm --prefix frontend ci
npm --prefix frontend run build -- --base=/workaround.co.kr-platform/
node infra/public-site/prepare-github-pages.mjs --dist frontend/dist --base /workaround.co.kr-platform/ --sha local
```

준비 스크립트는 `index.html`의 JS/CSS/assets/manifest/icon 로컬 참조가 project base 아래에 있고 실제 파일이 존재하는지 검사한다. 이어서 아래 파일을 산출한다.

- `404.html`: GitHub Pages의 SPA 새로고침 fallback
- `.nojekyll`: 산출물을 Jekyll 변환 없이 그대로 제공
- `deployment.json`: 배포 commit SHA, UTC 빌드 시각, base 경로

자동 배포는 `main` push에서 실행된다. 수동 재배포는 GitHub **Actions → Deploy GitHub Pages → Run workflow**에서 `main`을 선택하거나 GitHub CLI로 실행한다.

```text
gh workflow run deploy-github-pages.yml --ref main
```

최초 1회 repository **Settings → Pages → Build and deployment → Source**를 `GitHub Actions`로 선택해야 한다. 워크플로가 끝나면 `github-pages` environment URL, 실행 요약의 commit SHA, 공개 산출물의 `deployment.json`을 함께 확인한다.

Line V는 공개 첫 화면에서 `Line V / Voyage`를 선택하고, Blog 글쓰기는 `Blog District → Writing Studio`로 들어간다. 현재 기록은 같은 브라우저의 localStorage에만 저장된다. project base 내부 이동과 직접 진입의 프런트 라우팅 정합은 TKT-DRAFT-0338의 완료 후 통합 검증한다.

## 요청 경로

```text
Browser -> Cloudflare Pages -> static frontend/dist
                           `-> /api/* -> Pages Function
                                          -> https://api-origin.workaround.co.kr
                                          -> Cloudflare Tunnel
                                          -> gateway:8080
```

Tunnel compose 네트워크에서는 `cloudflared`만 `gateway:8080`에 접근한다. `gateway`, Ollama, 기타 서비스는 호스트 포트로 publish하지 않는다. API 원점 장애 시 Function은 정적 사이트를 건드리지 않고 해당 요청에만 `503` JSON을 반환한다.

## Pages 빌드와 배포

로컬/CI 빌드 기준값은 다음과 같다.

| 항목 | 값 |
| --- | --- |
| 루트 디렉터리 | 저장소 루트 |
| 빌드 명령 | `npm --prefix frontend run build` |
| 출력 디렉터리 | `frontend/dist` |
| Function 소스 | `infra/public-site/pages/functions` |
| 환경 변수 | `API_ORIGIN=https://api-origin.workaround.co.kr` |

직접 업로드는 PowerShell 7에서 실행한다.

```text
cd infra/public-site
./build-pages.ps1
$env:CLOUDFLARE_PAGES_PROJECT='workaround-co-kr'
$env:CLOUDFLARE_PAGES_BRANCH='main'
./deploy-pages.ps1
```

`deploy-pages.ps1 -DryRun`은 빌드 산출물과 배포 인자를 확인하되 Cloudflare에 쓰지 않는다. 실제 배포에는 `npx`, Wrangler 로그인 또는 `CLOUDFLARE_API_TOKEN`, 기존 Pages 프로젝트 권한이 필요하다.

Function 디렉터리가 저장소 루트의 `/functions`가 아니므로 `deploy-pages.ps1`은 `pages/`에서 Wrangler를 실행한다. Pages 프로젝트는 이 배포 방식에 맞는 Direct Upload 프로젝트로 만들고, 나중에 Git integration으로 바꾸려면 새 프로젝트가 필요하다는 Cloudflare 제약을 PO가 먼저 확인한다. 사용자 입력이나 요청 헤더로 `API_ORIGIN`을 바꿀 수 없게 유지한다.

## Tunnel 기동

1. Cloudflare Zero Trust에서 named Tunnel을 만든다.
2. Public Hostname `api-origin.workaround.co.kr`의 service를 `http://gateway:8080`으로 지정한다.
3. `.env.public-site.example`을 `.env.public-site`로 복사하고 `PLATFORM_API_KEY`, `CLOUDFLARE_TUNNEL_TOKEN`을 운영 secret으로 주입한다.
4. 다음 명령으로 기동한다.

```text
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile tunnel up -d --build
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile tunnel ps
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile tunnel logs --tail 100 cloudflared
```

`tunnel` 프로필은 인바운드 `ports`를 선언하지 않는다. 토큰, Pages API 원점 변수, `PLATFORM_API_KEY`는 Git에 넣지 않는다.

계정 인증 없이 로컬 이미지/컨테이너 게이트만 확인할 때는 gateway 기동과 cloudflared 바이너리 실행을 분리한다.

```text
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile tunnel up -d --build gateway
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile tunnel run --rm --entrypoint cloudflared cloudflared --version
```

기본 compose는 gateway 포트를 공개하지 않으므로 `docker compose ps`와 gateway 로그로 기동 상태를 확인한다.

## PO 계정 단계

1. `workaround.co.kr`, `workaround.kr` zone을 Cloudflare에 연결한다.
2. Pages Direct Upload 프로젝트를 만들고 대표 도메인을 `workaround.co.kr`로 연결한다.
3. `workaround.kr`과 `www.*`를 대표 도메인으로 리다이렉트한다.
4. Pages production 환경 변수 `API_ORIGIN`을 위의 고정 HTTPS 원점으로 설정한다.
5. named Tunnel과 `api-origin.workaround.co.kr -> http://gateway:8080` public hostname을 만든다.
6. Tunnel 토큰과 플랫폼 API 키를 배포 호스트의 secret store에 넣는다.
7. `/`, `/api/health`, 대표 도메인 리다이렉트, API 장애 시 정적 사이트 생존을 확인한다.

Pages 실배포와 Tunnel 계정 인증은 PO 계정 단계다. 하이브리드 경로에는 Origin CA 인증서, 공유기 80/443 포워딩, 공인 IPv4 DDNS가 필요하지 않다.

## 사전 점검

```text
./preflight.ps1 -Profile tunnel -EnvFile .env.public-site
./preflight.ps1 -Profile tunnel -EnvFile .env.public-site -AsJson
```

`preflight.ps1`는 secret 값을 출력하지 않고 필수 키 존재 여부, Docker/Compose, daemon 상태를 확인한다.

## Caddy 로컬/레거시 경로

Caddy 구성은 삭제하지 않고 로컬/내부 개발 및 롤백 자산으로 유지한다.

```text
# 실 DNS/인증서 없이 127.0.0.1:8088에서 Host 헤더 검증
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile local up -d --build

# 레거시 Origin CA + 호스트 80/443 방식(기본 공개안 아님)
docker compose --env-file .env.public-site -f docker-compose.public-site.yml --profile caddy up -d --build
```

`caddy` 프로필에만 Origin CA 파일, 80/443 포워딩, DDNS가 필요하다. `update-cloudflare-dns.ps1`와 `verify-public-site.ps1`도 이 레거시 경로에서만 사용한다.

## 롤백

- Pages 배포 문제: Cloudflare Pages에서 직전 deployment로 롤백한다.
- API 문제: Pages는 유지하고 Tunnel 또는 `API_ORIGIN`을 직전 설정으로 되돌린다.
- Tunnel 종료: `docker compose ... --profile tunnel down`을 실행한다.
- Caddy 임시 대체는 보안/포트 조건을 다시 검토한 뒤 `caddy` 프로필로만 수행한다.
