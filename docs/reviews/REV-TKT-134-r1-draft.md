문서 상태: 작성완료

# REV-TKT-134-r1-draft — 죽은 뷰·프로토타입 블록 정리 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-134(REV-TKT-128 [제안] 이관 — 제가 TKT-119 검증 중 발견해 언급했던 죽은 CSS/뷰 정리 부류와 같은 계열).

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch 확인. `git status`로 삭제 확인: `VoyageArchiveView.vue`·`VoyageDailyView.vue`·`voyage/VoyageDaySession.vue` 3개 파일이 실제로 `D`(deleted) 상태.
- 메인 unit 전체 — **25/25 통과**(22 기존 + `voyageImport.test.mjs` 3건 — 이건 TKT-134 소관이 아닌 공존 콘텐츠 작업의 신규 파일로 판단, 삭제 대상과 무관하게 통과).
- root/Pages-base build 각 **49 modules 통과**(삭제 전과 module 수 동일 — 애초에 참조되지 않던 코드였다는 방증).
- `VoyageRouteMap.e2e.mjs`(2)+`VoyageCollection.e2e.mjs`(2)+`staticRouting.e2e.mjs`(4) = **10/10 통과**.
- `ToneTools.e2e.mjs`(root 빌드) — **12/12 통과**, 그중 "전 정적 경로의 렌더 영어 대문자 간판은 0건이다"(375 dark·1440 light 2개)가 티켓이 말한 "8경로 대문자 검사 2/2"에 해당 — 별도 신규 테스트가 아니라 기존 회귀 게이트가 계속 그린임을 확인.

## 완료 조건 대조 — 제거 대상 직접 재확인

- `grep -n "QA Route\|UI-v0.5.0 Junction\|Prototype Lines\|UX Pivot\|Mobile Route\|TAXI DISTRICT LAB\|CREW BOARD\|SIGNAL ROOM" frontend/src/App.vue` → **0건**, 티켓이 지목한 8개 영어 라벨 전부 제거 확인.
- `grep -oE "\b[A-Z]{4,}\b" frontend/src/App.vue`로 잔존 대문자 토큰 전수 확인: `JSON`·`POST`(기술 토큰), `VOYAGE`·`LINES`(식별자), `WORKING`·`OPENING`·`MIND`·`DOORS`·`AROUND`(스플래시 3문구 "WORKING AROUND"/"MIND THE GAP"/"DOORS OPENING" — 톤 원칙상 의도적 보존 대상), 알파벳 문자열 1건(플랩 애니메이션용 문자셋으로 추정) — 전부 티켓이 주장한 "데이터 토큰·보존 대상 스플래시 문구만 남음"과 일치, 새로운 영어 눈썹 잔존 없음.

## 상태 제안 (판정은 PM)

블로커 0. 제거 대상·잔존 확인 전부 코드 레벨로 재현했다. **finished 전환 권장.**
