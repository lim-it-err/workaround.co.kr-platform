# TKT-085

## 메타데이터
- 제목: 도메인 공개 준비 — Cloudflare 프록시 + Caddy 연동
- 우선순위: P1 / 상태: `blocked` / 문서 상태: 작성완료
- 담당: `[INFRA]` / scope: `infra/**`, `docs/network.md`(절차 절 추가)
- 근거: D-009, U-15 (방문자에게 집 IP 은닉)

## 목표
workaround.co.kr / workaround.kr 을 Cloudflare 프록시 뒤에서 자가 서버(Caddy)로 서빙할 준비를 마친다.

## 작업 내용
1. `infra/` 에 공개 배포 구성 초안: Caddyfile(두 도메인, kr→co.kr 리다이렉트, `/arcade/*` 정적, `/api/*` → gateway) + compose 프로필
2. **Cloudflare 프록시 모드 전제 정리**: 오리진 TLS 는 Cloudflare Origin Cert 또는 Full(strict) 중 택1 — 비교표와 권고를 `docs/network.md` 에 기록 (Caddy 자동 ACME 는 프록시 뒤에서 DNS 챌린지 필요 — 방법 병기)
3. 유동 IP 대비: Cloudflare API 로 A 레코드 갱신하는 스크립트 초안 (토큰은 환경변수)
4. **PO 수작업 체크리스트** 산출(문서): 네임서버 이전 → A 레코드(프록시 ON) → 공유기 80/443 포워딩 → API 토큰 발급
## 완료 게이트
- 로컬 compose 로 Caddy 기동, host 헤더로 두 도메인 라우팅 curl 검증 (실 DNS 없이)
- 비밀값 저장소 미포함 확인

## 구현 결과 (2026-08-17, codex-2)

- `infra/public-site/docker-compose.public-site.yml` 에 `local`, `cloudflare` 프로필을 분리했다.
- 공개 Caddy 구성에 두 zone의 Origin CA TLS, `workaround.kr` canonical redirect, `/api/*` gateway 프록시, `/arcade/*` 정적 라우트를 반영했다.
- `Caddyfile.local` 로 실제 DNS·인증서 없이 `127.0.0.1:8088` Host 헤더 검증 경로를 추가했다.
- `update-cloudflare-dns.ps1` 로 두 zone apex A 레코드의 proxied upsert 초안을 추가했다. 토큰과 zone ID는 환경 변수로만 받는다.
- `docs/network.md` 에 TLS 비교/권고, DNS-01 대안, PO 수작업 체크리스트, DDNS 운영 경계를 기록했다.
- `.gitignore` 에 공개 배포 env와 Origin CA secret 디렉터리를 추가했다.

## 검증 기록

- `docker compose ... --profile local config`: 통과
- `docker compose ... --profile cloudflare config`: 통과
- JDK 21 고정 `mvn -q package`: 통과 (`Tests run: 7, Failures: 0, Errors: 0`)
- `git diff --check`: 통과
- Docker Desktop/daemon 기동 확인: Server `24.0.2`
- 로컬 compose 실제 기동: **미완료**. `caddy:2.9-alpine` pull이 두 차례 모두 출력 없이 장시간 정지해 중단했다. 따라서 Host 헤더 curl 4종은 아직 실행하지 못했다.
- 2026-08-17 04:39 KST 재시도: Docker daemon `24.0.2` 정상, 호스트에서 Docker Hub registry endpoint는 HTTP `401`로 도달했지만 `docker pull caddy:2.9-alpine`은 약 50초 동안 출력/진행 없이 다시 정지했다. pull을 중단했고 Caddy 이미지는 생성되지 않았다.

## 질문/결정 기록

- 결정: 오리진 TLS는 Cloudflare Origin CA 인증서 + Cloudflare `Full (strict)` 조합을 권고한다. 서로 다른 두 zone의 인증서/키를 분리한다.
- 결정: 공개 Caddy는 Ollama를 직접 라우팅하지 않고 `/api/*`를 gateway로만 전달한다(D-009).
- 차단 해제 조건: Docker registry에서 `caddy:2.9-alpine` pull이 가능한 환경에서 README의 `--profile local` 기동과 Host 헤더 curl을 재실행한다.
- PM 질문: 다음 실행에서 registry 접근이 복구되면 동일 게이트를 재시도해도 되는가? 구현 범위 변경은 필요 없다.
- 재시도 메모: 호스트 HTTPS 연결 자체는 정상이므로 Docker Desktop engine의 image pull 경로/credential/network 상태 확인이 필요하다. 실행 중인 타 작업 컨테이너가 있어 Docker Desktop 강제 재시작은 수행하지 않았다.


## 방향 갱신 (D-011 확정, 2026-08-18 — PO "채택")

기존 "자가서버 Caddy 공개 ingress" 구성을 **Pages+Tunnel 하이브리드**로 전환:
1. 프론트 빌드 산출물의 Cloudflare Pages 배포 구성(빌드 명령·출력 경로) 문서화 + 스크립트
2. `cloudflared` Tunnel 컨테이너를 compose 에 추가 — gateway 로만 연결 (인바운드 포트 개방 없음)
3. `/api/*` 프록시: Pages Function(또는 apex Worker) 코드
4. 기존 Caddy 구성은 로컬/내부 개발용으로 강등 (삭제 금지 — 재활용)
5. **완료 게이트 축소**: 도커 게이트는 cloudflared+gateway 기동 확인만. Pages 실배포·Tunnel 인증은 PO 계정 단계(체크리스트 산출). 부관 TLS 보고서의 Origin CA 절차는 하이브리드에선 불필요해짐을 명기.
