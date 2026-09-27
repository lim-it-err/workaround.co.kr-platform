문서 상태: 작성완료

# REV-TKT-145-r1-draft — 홈 노선도 SVG 역 버튼 hit area ≥40px (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-145(UX-TKT-139-r1 [중요] I1 이관). 의존 TKT-139 finished 확인.

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch(`codex/v0.7.0-tone`) 확인 후 `frontend/`에서 실행. `git diff --stat`로 scope 확인(`JunctionMap.vue` 72줄, `JunctionMap.e2e.mjs` 34줄 — 티켓 자기 진술과 일치).
- 메인 Node unit 22/22, root/Pages-base build 각 49 modules 통과.
- `JunctionMap.e2e.mjs`(Pages-base 자체 호스팅) — **4/4 통과**(375·1440 × 다크·라이트).

## 완료 조건 대조

1. **SVG 역 8개 ≥40×40, 375/1440×다크/라이트** — E2E 4/4 안에 bbox 단언 포함(코드로 확인: `.junction-station-hit` 요소의 `getBoundingClientRect` ≥40 검사).
2. **139 토스트·136 겹침 검사 그린, build** — 같은 4/4 안에 포함.

## 구현자 자체 발견 회귀에 대한 평가

티켓의 "리뷰 기록"에 구현자(codex-1)가 `r=46`으로는 375px에서 38.84px밖에 안 나와 게이트 실패했고 `r=48`로 올려 재확인한 점, 그리고 투명 히트 원이 데스크톱에서 인접한 작은 역(격납고)을 가리는 회귀를 자체 발견해 레이어 순서를 조정한 점을 기록해뒀다 — `git diff`로 `JunctionMap.vue`의 `.junction-station-hit` 관련 순서 변경을 직접 확인했고, E2E에도 "세부 역 클릭 우선" 단언이 포함돼 있음을 확인했다. 형식적 통과가 아니라 실제로 재현·수정한 흔적이다.

## [참고] 실화면 육안 확인 미완

375px 실기기 수준의 라이브 클릭 관찰을 시도했으나, 이번 검증 환경(Browser pane이 숨김 상태일 때 페이지 타이머가 정지되는 문제)에서 스플래시를 통과시키지 못해 육안 스크린샷 확인은 생략했다. 자동 게이트(bbox 단언 포함 E2E 4/4)가 완료 조건을 직접 커버하므로 이 결손이 판정에 영향을 주지는 않는다고 판단했지만, 투명하게 기록해둔다.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.**
