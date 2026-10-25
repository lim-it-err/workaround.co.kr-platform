문서 상태: 작성완료

# REV-TKT-182-r2 — 문 닫힘 애니메이션 (PM 판정: **통과 → finished**, 178 과 묶음)
- 판정자: PM(Claude), 2026-10-25. 리뷰어·디자이너 r2 초안 없음 → PM 게이트·실화면 직접. 공유 트리 게이트: 메인 build 55 · unit 27/27 · E2E Pages-base 55/55(Ets2Dev 6·Ets2Live 4·Junction 4·Pantry 7·Transfer 2·Collection 2·Replay 3·RouteMap 4·Settlement 1·WritingStudio 14·splash 11·staticRouting 4·Blog 2) · root-base SimTone 5·taxi 5 · ToneTools 12 · Advisor build 119·unit 98/98·Playwright 61/61 · 영어 간판 0(대문자 토큰은 JSON/POST/브랜드명)
- B1: 목업 `splash.html` `<script>` 0(grep), keyframes·`:target` 연출 확인. I1: 첫 방문 5.5초로, 문 열림 0.5초 동안 마지막 문구 DOM 유지 — PM 실측(1440 재방문 흐름): `DOORS OPENING` 0.4초~2.0초 유지(1.6초) → 2.0초 `door-transition opening` → 2.4초 환승 홀. splash E2E 11/11(실제 제거 시각 기준).
