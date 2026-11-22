문서 상태: 작성완료

# REV-TKT-228-r1 — lite 공용 틀 (PM, 2026-11-22)

판정: **통과** (블로커 0)

## PM 직접 검증
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` 통과.
- `HallV09.e2e.mjs` + `Lite.e2e.mjs`: pass 25 · fail 0 · skip 2(캡처 전용, `HALL_SCREENSHOT_DIR` 없음 — 기존 동작).
- `git diff --check` 클린.
- 캡처 `docs/tickets/captures/TKT-228/lite-placeholder-{375,1440}.png` 직접 확인 — 틀·crumb·뒤로·키 안내 줄 시안대로, 375 가로 넘침 없음.

## 지적
- `[제안]` 375 에서 상단바 제목(「유로트…」)과 lite crumb 이 같은 말을 두 번 한다. lite 화면들이 들어온 뒤 한꺼번에 볼 것.
- `[제안]` `useLiteKeys` 는 콜백 없는 키를 통과시킨다 — 후속 화면에서 Esc 를 빼먹으면 Esc 가 먹통이 된다. 화면 티켓마다 Esc 단언을 둔다(TKT-229·231·232 완료 조건에 이미 있음).

## 후속
- PO 2026-11-22 「유로트럭은 lite에 맞지 않아. 빼.」 → TKT-230 폐기, 환승 홀 lite 항목·자리표시 제거는 TKT-233.
