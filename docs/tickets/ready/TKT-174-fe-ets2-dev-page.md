문서 상태: 작성완료

# TKT-174 `[FE]` 유로트럭 개발자 페이지 `/ets2/dev` — 주행 정보·실시간 화면·감시/복구·게임 제어·차선 변경·시뮬레이터 (보호 구역)

- 상태: ready · **P1** · 담당: codex-1 · 의존: TKT-168 need_review(뷰어 뼈대 공유). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.** 스펙 `design/ets2-live-spec.md` v2 §B·§D. PoC 계약 `services/ets2-adas/API.md`.
- scope: `frontend/src/components/Ets2Dev.vue`(신규), `frontend/src/App.vue`(라우팅), `frontend/src/data/lines.js`(실험선 S 소역 `유로트럭 개발자`, `staticAccess: 'server'` — D-022 문법), `frontend/src/staticRouting.js`(`/ets2/dev` 를 `STATIC_UNAVAILABLE_LIVE_PAGES` 에), `frontend/src/styles.css`, `frontend/public/ets2-sim/`(PoC `index.html`·`styles.css`·`controller.js`·`app.js` 의 시뮬레이터 부분을 정적 복사 — 원본은 `services/ets2-adas/`, 복사 스크립트 `frontend/scripts/sync-ets2-sim.mjs`), `Ets2Dev.e2e.mjs`(PoC API 를 흉내내는 로컬 스텁 서버 포함).

## 화면 (톤 원칙: 읽기 행은 면 없음, 조작부만 면·40px)
1. 상단: 연결 상태 한 줄(`연결됨 · 25Hz · 일시정지 아님` / `PoC 서버 없음 — 127.0.0.1:8765`).
2. 주행 정보 행: 속도·크루즈·제한·목적지·조향 입력·브레이크 (m/s → km/h 변환은 화면에서만, API.md).
3. 실시간 화면: `GET /api/frame.jpg?id=` 1초, 168 과 같은 더블 버퍼 컴포넌트 재사용.
4. 정체 감시: `감시 시작`·`감시 중단`, 정지 경과 초, 복구 상태(`요청 없음/요청됨/보류`), 마지막 요청 시각. `견인 서비스 입력 시험` 은 확인 다이얼로그 뒤에만.
5. 실제 게임 제어: `명령 준비`(arm) → 활성화되는 `ACC 설정/해제`·`−5`·`+5`(상한 110)·`차선유지 토글`, 항상 보이는 `커스텀 제어 중단`(danger). 준비 전에는 버튼 비활성 + 이유 한 줄.
6. 차선 변경: 확인란 `빈 도로 확인`·`내장 차선유지 껐음` 둘 다 + 30~110km/h 일 때만 `← 왼쪽`·`오른쪽 →` 활성. 진행 중 상태(`maneuver`) 표시.
7. 이벤트: `GET /api/state` 의 최근 이벤트/상태 변화를 화면에서 20줄 링 버퍼로(서버 파일 접근 없음).
8. 시뮬레이터: `02 시뮬레이션` 펼침 → `iframe src="/ets2-sim/index.html"`(정적, API 미사용).
9. 설정 행: 리미터 모드 파일명·`speedLimitKmh`·`POC_ALLOWED_ORIGINS` 안내(읽기).

## 완료 조건
0. [ ] (PO 2026-09-28) 페이지가 호출하는 원격 자원은 PoC API(`/api/state`·`/api/frame.jpg`·`/api/action`)뿐 — 파일·프로세스·다른 포트 호출 0, E2E 요청 로그로 단언.
1. [ ] 정적 공개본: `/ets2/dev` 는 흐림 + 토스트 `개발자 페이지 · 로컬 전용`(페이지 이동 없음), 홈 노선도·격납고 목록에서 같은 문법. staticRouting E2E 갱신.
2. [ ] 개발 모드: `VITE_ETS2_DEV_API` 스텁 서버로 E2E 5건 — 연결/미연결 표시, arm 전 비활성→arm 후 활성, `+5` POST 에 `X-Poc-Token`·JSON 본문, 차선 변경 조건 게이트, 감시 시작/중단 상태 반영.
3. [ ] 375/1440 × 다크/라이트 overflow 0, 40px, 영어 간판 0(`ACC`·`km/h` 약어 허용), 위험 조작(`커스텀 제어 중단`·`견인 시험`)은 톤 안에서 구분(면 + 색 1개).
4. [ ] `sync-ets2-sim.mjs` 로 복사한 시뮬레이터가 `/ets2-sim/index.html` 에서 단독 동작(빌드 포함).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
