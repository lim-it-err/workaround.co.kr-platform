문서 상태: 작성완료

# TKT-228 `[FE]` lite 공용 틀 — 키 규칙 composable · 화면 틀 · 화면 연결

- 상태: ready · **P1 · v0.9.2** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.2`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PO 2026-11-22 「나머지 페이지는 lite에 맞춰서 디자인 다시 다 해줘」 → 시안 `design/mockups-v0.9/lite-pages.html` (https://claude.ai/artifact/FJs2PG2o7RYvcJLqPvT7Xz) → PO 「어 이렇게 해줘」. REV-TKT-227-r1 `[중요]` 「화면마다 같은 규칙(↑↓·Enter·Esc)으로 공용 composable 로 묶을 것」.
- 의존: 없음. **TKT-229~232 가 이 티켓의 틀 위에 화면을 올린다** — 이 티켓은 틀과 연결만, 화면 내용은 만들지 않는다.
- scope:
  - 신규 `frontend/src/composables/useLiteKeys.js`
  - 신규 `frontend/src/components/lite/LiteScreen.vue`(화면 틀), `frontend/src/components/lite/index.js`(페이지 → lite 컴포넌트 표)
  - 신규 자리표시 `frontend/src/components/lite/LiteVoyage.vue`·`LiteEts2.vue`·`LitePantry.vue`·`LiteWork.vue` — 각각 `LiteScreen` 안에 「준비 중 · 상단 기본으로 보기」 한 줄만. 후속 티켓이 통째로 교체한다.
  - `frontend/src/App.vue` — lite 일 때 해당 페이지 자리에 lite 컴포넌트를 그리는 분기만
  - `frontend/src/components/hall/HallLite.vue` — 키 처리를 composable 로 교체(동작 변경 없음)
  - 신규 `frontend/src/components/Lite.e2e.mjs`, `VERSION` → `0.9.2`
  - 금지: `styles.css` 전역 토큰 변경, 기본 보기 컴포넌트 수정, `HallV09.e2e.mjs` 의 기존 단언 수정(버전 계산은 이미 VERSION 을 읽는다).

## 완료 조건
- [ ] 1. `useLiteKeys({ onMove(delta), onEnter(), onBack(), onSide(delta)?, onHome?, onEnd? })` — 마운트 동안만 `document` keydown 등록, 언마운트 해제. 규칙은 TKT-227 과 같다: 입력 칸·textarea·select·contenteditable 와 Alt/Ctrl/Meta 조합 무시, Enter 는 button·a[href]·summary 위에서는 원래 동작. ↑↓ = onMove(∓1), ←→ = onSide(∓1)(없으면 무시), Esc = onBack, Home/End. 처리한 키는 preventDefault. 포인터 「한 번 = 선택, 같은 줄 다시 = 진입」(armed) 도 composable 이 제공(`pointerPick(index)` 꼴).
- [ ] 2. `HallLite.vue` 가 composable 을 쓰도록 바뀌고 `HallV09.e2e.mjs` 가 그대로 전부 통과한다.
- [ ] 3. `LiteScreen.vue`: 시안의 틀 — 위 한 줄(「workaround lite」 · 현재 위치 crumb · 「‹ 뒤로」 버튼), 가운데 스크롤 영역(slot), 아래 키 안내 줄(prop 으로 받은 문구, 예 「↑↓ 고르기 · Enter 들어가기 · Esc 뒤로」). 색·글꼴은 기존 lite(C안 CRT) 토큰을 쓴다 — 새 색 하드코딩 금지. 375 폭에서 가로 스크롤 0, 버튼 높이 ≥44px.
- [ ] 4. `App.vue`: `view === 'lite'` 이고 페이지가 `voyage`·`ets2`·`pantry`·`work` 이면 기본 화면 대신 `components/lite/index.js` 의 컴포넌트를 그린다. 그 외 페이지(Advisor·격납고·블로그 등)는 지금처럼 기본 화면 그대로(PO 「advisor는 지원안해도 되고 … 격납고도」). lite 화면의 맨 위 단계에서 Esc·「‹ 뒤로」 = 환승 홀(`openPage('junction')`).
- [ ] 5. 검증: 빌드(root·Pages base) + `HallV09.e2e.mjs` 전부 + 새 `Lite.e2e.mjs` — lite 로 환승 홀 → ↓ Enter → 유로트럭 lite 자리표시가 보이고 기본 화면 요소(예: 프레임 이미지)는 없다 / Esc → 환승 홀로 돌아와 목록이 키로 움직인다 / 4개 화면 각각 lite 자리표시 렌더 / 기본 보기에서는 기존 화면 그대로 / Advisor 경로는 lite 에서도 기존 화면. `git diff --check`. 캡처 `docs/tickets/captures/TKT-228/` 375·1440 자리표시 1장씩.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
