문서 상태: 작성완료

# TKT-119 `[FE]` 접근성 패스 — 톤 전환 화면 전체

- 상태: `need_review` (2026-09-14) · P2 · 담당: codex-1 · 의존: TKT-110·111·112·113 (모두 finished)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: 톤 전환 화면 컴포넌트, E2E

## 목표
시각표 행·노선도 구간·정차역 시트·플랩: 키보드 도달(Tab 순서 = 시각 순서), 포커스 링 가시, `aria-pressed/aria-current/aria-expanded`, 노선도 `<a>` 에 접근성 이름(“DAY 4 · 할슈타트→잘츠부르크”), 바텀시트 포커스 트랩+ESC. 스크린리더로 홈→여행→정차역 상세까지 도달하는 E2E 1건.

## PM 추가 (2026-09-14, REV-TKT-118-r1 이관)
- [중요] 라이트 테마에서 W 노선색(`--line-w` #00863E)이 글자로 쓰인 곳(환승 홀 `기지선` 라벨 SVG/목록, `junction-route-badge` W) 4.13:1 → `--line-w-text` 로 교체(`styles.css` `color: var(--line-w)` 검색). 다른 노선색의 글자 사용도 같이 검사해 4.5:1 미만 0 으로.
- (REV-TKT-129-r1) Advisor `/learn` 필터 select 4개(시간·코드 작성·형식·완료)에 `aria-label` 부여. 다른 화면의 이름 없는 select/input 도 함께 검사.

## 구현 결과

- 여행 SVG 구간과 도시를 실제 `<a>` 순서로 유지하고, 구간 이름을 `DAY 4 · 할슈타트→잘츠부르크 · …`로 고정했다. Tab으로 지나갈 때 구간 선과 도시 점에 안전색 광채가 남는 포커스 표시를 추가했다.
- 정차역 상세 시트는 열린 동안 첫·마지막 제어 사이를 Tab/Shift+Tab으로 순환한다. Escape로 닫히고 열었던 시각표 정차역으로 포커스가 복귀하도록 시트 내부 키 계약으로 한정했다.
- 환승 홀 선색은 선·텍스트 토큰을 분리했다. 선은 기존 색을 유지하고, SVG 노선명·목록 제목·원형 배지는 `--line-*-text`를 써서 다크·라이트 모두 4.5:1 이상을 확보했다.
- 스플래시 플랩은 현재 문구를 `role="img"` 이름으로 유지하고, 키보드 도달 대상인 `다시 재생`의 포커스 링과 티커 `aria-live`를 회귀 검증했다. 일차 탭·스탬프·노선도 토글의 `aria-current`·`aria-pressed`·`aria-expanded`도 보존했다.
- Advisor `/learn` 4개 select에 시간·코드 작성·형식·완료 이름을 명시했다. 추가 점검으로 Advisor의 미션 검색·파일 제출·챗·회의·검토·닉네임·설명 훈련 입력과 Work의 목표 버전·우선순위·의존성 편집에 접근 이름을 보강했다.
- `공유 파일: frontend/src/App.vue`
- `공유 파일: frontend/src/components/ToneTools.e2e.mjs`
- `공유 파일: frontend/src/components/voyage/VoyageRouteMap.vue`
- `공유 파일: frontend/src/components/VoyageRouteMap.e2e.mjs`

## 완료 게이트

- [x] 메인 프런트 unit 20/20, 기본·Pages-base build 각 48 modules 통과.
- [x] Chromium E2E 14/14 통과: 스플래시 2, 환승 홀+스크린리더 경로 2, 여행 노선·포커스 트랩 2, 톤 도구 회귀 8. 375px dark·1440px light, API 요청·브라우저 오류/경고·가로 overflow 0.
- [x] 환승 홀 노선색 텍스트 명암비 자동 측정: 375px dark·1440px light의 SVG 노선명·목록 제목·배지 전부 4.5:1 이상.
- [x] Advisor unit 74/74, build 110 modules, `/learn`·모선 프레임 Chromium E2E 8/8 통과. `/learn`의 보이는 input/select/textarea 전부 접근 이름이 있음을 DOM 계약으로 검증했다.
- [x] `git diff --check` 통과. commit/push 없음.

## 질문/에스컬레이션

- 열린 질문 없음.

## 남은 위험

- Safari/WebKit·실제 스크린리더·실 GitHub Pages 배포는 미검증이다. Advisor 빌드의 기존 초기 JS 청크 500kB 초과 경고는 남아 있다.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-119-r1.md`. 공유 파일 4 에 128 반려분 공존 → 커밋은 128 r2 판정 시 묶음.
