문서 상태: 작성완료

# REV-TKT-145-r1 — 홈 노선도 SVG 역 버튼 hit area ≥40px (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 `REV-TKT-145-r1-draft.md`(통과 권고, 블로커 0) 채택.
- PM 게이트(2026-09-15 저녁, 워킹 트리 = 142·145·148·150 + 146 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base 로 **52/52**(Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·Transfer 2·SimTone 5·taxi 5·ToneTools 12; splash 는 TKT-146 이 재작성 중이라 제외) · Advisor build 110 · unit **81/81** · Playwright **48/48**.
- PM 실화면(dev 7010, `elementFromPoint` 검사): **375** — 큰 역 8개(B·V·A·S·D·P·W·R) 투명 히트 원 **40.5×40.5px**, 각 역의 점 중심·라벨 중심이 모두 **자기 역**으로 해석됨(겹침 오클릭 0). 세부 역(아카이브·격납고…)은 375 에서 `display:none`(목록이 대신) — 회귀 아님. **1440** — 히트 원 75.6px, 세부 역 11개 원·글자 중심이 모두 자기 그룹(큰 역 히트 원이 가리지 않음, 레이어 순서 조정 확인).
- 리뷰어가 스플래시 타이머 정지로 육안을 생략한 부분은 PM 이 실측으로 보완.
- [제안] r=48 은 viewBox 상 인접 큰 역 간격(D–P 70.7·B–R 84.2)보다 커 **역 사이 빈 공간**에서는 나중에 그려진 역이 이긴다. 점·라벨 위는 정확하므로 수용. 접근성 검수(TKT-161)에서 키보드 포커스 순서와 함께 재확인.
- 커밋 범위: `frontend/src/components/JunctionMap.vue`, `frontend/src/components/JunctionMap.e2e.mjs`.
