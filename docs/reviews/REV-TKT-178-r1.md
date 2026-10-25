문서 상태: 작성완료

# REV-TKT-178-r1 — 스플래시 플랩 속도 상향 (PM 판정: **통과 → finished**, 182 와 묶음)
- 판정자: PM(Claude), 2026-10-24. 리뷰어 미기동 → 디자이너 UX 초안 + PM 게이트·실화면. 공유 트리(need_review 7장 + 168) 게이트: 메인 build 55 · unit 27/27 · E2E Pages-base 51/53(**Ets2Dev 1·2 red — `VITE_ETS2_DEV_API` 없는 Pages 빌드에서 `/ets2/dev` 가 정적 모드로 떨어져 `.ets2-dev-page` 미노출, 174 r2 에서 스텁·빌드 플래그 자급**) · root-base SimTone 5·taxi 5 · ToneTools 12 · Transfer 2/2(174 가 정합) · Advisor build 119·unit 98/98·Playwright 61/61
- 디자이너 UX-178: B0/I0/S0 — 실시간 첫 문구별 0.766~0.935초·재방문 1.842~1.884초 읽기 확보, 32캡처. 첫 방문 5초·재방문 2.5초.
- [구체화 질문] 답: `docs/feature-definition.md` Splash 조건을 5초(재방문 2.5초, 문 연출 포함)로 PM 이 갱신했다 — PO 지시가 우선.
- 주의: 이후 TKT-182 가 같은 타이밍 위에 문 열림을 얹으면서 마지막 문구 읽기 시간을 0.38~0.46초로 깎았다(UX-182 I1) — 182 r2 에서 복구. 178 자체는 통과.
