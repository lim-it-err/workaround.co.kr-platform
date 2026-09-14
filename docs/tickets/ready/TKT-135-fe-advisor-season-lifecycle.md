문서 상태: 작성완료

# TKT-135 `[FE]` Advisor 시즌 수명주기 — 종료 시즌 보존·명시적 새 시즌·평생 누적

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-121 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-season-spec.md` §1~§4 (AS-R008 §5·§9 근거)
- scope: `services/advisor/frontend/src/modules/missions/store/{seasonStats.js,missions.js}`, `pages/{SeasonPage,RecordsPage}.vue`, 테스트. 콘텐츠 3파일 불가침. `advisor.learner.v1` 다른 필드 무변경.

## 목표
스펙 §2 수명주기 그대로: 종료 시즌 보존(결말 불변) → 적립 거절 사유 노출 + `새 시즌 시작` CTA → 새 시즌 0 에서 시작, 거절됐던 적립 재시도 → `지난 시즌` 읽기 전용 재열람 → 평생 누적. 구 `seasonStats` 마이그레이션.

## 완료 조건
1. [ ] 스펙 §4-1 E2E 1건(종료→거절 사유→새 시즌→재적립→재열람).
2. [ ] §4-2 마이그레이션 unit(기록 수 동일), §4-3 불변 unit, §4-4 기존 테스트 갱신.
3. [ ] 기록 표면: `이번 시즌`(진행/종료 결말+CTA/없음 3상태), `지난 시즌` hairline 행, 누적 스탯 행. 375/1440 overflow 0, 면은 조작부만.
4. [ ] unit/E2E 회귀 그린, build.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
