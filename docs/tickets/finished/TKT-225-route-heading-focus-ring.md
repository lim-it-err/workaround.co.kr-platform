문서 상태: 작성완료

# TKT-225 `[FE]` 화면 제목 포커스 테두리 — 첫 방문 마우스 사용자에게 노란 테두리 제거

- 상태: finished · **P2 · v0.9.1** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.1`.
- 근거: PM 의문(PR #11, 2026-11-22) — 첫 진입 시 제목 「환승 홀」(`frontend/src/App.vue:242` `<h2 tabindex="-1">`)에 노란 포커스 테두리가 보인다. 라우트 이동 시 제목으로 포커스를 보내는 접근성 처리(스크린리더가 새 화면 제목을 읽게)는 유지하되, 제목은 조작 요소가 아니므로 테두리를 그리지 않는다(관례).
- scope: `frontend/src/styles.css` 만.

## 완료 조건
1. `styles.css` 의 전역 `:focus-visible`(190행 근처) 바로 뒤에 `[tabindex="-1"]:focus, [tabindex="-1"]:focus-visible { outline: none; }` 와 같은 효과의 규칙(조작 요소가 아닌 프로그램 포커스 대상만 — 버튼·링크·입력의 포커스 링은 그대로).
2. 포커스 이동 자체(JS)는 건드리지 않는다.
3. 검증: `npm --prefix frontend run build`; 기존 E2E 중 포커스·접근성 관련(`HallV09.e2e.mjs` 등) 통과 — 실행법 `NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test <파일>`(Pages base dist 먼저 빌드, 저장소 CLAUDE.md 참고); Playwright 로 `/` 첫 진입 1440 캡처에서 제목 테두리 없음 + Tab 키 한 번 누른 뒤 첫 버튼에 포커스 링이 보이는 캡처 → `docs/tickets/captures/TKT-225/`.

## 구현 메모
(dev)
- 변경: `frontend/src/styles.css` 전역 `:focus-visible` 블록(190행) 바로 뒤에 `[tabindex="-1"]:focus, [tabindex="-1"]:focus-visible { outline: none; }` 추가 (주석 1줄 포함). 다른 파일 미변경, JS 포커스 이동 미변경.
- 근거 확인: `App.vue:242` `<h2 tabindex="-1">` 의 노란 테두리가 캡처에서 사라짐(`first-1440-light.png` 제목 테두리 없음, 실측 computed outline 'none 3px').

## 구현 내역
- 파일: `frontend/src/styles.css` (+6행). 공유 파일: 없음 (TKT-224 와 같은 트리이나 겹치는 파일 없음).

## 검증
- `npm --prefix frontend run build`: 성공 (80 modules, dist/assets 생성).
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/`: 성공.
- `git diff --check`: 통과(출력 없음).
- Playwright 실렌더(스크립트: 스크래치패드 `tkt225-capture.mjs`, 로컬 정적 서버로 Pages-base dist 서빙, 첫 진입 후 12s 대기): 1440/375 × light/dark 4조합 모두
  - 첫 진입: h2 outlineStyle `none`(포커스 링 없음), 포커스는 h2 `환승 홀`, 가로 overflow 0.
  - Tab 1회: 포커스 `BUTTON 기본`, outline `solid 2px`(포커스 링 유지), 가로 overflow 0.
  - 캡처: `docs/tickets/captures/TKT-225/first-{1440,375}-{light,dark}.png`, `tab-{1440,375}-{light,dark}.png`.
- E2E `frontend/src/components/HallV09.e2e.mjs` (NODE_PATH=advisor node_modules):
  - run 1: pass 12 / fail 4 / skipped 2. run 3(단독): 실패 13건 전부 `waiting for getByRole('button', { name: '환승 홀' })` 30s timeout 또는 부팅 로그 타이밍 — 포커스·outline 단언 없음.
  - 다른 실패 원인 판단: 이 CSS 규칙은 `display`/`visibility`/접근 이름을 바꾸지 않으므로 버튼 탐색 실패를 만들 수 없다고 판단하나, 기준선(변경 전) 실행은 하지 않았다 — 확정 아님.
- 미실행: `NODE_PATH=... node --test` 의 다른 포커스 관련 E2E(JunctionMap 등) 미실행 (JunctionMap run 은 기타 실행 중 중단).

## 질문/에스컬레이션
[구체화 질문] HallV09.e2e.mjs 의 30s timeout 실패가 TKT-225 변경과 무관한 기존 실패인지 PM 확인 요청.
- 이 머신에서 TKT-225 적용 전(styles.css HEAD 버전) 동일 E2E 기준선이 필요하다. 같은 트리에서 TKT-224 가 동시에 빌드 중이라 부하가 높았다(run 2·3 실패 수가 run 1 보다 많음).
- 게이트가 red 이므로 need_review 로 옮기지 않고 blocked 로 둔다. 기준선 또는 PM 판정(무관 실패로 수용 여부)이 오면 need_review 전환.
- 실렌더 판정 자체는 통과(위 캡처). 제목 테두리 제거와 Tab 포커스 링 유지 모두 확인됨.

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-225-r1.md`
