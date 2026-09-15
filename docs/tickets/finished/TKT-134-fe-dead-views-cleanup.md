문서 상태: 작성완료

# TKT-134 `[FE]` 죽은 뷰·프로토타입 블록 정리 — 렌더되지 않는 영어 눈썹 제거

- 상태: finished (2026-09-15, PM 통과) · P3 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`.
- 근거: `docs/reviews/REV-TKT-128-r1.md` [제안], REV-TKT-128-r2.
- scope: `frontend/src/App.vue`(junction 프로토타입 블록 `QA Route`·`UI-v0.5.0 Junction`·`Prototype Lines`·`UX Pivot`·`Mobile Route`), `frontend/src/components/{VoyageDailyView,VoyageArchiveView}.vue`(외부 참조 0), `VoyageDaySession.vue`(참조 2 — 사용처 확인 후 판단), 관련 테스트

## 목표
정적 경로 8곳 어디에도 렌더되지 않는 템플릿·컴포넌트를 삭제해 원칙 4 잔존을 소스에서도 0 으로. 기능 변화 0.

## 완료 조건
1. [x] 삭제 후 build·unit·E2E 그린, 8경로 렌더 diff 0(스크린샷 비교 또는 innerText 동일).
2. [x] `grep -rn "\b[A-Z]{4,}\b"` 템플릿 잔존 목록이 데이터 토큰·약어(SVG·HTML·JSON·URL)만 남음.

## 질문/에스컬레이션
- `[구체화 질문][해결]` `VoyageDaySession.vue`의 "참조 2"는 모두 외부 사용이 아니라 외부 참조 0인 `VoyageDailyView.vue` 안의 import·렌더 1건씩이었다. 독립 사용처가 없으므로 세 구 뷰를 함께 삭제했다.
- `[구체화 질문][해결]` 소스 대문자 검사에서 같은 App 구 프로토타입 레일의 `title-en` 3건(`TAXI DISTRICT LAB`·`CREW BOARD`·`SIGNAL ROOM`)이 추가로 잡혀, App 범위 안에서 같이 제거했다. 프로토타입의 한국어 제목과 동선은 유지했다.

## 구현 내역
- `VoyageDailyView.vue`·`VoyageArchiveView.vue`·`voyage/VoyageDaySession.vue`를 삭제해 외부 참조 없는 구 여행 화면 1,199줄을 제거했다.
- App의 구 검수 프로토타입에서 티켓이 지목한 영어 눈썹 5건과 소스 검사에서 발견한 `title-en` 3건을 제거했다. 실사용·검수 라우팅, 한국어 제목, 데이터, 시뮬레이션 로직은 바꾸지 않았다.
- 공유 파일: `frontend/src/App.vue` — 직전 need_review TKT-147의 재방문 3.8초 변경을 그대로 보존하고 TKT-134는 템플릿 8줄만 삭제했다.

## 검증
- `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/` — 각각 49 modules 통과.
- 전체 unit 25/25 통과.
- 현행 여행·정적 라우팅 Chromium E2E 10/10 통과, 375/1440 × 다크/라이트 overflow 0.
- ToneTools의 8개 정적 경로 렌더 대문자 검사 2/2 통과(375 dark·1440 light, details 전체 펼침, leaf `innerText` 위반 0).
- 삭제 전·후 8경로 × 2환경 스크린샷 16쌍은 `diff -qr` 기준 바이트 동일. 375/1440의 홈·여행 화면을 육안 확인했다.
- App와 삭제 대상 이름 재검색 결과 구 프로토타입 표식·컴포넌트 참조 0. App의 `\b[A-Z]{4,}\b` 잔존은 `LINES`·`VOYAGE`·`JSON`·`POST`와 보존 대상 스플래시 문구/문자셋뿐이다.
- `git diff --check` 통과. Safari/WebKit·VoiceOver·실 Pages는 미검증이며 commit/push 없음.

## PM 추가 (2026-09-14, REV-TKT-120-r1)
- `frontend/src/components/taxiDispatch.e2e.mjs` 복귀 단계가 TKT-114 에서 제거된 격납고 `.sim-annex` 를 찾아 실패 — 현재 격납고 구조(히어로·행)에 맞게 selector 갱신. 시뮬 로직 단언은 그대로.

## PM 추가 (2026-09-15, ready 승격)
- 상태 `ready` · P3 · codex-1 큐(148·150·146·151·147 뒤). taxi E2E selector 항목은 TKT-138 에서 해소됐다 — 이 티켓 범위에서 제외. 148 이 `VoyageDailyView.vue` 를 건드리지 않으므로 충돌 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-134-r1.md`. 커밋은 147 r2 와 묶음(공유 파일).
