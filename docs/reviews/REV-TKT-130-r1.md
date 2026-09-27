문서 상태: 작성완료

# REV-TKT-130-r1 — Advisor 흐름 결함(Probe 순서·기내 빈 상태·결과→기록·닉네임 게이트) (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **66/66**, build **116 modules**. 구현자 Playwright 35/35(전용 5건 포함) 인정. 콘텐츠 3파일 diff 없음. 공유 파일(`ReviewPage`·`PracticeGamePage`) 은 124 커밋 뒤라 경계 깨끗함.
- 실화면(127.0.0.1:5173, 390):
  - **Probe** `/games/probe`: 관측 선택 → 화면이 관측 결과(`결제사 호출 p99는…` y548)로 이동하고 바로 아래 `결과와 맞닿은 가설 하나를 지목하세요`(y597) → `무엇이 원인일까요?`(y678) 가설 3개(y716~). 역방향 안내(`위의 가설`) 0. 완료 조건 1 충족.
  - **기내** `/today` › 오프라인 세션: `3분 한 판` + `운영` → `조건에 맞는 콘텐츠가 없습니다 · 10분 세 판으로 바꾸면 바로 시작할 수 있습니다` + `시간 늘리기` 1회 → `35개 선택 가능`, 추천 3행. 완료 조건 2 충족(원인 맞춤 CTA).
  - **기록** `/history`: 닉네임 모달 없이 진입·체류(익명 열람). 완료 조건 5 충족. 리뷰→기록 1회 이동(조건 3)은 E2E 근거 인정.
- **미해결(이 티켓 밖으로)**: PM 추가 5번(코스 시뮬 `생각해 볼 질문` 빈 절)은 codex-1 착수 뒤에 추가돼 구현 내역에 없음 — 실측 여전히 제목만. 디자이너 `UX-TKT-124-r1` 의 시뮬 집계 [블로커]와 함께 **TKT-131** 로 묶는다(같은 파일).
- 커밋 범위: `services/advisor/frontend/{e2e/advisor-flow-defects.spec.ts, src/modules/missions/pages/{HistoryPage,InflightPage,PracticeGamePage,ProbeGamePage,ReviewPage}.vue}`.
