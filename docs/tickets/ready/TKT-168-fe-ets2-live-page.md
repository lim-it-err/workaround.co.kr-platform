문서 상태: 작성완료

# TKT-168 `[FE]` 유로트럭 관제 페이지 `/ets2` — 프레임 폴링·신선도·정지 상태

- 상태: ready · **P1** · 담당: codex-1 · 의존: TKT-166 finished(스펙). 167 과 병행(샘플 프레임으로 개발). 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.** 스펙 `design/ets2-live-spec.md` §4·§5.
- scope: `frontend/src/components/Ets2Live.vue`(신규), `frontend/src/App.vue`(라우팅·격납고 목록 행), `frontend/src/data/lines.js`(실험선 S 소역 `유로트럭` page `ets2`), `frontend/src/staticRouting.js`(`/ets2`), `frontend/src/styles.css`, `frontend/public/mockups/ets2-sample/`(샘플 프레임 3장 — 저작권 없는 합성 이미지), `frontend/src/components/Ets2Live.e2e.mjs`, `JunctionMap.e2e.mjs`(역 9개).

## 완료 조건
1. [ ] `VITE_ETS2_FRAME_URL` 이 있으면 `<url>/latest.jpg?t=` + `meta.json` 을 2초 폴링, 없으면 샘플 3장 순환. 새 이미지 로드 완료 후 교체(깜빡임 0 — E2E 로 `img` 교체 시 빈 프레임 없음 단언).
2. [ ] 신선도 `n초 전`, 30초 이상 정지 상태(흐림 + hairline `마지막 화면 · n분 전`, 폴링 10초), 로드 실패 3회 `관제 신호 없음`. 페이지 이동 없음(D-022 문법).
3. [ ] 홈 노선도·격납고 목록에서 진입, 정적 라우팅 `/ets2` 직접 진입·새로고침, 375/1440 × 다크/라이트 overflow 0, 영어 간판 0(`ETS2` 는 약어로 허용, 눈썹 금지).
4. [ ] E2E 4건(폴링·정지·실패·진입), 기존 E2E 회귀 0, Pages-base build.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
