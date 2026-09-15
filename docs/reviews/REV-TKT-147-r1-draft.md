문서 상태: 작성완료

# REV-TKT-147-r1-draft — 디자이너 제안 소묶음: 재방문 읽기 시간·저장 안내 원 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-147(UX-TKT-140-r1 S1 + UX-TKT-138-r1 S1). 의존 TKT-140·138 finished 확인. TKT-146의 가상 시계 인프라 위에서 구현됨.

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch 확인. `git diff --stat`: `App.vue`(2줄)·`styles.css`(19줄)·`splashTone.e2e.mjs`(TKT-146과 공유)·`WritingStudio.e2e.mjs`(27줄) — scope와 일치.
- `git diff -- frontend/src/App.vue` 직접 대조: `SPLASH_RETURN_DURATION_MS = 3000` → `3800` 한 줄이 유일한 제품 코드 변경 — 목표(총 3.6~4.0초) 안에 정확히 들어간다.
- 메인 unit 22/22, root/Pages-base build 각 49 modules 통과(TKT-146 검증과 공유 재확인).
- `node --test src/splashTone.e2e.mjs` — **6/6 통과**(TKT-146 인프라 위에 TKT-147 정착 관찰 추가).
- `node --test src/components/WritingStudio.e2e.mjs`(Pages-base 프리뷰, 고정 포트 4174) — **13/13 통과**(기존 9 + 신규 4환경).

## 완료 조건 대조

1. **재방문 정착~전환 ≥1.0초, 첫 방문·다시 재생 회귀 0** — splashTone 6/6 안에 포함. 3800-2600(대략 정착 시각)이 1000ms 이상이라는 티켓 서술과 App.vue의 3800ms 값이 일치.
2. **저장 안내 원 computed 지름 28px·hit ≥40 (375/1440)** — WritingStudio 13/13 안에 신규 4환경 서브테스트로 포함.
3. **375/1440×다크/라이트 스크린샷, overflow 0** — 같은 13/13 안에서 확인(overflow 단언은 기존부터 있던 공통 헬퍼 재사용을 `git diff`로 확인).

## [구체화 질문] 처리 확인

"저장 안내 DOM이 `WritingStudio.vue` 소유인데 scope엔 없다"는 질문에 대해 컴포넌트 파일을 건드리지 않고 전역 `styles.css`에 `::before` 의사 요소로 28px 원만 추가하는 방식을 택했다고 기록했다 — `git diff -- frontend/src/styles.css`로 실제로 `WritingStudio.vue` 무수정, `styles.css`에만 원 관련 규칙이 추가된 것을 확인했다. scope 우회가 아니라 scope 안에서 목표를 달성한 합리적 선택으로 판단.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.**
