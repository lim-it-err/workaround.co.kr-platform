문서 상태: 작성완료

# TKT-118 `[FE]` 라이트 테마 톤 정합 — 새 톤의 토큰 매핑

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-110
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/styles.css`(`[data-theme='light']` 블록), 각 화면 라이트 검수

## 목표
목업은 다크 전용. 라이트 테마에서 원칙(면은 조작부만·hairline·노선색은 선)이 유지되도록 토큰만 매핑: 바탕 off-white, hairline 검정 9%, 노선색은 라이트 변형(기존 `--line-*` 라이트 값), 배지 대비 4.5:1. **[구체화 질문] 환영** — 라이트에서 순환선 노선도 대비가 약하면 대안 제시.
