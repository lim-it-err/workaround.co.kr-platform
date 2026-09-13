문서 상태: 작성완료

# TKT-116 `[FE]` 여정 노선도 회고 모드 — 열차 점 재생 (종착 후)

- 상태: ready · P2 · 담당: codex-6 · 의존: TKT-109 (need_review 시)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`(109 산출), 관련 테스트

## 목표
`design/voyage-route-map-spec.md` §4-6. ▶ 누르면 열차 점이 일차 순서로 노선을 달리며 시각표 카드가 자동으로 넘어간다. 일시정지·속도 2단. `prefers-reduced-motion` 시 단계 이동만. 여행 status `arrived` 에서만 기본 노출.
