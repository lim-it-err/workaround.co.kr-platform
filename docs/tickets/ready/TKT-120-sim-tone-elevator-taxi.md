문서 상태: 작성완료

# TKT-120 `[SIM]` 시뮬 2화면 톤 전환 — 엘리베이터·택시

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-110, TKT-114(격납고)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/App.vue`(elevator/taxi 섹션), `frontend/src/components/ElevatorCrossSection.vue`, `frontend/src/sim/**`(표시부만), `frontend/src/styles.css`

## 목표
격납고 안 두 캐비닛의 화면을 원칙대로: 통계 타일→시각표 행, 조작 버튼만 면, 시뮬 캔버스는 그림(원칙 1 예외). 기존 시뮬 로직·테스트(082·083·094) 무접촉. **[반박] 환영** — 시뮬 화면은 조작부가 많아 원칙 1 적용이 과할 수 있다. 어디까지가 조작부인지 티켓에 제안.
