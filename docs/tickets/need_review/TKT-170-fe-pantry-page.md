문서 상태: 작성완료

# TKT-170 `[FE]` 자취 밥상 페이지 `/pantry` — 오늘의 한 상·대안 2·장보기·스탬프, 취향선 P 개통

- 상태: need_review (2026-10-05, r2 재작업 완료)· **P1** · 담당: codex-1 · 의존: TKT-169 finished(콘텐츠 있음). 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.** 스펙 `design/pantry-spec.md` §3·§5. 콘텐츠 3파일(`frontend/src/data/pantry/*`) 불가침 — 구조 문제는 [구체화 질문]으로.
- scope: `frontend/src/components/Pantry.vue`(신규), `frontend/src/App.vue`, `frontend/src/data/lines.js`(P 역 개통: `page: 'pantry'`, `access`·`upcoming` 제거, 홈 목록 행 `자취 밥상 · 오늘의 한 상: <제목>`), `frontend/src/staticRouting.js`(`/pantry`), `frontend/src/styles.css`, `frontend/src/components/Pantry.e2e.mjs`, `JunctionMap.e2e.mjs`·`junction.test.mjs`(P 개통).

## 완료 조건
1. [x] 첫 화면(375, 스크롤 없이): 오늘의 한 상(제목·기분·시간·비용·페어링 한 줄) + `다른 상 보기` + hairline 행 `10분 대안`·`야식·한잔`. 같은 날 새로고침 시 동일 추천(`pickPantrySets(오늘)`), `다른 상 보기` 3회 중복 0(`offset`).
2. [x] 상 펼침: 메인·반찬·국을 행으로, 행 펼침에 재료·순서. `장보기 목록` 체크(localStorage `pantry:shopping`)·`오늘 먹었음` 스탬프(`pantry:history`, 7일 중복 회피에 반영) 새로고침 보존.
3. [x] 칩 4개(`10분`·`해장`·`손님`·`무알코올`) — `무알코올` 이면 화면에 술 이름 0(대안만), 나머지는 `when`·`minutes` 필터. 음주 권장 문구 없음.
4. [x] 홈 P 역 개통(흐림 해제, 클릭 시 `/pantry`), 격납고식 목록 행. 375/1440 × 다크/라이트 overflow 0, 40px, 영어 간판 0, 면은 조작부만.
5. [x] E2E 4건 + Junction 회귀, Pages-base build, unit.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 구현: `/pantry` 오늘 추천·대안·조건 칩·차림 상세·장보기·식탁 기록과 P 역 개통. 콘텐츠 3파일은 변경하지 않음.
- 검증: Pages-base 정적 build 통과, Pantry E2E 4/4, Junction E2E 4/4, unit 26/26, `git diff --check` 통과.
- 시각 검증: 375/1440 × 다크/라이트 4종 스크린샷 직접 확인 — 가로 넘침 0, 모바일 첫 화면에 대안 2행까지 노출, 읽기 행 무면·조작부만 면 유지.

## PM 반려 (2026-10-05, r1) — `docs/reviews/REV-TKT-170-r1.md`
- [블로커] B1 `다른 상 보기` 뒤 한 상이 대안 행과 같은 세트 → `pickPantrySets(…, { offset })` 로 세 자리 재계산, E2E 단언 추가. 그 외 통과.

## r2 재작업 기록 (2026-10-05)
- `다른 상 보기`의 주인공·10분 대안·야식 대안을 동일한 `pickPantrySets(dateKey, { offset, ... })` 결과에서 함께 갱신하도록 바꿨다. 대안 직접 선택 시에도 선택한 주인공을 제외한 묶음으로 두 대안을 다시 계산한다.
- Pantry E2E에 첫 추천과 `다른 상 보기` 1·2·3회 각각 세 칸의 제목이 모두 다른지 단언을 추가해 r1 재현을 회귀로 고정했다.
- 검증: Pages-base build 55 modules, Pantry E2E 4/4, Junction E2E 4/4, unit 25/25, static routing, `git diff --check` 통과. 레이아웃·스타일 변경 없음. 콘텐츠 3파일은 이 티켓에서 변경하지 않았다.
