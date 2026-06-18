# 공개 사이트 배포 번들

`workaround.co.kr` 와 `workaround.kr` 공개 사이트용 Docker 배포 기준선이다.

## 구성

- `docker-compose.public-site.yml`: 공개 사이트 서비스와 Caddy reverse proxy
- `Caddyfile`: TLS, canonical domain, alias redirect 정책
- `.env.public-site.example`: 운영자가 채울 환경 변수 예시

## 현재 기본 정책

- 대표 도메인: `workaround.co.kr`
- 보조 도메인: `workaround.kr`
- `www.workaround.co.kr`, `www.workaround.kr` 은 모두 대표 도메인으로 리다이렉트
- TLS 는 Caddy 자동 인증서 발급을 기본값으로 둔다.

## DNS 체크리스트

1. `workaround.co.kr` A 또는 AAAA 레코드가 공개 서버 IP 를 가리키는지 확인한다.
2. `workaround.kr` 도 같은 서버 IP 를 가리키게 맞춘다.
3. `www.workaround.co.kr`, `www.workaround.kr` 도 같은 서버 IP 또는 CNAME 정책으로 맞춘다.
4. 기존 레코드와 TTL 을 캡처해 롤백 기준을 남긴다.
5. DNS 관리 주체와 콘솔 접근 방법을 기록한다.

## 서버 체크리스트

1. 80, 443 포트가 공개되어 있는지 확인한다.
2. Docker 와 Docker Compose plugin 이 설치되어 있는지 확인한다.
3. 방화벽과 클라우드 보안 그룹에서 80, 443 을 허용한다.
4. 서버에 이 저장소를 배포할 경로를 정한다.

## 배포 전 preflight

아래 스크립트로 env 파일, Docker, 80/443 포트 상태를 먼저 확인한다.

```text
powershell -ExecutionPolicy Bypass -File preflight.ps1 -EnvFile .env.public-site
```

옵션:

- `-AsJson`: 자동화용 JSON 출력
- `-CheckDns`: 현재 머신에서 DNS resolve 까지 같이 확인

## 배포

```text
cd infra/public-site
copy .env.public-site.example .env.public-site
docker compose --env-file .env.public-site -f docker-compose.public-site.yml up -d --build
```

## 수동 검증

```text
curl http://127.0.0.1:8010/health
curl -I http://workaround.kr
curl -I https://workaround.co.kr
```

PowerShell 증거 수집:

```text
powershell -ExecutionPolicy Bypass -File verify-public-site.ps1
```

확인 포인트:

- `/health` 가 200 이다.
- `http://workaround.kr` 이 `https://workaround.co.kr` 로 301/308 리다이렉트된다.
- `https://workaround.co.kr` 가 소개 페이지 HTML 을 반환한다.

## 롤백

1. 기존 배포가 있으면 직전 compose 파일과 `.env.public-site` 백업을 유지한다.
2. 문제 발생 시 아래 명령으로 현재 번들을 내린다.

```text
docker compose --env-file .env.public-site -f docker-compose.public-site.yml down
```

3. 직전 compose 또는 기존 정적 호스팅 설정으로 되돌린다.
4. DNS 를 이미 변경했다면 이전 레코드로 복원한다.

## 운영 메모

- 공개 사이트는 소개 페이지용 정적 서비스다.
- 내부 플랫폼 프리뷰(`localhost:7000`)나 gateway 라우팅 정책과 직접 섞지 않는다.
- 실제 서버 OS, SSH 접근 방식, DNS 콘솔 정보가 확보되면 그때 실배포 체크 결과를 `docs/history/` 에 추가한다.
- 배포 전에는 `preflight.ps1`, 배포 후에는 `verify-public-site.ps1` 결과를 함께 남기면 다음 검토자가 증거를 재사용하기 쉽다.
