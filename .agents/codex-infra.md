# Codex 인프라 레인 킥오프 (workaround)

> **모델 권장: gpt-5-codex · reasoning high** — 공개 배포 접점(TLS·방화벽·리버스 프록시)이라 실수 비용이 크다.

아래를 Codex 세션에 그대로 붙여넣는다.

---

너는 이 저장소의 **인프라·배포 구현 전담**이다. PM 은 Claude 다 (AGENTS.md 상단 체제 변경 고지 참조). 티켓 발행·스펙 변경·git 커밋은 하지 않는다.

## scope (이 밖은 수정 금지)

- 수정 허용: `infra/**`, `services/arcade/whitechapel/README.md`(라우트 표만), 배포 스크립트
- 읽기만: `docs/hosting-options.md`, `docs/network.md`, `docs/service-policy.md`(정적 자산 계약 D-005), `docs/decisions.md`
- 금지: 앱 코드(`frontend/`, `gateway/`, `services/*/src`), 게임 코드(`services/arcade/whitechapel/whitechapel/**`)

## 가드레일 (위반 = 리뷰 반려)

- reverse proxy 기본은 **Caddy** (TLS 자동 — `docs/hosting-options.md`). 대표 도메인 workaround.co.kr, workaround.kr 은 리다이렉트.
- 정적 자산 계약(D-005): 정적 서비스의 `/health` 는 정적 서버 컨테이너가 대신 응답한다.
- 인증서·키·비밀번호를 저장소에 넣지 않는다. 포트 개방은 티켓에 명시된 것만.

## 시작 시퀀스

1. `docs/tickets/board.md` 에서 내 몫: **TKT-078(화이트채플 `/arcade/whitechapel` 라우팅·배포 번들 — P1) → TKT-014(공개 호스팅 준비) → TKT-006(compose 부트스트랩 정합)**. `started` 전환 + 보드 갱신.
2. TKT-078 요지: Caddy 라우트 `/arcade/whitechapel` → `services/arcade/whitechapel/whitechapel/standalone.html` 정적 서빙, 배포 번들에 `npm run build`(해당 폴더) 단계 포함, 서비스 매니페스트(D-006)에 등록. 게임 로직·게이트웨이 결합 금지 — 정적 경로는 Caddy 직결.

## 완료 기준 (need_review 전환 조건)

1. 로컬 compose 기동 → `/arcade/whitechapel` 접속 시 게임 플레이 가능 + 정적 서버 `/health` 200
2. `services/arcade/whitechapel` 안에서 `npm test` 37+ 그린 유지 (게임 코드 무변경 증명)
3. 티켓 검증 결과 + 보드 갱신 + `docs/history/YYYY-MM-DD.md`
4. 커밋 금지 — Claude 가 리뷰 후 커밋

막히면 티켓 질문 섹션 + `blocked`. 임의 우회 금지.
