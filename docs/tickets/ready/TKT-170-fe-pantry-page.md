문서 상태: 작성완료

# TKT-170 `[FE]` 자취 밥상 페이지 `/pantry` — 오늘의 한 상·대안 2·장보기·스탬프, 취향선 P 개통

- 상태: ready · **P1** · 담당: codex-1 · 의존: TKT-169 finished(콘텐츠 있음). 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.** 스펙 `design/pantry-spec.md` §3·§5. 콘텐츠 3파일(`frontend/src/data/pantry/*`) 불가침 — 구조 문제는 [구체화 질문]으로.
- scope: `frontend/src/components/Pantry.vue`(신규), `frontend/src/App.vue`, `frontend/src/data/lines.js`(P 역 개통: `page: 'pantry'`, `access`·`upcoming` 제거, 홈 목록 행 `자취 밥상 · 오늘의 한 상: <제목>`), `frontend/src/staticRouting.js`(`/pantry`), `frontend/src/styles.css`, `frontend/src/components/Pantry.e2e.mjs`, `JunctionMap.e2e.mjs`·`junction.test.mjs`(P 개통).

## 완료 조건
1. [ ] 첫 화면(375, 스크롤 없이): 오늘의 한 상(제목·기분·시간·비용·페어링 한 줄) + `다른 상 보기` + hairline 행 `10분 대안`·`야식·한잔`. 같은 날 새로고침 시 동일 추천(`pickPantrySets(오늘)`), `다른 상 보기` 3회 중복 0(`offset`).
2. [ ] 상 펼침: 메인·반찬·국을 행으로, 행 펼침에 재료·순서. `장보기 목록` 체크(localStorage `pantry:shopping`)·`오늘 먹었음` 스탬프(`pantry:history`, 7일 중복 회피에 반영) 새로고침 보존.
3. [ ] 칩 4개(`10분`·`해장`·`손님`·`무알코올`) — `무알코올` 이면 화면에 술 이름 0(대안만), 나머지는 `when`·`minutes` 필터. 음주 권장 문구 없음.
4. [ ] 홈 P 역 개통(흐림 해제, 클릭 시 `/pantry`), 격납고식 목록 행. 375/1440 × 다크/라이트 overflow 0, 40px, 영어 간판 0, 면은 조작부만.
5. [ ] E2E 4건 + Junction 회귀, Pages-base build, unit.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
