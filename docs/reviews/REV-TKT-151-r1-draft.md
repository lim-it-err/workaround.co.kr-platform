문서 상태: 작성완료

# REV-TKT-151-r1-draft — 여행 시각표 행 기록 표식 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-151(REV-TKT-117-r1 [제안] 이관). 의존 TKT-141 finished 확인.

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch 확인. `git diff -- frontend/src/components/voyage/VoyageRouteMap.vue`를 직접 읽고 `stopRecordMarker()` 함수 로직을 코드 레벨로 대조했다: 메모·사진·지출 각각 있을 때만 `labels`/`parts`에 추가하고, 셋 다 없으면 `null` 반환 → 템플릿의 `v-if="entry.recordMarker"`로 DOM 자체가 사라진다. `aria-label`은 `labels.join(', ')`로 "메모 있음, 사진 1장, 지출 3만원" 형태를 실제로 만들어냄을 확인 — 티켓 예시와 일치.
- `node --test src/components/voyage/voyageRoute.test.mjs src/data/voyageCoverage.test.mjs` — **2/2 통과**.
- `npm run build -- --base=/workaround.co.kr-platform/` — 49 modules 통과(메인 unit 22/22는 TKT-146/147 검증과 공유 재확인).
- `VoyageRouteMap.e2e.mjs`(Pages-base 자체 호스팅) — **4/4 통과**(375·1440 × 다크·라이트).

## 완료 조건 대조

1. **행 높이 불변, hit area ≥40, overflow 0** — E2E 4/4 안에 포함.
2. **기록 저장→표식 갱신, 삭제→소멸** — 같은 4/4에 포함, 코드 레벨로 위 `stopRecordMarker` null 반환 경로 확인과 정합.
3. **접근 이름 `aria-label`** — 위 코드 대조로 직접 확인.

## [참고] 같은 파일에 공존하는 TKT-148 변경분

`git diff`에서 `VoyageRouteMap.vue`에 `route-day-links`(링크 행) 섹션 추가가 함께 보이는데, 이는 TKT-151 완료 조건 어디에도 없다 — board 확인 결과 `[콘텐츠]` 태그의 TKT-148("남은 일정 링크 행")의 미커밋 변경이 같은 파일에 공존하는 것으로, 리뷰어 지침상 `[콘텐츠]` 티켓은 코드 리뷰 대상이 아니라 이번 검증에서 다루지 않았다. TKT-151 자체의 scope 이탈은 아니다.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.** (커밋 시 TKT-148 변경분과 섞이지 않게 경로 지정 필요 — 공통 CLAUDE.md §6.)
