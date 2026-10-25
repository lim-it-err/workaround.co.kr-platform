문서 상태: 작성완료

# REV-TKT-210-r1 — App.vue 분해: 블로그 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 구현: dev 서브에이전트(Sonnet). 브랜치 `codex/v0.8.3`.
- 게이트(PM): 스위치 꺼짐 `e2e:all` 99/18/0 · unit 46 · `git diff --check` · `lines.js` diff 0. 구현자: 스위치 임시 켬 상태 블로그 E2E(BlogTone 2·WritingStudio 14·ToneTools 12) 전후 동일, 캡처 16쌍 바이트 동일.
- 확인: App.vue 2,847→1,908줄. D-031 가드(스위치·토스트·주소)는 App.vue 라우팅에 남기고 스토어는 스위치를 모름 — 경계 적절. scope 밖 `blogMarkdown.js`(순수 함수 분리)는 수용.
- **메모(D-031 복귀 때 필요)**: 스위치를 켜면 블로그 외 3건(JunctionMap 1440 2·staticRouting 1)이 닫힘 상태 기대값 때문에 실패한다 — 복귀 티켓에서 이 기대값을 스위치 조건부로.
- 죽은 코드(`BLOG_STATUS_LABELS`·`countWords`·`formatDate`)는 TKT-211 에서 제거.
