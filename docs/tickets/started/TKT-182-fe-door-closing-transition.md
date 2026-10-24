문서 상태: 작성완료

# TKT-182 `[FE]` 문 닫힘 애니메이션 — 역 출발 전환(DOORS CLOSING) + 스플래시 끝 문 열림을 실제 문짝 연출로

- 상태: started (2026-10-24, PM r1 반려 → r2)· **P1** · 담당: codex-1 · 의존: TKT-178 need_review(스플래시 타이밍 공유 — 178 뒤 바로). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박]·[구체화 질문] 의무.**
- 근거: PO 2026-10-05 "문이 닫히는 애니메이션도… 만들어줘 다시." 톤 원칙(지하철 메타포): 스플래시는 `DOORS OPENING` 문구로 끝나지만 지금은 페이드일 뿐 **문짝이 없다**. 목업 r5(2026-09-13 "티커 3회 + 문 열림 연출")의 연출이 구현에서 빠졌다.
- scope: `frontend/src/App.vue`(스플래시 종료 연출, `openPage()` 출발 전환), `frontend/src/styles.css`(문짝 2장: `.door-left/.door-right`, 전환 키프레임), `frontend/src/splashTone.e2e.mjs`·`frontend/src/staticRouting.e2e.mjs`(전환 중 overflow·reduced-motion), `frontend/public/mockups/splash.html`(r7 — 같은 연출로 목업 동기화).

## 연출 (기본값 — PO 가 보고 조정)
1. **출발(문 닫힘)**: 환승 홀에서 역·소역을 고르면 화면 양옆에서 문짝 2장이 **0.45초** 안에 중앙으로 닫힌다(노선색 hairline 가장자리, 면은 배경색과 같은 톤의 어두운 패널). 닫힌 순간 상단 플랩 한 줄 `DOORS CLOSING` (0.2초), 이어서 새 화면이 **문이 열리며** 드러난다(0.35초). 총 ≤1.0초, 두 번째 이동부터는 0.6초. 홈으로 돌아올 때도 같은 문법(닫힘 → 환승 홀 열림).
2. **도착(스플래시 끝)**: `DOORS OPENING` 정착 뒤 문짝이 양옆으로 열리며 환승 홀이 드러난다(0.5초) — 현재 페이드 교체. 178 의 총 시간(첫 방문 5초·재방문 2.5초) 안에 포함.
3. `prefers-reduced-motion`: 문짝 없이 즉시 전환(현행 유지). 키보드 포커스는 전환 뒤 새 화면 제목으로.
4. 전환 중 가로 overflow 0, 문짝은 `pointer-events:none`, 본문 스크롤 위치 보존.

## 완료 조건
1. [x] 375/1440 × 다크/라이트 캡처 각 3컷(닫힘 중·닫힘·열림), 전환 시간 계측(E2E 가상 시계).
2. [x] 역 이동 10회 연속에서 잔상·중복 문짝 0(상태 머신 단일), reduced-motion 즉시 전환 E2E.
3. [x] splash E2E(178 갱신본)·staticRouting E2E 그린, 목업 `splash.html` 현행 리비전 동기화.

## 질문/에스컬레이션
- (해결) PO 2026-10-05 "(a)로 해줘" — 출발 전환 + 스플래시 끝 둘 다.

## 리뷰 기록
- 구현: 앱 전역에 단일 문 전환 상태 머신을 두고 첫 역 이동은 `450ms 닫힘 + 200ms DOORS CLOSING + 350ms 열림`, 이후 이동은 `270+120+210ms`로 단축했다. 스플래시는 기존 첫 방문 5초·재방문 2.5~2.8초 총시간의 마지막 500ms를 실제 문 열림으로 사용한다.
- UX/접근성: 문짝은 배경색 계열 단색 면과 노선색 중앙 hairline만 사용하고 `pointer-events:none`으로 뒀다. `prefers-reduced-motion`은 오버레이 없이 즉시 전환하며, 완료 뒤 새 화면 제목에 포커스하고 경로별 본문 스크롤 위치를 복원한다.
- 목업: `frontend/public/mockups/splash.html`을 5초·세 문구·두 장 문 열림 및 환승 홀 링크 문 닫힘으로 동기화했다.
- 시각 검증: `/private/tmp/tkt182-doors/doors-real-{375,1440}-{dark,light}-{closing,closed,opening}.png` 12장을 직접 확인했다. 닫힘 중 중앙 틈, 완전 닫힘 불투명 면, 열림 뒤 목적 화면이 네 환경에서 일관되고 가로 overflow는 0이다.
- 검증: root/Pages-base build 각 55 modules, splash+static routing E2E 14/14, ToneTools 12/12, JunctionMap+Pantry 8/8, unit 26/26, `git diff --check` 통과. commit/push 없음.
- 공유 파일: `frontend/src/App.vue`, `frontend/src/styles.css`, `frontend/src/splashTone.e2e.mjs`, `frontend/src/staticRouting.e2e.mjs`에는 선행 need_review 티켓 변경이 함께 존재하며 기존 hunk를 보존했다.

## PM 반려 (2026-10-24, r1) — `docs/reviews/REV-TKT-182-r1.md`
- [블로커] B1 목업 스크립트 0(CSS 연출) · [중요] I1 총 5.5초, 마지막 문구 ≥0.7초 유지(문 열림 중 문구 유지), E2E 실제 DOM 제거 시각 계산.
