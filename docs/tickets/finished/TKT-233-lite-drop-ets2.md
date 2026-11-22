문서 상태: 작성완료

# TKT-233 `[FE]` lite 에서 유로트럭 빼기

- 상태: finished · **P1 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: PO 2026-11-22 「유로트럭은 lite에 맞지 않아. 빼.」 (D-038 개정, TKT-230 폐기).
- scope: `frontend/src/data/hallBoard.js` 의 **`HALL_LITE_ITEMS` 만**, `frontend/src/components/lite/index.js`(ets2 항목 삭제), `frontend/src/components/lite/LiteEts2.vue` 삭제, `frontend/src/components/Lite.e2e.mjs`, `frontend/src/components/HallV09.e2e.mjs`(lite 단언 중 유로트럭·항목 수에 묶인 부분만). `LiteVoyage.vue`·`LitePantry.vue`·`LiteWork.vue` 와 그 e2e 는 다른 티켓이 동시에 고치므로 **손대지 말 것**.

## 완료 조건
- [x] 1. lite 환승 홀 항목 = 여행·자취 밥상·운영 노트 3개.
- [x] 2. lite 에서 `/ets2`(유로트럭)로 가면 기본 유로트럭 화면 그대로(Advisor·격납고와 같은 취급).
- [x] 3. 기존 e2e 의 「↓ Enter → 유로트럭」 류 단언은 새 목록에 맞게 바꾼다(예: ↓ Enter → 자취 밥상). lite 에서 ets2 경로 = 기본 화면 단언 추가.
- [x] 4. 검증: 빌드(Pages base) + `HallV09.e2e.mjs`·`Lite.e2e.mjs` 통과, `git diff --check`.

## 구현 메모
- `hallBoard.js` `HALL_LITE_ITEMS`: ets2 항목 제거 → 여행·자취 밥상·운영 노트 3개. 기본 `HALL_ROWS` 의 유로트럭 행은 그대로.
- `lite/index.js`: `LiteEts2` import·`ets2` 매핑 삭제. App.vue 는 수정하지 않았다 — `LITE_PAGES[page]` 가 없으면 `liteComponent` 가 null 이 되어 기본 화면(Ets2Live)이 그려진다(e2e 로 확인).
- `LiteEts2.vue` 는 `git rm` 으로 삭제(스테이징됨).
- `Lite.e2e.mjs`: ↓ Enter 단언을 자취 밥상(lite 틀 `[data-lite-screen]`·뒤로 버튼·키 줄 존재, `/pantry`)으로 바꿨다. 4화면 자리표시 테스트 → 3화면 「lite 틀이 그려짐」(`[data-lite-screen]` 안의 뒤로 버튼 + crumb 라벨) 로 바꾸고 `/ets2` 를 뺐다. 「유로트럭은 lite 틀이 아니라 기본 화면」 테스트를 추가했다.
- `HallV09.e2e.mjs`: `LITE_LABELS` 3개, 맨 위·맨 아래 순환 인덱스를 3항목 기준(opt-2)으로 바꾸고 ↓ 2번 = 운영 노트, ↓ Enter = 자취 밥상(lite 틀 확인). 나머지 lite 단언(클릭 선택·보기 전환)은 그대로 통과.
- 다른 작업자 파일(LiteVoyage/LitePantry/LiteWork 및 그 신규 파일)은 건드리지 않았다. `docs/tickets/board.md` 도 수정하지 않았다(PM 지시) — 보드 줄 `need_review` 반영은 PM 몫.

## 구현 내역
- 바꾼 파일: `frontend/src/data/hallBoard.js`, `frontend/src/components/lite/index.js`, `frontend/src/components/lite/LiteEts2.vue`(삭제, git rm), `frontend/src/components/Lite.e2e.mjs`, `frontend/src/components/HallV09.e2e.mjs`.
- 공유 파일: 없음(App.vue 읽기만).
- 커밋·push 없음.

## 검증
- 게이트 1(잠금 스크립트, Pages base 빌드 + e2e): `BUILD OK`, `node --test frontend/src/components/Lite.e2e.mjs frontend/src/components/HallV09.e2e.mjs` → `# pass 27`, `# fail 0`, `# skipped 2` (skip 2 = 「부팅 로그 중간 캡처」, SHOT_DIR 없을 때 건너뜀).
- 게이트 2(루트 빌드): `npm --prefix frontend run build` exit 0.
- 게이트 3(unit): `cd frontend && node --test $(find src -name "*.test.mjs")` → `# tests 56`, `# pass 56`, `# fail 0`.
- `git diff --check` 통과, `git diff --cached --check` 통과.
- 실렌더 캡처(375/1440 다크/라이트) 는 이번 티켓에서 새로 찍지 않았다(SHOT_DIR 미지정). 판정 시 PM 실화면 확인 필요.

## 질문/에스컬레이션

(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-233-r1.md`
