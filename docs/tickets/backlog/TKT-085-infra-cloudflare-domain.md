# TKT-085

## 메타데이터
- 제목: 도메인 공개 준비 — Cloudflare 프록시 + Caddy 연동
- 우선순위: P1 / 상태: `ready` / 문서 상태: 작성완료
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
