문서 상태: 작성완료

# REV-TKT-121-r1 — Advisor 3표면 뼈대 + 톤 정합 + 초안 보호 (PM 판정: **통과 → finished**, [중요] 1 → TKT-130)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **63/63**(11 files), build **104 modules**. 구현자 Playwright 27/27 인정. 콘텐츠 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) diff 없음 확인.
- 실화면(127.0.0.1:5173, 390×900 dark / 1440 light):
  - **오늘** `/` → `/today`. 전역 메뉴 정확히 `오늘 / 배우기 / 기록` 3개. 첫 화면에 대상명 `사라지는 적립금 · 1일차` + 주 CTA `오늘의 첫 판 시작`(h44) 하나, `오늘 전체 보기 0/3`·`오프라인 세션 만들기` 접힘. 기내 시간/취향 칩 h40. 영어 대문자 간판 0, overflow 0, 콘솔 오류 0.
  - **redirect 7건 실측**: `/missions`→`/learn`, `/games`→`/learn#practice`, `/projects`→`/learn#projects`, `/season`→`/history#season`, `/missions/history`→`/history`, `/routine`→`/today`, `/inflight`→`/today#offline`. 상세 딥링크 `/missions/s1-wine-01` 정상.
  - **초안 저장(§4)**: 제출 탭에서 파일명(실제 키 입력)·본문·`+ 파일 추가` 2번째 본문·설명 훈련 탭 설명 입력 → `advisor.drafts.v1["s1-wine-01:developer"] = {files:[2], description, updatedAt}`, `저장됨 오전 04:41` 표시 → 배우기 왕복·새로고침 뒤 4값 전부 복원. (PM 테스트 데이터는 검증 후 제거.)
  - **복귀·문구**: ReviewPage `다음 미션으로`(목록행) 제거 → `기록에 저장됨` + `내 기록 보기` + 진입 표면 복귀 라벨(`returnSurface`). 미션 탭 4개·파일 제거 `✕` h40.
  - **배우기/기록** 라이트 1440: hairline 구분, 히어로 1. 배우기의 미션 필터 12칩 박스는 129 범위대로 유지.
- **[중요] 기록 진입 시 닉네임 모달 `✕` → `/today` 이동** — `/history` 첫 진입에 "기록에 이름을 남깁니다" 모달이 뜨고, 닫으면 기록이 아니라 오늘로 튕긴다(실측). 이름 없이도 기록 열람은 가능해야 하고 닉네임은 제출 시점에 요구하는 게 맞다. 기존(079 이전) `/missions` 복귀 의미를 `/today` 로 옮긴 것이라 121 반려 사유로 삼지 않고 **TKT-130 에 항목 추가**.
- [제안] 기록의 `S1~S11 스테이지 진행 현황`·`0 제출한 미션 수` 통계 면 — 원칙 1 관점에서 hairline 행으로 낮추는 검토(129 통합 인덱스 뒤).
- 커밋 범위: `services/advisor/frontend/{e2e,src/app,src/modules/missions/{components,pages,routes.js,store}}`.
