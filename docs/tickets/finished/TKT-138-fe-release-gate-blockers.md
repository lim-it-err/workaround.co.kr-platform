문서 상태: 작성완료

# TKT-138 `[FE]` v0.7.0 릴리스 게이트 블로커 — taxi E2E 구 selector, 블로그 최근 글 제목 hit area

- 상태: finished (2026-09-15, REV-TKT-138-r1 통과) · P1 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. **병합 전 필수** (AS-R009 §병합 전 닫아야 할 항목 2·3).
- scope: `frontend/src/components/taxiDispatch.e2e.mjs`(복귀 단계 selector만, 시뮬 로직 단언 무변경), `frontend/src/App.vue`·`styles.css`(블로그 허브 최근 글 제목 링크), `BlogTone.e2e.mjs`(단언 추가)

## 목표
1. `taxiDispatch.e2e.mjs:112` 가 TKT-114 에서 제거된 격납고 `.sim-annex` 를 기다려 4/5 red → 현행 격납고(`.tone-sim-page`, 히어로·행) 기준 복귀 단언으로 교체, **5/5 green**. 메인 전체 E2E 45/45.
2. `UX-TKT-113-r1 I1`: 블로그 허브 최근 글 제목 링크(`blog-text-link`) 실측 25.98px(모바일)/31.36px(데스크톱) → **실제 hit area ≥40px**(행 전체 이동 또는 padding/min-height), BlogTone E2E 에 375/1440 단언.

## 완료 조건
1. [x] `NODE_PATH=services/advisor/frontend/node_modules node --test src/components/taxiDispatch.e2e.mjs` 5/5, 메인 전체 `*.e2e.mjs` 45/45(Pages-base dist).
2. [x] 최근 글 제목 링크 bbox 높이 ≥40 (375·1440) E2E 단언, 시각 변화는 hairline·면 규칙 유지.
3. [x] build·unit 그린. `공유 파일:` 기록.

## 질문/에스컬레이션
- [구체화 질문][해결] scope의 `frontend/src/components/taxiDispatch.e2e.mjs`는 실파일이 `frontend/src/sim/taxiDispatch.e2e.mjs`임을 확인했다. 테스트 내용·목적이 일치하므로 실파일의 복귀 selector만 수정한다.

## 리뷰 기록
- 없음.

## PM 추가 (2026-09-14, UX-TONE-FINAL I2 이관) — 40px 미달 조작부 일괄
3. 메인 상단바 `환승 홀`·테마 버튼 높이 35.78px → ≥40. 모바일 스튜디오 `발행`·`글 도구` 너비 37.6/37.9 → ≥40, 저장 안내 `?`·백업 28×28 → ≥40(시각 무게는 늘리지 말고 hit area 만). Advisor `MissionPage.vue:559` 복귀 링크 16px·`PracticeGamePage.vue:189` 복귀 링크 20.8px → ≥40. scope 에 `styles.css:4266`, `WritingStudio.vue:645·648`, Advisor 두 페이지 추가. 완료 조건에 각 항목 bbox ≥40 단언(375).

## 구현 내역
- 택시 화면의 복귀 뒤 폐기된 `.sim-annex` 대신 현행 `.tone-sim-page`와 추천 히어로 `멈춘 엘리베이터`, 서비스 행 `심야 택시`를 확인하도록 바꿨다. 호출 생성·배차·완료·30초 무인 진행 단언은 건드리지 않았다.
- 블로그 최근 글 제목 링크에 `inline-flex`·`min-height: 40px`만 부여해 배경·테두리 없는 시각표 행 문법을 유지했다. BlogTone E2E가 375·1440에서 높이와 무면 스타일을 직접 측정한다.
- 상단바 두 버튼, 모바일 스튜디오 `발행`·`글 도구`·저장 안내·백업, Advisor 미션·연습 게임 복귀 링크의 실제 클릭 영역을 최소 40×40px로 맞췄다. 기존 색·테두리·타이포 위계는 유지했다.
- 공유 파일: `frontend/src/styles.css`, `frontend/src/components/WritingStudio.vue`, `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`, `services/advisor/frontend/src/modules/missions/pages/PracticeGamePage.vue`.

## 검증
- 메인 Node unit 21/21, Pages-base build 49 modules, root-base build 49 modules 통과.
- 현행 전체 메인 Chromium E2E 47/47 통과: Pages-base·병합 Advisor 산출물 27/27, root-base 격납고·도구 15/15, taxi 5/5. 티켓 작성 시 45개였으나 이후 JunctionMap 2개가 추가돼 현재 분모를 기록한다.
- Advisor unit 81/81, Pages-base build 110 modules, `course-container.spec.ts` Chromium 4/4 통과. 375px 미션·게임 복귀 링크 bbox ≥40 단언을 포함한다.
- 375px 다크·라이트와 1440px 라이트에서 블로그/스튜디오를 실화면 확인했고, Advisor 미션·게임은 375px 다크·라이트에서 실화면 확인했다. 가로 overflow 0, 새 카드 면 0, 브라우저 page error 0.
- 첫 통합 실행의 실패는 Pages preview에 `--base`를 빠뜨리고 Advisor dist를 병합하지 않은 검증 하네스 구성 오류였다. 올바른 base와 `prepare-github-pages.mjs --advisor-dist`로 재구성한 최종 실행은 전부 통과했다.

## PR 메모
- 리뷰 초점: 블로그 링크의 투명 배경·무테가 유지되는지, 40px 확장이 모바일 상단바/스튜디오 줄바꿈을 만들지 않는지, taxi 복귀 단언이 현행 격납고 구조를 충분히 고정하는지.
- Safari/WebKit·실 GitHub Pages 배포는 미검증이다. commit/push 없음.
- r1 (2026-09-15, PM): **통과 → finished**. `docs/reviews/REV-TKT-138-r1.md`.
