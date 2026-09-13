문서 상태: 작성완료

# TKT-126 `[FE]` 순환선 심볼 C안 적용 + 파비콘 + 스플래시 보드 높이

- 상태: ready · P1 (소형) · 담당: codex-1 · 의존: 없음 (TKT-110 finished). 브랜치 codex/v0.7.0-tone. UX 1순위·[반박] 의무.
- 근거: D-018. 시안 `frontend/public/mockups/loop-symbol.html` 안 C. 목업 `home.html`(r11) 환승 홀 표기 참고.
- scope: `frontend/src/components/tone/SiteLoopSymbol.vue`, `frontend/public/favicon*`·`index.html`(파비콘 링크), `frontend/src/App.vue`(스플래시 보드 높이)·`styles.css`

## 목표
1. `SiteLoopSymbol.vue` 를 C안(열린 기점: 링 + 12시 틈 ≈36° + 기점 점)으로 교체 — 24px 상단바·스플래시 대형 공통. 2. 파비콘을 같은 심볼로(16·32·SVG), 라이트/다크 배경 대비 확인. 3. 스플래시 플랩보드 높이를 **한 줄 + 여백**으로 줄이고 '알림' 티커 상자의 면을 hairline 행으로(REV-110 [제안]).

## 완료 조건
16px 파비콘에서 링·틈·점이 식별됨(스크린샷 첨부) · 스플래시 375px 에서 보드 빈 영역 제거 · splashTone E2E 그린.
