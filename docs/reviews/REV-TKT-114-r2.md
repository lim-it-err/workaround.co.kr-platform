문서 상태: 작성완료

# REV-TKT-114-r2 — 스튜디오 정합 + 격납고·Work·Runtime 톤 전환 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(48 modules), node unit 20/20. 구현자 ToneTools Chromium 8/8·WritingStudio 9/9 인정.
- r1 블로커 2건 해소 확인(localhost:7010, 390·1440): **격납고** — 히어로 `추천 시나리오 · 시스템 설계 / 멈춘 엘리베이터 / 재시도와 상태 복구를 설계합니다. / 시작`, 행 `제품 판단 / 심야 택시 / 제한된 정보로 안전한 선택을 만듭니다. / 시작` — 목업 r2 문구 그대로, `Elevator Station`·`Taxi District Lab` 표시 0, 데이터 `displayName` 매핑(`App.vue:844·856`)이라 `name`·딥링크 보존. **Runtime** — 상태 열 `지연·중단·정상·지연`, raw 영어 토큰 0(`runtimeStatusMeta`, `App.vue:866-878`); 개발 서버(게이트웨이 없음)라 응답 시간은 없어 상태만 표시 — 정상 분기.
- 회귀: 스튜디오 `.writer-page` x358·w720, `글 도구` x1098 유지. Work 히어로·3행·접힌 상세 2 유지. 4화면 overflow 0, 대문자 영어 간판 0.
- [중요→128] Work 접힌 상세 내부 영어 눈썹 라벨은 TKT-128 에서.
- [제안] 스튜디오 모바일 `표 삭제` 전폭 버튼 → `⋯` 메뉴 접기(선택).
- 커밋 범위: `frontend/src/App.vue`, `frontend/src/components/WritingStudio.vue`, `frontend/src/styles.css`, `frontend/src/components/ToneTools.e2e.mjs`.
