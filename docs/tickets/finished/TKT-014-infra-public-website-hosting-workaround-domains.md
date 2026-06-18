# TKT-014

## 메타데이터

- 제목: workaround.co.kr / workaround.kr 1차 공개 웹사이트 호스팅
- 우선순위: P1
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-014-public-website-hosting`

## 목표

구매한 도메인 `workaround.co.kr` 과 `workaround.kr` 에 1차 공개 웹사이트를 올릴 수 있도록, 배포 번들, 사전 점검 절차, 배포 후 검증 절차를 한 번에 재사용 가능한 기준선으로 정리한다.

## 작업 내용

- `services/public-site` 정적 소개 페이지 서비스와 `infra/public-site` 배포 번들을 다시 점검해 공개 호스팅 기준선을 문서와 스크립트로 고정했다.
- `infra/public-site/preflight.ps1` 를 추가해 아래 항목을 배포 전에 자동 점검하도록 했다.
  - `.env.public-site` 존재 여부
  - `PUBLIC_SITE_DOMAIN`, `PUBLIC_SITE_ALIAS_DOMAIN`, `PUBLIC_SITE_EMAIL` 필수 값
  - Docker CLI / Docker daemon / Compose plugin 가용성
  - 80, 443 포트 상태
  - 필요 시 `-CheckDns` 로 현재 머신 DNS resolve 상태
- `infra/public-site/verify-public-site.ps1` 를 추가해 아래 증거를 배포 후 한 번에 수집할 수 있게 했다.
  - `http://127.0.0.1:8010/health`
  - `http://workaround.kr`
  - `https://workaround.co.kr`
- `verify-public-site.ps1` 는 PowerShell 5.1 과 7 양쪽에서 동작하도록 `Invoke-WebRequest` 파라미터 호환성을 보강했다.
- `infra/public-site/README.md`, `docs/hosting-options.md` 를 갱신해 preflight, 수동 배포, 배포 후 증거 수집 흐름을 같은 기준으로 맞췄다.

## 범위

- 포함: DNS/TLS/리다이렉트 운영 기준선, Caddy 기반 공개 배포 번들, preflight 스크립트, 배포 후 검증 스크립트, 운영 문서
- 제외: 실제 운영 서버 접속, 실제 DNS 변경, 실제 TLS 발급 완료 증거 수집, 클라우드 공급자별 자동 배포

## 완료 기준

- 공개 도메인 호스팅을 위한 배포 전 점검 절차가 있다.
- 공개 도메인 리다이렉트와 TLS 증거를 수집하는 배포 후 검증 절차가 있다.
- 공개 사이트와 로컬 프리뷰의 역할 차이가 문서에 정리되어 있다.
- 실제 배포를 아직 못 했더라도, 현재 세션 제약과 다음 액션이 문서에 남아 있다.

## 선행 조건

- 실제 서버 OS, SSH 접근 방식, 공개 포트 정책, DNS 관리 콘솔 접근 정보가 있어야 실배포까지 닫을 수 있다.
- 사용자 승인 없이 DNS 변경이나 실제 운영 서버 조작을 강행하지 않는다.

## 질문/결정 기록

- 결정: 대표 도메인은 `workaround.co.kr` 이다.
- 결정: `workaround.kr`, `www.workaround.co.kr`, `www.workaround.kr` 은 대표 도메인으로 리다이렉트한다.
- 결정: 첫 공개 배포 기본값은 `infra/public-site/docker-compose.public-site.yml` + Caddy 조합이다.
- 결정: 실제 배포 전에는 `preflight.ps1`, 배포 후에는 `verify-public-site.ps1` 결과를 남긴다.
- 열린 질문: 실제 운영 서버의 OS, 방화벽, Docker 설치 상태, DNS 관리 권한은 아직 확인이 필요하다.

## 권장 검증 명령

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\public-site\preflight.ps1
powershell -ExecutionPolicy Bypass -File .\infra\public-site\preflight.ps1 -AsJson
powershell -ExecutionPolicy Bypass -File .\infra\public-site\verify-public-site.ps1
```

## 선행 읽기

- `README.md`
- `docs/architecture.md`
- `docs/network.md`
- `docs/service-policy.md`
- `docs/hosting-options.md`
- `infra/public-site/README.md`
- `docs/history/README.md`
- 최신 관련 히스토리

## 작업자 산출물

- 공개 호스팅 기준선 요약
- 배포 전 점검 스크립트
- 배포 후 검증 스크립트
- 현재 세션 검증 결과
- 남은 운영 제약

## 검토 메모

- 현재 작업은 "공개 사이트 운영 기준선 + preflight + 배포 후 검증 도구" 까지 완료했다.
- 2026-06-15 현재 검증 결과는 아래와 같다.
  - `preflight.ps1`
    - `.env.public-site` 부재
    - 필수 env 키 3개 누락
    - Docker CLI / daemon / compose 미가용
    - 80, 443 포트 조회는 현재 권한 컨텍스트에서 `액세스가 거부되었습니다.` 로 확인 불가
  - `verify-public-site.ps1`
    - 로컬 `127.0.0.1:8010/health` 미기동
    - `workaround.kr`, `workaround.co.kr` 는 현재 세션에서 DNS resolve 실패
- 위 결과는 "아직 실배포를 하지 않았다" 는 사실과 일치하며, 스크립트가 실패 사유를 증거로 남기는지까지 검증했다.
- 실제 서버 접근 정보와 DNS 권한이 주어지면 같은 스크립트로 곧바로 재검증을 이어갈 수 있다.
- 오케스트레이터 판정: 이 티켓의 범위는 공개 배포 기준선, preflight, 배포 후 검증 절차 정리까지이며 실제 DNS/TLS 반영은 제외 범위였으므로 완료 기준을 충족한 것으로 본다.

## Notes

- 다음 작업자는 실제 서버에 `.env.public-site` 를 준비하고 Docker/Caddy 를 기동한 뒤 `verify-public-site.ps1` 결과를 히스토리에 추가하면 된다.
