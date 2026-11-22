문서 상태: 작성완료

# REV-TKT-224-r1 — 부팅 로그 버전 = 저장소 VERSION 파일

- 판정: **통과** (블로커 0) · PM 2026-11-22 · 구현 dev 서브에이전트(Haiku 5.5)
- 근거: PO 「이거 왜 내가 해야되지? 버전명?」 — 저장소 변수·.100 `.env` 두 곳 수동 관리를 없앤다. 버전은 루트 `VERSION`, PM 이 릴리스 PR 에서 올린다. `RELEASE_VERSION` 은 덮어쓰기용으로만.
- PM 직접 검증: `docker compose -p v091pm build web` → `/srv/site/assets` 에 `0.9.1` 포함. `HallV09.e2e.mjs` pass 16 / fail 0 / skip 2. `git diff --check` 통과.
- 게이트 픽스(PM 승인 범위 확장, Haiku): `HallV09.e2e.mjs` 부팅 로그 단언이 「환경값 없으면 버전 없음」을 기대해 375·1440 2건 실패 → 빌드와 같은 규칙(RELEASE_VERSION → VERSION 파일)으로 기대 버전 계산. TKT-225 서브에이전트가 보고한 E2E red 의 원인도 이것이었다(TKT-225 무관).
- `[제안]` Pages 워크플로 실행 결과(전체 checkout 이라 VERSION 포함 예상)는 머지 뒤 라이브 부팅 로그로 확인.
