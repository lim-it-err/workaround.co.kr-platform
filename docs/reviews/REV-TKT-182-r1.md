문서 상태: 작성완료

# REV-TKT-182-r1 — 문 닫힘 애니메이션 (PM 판정: **반려 → started**, [블로커] 1·[중요] 1)
- 판정자: PM(Claude), 2026-10-24. 리뷰어 미기동 → 디자이너 UX 초안 + PM 게이트·실화면. 공유 트리(need_review 7장 + 168) 게이트: 메인 build 55 · unit 27/27 · E2E Pages-base 51/53(**Ets2Dev 1·2 red — `VITE_ETS2_DEV_API` 없는 Pages 빌드에서 `/ets2/dev` 가 정적 모드로 떨어져 `.ets2-dev-page` 미노출, 174 r2 에서 스텁·빌드 플래그 자급**) · root-base SimTone 5·taxi 5 · ToneTools 12 · Transfer 2/2(174 가 정합) · Advisor build 119·unit 98/98·Playwright 61/61
- 통과: 출발 전환(문짝 2장·노선색 중앙선·`DOORS CLOSING`)·도착 문 열림 양테마 순서 성립(UX-182 캡처 58장), reduced-motion 즉시, 14/14.
- **[블로커] B1**: 목업 `splash.html` r7 에 `<script>`(setTimeout·rAF·링크 가로채기) — 목업은 스크립트 0 규칙(U-30·디자이너 체크리스트). → CSS keyframes/`:target` 로 연출, 링크는 일반 링크.
- **[중요] I1**: 첫 방문 마지막 문구가 정착 후 0.38~0.46초 만에 사라짐(4환경, 178 의 ≥0.7초 계약 위반) — 총 5초에서 문 열림 500ms 를 단순 차감한 탓. PM 결정: **총 5.5초로 늘려 문구 읽기 ≥0.7초를 지키고**, 문 열림 중에도 마지막 문구는 유지(문짝이 열리며 문구가 뒤로 사라지는 연출). E2E `measureFirstVisitReadTimes` 는 실제 DOM 제거 시각으로 계산하도록 정정(178 기대값도 함께).
- 커밋 보류(178 과 묶음).
