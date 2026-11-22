문서 상태: 작성완료

# REV-TKT-225-r1 — 화면 제목 포커스 테두리 제거

- 판정: **통과** (블로커 0) · PM 2026-11-22 · 구현 dev 서브에이전트(Haiku 5.5)
- 변경: `styles.css` `[tabindex="-1"]:focus, :focus-visible { outline: none }` — 라우트 전환 시 제목 포커스 이동(JS)은 유지.
- 검증: 캡처 `docs/tickets/captures/TKT-225/` — 첫 진입 1440·375 제목 테두리 없음, Tab 1회 뒤 「기본」 버튼 포커스 링 유지(PM 눈 확인 `tab-1440-dark.png`). 서브에이전트가 blocked 로 둔 E2E red 는 TKT-224 버전 단언 때문이었고, 게이트 픽스 뒤 PM 실행 `HallV09.e2e.mjs` fail 0.
- `[PM 의문]` 1440 폭 안내판 아래 빈 영역은 남아 있다(데스크톱 하단 메뉴 없음, 의도된 숨김) — 다음 디자인 손질 후보.
