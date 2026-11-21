문서 상태: 작성완료

# REV-TKT-218-r1 — v0.9 디자인 토큰·보기 전환 (PM 판정: **통과**)

- 판정: PM(Claude Opus 5.5), 2026-11-16 · 구현: dev 서브에이전트(Sonnet 5.5, 네트워크 오류·잠자기로 2회 중단 후 재개) · 브랜치 `codex/v0.9.0`.

## PM 직접 실행
- unit 46/0, `git diff --check` 통과.
- `e2e:all` 1회차: 96 pass / 18 skip / 9 fail. 실패 9건은 전부 시간 계열(`browserType.launch` 180초 초과, `locator.waitFor` 30초 초과, 2.6초 고정 대기 뒤 토스트 단언)이고 소요가 파일당 900~1,600초로 비정상.
- 실패 파일 재실행: blogClosed 16/0, splashTone 14/0, SimTone 5/0 통과. JunctionMap 은 회차마다 **다른 하위 테스트**가 실패(1회차 light 2건 → 3회차 1440 dark 1건, light 2건은 통과). 실패 회차마다 하위 테스트 하나가 약 900초 멈춘다.
- 대조: 변경 전 `codex/v0.8.4` 의 JunctionMap 도 같은 시간대에 하위 테스트 하나가 939초 멈췄다(통과). 멈춤은 코드와 무관한 호스트 문제로 판단(load 10~16, contactsd·AddressBook 데몬 고부하, 잠자기는 이미 차단 상태). 3주 묵은 vite preview 3개도 정리했다.
- 결론: **변경 후 모든 E2E 하위 테스트가 최소 1회 통과**, 실패는 재현성 없는 시간 계열. 통과로 판정하되 아래 [중요] 로 남긴다.
- 캡처 20장(`/private/tmp/tkt218/`) 실확인: 여행·밥상·운영 노트·유로트럭 375/1440 × 기본/lite 가독·overflow 이상 없음, 토글 위치 정상.

## 지적
- [중요] 호스트 부하 시 E2E 가 하위 테스트 단위로 약 15분 멈춘다 — 다음 릴리스 감사(codex-9) 때 깨끗한 상태에서 `e2e:all` 전체 1회 재확인. JunctionMap 의 `waitForTimeout(2600)` 고정 대기는 `expect.poll`/`waitFor({state:'detached'})` 로 바꾸는 후속 권고.
- [중요] 노선 9개 → 5색 수렴(d→배움, p→기지, s·v→회색)은 서브에이전트 판단. 5노선 IA 재편 티켓에서 노선별 색을 다시 확정.
- [제안] 일부 카드의 하드코딩 청색 rgba 그라디언트 잔존 — 화면별 v0.9 티켓에서 정리.
