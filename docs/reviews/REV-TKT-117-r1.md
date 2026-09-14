문서 상태: 작성완료

# REV-TKT-117-r1 — 정차역 상세 편집 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(48 modules), node 19/19. 구현자 VoyageRouteMap Chromium 375 dark·1440 light 2/2 인정.
- 실화면(localhost:7010/voyage, 390 모바일): DAY 3 → `Papa's` 정차역 클릭 → 바텀시트에 식당명·먹은 것·현지 금액/통화(1031 CZK)·원화 금액(66500)·메모·구글 지도 링크(새 탭)·사진 입력 + 하단 고정 `정차역 저장` 막대 확인. 원화 70000·메모 "코젤이 좋았다" 저장 → 저장 즉시 상단 지출 523→524만원, `localStorage` 키 `voyage:east-europe-2026:days` 생성. 새로고침 후 시트 재개봉 시 70000·메모 그대로 복원(캡처 확인). 가로 overflow 0, 콘솔 오류 0.
- 완료 조건 1(입력→새로고침→복원) 2(요금·합계·누적 갱신) 3(저장 버튼 가시성) 모두 실화면·E2E 근거로 충족.
- [제안] 시트를 열어야만 입력값이 보인다 — 시각표 행에 "메모 있음"/"사진 n" 같은 1글자 표식이 있으면 현장에서 어느 정차역을 채웠는지 한눈에 안다. 후속(112 톤 정합 또는 별도)에서 검토.
- [제안] 사진 1.5MB×4 상한은 폰 원본(3~6MB)에 걸린다 — 저장 전 캔버스 축소(긴 변 1600px) 후속 티켓 후보.
- **커밋 경계 메모**: 117 인계(02:48) 직후 codex-1 이 TKT-112 를 착수(02:50)하며 같은 파일 `voyage/VoyageRouteMap.vue`(02:53)·`VoyageRouteMap.e2e.mjs`(02:56)를 다시 수정했다(≥900px 항상 펼침 리스너·뷰포트 왕복 E2E). 117 만 hunk 분리 커밋은 신뢰할 수 없어 **117 커밋은 112 판정 시 한 커밋으로 묶고 본문에 티켓별 파일 목록을 적는다(AS-R007 규칙)**. 117 단독 파일: `voyage/voyageRoute.js`, `voyage/voyageRoute.test.mjs`, `staticWritingState.js`, `staticWritingState.test.mjs`. 공유 파일: `voyage/VoyageRouteMap.vue`, `components/VoyageRouteMap.e2e.mjs`.
