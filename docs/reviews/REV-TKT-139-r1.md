문서 상태: 작성완료

# REV-TKT-139-r1 — 홈 노선도 기지선·예정 역 흐림 + 같은 화면 토스트 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-139-r1-draft.md` 채택. PM 재실행(2026-09-15 10:xx): 메인 Pages-base build 49 modules · unit 22/22 · E2E 스위트별 올바른 base 로 58/58(Blog 2·Junction 4·Transfer 2·Collection 2·Replay 3·RouteMap 4·splash 6(단독 재실행, 배치 병렬 시 1건 타이밍 실패)·staticRouting 4·WritingStudio 9(Pages preview 4174)·SimTone 5·taxi 5(root preview 4175)·ToneTools 12) · Advisor build 110 · unit 81/81 · Playwright 46/46.
- 실화면(375 dev): SVG `Work Manager · 보호 구역 · 준비 중` 역 클릭 → URL 불변, `role=status` 토스트 `보호 구역 · 준비 중` 표시 → 3초 후 사라짐. 리뷰어 통과, 디자이너 UX-TKT-139-r1 [중요] I1: 새 SVG 역 버튼 실제 hit area 14~26px(40 미만) — 흐림·카피·키보드·단일 토스트·2.5초 소멸은 확인.
- **[중요] I1 → TKT-145**(투명 히트 원 r≥20 으로 40px 확보, 병합 전). 139 자체는 D-021 문법 충족으로 통과.
- 커밋 범위: `frontend/src/data/lines.js`, `frontend/src/components/JunctionMap.vue`, `frontend/src/components/JunctionMap.e2e.mjs`, `frontend/src/data/junction.test.mjs`; 공유 `styles.css`. 138·139·140·143·144 는 공유 파일(`App.vue`·`styles.css`·`lines.js`·`JunctionMap.vue`·`ToneTools.e2e.mjs`)이 겹쳐 **한 커밋**(U-32), 141 은 단독 커밋.
