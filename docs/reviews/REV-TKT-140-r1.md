문서 상태: 작성완료

# REV-TKT-140-r1 — 스플래시 재방문 3초(localStorage 플래그) + 패널 면 제거 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-140-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 리뷰어 통과, 디자이너 UX-TKT-140-r1: 첫 방문 10초·재방문 3초·`다시 재생` 10초·저장소 예외·패널 투명 4환경 확인, [제안] S1(재방문 마지막 문구 정착 시간). splash E2E 6/6.
- PM 실화면: `splash:seen` 플래그 기록 확인. 시간 계측은 브라우저 패널 숨김 시 타이머가 멈춰 무효 — E2E·디자이너 실측 채택. 배치 병렬 실행에서 10초 타이밍 테스트 1건 실패 후 단독 6/6 → [제안] 타이밍 허용치 완화(후속).
- 커밋 범위: `frontend/src/splashTone.e2e.mjs`; 공유 `App.vue`·`styles.css`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.
