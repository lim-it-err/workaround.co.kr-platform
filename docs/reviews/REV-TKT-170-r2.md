문서 상태: 작성완료

# REV-TKT-170-r2 — 자취 밥상 (PM 판정: **반려 → started**, [중요] 2 — UX 1순위)
- 판정자: PM(Claude), 2026-10-24. 리뷰어 미기동 → 디자이너 UX 초안 + PM 게이트·실화면. 공유 트리(need_review 7장 + 168) 게이트: 메인 build 55 · unit 27/27 · E2E Pages-base 51/53(**Ets2Dev 1·2 red — `VITE_ETS2_DEV_API` 없는 Pages 빌드에서 `/ets2/dev` 가 정적 모드로 떨어져 `.ets2-dev-page` 미노출, 174 r2 에서 스텁·빌드 플래그 자급**) · root-base SimTone 5·taxi 5 · ToneTools 12 · Transfer 2/2(174 가 정합) · Advisor build 119·unit 98/98·Playwright 61/61
- 통과: r1 블로커(한 상 = 대안 중복) 해소 — PM 실화면 4회 클릭 중복 0, Pantry E2E 4/4, 칩 4·overflow 0·40px. UX-170(디자이너 첫 보고, B0/I3).
- PM 처리(콘텐츠): I1 무알코올 대안 문구의 술 이름 제거(`sets.js` alt 3건, 검사 0건) · I3 `quickIsFallback` 플래그 추가(`pickPantrySets` — 15분 이내 후보가 없으면 가장 짧은 세트 + 플래그). 자취 태그 7종 추가(181 보고서).
- **[중요] I2 → 재작업**: 대안 행(`10분 대안`·`야식·한잔`)을 고르면 선택된 칩(무알코올 포함)이 전부 해제된다 — 메뉴 선택과 선호는 분리, 대안 이동에도 칩 유지. PM 실화면 재현(무알코올 켠 뒤 대안 클릭 → `aria-pressed=false`).
- **[중요] I3 → 재작업(라벨)**: `quickIsFallback` 이면 행 라벨 `빠른 대안`(시간 표기 유지), 아니면 `10분 대안`.
- 커밋 보류(공유 App.vue·lines.js·staticRouting). r3 는 180(태그 칩)과 함께 해도 좋다.
