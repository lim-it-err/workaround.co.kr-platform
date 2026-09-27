문서 상태: 작성완료

# TKT-145 `[FE]` 홈 노선도 SVG 역 버튼 hit area ≥40px

- 상태: finished (2026-09-15, PM r1 통과) · P1 · 담당: codex-1 · 의존: TKT-139 finished. 브랜치 `codex/v0.7.0-tone`. **병합 전**(UX-TKT-139-r1 [중요] I1).
- scope: `frontend/src/components/JunctionMap.vue`(역 그룹에 투명 히트 원), `JunctionMap.e2e.mjs`(SVG 역 8개 bbox 단언)
## 목표
W·R·D·P(흐림·토스트 역)와 개통 역 B·V·A·S 모두 SVG 그룹 안에 **투명 원(r≥20, `pointer-events: all`)** 을 두어 실제 hit area 40×40 이상. 시각 크기·라벨·토스트 동작 무변경. 실측(375): D 31.55×18.63 · P 31.76×18.42 · W 35.35×16.17 · R 51.78×14.36.
## 완료 조건
1. [x] 375/1440 × 다크/라이트에서 SVG 역 8개 `getBoundingClientRect` ≥ 40×40 — E2E 단언(기존 hitTargets 에 SVG 그룹 추가).
2. [x] 139 토스트·136 겹침 검사 그린, build.
## 질문/에스컬레이션
- 없음.
## 리뷰 기록
- 2026-09-15 codex-1: SVG 큰 역 8개에 시각적으로 투명한 r=48 hit 원을 추가했다. 375px에서 r=46은 실제 높이 38.84px로 게이트가 실패해 r=48로 조정했고, 최솟값 40.53px 이상을 확보했다. 투명 원이 데스크톱의 인접 세부 역 `격납고`를 가리는 회귀를 재현한 뒤 세부 역 레이어를 앞으로 올려 기존 클릭 우선순위를 보존했다.

## 구현 내역
- `.junction-station-hit`은 `fill: transparent`, `pointer-events: all`이며 기존 원·코드·라벨의 시각 크기를 바꾸지 않는다.
- E2E가 SVG 역 8개의 bbox·반경·pointer-events를 4환경에서 단언하고, 큰 역 hit 원이 세부 역 중심점을 가리지 않는지도 검사한다.
- 공유 파일: `docs/tickets/board.md`, `docs/history/2026-09-15.md`(직전 need_review TKT-142 기록 보존).

## 검증
- 메인 unit 22/22, root/Pages-base build 각 49 modules 통과.
- `JunctionMap.e2e.mjs` Chromium 4/4: 375/1440 × dark/light, SVG 역 8개 ≥40×40, r≥20·pointer-events all, W/R/D/P 토스트·URL 불변·2.5초 제거, 글자/노선 겹침 0, 세부 역 클릭 우선, 가로 overflow 0.
- 4환경 새 캡처를 직접 비교해 역·라벨·노선의 시각 크기와 흐림이 바뀌지 않음을 확인했다. Safari/WebKit·VoiceOver·실 Pages 배포는 미검증이며 commit/push 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-145-r1.md`.
