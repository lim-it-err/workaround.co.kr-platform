문서 상태: 작성완료

# REV-TKT-147-r1 — 디자이너 제안 소묶음: 재방문 플랩 읽기 시간·저장 안내 원 (PM 판정: **반려 → started**, 블로커 1)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-147-r1-draft.md` 는 통과 권고였으나, 디자이너 `UX-TKT-147-r1.md` 의 **실시간·실난수 계측**을 채택해 뒤집는다(U-35: 조건 문구가 아니라 실제 화면 기준).
- PM 게이트(2026-09-15 밤, 워킹 트리 = 146·147·148r2·151·134·152·153·154·155·156 + 157 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base — Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·splash 6·WritingStudio 13(첫 배치 2건 red 는 preview 기동 race, 단독 재실행 13/13) · root-base SimTone 5·taxi 5·ToneTools 12 · Transfer 2 (메인 E2E 합계 **62/62**) · Advisor build 117(경고 0) · unit **93/93** · Playwright **56/56**.
- **통과한 것**: 저장 안내 원 — computed 28px 시각 원 + hit ≥40 (WritingStudio E2E 13/13, `storage help keeps a 28px visual circle inside a 40px target` 4환경). 디자이너 [제안] S1(외곽선 포함 실측 30px)은 수용 가능 범위 — 후속 없음.

## [블로커] B1 — 완료 조건 1 미달: 최종 문구 정착 후 정지 노출이 1.0초에 못 미친다
- 티켓 완료 조건 1: "최종 문구 정착 후 **1.0초 이상** 보이고 전환(총 3.6~4.0초)". 구현은 고정 3.8초 타이머(`App.vue:29` `SPLASH_RETURN_DURATION_MS = 3800`).
- 디자이너 실측(실난수·실시간, 20ms 간격, `UX-TKT-147-r1-assets/timing-followup.json`): 정착 → 페이드 시작까지 375-dark **0.719초** · 1440-dark **0.900초** · 1440-light **0.821초** · 375-light 1.001초 — 4환경 중 3환경 미달. 원인: 셀 난수 지연으로 정착이 2.8~3.08초까지 밀리는데 전환은 3.8초 고정.
- E2E 6/6 은 `Math.random = 0.1` 고정 fixture(짧은 정착 경로)만 검증해 긴 정착 경로를 대표하지 못한다(리뷰어 초안이 이 점을 놓침).
- → 반영 요구: 전환 시각 = **max(3.8초, 정착 시각 + 1.0초)** 로 바꾸고, 정착 상한(난수 지연 상한)을 2.8초 이내로 묶어 총 시간이 4.0초를 넘지 않게. E2E 에 최악 난수 경로(`Math.random = 0.99` 등) 케이스 추가. `다시 재생`·첫 방문 10초는 무변경.

## 묶음 커밋 안내
- `App.vue`(134 템플릿 삭제와 공유)·`splashTone.e2e.mjs`(146 가상 시계와 공유) 때문에 **146·134 는 finished 이되 커밋은 147 r2 통과 시 함께**(U-32 ③).
