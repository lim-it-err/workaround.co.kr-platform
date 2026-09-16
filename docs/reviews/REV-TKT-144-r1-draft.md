문서 상태: 작성완료

# REV-TKT-144-r1-draft — 정적 공개본 범위 정합: 격납고·택시 공개, 엘리베이터 흐림 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-144(UX-TONE-FINAL I3, D-022). 의존 TKT-139 need_review 확인(완화 규칙상 착수 가능).

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch(`codex/v0.7.0-tone`) 확인. `git diff --stat`로 scope 확인: `App.vue`·`JunctionMap.vue`·`lines.js`·신규 `staticRouting.e2e.mjs`(App.vue·JunctionMap.vue는 138/139/140/143과 공존, 티켓 자기 진술과 일치).
- 메인 Node unit 22/22, root/Pages-base build 각 49 modules — TKT-141과 동일 스위트로 재확인, 그린.
- `staticRouting.e2e.mjs`(신규, Pages-base 자체 호스팅) — **4/4 통과**: 375·1440 × 다크·라이트에서 `/sim`·`/taxi` 직접 진입, 택시 클라이언트 시뮬 지표 변화(약 5.4초 관찰 — 실제 시간 경과로 확인, mock 아님), API 호출 0, `/work`·`/runtime` 환승 홀 복귀, 엘리베이터 흐림+토스트+overflow 0.
- `JunctionMap.e2e.mjs` — **4/4 재확인 통과**(S 하위 역이 격납고·엘리베이터·택시·화이트채플 4개로 늘어난 뒤에도 회귀 없음).
- `lines.js`에서 신규 필드 직접 확인: 엘리베이터에 `staticAccess:'server'`, 화이트채플에 `access:'planned'` — 티켓의 데이터 계약 설명과 일치.
- **라이브 확인**(Pages-base 프리뷰, 375px): `/voyage` 진입 시 "달린 거리 985km / 약 1,515km"(DAY 8/11, 9월 15일 · 부다페스트)를 직접 확인 — TKT-141이 고정한 것은 **테스트의 시계**이지 제품 자체는 계속 실제 날짜로 진행 중임을 재확인(제품 동작 자체는 의도대로임).

## 완료 조건 대조

1. **Pages-base dist에서 `/sim`·`/taxi` 진입·동작, `/elevator` 정책, `/work`·`/runtime` 복귀** — `staticRouting.e2e.mjs` 4/4로 확인.
2. **홈 노선도 S 역·작은 역 4환경, 139 토스트 재사용** — 같은 4/4 안에 포함, `JunctionMap.e2e.mjs` 재확인으로 회귀 없음 교차 확인.
3. **정적 라우팅 unit·기존 E2E 그린, build** — 위 unit 22/22·build 49/49로 확인.

## [구체화 질문] 처리 확인

티켓이 자체 제안한 "`/elevator` 직접 진입은 화면 미리보기로 열되 조작부 `inert`" 방식이 실제로 반영됐는지 `App.vue`의 `inert` 속성 바인딩을 grep으로 확인했다 — 존재함. 코드 레벨 확인이며, 실기기 스크린리더로 `inert` 무장 여부까지는 검증하지 못했다(남은 위험에 이미 명시된 범위와 일치).

## [참고] TKT-138 블로커 최신 상태

TKT-141 리뷰에서 기록한 대로, 현재(TKT-144까지 반영된) 트리에서 `WritingStudio.e2e.mjs`를 재확인해도 **9/9 통과** — REV-TKT-138-r1-draft의 overflow 블로커는 이 시점 기준 재현되지 않는다. 중복 서술을 피하기 위해 상세 근거는 REV-TKT-141-r1-draft를 참조.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.**
