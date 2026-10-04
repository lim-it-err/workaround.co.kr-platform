문서 상태: 작성완료

# TKT-182 `[FE]` 문 닫힘 애니메이션 — 역 출발 전환(DOORS CLOSING) + 스플래시 끝 문 열림을 실제 문짝 연출로

- 상태: ready · **P1** · 담당: codex-1 · 의존: TKT-178 need_review(스플래시 타이밍 공유 — 178 뒤 바로). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박]·[구체화 질문] 의무.**
- 근거: PO 2026-10-05 "문이 닫히는 애니메이션도… 만들어줘 다시." 톤 원칙(지하철 메타포): 스플래시는 `DOORS OPENING` 문구로 끝나지만 지금은 페이드일 뿐 **문짝이 없다**. 목업 r5(2026-09-13 "티커 3회 + 문 열림 연출")의 연출이 구현에서 빠졌다.
- scope: `frontend/src/App.vue`(스플래시 종료 연출, `openPage()` 출발 전환), `frontend/src/styles.css`(문짝 2장: `.door-left/.door-right`, 전환 키프레임), `frontend/src/splashTone.e2e.mjs`·`frontend/src/staticRouting.e2e.mjs`(전환 중 overflow·reduced-motion), `frontend/public/mockups/splash.html`(r7 — 같은 연출로 목업 동기화).

## 연출 (기본값 — PO 가 보고 조정)
1. **출발(문 닫힘)**: 환승 홀에서 역·소역을 고르면 화면 양옆에서 문짝 2장이 **0.45초** 안에 중앙으로 닫힌다(노선색 hairline 가장자리, 면은 배경색과 같은 톤의 어두운 패널). 닫힌 순간 상단 플랩 한 줄 `DOORS CLOSING` (0.2초), 이어서 새 화면이 **문이 열리며** 드러난다(0.35초). 총 ≤1.0초, 두 번째 이동부터는 0.6초. 홈으로 돌아올 때도 같은 문법(닫힘 → 환승 홀 열림).
2. **도착(스플래시 끝)**: `DOORS OPENING` 정착 뒤 문짝이 양옆으로 열리며 환승 홀이 드러난다(0.5초) — 현재 페이드 교체. 178 의 총 시간(첫 방문 5초·재방문 2.5초) 안에 포함.
3. `prefers-reduced-motion`: 문짝 없이 즉시 전환(현행 유지). 키보드 포커스는 전환 뒤 새 화면 제목으로.
4. 전환 중 가로 overflow 0, 문짝은 `pointer-events:none`, 본문 스크롤 위치 보존.

## 완료 조건
1. [ ] 375/1440 × 다크/라이트 캡처 각 3컷(닫힘 중·닫힘·열림), 전환 시간 계측(E2E 가상 시계).
2. [ ] 역 이동 10회 연속에서 잔상·중복 문짝 0(상태 머신 단일), reduced-motion 즉시 전환 E2E.
3. [ ] splash E2E(178 갱신본)·staticRouting E2E 그린, 목업 `splash.html` r7 동기화.

## 질문/에스컬레이션
- (해결) PO 2026-10-05 "(a)로 해줘" — 출발 전환 + 스플래시 끝 둘 다.

## 리뷰 기록
- 없음.
