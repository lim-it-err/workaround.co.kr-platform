문서 상태: 작성완료

# TKT-135 `[FE]` Advisor 시즌 수명주기 — 종료 시즌 보존·명시적 새 시즌·평생 누적

- 상태: finished (2026-09-14, REV-TKT-135-r1 통과) · P2 · 담당: codex-1 · 의존: TKT-121 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박]/[구체화 질문] 의무.**
- 스펙: `design/advisor-season-spec.md` §1~§4 (AS-R008 §5·§9 근거)
- scope: `services/advisor/frontend/src/modules/missions/store/{seasonStats.js,missions.js}`, `pages/{SeasonPage,RecordsPage}.vue`, 테스트. 콘텐츠 3파일 불가침. `advisor.learner.v1` 다른 필드 무변경.

## 목표
스펙 §2 수명주기 그대로: 종료 시즌 보존(결말 불변) → 적립 거절 사유 노출 + `새 시즌 시작` CTA → 새 시즌 0 에서 시작, 거절됐던 적립 재시도 → `지난 시즌` 읽기 전용 재열람 → 평생 누적. 구 `seasonStats` 마이그레이션.

## 완료 조건
1. [x] 스펙 §4-1 E2E 1건(종료→거절 사유→새 시즌→재적립→재열람).
2. [x] §4-2 마이그레이션 unit(기록 수 동일), §4-3 불변 unit, §4-4 기존 테스트 갱신.
3. [x] 기록 표면: `이번 시즌`(진행/종료 결말+CTA/없음 3상태), `지난 시즌` hairline 행, 누적 스탯 행. 375/1440 overflow 0, 면은 조작부만.
4. [x] unit/E2E 회귀 그린, build.

## 구현 내역

- 단일 `seasonStats`를 `seasons.activeId + byId` 반복 인스턴스로 바꾸고, 기존 시즌의 날짜·적립 기록 수를 그대로 옮긴 뒤 구 키는 다음 저장에서 제거한다. 첫 방문에는 시즌을 자동 생성하지 않고 기록 표면의 명시적 `새 시즌 시작` 조작만 허용한다.
- 28일이 지난 시즌 적립은 `{ ok: false, reason: 'ended' }`로 돌려주고 결말을 즉시 잠근다. 종료 뒤 발생한 적립은 같은 행동을 잃지 않도록 `pendingGains`에 중복 없이 보관하며, 사용자가 새 시즌을 시작할 때 당일 첫 적립으로 전부 재시도한다. 한 행동이 2개 스탯을 주는 기존 게임도 보존하려고 단일 값이 아니라 큐로 구현했다.
- 새 시즌 시작 시 이전 시즌의 `closedAt`과 결말 식별자를 고정한다. 과거 결말은 저장된 식별자로만 다시 풀어 읽고, 이후의 루틴·적립 변경이 과거 시즌의 적립·결말을 바꾸지 않게 했다.
- 기록 화면에 평생 누적 4스탯, 이번 시즌 없음·진행·종료 3상태, 거절 사유와 CTA, 지난 시즌 hairline 행과 접이식 읽기 전용 상세를 추가했다. 배경 면은 실제 `새 시즌 시작` 버튼에만 두었다.
- 기존 리뷰 완료 요약이 새 저장 모델에서도 이번 시즌 적립을 찾도록 `ReviewPage.vue`의 조회 한 곳을 최소 연동했고, 기존 게임 E2E의 저장 검증도 활성 시즌 또는 대기 적립 계약으로 갱신했다.
- 콘텐츠 `sampleContent.js`, `inflightContent.js`, `endingContent.js`는 수정하지 않았다.

## 검증

- Advisor unit `81/81`: 구 `seasonStats` 마이그레이션 전후 제출·프로젝트·게임·시즌 기록 수 동일, 종료 거절, 명시적 시작, 대기 적립 재시도, 평생 누적, 과거 적립·결말 불변을 확인했다.
- Chromium E2E `41/41`: 종료 시즌 행동 → 거절 문구·CTA → 새 시즌 → 대기 적립 재반영 → 지난 시즌 행·읽기 전용 결말 재열람을 포함해 전체 회귀를 통과했다.
- 기본 build와 Pages base(`/workaround.co.kr-platform/advisor/`) build 모두 110 modules 통과. 기존 초기 JS `505.90kB` 청크 경고는 유지한다.
- 375px dark 종료 화면과 1440px light 새 시즌·지난 시즌 화면을 직접 확인했고 두 폭 모두 가로 overflow 0이었다. Safari/WebKit·실제 Pages 배포는 미검증이다.
- 콘텐츠 3파일 diff 0, `git diff --check` 통과. commit/push 없음.
- 공유 파일: `docs/tickets/board.md`
- 공유 파일: `docs/history/2026-09-14.md`

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 구현 완료, PM r1 검토 대기.

## PR 준비 메모

- 제목: `feat(advisor): preserve repeatable season lifecycles`
- 본문: Advisor 시즌을 반복 가능한 인스턴스로 이행하고 종료 적립 사유·명시적 새 시즌·대기 적립 재시도·과거 결말·평생 누적을 기록 화면에 연결한다.
- 검증: unit 81/81, Chromium E2E 41/41, 기본·Pages-base build 각 110 modules, 375/1440 overflow 0.
- 미검증: Safari/WebKit, 실제 Pages 배포.
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-135-r1.md`. 종료→새 시즌→재열람 실화면 검증.
