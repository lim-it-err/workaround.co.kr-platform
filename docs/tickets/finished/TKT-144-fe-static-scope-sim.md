문서 상태: 작성완료

# TKT-144 `[FE]` 정적 공개본 범위 정합 — 격납고·택시 공개, 엘리베이터는 흐림+토스트

- 상태: finished (2026-09-15, REV-TKT-144-r1 통과) · P1 · 담당: codex-1 · 의존: TKT-139 need_review 시. 브랜치 `codex/v0.7.0-tone`. **병합 전**(홈 노선도의 S 역이 공개본에서 거짓 목적지가 되지 않도록). **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: UX-TONE-FINAL I3 — 현재 `staticMode` 제외 집합이 `/sim /taxi /elevator /work /runtime` 전부를 환승 홀로 되돌린다(`App.vue:31·2219·2933·3044`). D-022.
- scope: `frontend/src/App.vue`(staticMode 제외 집합·진입 정책), `lines.js`(S 하위 역 access 플래그), `JunctionMap.vue`(139 토스트 재사용), `staticRouting` 테스트·E2E

## 목표
1. 정적 공개본에서 **`/sim`(격납고)·`/taxi`(심야 택시)** 허용 — 택시는 클라이언트 시뮬이라 서버 없이 동작한다(dev 확인: 5초 관찰에 지표 변화). 격납고 히어로 `멈춘 엘리베이터` 는 정적에서 **흐림 + 토스트 `서버 시뮬 · 정적 공개본에서는 준비 중`**(139 문법), `심야 택시` 는 `시작` 그대로.
2. `/elevator` 직접 진입(정적): 화면은 열되 상단에 hairline 한 줄 `정적 공개본 — 서버 시뮬은 준비 중, 화면만 봅니다` 표시(정지값 오해 방지). 또는 격납고로 되돌리며 토스트 — 구현자 [구체화 질문]으로 택1 제안.
3. `/work`·`/runtime` 은 D-021(139)대로 노선도 흐림+토스트, 직접 진입 시 현행 환승 홀 복귀 유지.
4. 홈 노선도 S 하위 작은 역(격납고·엘베·택시·화이트채플 예정): 엘베는 정적에서 흐림, 화이트채플은 107 전까지 예정 점선.

## 완료 조건
1. [x] Pages-base dist 에서 `/sim`·`/taxi` 진입·동작(택시 지표 변화) E2E, `/elevator` 정책 E2E, `/work`·`/runtime` 복귀 유지.
2. [x] 홈 노선도 S 역·작은 역 표현 4환경 확인, 139 토스트 재사용.
3. [x] 정적 라우팅 unit·기존 E2E 그린, build.

## 질문/에스컬레이션
- **[구체화 질문][제안 적용]** `/elevator` 직접 주소는 상단 hairline으로 `정적 공개본 — 서버 시뮬은 준비 중, 화면만 봅니다`를 밝히고 읽기 전용 미리보기로 연다. 직접 URL은 사용자의 명시적 의도이므로 화면을 숨기지 않되, 격납고·홈의 일반 진입은 흐림+같은 화면 안내로 막아 실시간 운행 오인을 피한다. PM이 격납고 복귀 안을 선호하면 승인 전 교체 가능하다.

## 구현 내역
- 정적 제외 정책을 Work·Runtime(검수 레일 Ops·Signals 포함)만으로 줄여 `/sim`·`/taxi`·`/elevator` 직접 경로를 열었다. API 폴링은 정적에서 계속 꺼지고, 택시의 클라이언트 시뮬레이션 타이머만 1.2초 간격으로 돌아간다.
- 격납고의 `멈춘 엘리베이터`는 정적에서 흐림 처리하고 CTA를 `준비 중`으로 바꿘 누른 자리 근처(모바일은 하단)에 2.5초 안내를 남겼다. `심야 택시`는 `시작`과 진입을 그대로 유지했다.
- 엘리베이터 직접 미리보기는 `화면 미리보기`로 상태를 바꾸고 본문 조작부를 `inert`로 잠갔다. 정지 fallback을 실시간 데이터로 오인하거나 조작이 저장된다고 느끼지 않게 한다.
- S 하위 정류장을 격납고·엘리베이터·택시·화이트채플 4개로 분리했다. 엘리베이터에는 `staticAccess: 'server'`, 화이트채플에는 `access: 'planned'`를 두고 SVG 정류장·목록 서브링크가 같은 흐림·점선·토스트 문법을 쓴다.
- 정적 모바일 빠른 환승에 `승강장`을 복구해 공개된 격납고·택시에 다시 진입할 수 있게 했다.
- 공유 파일: `frontend/src/App.vue`·`frontend/src/styles.css`(TKT-140·143), `frontend/src/data/lines.js`·`frontend/src/components/JunctionMap.vue`(TKT-139), `docs/tickets/board.md`·`docs/history/2026-09-15.md`. 선행 미커밋 한크를 보존한 채 TKT-144 변경을 이어 붙였다.

## 검증
- 메인 Node unit 22/22 통과. 정적 제외 집합과 S 하위 4역 데이터 계약을 단위 검사에 고정했다.
- 신규 `staticRouting.e2e.mjs` Chromium 4/4 통과: 375·1440 × 다크·라이트에서 세 직접 경로, 택시 5초 지표 변화, API 호출 0, Work·Runtime 환승 홀 복귀, 엘리베이터 흐림 불투명도·토스트·overflow 0을 확인했다.
- 기존 JunctionMap 4/4, 라이브 SimTone 5/5, taxi dispatch 5/5(무인 30.5초 포함), Pages 블로그 2/2·여행 목록 2/2·회고 3/3·Writing Studio 9/9·splash 6/6, 병합 산출물 여행↔Advisor 2/2 통과.
- `npm --prefix frontend run build`과 Pages-base build 각 49 modules, Advisor nested-base build 110 modules·Pages 병합 참조 5+2 통과. 실 Pages 배포·Safari/WebKit·VoiceOver는 미검증이며 commit/push 없음.
- 전체 정적 E2E 추가 스윕의 `VoyageRouteMap.e2e.mjs` 2건은 오늘 날짜를 따라 지표가 진행하는 제품과 달리 2026-09-14의 `740km`를 고정 기대해 2026-09-15에 red였다. 본 티켓 변경 파일과 무관한 기존 시각 의존 테스트로 분리 기록하고 제품의 당일 지표는 별도 unit에서 통과했다.

## 리뷰 기록
- 없음.
- r1 (2026-09-15, PM): **통과 → finished**. `docs/reviews/REV-TKT-144-r1.md`.
