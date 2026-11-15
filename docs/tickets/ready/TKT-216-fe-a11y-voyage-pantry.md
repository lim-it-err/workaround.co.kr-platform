문서 상태: 작성완료

# TKT-216 `[FE]` 접근성 패치 — 숨은 파일 입력·모바일 지도 도시 타깃·밥상 끝 칩 가시성 (+ 밥상 main 중첩)

- 상태: ready · **P1 · v0.8.4** · 담당: dev 서브에이전트(**Sonnet 5.5**) · 브랜치 `codex/v0.8.4`(작업 트리 `/Users/imjeonghan/newProject/wa-084`).
- 근거: codex-9 `docs/reviews/UX-A11Y-2026-10.md` I1·I2·I3 [중요] + S2 일부, 라이브 v0.8.2 기준 Chromium 재현. v0.8.3(`1b47b02`)에서 해당 코드 변경 없음.
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/Pantry.vue`, `frontend/src/styles.css`(해당 블록만), 관련 E2E(`VoyageRouteMap.e2e.mjs`·`Pantry.e2e.mjs`).
- 범위 밖: S1(운영 노트 desktop 힌트)·S2 환승 홀/여행 h1 — v0.9 블랙 디자인에서 화면 골격과 함께 정리. VoiceOver·Safari 실기기 — codex-9 재검수.

## 목표
키보드·터치 사용자가 여행·자취 밥상에서 보이지 않는 곳으로 포커스를 잃거나, 너무 작은 타깃을 눌러야 하는 문제 3건을 없앤다. 보이는 디자인은 바꾸지 않는다.

## 완료 조건
1. **I1** `/voyage` 백업 복원·사진 추가의 숨은 `input[type=file]`(`VoyageRouteMap.vue:985`, `:1147`)이 Tab 순서에 없다(`tabindex="-1"` 등). 보이는 `백업 복원`/사진 버튼이 유일한 진입점이며, 버튼으로 파일 선택이 그대로 열린다. 기존 `setInputFiles` E2E 유지 + 「백업 복원 다음 Tab 이 1×1 입력이 아니다」 E2E 추가.
2. **I2** 375px `/voyage` 노선도 펼침 상태에서 각 도시 상세 링크의 실제 조작 영역(getBoundingClientRect 또는 투명 hit 영역) 세로 ≥ 40px. 도시 간 hit 영역 겹침 0(인접 도시 중심 클릭이 각자 자기 도시로 간다). 표시 점·글자 크기는 바꾸지 않는다. 1440 기존 동작 불변. E2E 로 375 측정 단언.
3. **I3** 375px `/pantry` 깨끗한 저장소에서 Tab 으로 기본 칩 끝(현재 마지막 칩)까지, Shift+Tab 으로 처음 칩까지 이동할 때 포커스된 칩의 사각형이 스크롤 행 사각형 안에 **완전히** 들어오고, 칩 중심 `elementFromPoint` 가 그 칩이다. 실시간(가짜 시계 없이) 500ms 대기 후 측정. `mask:none` 단언만으로 통과 처리 금지. 1440 불변.
4. **S2 일부** 밥상 화면 접근성 트리의 `main` 이 1개(App.vue `<main>` 안의 `Pantry.vue:257` `<main>` → `section` 등). `aria-labelledby="pantry-title"` 유지.
5. 게이트: `npm --prefix frontend run build`, unit 전체, `npm --prefix frontend run e2e:all` 기준선(99 pass / 18 skip / 0 fail) 이상, `git diff --check`. 375/1440 다크 캡처 각 화면 1장씩 `docs/history` 또는 티켓에 경로 기록.

## 구현 메모
- I3 원인 추정: 칩 행이 `overflow-x` 스크롤인데 오른쪽에 `태그 더 보기` 토글이 겹쳐 마지막 칩이 토글 뒤로 들어간다(칩 x240.55~295, 행 오른쪽 248.34). 행 끝 여백(scroll-padding-inline-end / 패딩 스페이서)과 포커스 시 `scrollIntoView({inline:'nearest'})` 계열 중 덜 침습적인 쪽. 재현 스크립트 `docs/reviews/UX-A11Y-2026-10-assets/pantry-focus.cjs`.
- I2: SVG 안 각 도시 `<a>` 에 투명 `rect` hit 영역(가로는 라벨 폭, 세로 ≥40px 를 viewBox 축소 비율로 환산)을 두는 방식 권장. 지도 아래 목록을 새로 만드는 안은 디자인 변경이라 이번 범위 아님.
- 콘텐츠 문자열은 바꾸지 않는다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- (대기)
