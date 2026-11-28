# REV-TKT-247-r1 — Advisor 셸 v0.9 모선 테마

- 판정: **통과** (블로커 0) · 2026-11-28 · PM
- 대상: dev 서브에이전트(Sonnet) 구현, 작업 트리 `wa-096`(`codex/v0.9.6`)

## PM 직접 검증
- `services/advisor/frontend`: `npx vitest run` 21 파일 / 140 통과 — 알려진 `platformTheme.spec.js` 실패 해소. `npx playwright test` 76 passed. `npx vite build --base=/workaround.co.kr-platform/advisor/` 성공.
- 루트 `npm --prefix frontend run e2e:all`: pass 150 / skip 20 / fail 0. `git diff --check` 깨끗.
- 실화면(캡처 `docs/tickets/captures/TKT-247/` 9장 직접 확인): 오늘·배우기·미션·기록 1440/375 모두 검은 바탕 + 둥근 프레임 + 상단바(line-d 원 `A`, 「Developer Advisor」, 3px 노선색 밑줄)로 모선 `pantry` 와 같은 문법. 밝게/어둡게 버튼 없음, lite 토글 없음. 375 가로 overflow 0.
- 코드: `App.vue` 템플릿 — `.app-shell > .portal-stage.line-d > station-topbar / nav / page-scroller / footer`. `src/` 에 `workaround-theme`·`data-theme` 참조 0(spec 제외).

## 지적
- [제안] 미션 화면에서 상단 탭 「배우기」가 활성 표시되지 않는다(`learnIsCurrent` 가 `/learn`·`/courses` 만 봄) — 기존 동작, 후속.
- [제안] 미션 화면 본문은 프레임 전체 폭(1440 에서 약 1350px), 오늘·배우기는 가운데 좁은 단 — 기존 레이아웃 그대로. 화면 간 폭 통일은 후속 판단.
- [제안] `e2e/label-bundle`·`review-first-fix` 에 `workaround-theme` setItem 잔재(무해) — 다음 e2e 손볼 때 정리.
- [제안] 로컬 단독 실행에서 상단바 「오늘」 버튼과 탭 「오늘」이 겹쳐 보임. Pages(`환승 홀`)에는 해당 없음.
