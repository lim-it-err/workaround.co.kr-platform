문서 상태: 작성완료

# TKT-124 `[FE]` Advisor 코스 컨테이너 — 코스 = 정류장, 미션 형식 3종

- 상태: ready · P1 · 담당: codex-1 · 의존: TKT-121(톤 정합) need_review 시. 브랜치 codex/v0.7.0-tone. **UX 1순위·[반박] 의무.**
- 스펙: `design/advisor-course-spec.md` §1
- scope: `services/advisor/frontend/src/modules/missions/**`(콘텐츠 파일 제외 — `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js` 불가침), routes, store, 테스트

## 목표
`courses[]` 모델 + 코스 목록/상세 화면(시각표 행, 형식 배지 코딩/게임/시뮬), 기존 미션은 "기본 코스"로 자동 묶음(회귀 0). 코스 상세에서 각 형식이 기존 페이지(MissionPage/게임/시뮬)로 진입. 감사 원점 재검토 결과가 오면 표면 구조를 그에 맞춰 조정 — 그 전엔 기존 라우트 위에 코스 층만 추가.

## 완료 조건
1. 코스 목록에 기본 코스 + 비엔나 1900(빈 껍데기, 123 콘텐츠 전) 표시. 2. 형식 배지·진입·복귀. 3. unit/E2E 회귀 + 코스 테스트 3건. 4. 375/1440.
