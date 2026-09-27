문서 상태: 작성완료

# REV-TKT-116-r1 — 여정 노선도 회고 모드(열차 점 재생) (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 48 modules, unit 20/20, **`VoyageReplay.e2e.mjs` PM 직접 3/3**(운행 중 비노출 / 1440 light 재생·일시정지·2단 속도·일차 자동 전환 / 375 dark reduced-motion 단계 이동·지도 자동 전개). 실행 절차: `NODE_PATH=services/advisor/frontend/node_modules node --test …`(메인 E2E 는 `createRequire` 로 playwright 를 찾으므로 NODE_PATH 필요 — CLAUDE.md 에 기록).
- 실화면(localhost:7010 `/voyage`, 390): 현재 여행(`boarding`)에는 재생 제어 비노출 ✓ — 완료 조건 1. 나머지 조건 2~5 는 도착 상태를 격리 시나리오로만 만들 수 있어 E2E 근거.
- **[반박] 수용**: 테스트를 위해 제품 데이터를 `arrived` 로 바꾸지 않은 것이 맞다(콘텐츠는 PM 권한). 실여행 종료(9/18) 후 PM 이 `east-europe-2026.js` status 를 `arrived` 로 바꾸면 같은 UI 가 노출된다 — PM 할 일로 등록.
- 구현 요약: `여정 다시 보기` 한 줄 hairline 구획(버튼만 면), 일차별 프레임(이동 없는 날 포함, 한 날 두 구간은 두 종점), 수동 조작 시 재생 정지, 모바일 재생 시 지도 자동 전개, 상태 `aria-live`·속도 `aria-pressed`, reduced-motion 시 보간 0ms, 해제 시 타이머·미디어쿼리 정리.
- [제안] 재생 완료 뒤 `처음부터` 외에 `기록 보기`(DAY 0 준비 시트가 아닌 지출·거리 요약)로 이어지면 회고의 끝이 생긴다 — 콘텐츠 스펙 §4 재미 요소 후속.
- 커밋 범위: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/VoyageReplay.e2e.mjs`.
