문서 상태: 작성완료

# REV-TKT-105-r2 — Writing Studio 도구 메뉴 · 인라인 블록 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. r1 블로커·중요 해소 확인.
- PM 실화면(localhost:7010/studio, 1440·390): '표 삽입' → 커서 위치 인라인 2×2 표 즉시 생성, 다이얼로그 없음, `＋ 열`/`＋ 행`/셀 `⋯`/행·열 삭제 존재, textarea/input 어디에도 표 토큰·data URL 미노출(자동 검사 tokenLeak=false), `← 블로그` 모바일 표시, 제목 자동 높이, 390 overflow 0. build(Pages base)·node 11/11 그린. 구현자 E2E 9/9 인정.
- [제안] 표 블록 하단의 전폭 '표 삭제' 버튼은 면이 커 원칙 1 에 무겁다 — 셀 `⋯` 메뉴로 흡수(TKT-114 톤 정합에서). 텍스트 블록은 여전히 마크다운 textarea(## 헤딩 노출) — 이 티켓 범위 밖, 114/블록 에디터 후속.
- **커밋 경계 메모**: 워킹트리에 TKT-110(blocked) 진행분이 `App.vue`·`styles.css`·`StationHeader.vue`·`components/tone/`·`splashTone.e2e.mjs` 로 공존. 105 커밋은 `WritingStudio.vue`·`WritingStudio.e2e.mjs` 만 담고, App.vue/styles.css 의 105 연결부 hunk 는 110 커밋에 동반 — 110 리뷰가 그 hunk 를 포함 검증한다.
