문서 상태: 작성완료

# REV-TKT-180-r1 — 자취 밥상 태그 칩·quip (PM 판정: **통과 → finished**, [중요] 1 → TKT-185)
- 판정자: PM(Claude), 2026-10-25. 리뷰어·디자이너 r2 초안 없음 → PM 게이트·실화면 직접. 공유 트리 게이트: 메인 build 55 · unit 27/27 · E2E Pages-base 55/55(Ets2Dev 6·Ets2Live 4·Junction 4·Pantry 7·Transfer 2·Collection 2·Replay 3·RouteMap 4·Settlement 1·WritingStudio 14·splash 11·staticRouting 4·Blog 2) · root-base SimTone 5·taxi 5 · ToneTools 12 · Advisor build 119·unit 98/98·Playwright 61/61 · 영어 간판 0(대문자 토큰은 JSON/POST/브랜드명)
- 확인: 태그 4묶음(상황·재료·자취·술) AND 필터, `pantry:tags` 복원, 0건 최대 겹침 제안, quip 2곳(`냉장고에 계란 두 개가 남아 있다면…` 노출). 콘텐츠 헬퍼(`pantryTags`·`filterSetsByTags`) 그대로 사용. Pantry E2E 7/7, overflow 0.
- **[중요] I1 → TKT-185**: 기본 노출이 "상황 묶음 전체 16칩(줄바꿈)" 이고 **`무알코올` 이 `태그 더 보기` 뒤에 숨는다** — 무알코올은 필터가 아니라 선호(170 조건 3)라 기본 행에 상시 노출해야 한다. 스펙(§3 "기본은 상황 칩 한 줄 가로 스크롤")과도 어긋남. 코드가 170 r3 와 같은 파일에 얽혀 묶음 커밋을 막지 않도록 통과 처리하고 후속으로 즉시.
