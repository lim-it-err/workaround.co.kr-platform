문서 상태: 작성완료

# REV-TKT-126-r1 — 순환선 심볼 C안 + 파비콘 + 스플래시 보드 높이 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 48 modules, unit 20/20, `splashTone.e2e.mjs` PM 직접 3/3. 구현자 ToneTools 10/10·Advisor unit 77/77·병합 왕복 E2E 2/2 인정.
- 실화면(localhost:7010, 390 스플래시): 상단 C 심볼(54px, 열린 링 + 12시 기점 점) · `workaround.co.kr` · `곧 문이 열립니다` · 플랩보드 **한 줄**(보드 312×51, 값 행 27px — 빈 면 0) · 알림 티커는 위아래 hairline + 한 줄 문구(pill·카드 면 0) · `10초 후 자동 전환`·`다시 재생`. overflow 0.
- 파비콘: `favicon.svg`(라이트/다크 `prefers-color-scheme` 로 색 전환) + PNG 16/32. **16px PNG 를 직접 열어 링·틈·점 식별 확인**(첨부: `frontend/public/favicon-16x16.png`), 32px 선명. `index.html` 에 Pages base 보존 링크 3개.
- 환승 표식(125 임시 CSS 원 → C 심볼): 여행 `이걸로 미션 만들기 →` 앞 18px SVG, 경로 `M58 18.55 A33 33 0 1 1 38 18.55` — `SiteLoopSymbol`·파비콘·Advisor 인라인 사본 세 곳 동일 경로 확인.
- [제안] 스플래시 패널의 옅은 테두리 면 — 목업 `splash.html` r12 는 패널 투명. 110 때부터 있던 것이라 126 범위 밖; TKT-102 종결(PO r14 확정) 시 목업 대조 목록에 포함.
- 커밋 범위: `frontend/index.html`, `frontend/public/favicon{.svg,-16x16.png,-32x32.png}`, `frontend/src/App.vue`, `frontend/src/styles.css`, `frontend/src/components/tone/SiteLoopSymbol.vue`, `frontend/src/components/VoyageAdvisorTransfer.e2e.mjs`, `frontend/src/splashTone.e2e.mjs`, `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`.
