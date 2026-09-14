문서 상태: 작성완료

# TKT-129 `[FE]` Advisor 배우기 통합 인덱스 + 중복 표면 폐기

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-124 need_review 시. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-surfaces-spec.md` §1 배우기·§5 단계 3, `reports/advisory/AS-R008-advisor-rethink.md` §4·§6
- scope: `services/advisor/frontend/src/modules/missions/**`(콘텐츠 파일 불가침), routes, 테스트

## 목표
배우기 표면에서 미션 39·사건 파일·프로젝트·practice 131판·코스를 **한 콘텐츠 인덱스**로 — 필터 4축(시간·코드 작성 여부·형식·완료 여부), 현 12칩은 고급 필터로 접힘. GamesPage 의 중복 진열 4묶음과 "시즌제 스탯 — 준비 중" 죽은 UI 폐기(alias·회귀 게이트 뒤).

## 완료 조건
1. [ ] 인덱스 1개에서 5종 콘텐츠를 길이·진행 상태로 찾는다. 상세 URL 유지.
2. [ ] `/games` alias 가 `/learn#practice` 로 도달, GamesPage 컴포넌트 제거 후에도 practice 딥링크·last practice 링크 복원.
3. [ ] "시즌제 스탯 준비 중" 0.
4. [ ] unit/E2E 회귀 그린, 375/1440.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
