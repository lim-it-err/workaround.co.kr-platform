문서 상태: 작성완료

# TKT-168 `[FE]` 유로트럭 관제 페이지 `/ets2` — 프레임 폴링·신선도·정지 상태

- 상태: finished (2026-10-05, PM r1 통과 — 커밋은 174 와 묶음 조건부)· **P1** · 담당: codex-1 · 의존: TKT-166 finished(스펙). 167 과 병행(샘플 프레임으로 개발). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.** 스펙 `design/ets2-live-spec.md` §4·§5.
- scope: `frontend/src/components/Ets2Live.vue`(신규), `frontend/src/App.vue`(라우팅·격납고 목록 행), `frontend/src/data/lines.js`(실험선 S 소역 `유로트럭` page `ets2`), `frontend/src/staticRouting.js`(`/ets2`), `frontend/src/styles.css`, `frontend/public/mockups/ets2-sample/`(샘플 프레임 3장 — 저작권 없는 합성 이미지), `frontend/src/components/Ets2Live.e2e.mjs`, `JunctionMap.e2e.mjs`(역 9개).

## 개정 (2026-09-27 밤, PM) — 스펙 v2 §A
`meta.json` 에 주행 정보가 들어온다. 프레임 아래 **주행 정보 한 행**: `속도 82 km/h · 크루즈 80 · 제한 90 · 목적지 14.2 km · 감시 중(정지 0초)`. `connected:false` 면 값 자리는 `—`. 샘플 모드에서도 샘플 meta 3개를 순환. 완료 조건 5 추가: 주행 정보 행 E2E 1건(값·`—`·감시 상태).

## 완료 조건
1. [x] `VITE_ETS2_FRAME_URL` 이 있으면 `<url>/latest.jpg?t=` + `meta.json` 을 2초 폴링, 없으면 샘플 3장 순환. 새 이미지 로드 완료 후 교체(깜빡임 0 — E2E 로 `img` 교체 시 빈 프레임 없음 단언).
2. [x] 신선도 `n초 전`, 30초 이상 정지 상태(흐림 + hairline `마지막 화면 · n분 전`, 폴링 10초), 로드 실패 3회 `관제 신호 없음`. 페이지 이동 없음(D-022 문법).
3. [x] 홈 노선도·격납고 목록에서 진입, 정적 라우팅 `/ets2` 직접 진입·새로고침, 375/1440 × 다크/라이트 overflow 0, 영어 간판 0(`ETS2` 는 약어로 허용, 눈썹 금지).
4. [x] E2E 4건(폴링·정지·실패·진입), 기존 E2E 회귀 0, Pages-base build.
5. [x] 주행 정보 행이 샘플 메타의 값·`connected:false` 대시·감시 상태를 표시한다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## 구현 내역
- `Ets2Live.vue`: 외부 R2 URL의 `meta.json`·`latest.jpg` 또는 로컬 샘플 3쌍을 폴링한다. 새 이미지를 메모리에서 먼저 로드한 뒤 현재 `img`를 교체하며, 신선도에 따라 2초→10초→30초로 늦추고 3회 연속 실패에도 같은 페이지와 마지막 프레임을 유지한다.
- 주행 정보는 속도·크루즈·제한·목적지·감시를 한 hairline 행으로 배치했다. 연결이 끊기면 다섯 값 모두 `—`, 정지/신호 없음은 프레임을 흐리고 한 줄 상태를 겹쳐 표시한다. 최신 v2 §A의 "조작부 없음"을 따라 수동 새로고침 버튼 대신 읽기 전용·자동 확인 간격만 표시한다.
- `/ets2` 정적 딥링크, 격납고 행, 홈 S 소역 `유로트럭`을 연결했고 저작권 없는 합성 SVG 3장과 샘플 meta 3개를 추가했다. 신선도 접근성 상태는 화면에서는 매초 갱신하되 낭독은 30초 구간·상태 전이에만 갱신한다.
- 공유 파일: `frontend/src/App.vue`, `frontend/src/data/lines.js`, `frontend/src/data/junction.test.mjs`, `frontend/src/staticRouting.js`, `frontend/src/staticRouting.test.mjs`, `frontend/src/staticRouting.e2e.mjs`, `frontend/src/styles.css`, `frontend/src/components/JunctionMap.e2e.mjs`, `frontend/src/components/ToneTools.e2e.mjs` (TKT-170 need_review 변경 위에 이어짐).
- 검증: Pages-base build 54 modules, unit 26/26, Pages-base E2E 47/47, root-base E2E 22/22(시뮬 5·도구 12·택시 5), 신규 `Ets2Live.e2e.mjs` 4/4 통과. 375/1440 × 다크/라이트 캡처를 직접 확인했고 overflow 0이다.
- 2026-10-05 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-168-r1.md`. 커밋 조건: Ets2Live E2E 4·Transfer E2E 2/2 그린(174 와 함께).
