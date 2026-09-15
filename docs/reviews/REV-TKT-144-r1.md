문서 상태: 작성완료

# REV-TKT-144-r1 — 정적 공개본 범위 — 격납고·택시 공개, 엘리베이터 흐림+토스트 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-144-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 리뷰어 통과(`/elevator` 직접 진입은 미리보기로 열되 조작부 `inert` — 구현자 [구체화 질문] 자체 제안 채택 확인). staticRouting unit·E2E 4/4, SimTone 5/5, JunctionMap 4/4. D-022 대로 `/sim`·`/taxi` 정적 허용, `/work`·`/runtime` 복귀 유지.
- [PM 의문] `/elevator` 미리보기+`inert` 는 "보이지만 못 만진다" — 정지값 화면이 오해를 줄 수 있어 상단 hairline 안내 한 줄 문구를 다음 검수에서 확인(TKT-145 와 함께 codex-8 검수 요청).
- 커밋 범위: `frontend/src/staticRouting.js`, `frontend/src/staticRouting.test.mjs`; 공유 `App.vue`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.
