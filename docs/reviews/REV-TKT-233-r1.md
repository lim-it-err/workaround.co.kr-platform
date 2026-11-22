문서 상태: 작성완료

# REV-TKT-233-r1 — lite 에서 유로트럭 빼기 (PM, 2026-11-22)

판정: **통과** (블로커 0)

## 근거
- diff 직접 확인: `HALL_LITE_ITEMS` 3개(여행·자취 밥상·운영 노트), `lite/index.js` 에서 ets2 매핑 삭제 → App.vue 분기상 lite 에서 `/ets2` 는 기본 화면. `LiteEts2.vue` 삭제.
- 구현자 게이트(잠금 스크립트, 다른 티켓 진행 중 트리): Pages base 빌드 OK, `Lite.e2e.mjs`+`HallV09.e2e.mjs` pass 27 · fail 0 · skip 2. unit 56/56. 화면 티켓(229·231·232) 병합 뒤 PM 이 전체 게이트를 다시 돈다.

## 지적
- `[제안]` `hallBoard.js` 주석 「역 이름 6개만」이 낡았다(지금 3개). 다음 손질 때.
- `[제안]` `Lite.e2e.mjs` 3화면 테스트가 crumb 문구를 단언한다 — 화면 티켓이 crumb 를 바꾸면 거기서 맞춘다.
