문서 상태: 작성완료

# REV-TKT-136-r1 — 홈 노선도: 세 노선이 환승 홀을 직선으로 통과 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14 21:5x. 리뷰어(Claude Sonnet 5) 초안 `REV-TKT-136-r1-draft.md` 채택 — 목업 r16 좌표 1:1 대조·unit 21/21·E2E 4/4·실화면 3콤보 확인. PM 재실행: Pages base build **49 modules**, unit **21/21**, `JunctionMap.e2e.mjs` **4/4**(375/1440 × dark/light: 텍스트 겹침 0·노선-텍스트 교차 0·overflow 0·대비·서브링크·딥링크·키보드). codex-5(AS-R009 재검증)도 같은 결과.
- 실화면(localhost:7010 `/`, 1440·390): 기록선 수평(블로그–환승 홀–여행), 기지선 북서–남동(Runtime–환승 홀–Work), 실험선 북동–남서(Advisor·미스터리 트레인 실선, 발견·취향 점선) — 목업 r16 과 같은 배치. 모바일은 큰 역 8개 이름만, 노선명 3개, 아래 3묶음 목록 유지. 스크린샷 육안 겹침 0.
- scope 4파일만 변경(`lines.js`·`JunctionMap.vue`·`JunctionMap.e2e.mjs`·`junction.test.mjs`), 공유 파일 없음. codex-1 은 착수 직후 r15→r16 티켓 교체를 감지하고 r16 만 반영([구체화 질문][해결] 기록 — 좋은 처리).
- [제안] 리뷰어가 `.claude/launch.json` 에 7099 포트 항목을 추가함(루트, 저장소 밖) — 유지.
- 커밋 범위: `frontend/src/data/lines.js`, `frontend/src/components/JunctionMap.vue`, `frontend/src/components/JunctionMap.e2e.mjs`, `frontend/src/data/junction.test.mjs`.
