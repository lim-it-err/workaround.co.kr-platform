문서 상태: 작성완료

# TKT-145 `[FE]` 홈 노선도 SVG 역 버튼 hit area ≥40px

- 상태: ready · P1 · 담당: codex-1 · 의존: TKT-139 finished. 브랜치 `codex/v0.7.0-tone`. **병합 전**(UX-TKT-139-r1 [중요] I1).
- scope: `frontend/src/components/JunctionMap.vue`(역 그룹에 투명 히트 원), `JunctionMap.e2e.mjs`(SVG 역 8개 bbox 단언)
## 목표
W·R·D·P(흐림·토스트 역)와 개통 역 B·V·A·S 모두 SVG 그룹 안에 **투명 원(r≥20, `pointer-events: all`)** 을 두어 실제 hit area 40×40 이상. 시각 크기·라벨·토스트 동작 무변경. 실측(375): D 31.55×18.63 · P 31.76×18.42 · W 35.35×16.17 · R 51.78×14.36.
## 완료 조건
1. [ ] 375/1440 × 다크/라이트에서 SVG 역 8개 `getBoundingClientRect` ≥ 40×40 — E2E 단언(기존 hitTargets 에 SVG 그룹 추가).
2. [ ] 139 토스트·136 겹침 검사 그린, build.
## 질문/에스컬레이션
- 없음.
## 리뷰 기록
- 없음.
