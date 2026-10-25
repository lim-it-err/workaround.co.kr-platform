문서 상태: 작성완료

# TKT-201 `[FE]` 버그 — 스플래시 문이 열릴 때 뒤에 환승 홀이 아니라 `DOORS OPENING` 화면이 보인다

- 상태: ready · **P1 · v0.8.1(패치)** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.1`**(작업 트리 `/Users/imjeonghan/newProject/wa-081`).
- 근거: PO 2026-10-25 「문이 열릴 때 doors opening 하고 나서 문이 열릴 때 메인 화면이 아니라 doors opening으로 나와」.
- 원인(PM 확인): `App.vue` `startSplashDoorOpening()` 이 문을 여는 500ms 동안 페이지를 `splash` 로 둔 채 애니메이션하고, **열림이 끝난 뒤에야** `applyPageChange('junction')` 을 부른다. 그래서 열리는 문 사이로 스플래시 플랩(`DOORS OPENING`)이 보인다.
- scope: `frontend/src/App.vue`(스플래시 문 열림 순서), `frontend/src/splashTone.e2e.mjs`, 필요 시 `styles.css`(문 레이어 z-index).

## 완료 조건
1. [ ] 순서: 문이 닫힌 상태(`closed`)에서 **먼저 환승 홀로 페이지 전환** → 다음 프레임에 `opening` 시작 → 500ms 뒤 문 레이어 제거. 열리는 문 사이로 환승 홀이 보여야 한다.
2. [ ] 총 시간 5.5초·재방문 2.5초·reduced-motion(문 없음 즉시 전환)·`다시 재생`·출발 전환(TKT-182 의 라우트 문)은 그대로. 포커스는 전환 직후 환승 홀 제목.
3. [ ] E2E 1건 추가: 문 열림 중간(약 250ms) 시점에 환승 홀 노선도가 DOM 에 있고 스플래시 플랩이 없음(또는 보이지 않음), 캡처 1장. 기존 splashTone 13 그린.
4. [ ] 게이트: build, splashTone·JunctionMap·staticRouting E2E, unit, `git diff --check`, 375/1440 캡처 `/private/tmp/tkt201/`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
