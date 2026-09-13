문서 상태: 작성완료

# TKT-121 `[FE]` Developer Advisor 화면 톤 정합

- 상태: ready · P2 · 담당: codex-6 · 의존: TKT-110 (토큰), TKT-104
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `services/advisor/frontend/src/**`(불가침 콘텐츠 파일 제외), 테스트

## 목표
079 로 모선 룩앤필은 맞췄으나 새 톤(행·hairline·주인공 1·영어 간판 0)은 미반영. 홈·미션·게임·시즌 페이지를 원칙대로. 콘텐츠 파일(`sampleContent.js`·`sampleProjects.js`) 무접촉. unit/E2E 회귀 그린.

## PM 메모 (2026-09-14)
- 착수 전 디자이너의 Advisor UX/UI 전면 검수(`docs/reviews/UX-ADVISOR-2026-09-14.md`)를 입력으로 삼는다 — 톤 정합만이 아니라 [원점 재검토]/[개선] 항목을 이 티켓(또는 분할 티켓)에서 반영. 감사팀 원점 재검토(AS-R###-advisor-rethink)는 구조, 디자이너 검수는 화면 — 둘 다 입력.
