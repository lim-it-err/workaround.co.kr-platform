# 호스팅 선택지

## 현재 기본 선택

첫 공개 웹사이트는 사용자가 가진 서버 위에 Docker로 배포한다.

기본 방향:

- 대표 도메인: `workaround.co.kr`
- 보조 도메인: `workaround.kr`
- `workaround.kr` 은 `workaround.co.kr` 로 리다이렉트한다.
- 첫 화면은 플랫폼 소개 페이지다.
- reverse proxy 와 TLS 를 서버에서 운영한다.

## Docker 서버 배포

사용자가 가진 서버에서 컨테이너를 실행하고, 도메인 DNS 를 그 서버 IP로 연결하는 방식이다.

장점:

- 플랫폼 전체 구조와 잘 맞는다.
- 프런트엔드, 게이트웨이, 서비스, 워커를 같은 운영 방식으로 확장하기 쉽다.
- 나중에 서브서비스를 붙이기 좋다.

주의할 점:

- 서버 보안, 방화벽, TLS 인증서 갱신을 직접 관리해야 한다.
- 장애가 나면 직접 확인해야 한다.
- 공개 포트와 reverse proxy 설정이 필요하다.

현재 저장소 기준 첫 배포 번들은 `infra/public-site/` 아래에 둔다. reverse proxy 는 TLS 자동 갱신 부담을 줄이기 위해 Caddy 를 기본값으로 사용한다.

### reverse proxy 기본 선택

- 기본: Caddy
- 이유:
  - 도메인 canonical redirect 와 TLS 자동 발급을 한 파일에서 단순하게 유지하기 쉽다.
  - 첫 공개 소개 페이지 범위에서는 Spring gateway 수준의 세밀한 라우팅보다 인증서 자동화가 더 중요하다.
- 보조 선택지: Nginx
  - 이미 별도 인증서 관리 체계가 있거나 수동 TLS 운영이 익숙할 때 선택할 수 있다.

## 정적 호스팅

HTML, CSS, JavaScript 빌드 결과만 올리는 방식이다. GitHub Pages, Netlify, Vercel 같은 서비스가 여기에 가깝다.

장점:

- 운영이 쉽다.
- 서버 관리가 거의 없다.
- 소개 페이지처럼 정적인 웹사이트에는 빠르게 시작하기 좋다.

주의할 점:

- 게이트웨이, 워커, Redis 같은 백엔드 런타임은 따로 운영해야 한다.
- 플랫폼 전체를 Docker로 확장하려는 방향과는 분리된다.

## 클라우드 호스팅

AWS, GCP, Azure 같은 클라우드에 서버나 컨테이너 서비스를 올리는 방식이다.

장점:

- 확장성과 관리 기능이 좋다.
- DNS, 인증서, 로깅, 모니터링 선택지가 많다.

주의할 점:

- 비용과 설정 복잡도가 늘어난다.
- 지금 단계에서는 학습 비용이 크다.

## 현재 결론

첫 배포는 사용자가 가진 서버 위 Docker 배포로 간다.

정적 호스팅과 클라우드 호스팅은 나중에 운영 부담이나 비용을 비교할 때 다시 검토한다.

첫 실행 기준선은 아래처럼 정리한다.

- 공개 소개 페이지 서비스: `services/public-site`
- 공개 배포 번들: `infra/public-site/docker-compose.public-site.yml`
- canonical domain: `workaround.co.kr`
- alias redirect: `workaround.kr` -> `workaround.co.kr`
- TLS: Caddy 자동 인증서 발급
- 배포 전 점검: `infra/public-site/preflight.ps1`
- 배포 후 증거 수집: `infra/public-site/verify-public-site.ps1`
