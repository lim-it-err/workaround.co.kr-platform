문서 상태: 작성완료

# REV-TKT-164-r1 — 글쓰기 375 상단바 간헐 1px 넘침 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-16 밤. 리뷰어 초안 없음 — PM 직접(릴리스 게이트 red 해소 티켓).
- 변경: `WritingStudio.vue` scoped `.writer-save` 에 `min-width: 0; overflow: hidden; text-overflow: ellipsis` — PM 진단(flex 자식 6개 고정 + 저장 문구 칸이 `min-width:auto` 로 축소 불가) 그대로. 티켓이 `styles.css` 라고 적은 경로는 PM 오기, 구현자가 실제 규칙 위치에서 최소 수정(정정 타당). E2E: 작성 중·저장됨·저장 실패·백업 안내 4상태 × 가시 버튼의 컨테이너 경계·40px 계약 + `.writer-save` computed 계약 단언.
- PM 게이트: Pages-base build 49 · unit 25/25 · WritingStudio — 공유 포트 4174 배치 루프에서는 run1 13/13 후 run2~5 가 375 두 건 red(다른 워커 브라우저 20개·부하 6 구간, 원인 미확정), **격리 포트 4176 에서 현재 트리 새 빌드로 3회 연속 13/13** + 구현자 5회 연속 13/13 · ToneTools 12/12 · Blog 2 · staticRouting 4
- 커밋 범위: `frontend/src/components/WritingStudio.vue`, `frontend/src/components/WritingStudio.e2e.mjs`.
