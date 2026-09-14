문서 상태: 작성완료

# TKT-128 `[FE]` 원칙 4 잔존 일소 — 영어 눈썹 라벨·구 보드 라벨·빈 수치 노출

- 상태: started (2026-09-14, **r1 반려 → 재작업**) · P3 · 담당: codex-1 · 의존: TKT-114 finished
- 스펙: `design/tone-principles-2026-09-09.md` 원칙 4(영어 간판 0) + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/VoyageIndexView.vue`, `frontend/src/App.vue`(Work 접힌 상세 블록), `frontend/src/styles.css`, 관련 테스트

## 목표
톤 전환 시리즈가 지나간 뒤 남은 영어 눈썹 라벨·숫자 0 노출을 화면 단위로 걷어낸다. 기능·데이터 구조는 바꾸지 않는다.

## 완료 조건
1. [x] `/voyage` 일차 패널 "이 날의 기록" 위 `ACTUAL`(`VoyageRouteMap.vue:687` 근처) 제거 또는 한글 눈썹(`기록`)으로.
2. [x] Work 접힌 상세(`App.vue` `tone-work-manager-details` 내부) 의 영어 눈썹 라벨(`VERSION HEADER` 등 `.eyebrow`)을 한글로 — 목록을 구현 기록에 남긴다. 구 보드의 기능(5레인·상세 편집·command gate)은 그대로.
3. [x] 여행 목록 지난 여행 행: 도시 수 0 이면 `0개 도시` 를 숨긴다(`노선도` 만).
4. [ ] 전 화면 375/1440 에서 대문자 영어 눈썹 라벨 0 — 검사 방법(정규식 `\b[A-Z]{4,}\b` 등)과 결과를 구현 기록에.
5. [x] build + 기존 테스트 그린.

## 구현 메모
- REV-TKT-112-r1·REV-TKT-114-r1 에서 이관. 라이트 테마(118)와 무관 — 토큰이 아니라 카피.

## 구현 결과

- 여행 일차 기록 눈썹 `ACTUAL`을 `기록`으로, 정차역 상세의 `DAY n`을 `n일차`로 바꿨다. 지난·예정 여행의 도시 수가 0이면 보조문구에서 수치를 생략하고 각각 `노선도`·`준비 중`만 표시한다.
- Work 접힌 지원 상세의 `.eyebrow`를 `Version Header → 목표 버전`, `Worker Visibility → 담당 현황`, `Priority Policy → 우선순위 정책`, `Persistence → 저장 방식`, `Next Pick Hint → 다음 작업 예상`으로 바꿨다.
- 같은 눈썹 스타일로 보이던 지원 상세의 큐·저장 안내와 구 보드 상세 필드도 한글화했다. 상태값·버전값과 5레인, 상세 편집, command gate 동작은 유지했다.
- 공유 파일: `frontend/src/components/voyage/VoyageRouteMap.vue` — 직전 TKT-125의 여행↔Advisor 환승 변경을 그대로 보존하고 이 티켓의 카피만 수정했다.

## 검증

- Pages base build: `npm run build -- --base=/workaround.co.kr-platform/` 통과(48 modules).
- 전체 프런트 unit: 20/20 통과.
- Chromium: `VoyageCollection` 375 dark·1440 light 2/2, `VoyageRouteMap` 375 dark·1440 light 2/2, `ToneTools` Work 집중 검증 375 dark·1440 light 2/2 통과. 브라우저 오류·경고·API 호출 회귀와 가로 overflow 0.
- Work DOM의 `.tone-work-page .eyebrow` 텍스트에 정규식 `\b[A-Z]{4,}\b`를 적용해 두 뷰포트 모두 0건을 확인했다. `ACTUAL`·`0개 도시` 부재와 `기록`·`n일차`·한글 보드 필드 목록을 E2E로 고정했다.
- 375px 다크·1440px 라이트 캡처에서 여행 목록의 `노선도` 단독 표기, 정차역 상세 `3일차`, Work 접힌 상세와 5레인·편집·command gate 배치를 직접 확인했다.
- 첫 Work E2E 시도는 Pages-base artifact를 루트(`/`) 테스트 서버로 열어 앱 로드가 실패했다. 기본 base로 재빌드해 2/2 통과시킨 뒤 Pages-base build를 다시 통과시켰다.
- Safari/WebKit·실제 GitHub Pages 배포는 미검증. commit/push 없음.

## PR 준비 메모

- 제목: `fix(frontend): remove residual English eyebrow labels`
- 본문: Voyage 기록·상세 카피와 빈 도시 수를 정리하고 Work 접힌 상세·구 보드 안내 라벨을 한글화한다. 기능·데이터 구조는 유지한다.
- 검증: 프런트 unit 20/20, 관련 Chromium E2E 6/6, Pages-base build 48 modules.
- 미검증: Safari/WebKit, 실제 Pages 배포.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## PM 답변 r1 (2026-09-14, 반려 — `docs/reviews/REV-TKT-128-r1.md`)
- [블로커] Runtime 접힌 상세 `오프라인·배포 기준` 안 `.eyebrow` `Routing Rules`·`Release Path` 가 CSS uppercase 로 영어 간판 렌더 → 한글화(`라우팅 규칙`·`배포 경로`).
- 검사 방법 교체: 전 정적 경로 × 375/1440, `details` 모두 펼친 뒤 leaf `innerText`(text-transform 반영)에 `\b[A-Z]{4,}\b` — 결과표를 구현 기록에. `.eyebrow` textContent 만 보면 놓친다.
- [제안] `infra / chore` 태그 처리 명시. 렌더되지 않는 잔존 눈썹(App.vue junction 프로토타입 블록, Voyage 구 뷰 3파일)은 렌더 여부만 기록 — 삭제는 별도 티켓.

## 리뷰 기록
- r1 (2026-09-14, PM): **반려 → started**. 블로커 1(Runtime 눈썹 2 + 검사 범위), 제안 2.
