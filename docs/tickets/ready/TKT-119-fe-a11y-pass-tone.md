문서 상태: 작성완료

# TKT-119 `[FE]` 접근성 패스 — 톤 전환 화면 전체

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-110·111·112·113 (각 need_review 시 해당 화면부터)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: 톤 전환 화면 컴포넌트, E2E

## 목표
시각표 행·노선도 구간·정차역 시트·플랩: 키보드 도달(Tab 순서 = 시각 순서), 포커스 링 가시, `aria-pressed/aria-current/aria-expanded`, 노선도 `<a>` 에 접근성 이름(“DAY 4 · 할슈타트→잘츠부르크”), 바텀시트 포커스 트랩+ESC. 스크린리더로 홈→여행→정차역 상세까지 도달하는 E2E 1건.
