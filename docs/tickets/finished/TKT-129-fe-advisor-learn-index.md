문서 상태: 작성완료

# TKT-129 `[FE]` Advisor 배우기 통합 인덱스 + 중복 표면 폐기

- 상태: finished (2026-09-14, REV-TKT-129-r1 통과) · P2 · 담당: codex-1 · 의존: TKT-124 need_review 시. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-surfaces-spec.md` §1 배우기·§5 단계 3, `reports/advisory/AS-R008-advisor-rethink.md` §4·§6
- scope: `services/advisor/frontend/src/modules/missions/**`(콘텐츠 파일 불가침), routes, 테스트

## 목표
배우기 표면에서 미션 39·사건 파일·프로젝트·practice 131판·코스를 **한 콘텐츠 인덱스**로 — 필터 4축(시간·코드 작성 여부·형식·완료 여부), 현 12칩은 고급 필터로 접힘. GamesPage 의 중복 진열 4묶음과 "시즌제 스탯 — 준비 중" 죽은 UI 폐기(alias·회귀 게이트 뒤).

## 완료 조건
1. [x] 인덱스 1개에서 5종 콘텐츠를 길이·진행 상태로 찾는다. 상세 URL 유지.
2. [x] `/games` alias 가 `/learn#practice` 로 도달, GamesPage 컴포넌트 제거 후에도 practice 딥링크·last practice 링크 복원.
3. [x] "시즌제 스탯 준비 중" 0.
4. [x] unit/E2E 회귀 그린, 375/1440.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 2026-09-14 codex-1: 181개 단일 인덱스(코스 2·미션 39·사건 8·프로젝트 1·연습 131), 4축 필터·접힌 12칩·30개 점진 노출을 구현. `/games` alias·practice/카드 심층 링크·마지막 연습과 저장 키를 보존하고 GamesPage 및 준비 중 UI를 제거했다. unit 74/74, Chromium E2E 40/40, build 110 modules, 375/1440 dark 실화면·overflow 0 확인. 콘텐츠 불가침 파일 diff 0, commit/push 없음. 선택 제안인 초기 청크 lazy-load는 502.28kB 경고가 남아 후속 판단 대상.

## PM 추가 (2026-09-14, REV-TKT-124-r1)
- [제안] 초기 번들 503kB — 코스·미션 콘텐츠 로더를 route 단위 lazy-load 로 분리(통합 인덱스 작업과 같은 파일이라 함께). 필수 아님, 공수 크면 [구체화 질문].
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-129-r1.md`. [제안] select aria-label → 119.
