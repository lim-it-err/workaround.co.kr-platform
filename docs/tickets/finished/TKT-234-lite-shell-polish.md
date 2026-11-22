문서 상태: 작성완료

# TKT-234 `[FE]` lite 틀 손질 — 375 윗줄 · 선택 줄 배지 · 낡은 주석

- 상태: finished · **P2 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: REV-TKT-231-r1 `[중요]`, REV-TKT-232-r1 `[중요]`, REV-TKT-233-r1 `[제안]`.
- 의존: TKT-229 finished 후(같은 화면 캡처를 다시 찍으므로).
- scope: `frontend/src/components/lite/LiteScreen.vue`, `frontend/src/components/lite/LiteWork.vue`(배지 색만), `frontend/src/components/lite/LiteVoyage.vue`(펼친 기록 들여쓰기만), `frontend/src/data/hallBoard.js`(HALL_LITE_ITEMS 위 주석 한 줄만), `frontend/src/components/Lite.e2e.mjs`(단언 추가), 캡처.

## 완료 조건
- [x] 1. 375 폭에서 lite 틀 윗줄이 한 줄을 유지한다: 「workaround lite」 는 560px 미만에서 숨기고, crumb 는 한 줄 말줄임. 「‹ 뒤로」는 항상 같은 줄 오른쪽. 자취 밥상 결과(crumb 「자취 밥상 › 오늘」)·여행 노선(「여행 › 중부유럽 순환선」)에서 확인.
- [x] 2. 운영 노트 목차의 선택 줄에서도 상태 배지가 보인다(반전 색 — 선택 줄 글자색으로 테두리·글자).
- [x] 2-1. 여행 노선의 펼친 기록 모든 줄이 요약과 같은 열에서 시작한다(375·1440, REV-TKT-229-r2 [중요]).
- [x] 3. `hallBoard.js` 「역 이름 6개만」 주석 → 지금 항목 수와 맞게.
- [x] 4. 검증: 잠금 게이트로 빌드 + `Lite.e2e.mjs`(375 에서 뒤로 버튼과 crumb 의 top 이 같음 단언 추가)·`HallV09`·`LiteVoyage`·`LitePantry`·`LiteWork` e2e 통과. 캡처 `captures/TKT-234/` 375 자취 밥상 결과·여행 노선·운영 노트 목차.

## 구현 메모
(구현자)
- LiteScreen.vue: `.lite-bar` 를 nowrap, `.lite-brand` 를 560px 미만(`max-width: 559px`)에서 숨김, `.lite-crumb` 는 한 줄 말줄임(`min-width:0`, `ellipsis`), `.lite-back` 은 `flex:none` 으로 항상 오른쪽 같은 줄. crumb 는 `line-height: 44px` 로 뒤로 버튼(44px)과 높이를 맞춘다(top 단언이 성립하도록).
- LiteWork.vue: `.nt-list li[aria-selected='true'] .nt-badge` 에 `color`·`border-color` = `var(--bg)` (선택 줄 반전 색).
- LiteVoyage.vue: 펼친 기록 `.lv-extra` — 넓은 화면(481px~)은 `.lv-line` 과 같은 4칸 그리드(`5.2em 1ch 14em minmax(0,1fr)`, gap 8px)에 두고 `p` 를 4번째 칸(요약 열)에 놓는다. 좁은 화면(480px 이하)은 기존 `padding-left: 0` 덮어쓰기를 없애 요약과 같은 들여쓰기 값을 쓴다. 글자 크기는 `p` 에 `0.85rem`.
- hallBoard.js: 주석 「역 이름 6개만」 → 「역 이름 3개만(여행·자취 밥상·운영 노트…)」.
- Lite.e2e.mjs: 3화면 루프에서 375 일 때 뒤로 버튼과 crumb 의 `boundingBox().y` 차이 < 1 단언.
- 범위 밖 손대지 않음: `board.md`(PM 지시), `frontend/src/data/workNotes/operatingModel.js` 는 워킹 트리에 다른 작업자의 미커밋 변경이 있어 그대로 둠(아래 참고).

## 검증
게이트 (`/private/tmp/claude-501/.../scratchpad/lite-gate.sh frontend/src/components/Lite.e2e.mjs HallV09 LiteVoyage LitePantry LiteWork`):
- BUILD OK (Pages base `--base=/workaround.co.kr-platform/`)
- `# pass 47` · `# fail 0` · `# skipped 2`
- 단위: `cd frontend && node --test $(find src -name "*.test.mjs")` → `# tests 56` · `# pass 56` · `# fail 0`
- `git diff --check` → 출력 없음, exit 0

실렌더 측정(375·1440, 기본 다크 테마, Playwright 측정 스크립트):
- 375 자취 밥상 결과: `brandDisplay: none`, 뒤로 `top 108` = crumb `top 108`, 뒤로 right 333. crumb 텍스트 「자취 밥상 › 오늘」, 한 줄.
- 375 여행 노선 DAY 4 펼침: 요약 텍스트 시작 x 와 펼친 줄 3개(「점심: Zum Bader…」「16:00 할슈타트 출발…」「오후: 미라벨 정원…」) 시작 x = 146.9 (같은 열). 요약 1·2행 실제 텍스트: 「07:30 출발 → 국경 전」 / 「비네트 확인 → 09:40…」.
- 1440 여행 노선 DAY 4 펼침: 요약 텍스트 시작 x = 725.8, 펼친 줄 3개 시작 x = 725.8 (같은 열). 요약 첫 줄: 「07:30 출발 → 국경 전 비네트 」.
- 1440 운영 노트 목차 선택 줄(01): 배지 「확정」 표시, 글자색 rgb(3,16,8) = 선택 줄 배경 rgb(141,255,176) 위에서 읽힘.
- 375 가로 넘침: Lite.e2e 의 3화면 루프 기존 단언(`.lite-screen` 등 scrollWidth − clientWidth = 0)이 통과 — 별도 단언은 추가하지 않음.

캡처 (`docs/tickets/captures/TKT-234/`):
- `pantry-result-375.png` — 자취 밥상 결과, 윗줄 한 줄(「자취 밥상 › 오늘」 · 「‹ 뒤로」 같은 줄)
- `voyage-route-375.png` — 여행 노선 DAY 4 펼친 줄만(요소 캡처)
- `voyage-route-375-page.png` — 같은 화면 전체 페이지
- `lite-work-toc-1440.png` — 운영 노트 목차, 선택 줄 배지 보임
- `voyage-route-1440.png` — 1440 DAY 4 펼침 (2-1 확인용)

## 질문/에스컬레이션
(질문 없음 — 아래는 구현자 참고 메모)
- 참고 1: 라이트 테마 캡처는 찍지 않았다(기본 다크만). 티켓 공통 기준의 라이트 실렌더는 PM 확인 필요.
- 참고 2: `frontend/src/data/workNotes/operatingModel.js` 가 워킹 트리에서 이미 수정돼 있다(갱신일 2026-11-22, 목차 제목 일부 변경). 운영 노트 캡처는 그 미커밋 내용을 보여준다. 이 파일은 내가 건드리지 않았고 커밋 판단은 PM 몫.
- 참고 3: 펼친 줄 들여쓰기 값은 375 에서 기존 `calc(5.2em + 8px + 1ch + 8px)` 를 그대로 쓰고, 1440 은 요약 열 그리드로 맞췄다. 폰트가 바뀌면 `1ch` 값이 달라져도 두 칸은 같이 움직인다.

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-234-r1.md`
