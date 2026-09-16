문서 상태: 작성완료

# REV-TKT-147-r2 — 재방문 플랩 읽기 시간·저장 안내 원 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-16. 리뷰어 초안 `REV-TKT-147-r2-draft.md`(통과, 안전장치 구조 확인) + 디자이너 `UX-TKT-147-r2.md`(실난수 4환경 정착→페이드 **1.479~1.641초**, r1 I1 미재현, 신규 0) 채택.
- PM 게이트(2026-09-16 아침, 워킹 트리 = 147r2·157·158 + 미커밋 146·134·152~156): 메인 Pages-base build 49 · unit 25/25 · splash **7/7**(최악 난수 케이스 포함)·Junction 4·staticRouting 4·Blog 2·RouteMap 4 · WritingStudio **11/13**(375 dark/light `.writing-room` 간헐 1px overflow — 코드 결함, TKT-164 로 병합 전 처리) · ToneTools 12/12 · Advisor build 119(경고 0) · unit **98/98** · Playwright **60/60**.
- r1 블로커 B1 반영 확인(`App.vue` diff): 전환 = `min(4.0s, max(3.8s, 정착+1.0s))`, 정착 상한 2.8초(초과 시 최종 문구로 스냅), 재방문 플랩은 compact 시퀀스로 정착을 앞당김, 최악 난수 E2E 1건 추가(6→7). `다시 재생`·첫 방문 10초 무변경.
- 커밋: 146(`splashTone.e2e.mjs`)·134(`App.vue` 템플릿 삭제·컴포넌트 3 삭제)와 **묶음 커밋**(U-32 ③).
