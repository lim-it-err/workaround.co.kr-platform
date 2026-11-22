문서 상태: 작성완료

# TKT-227 `[FE]` lite 환승 홀 — 열자마자 키보드로 움직이기 · Advisor·격납고 제외

- 상태: finished · **P1 · v0.9.1** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.1`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PO 2026-11-22 「lite에서는 기본적으로 키보드로 움직일 것을 기대했는데 키보드 누르면 Lite에서 멈춰. advisor는 지원안해도 되고 … 격납고도 지원 안해도돼」.
- 원인(PM): `HallLite.vue` 의 listbox 는 포커스를 받아야만 `onKeydown` 이 돈다. 화면을 열면 포커스는 라우트 제목(`App.vue` `<h2 tabindex="-1">`)이나 보기 전환 버튼에 있어 화살표·Enter 가 아무 일도 하지 않는다.
- scope: `frontend/src/components/hall/HallLite.vue`, `frontend/src/data/hallBoard.js` 의 **`HALL_LITE_ITEMS` 만**(같은 파일을 TKT-226 이 `HALL_MAP` 추가로 동시에 고친다 — 다른 부분은 건드리지 말 것), `frontend/src/components/HallV09.e2e.mjs`(lite 단언만), 캡처.

## 완료 조건
(1~5 모두 체크 — 단 아래 구현 메모의 [구체화 질문] 참고)
- [x] 1. lite 환승 홀이 보이는 동안 **어디에 포커스가 있든**(body·제목 h2·보기 전환 버튼 포함, 단 입력 칸·textarea·contenteditable 제외) ↑↓·Home·End 를 누르면 목록이 움직인다. 첫 ↓ 는 첫 항목, 첫 ↑ 는 마지막 항목 선택. 키 처리 후 포커스는 listbox 로 옮긴다(`aria-activedescendant` 유지). Enter 는 항목이 선택된 상태에서만 진입 — 버튼에 포커스가 있을 때 Enter 는 원래대로 버튼 동작.
- [x] 2. lite 로 환승 홀에 들어오면(첫 진입·뒤로 가기 포함) 첫 항목이 선택된 상태로 시작하고 안내 문구가 「여행 선택 · Enter 들어가기」 꼴로 보인다(기존 「한 번 더 누르면」 문구는 마우스·터치 선택 때만).
- [x] 3. 전역 keydown 리스너는 lite 환승 홀이 마운트된 동안만 등록하고 언마운트 때 해제.
- [x] 4. `HALL_LITE_ITEMS` 에서 **Advisor·격납고 제거** → 여행·유로트럭·자취 밥상·운영 노트 4개. (해당 화면에 lite 판이 없다는 PO 결정 — 주소로 직접 가면 기존 화면 그대로 보이는 것은 이번 범위에서 허용.)
- [x] 5. 검증: 빌드(Pages base) + `HallV09.e2e.mjs` 전부 통과, 새 단언 — lite 로 `/` 진입 직후 아무것도 클릭하지 않고 ↓↓ Enter → 유로트럭 화면, 보기 전환 버튼 클릭 직후 ↓ 가 목록을 움직임, 항목 4개. 캡처 `docs/tickets/captures/TKT-227/` 375·1440 lite 첫 화면. `git diff --check`.

## 구현 메모
- 공유 파일: `frontend/src/data/hallBoard.js`(HALL_LITE_ITEMS 2줄 삭제만), `frontend/src/components/HallV09.e2e.mjs`(lite 테스트 블록 교체·LITE_LABELS 만). TKT-226 변경과 같은 파일.
- `HallLite.vue`: listbox 자체 keydown 제거 → `document` keydown(마운트 동안만, onBeforeUnmount 해제). 입력 칸·textarea·select·contenteditable 와 Alt/Ctrl/Meta 조합은 무시. 키 처리 뒤 listbox 로 focus. Enter 는 button·a[href]·summary 위에서는 원래 동작.
- `active` 초기값 0, `armed`(마우스·터치로 고른 줄) 플래그 추가 — 첫 줄이 미리 선택돼 있어도 첫 탭은 선택만, 같은 줄 재탭 = 진입. 안내 문구: 키보드 「X 선택 · Enter 들어가기」 / 포인터 「X 선택 · 한 번 더 누르면 들어갑니다」.
- 새 e2e: 클릭 없이 ↓ Enter → 유로트럭, 보기 전환 버튼 위 Enter = 버튼 동작, 전환 버튼 클릭 직후 ↓, Advisor 진입 테스트는 삭제(항목 제거).
- [구체화 질문] 완료 조건 1(첫 ↓ = 첫 항목)과 2(진입 시 이미 첫 항목 선택)·5(↓↓ Enter = 유로트럭)가 서로 안 맞는다. 2번대로 미리 선택했으므로 ↓ 한 번이 유로트럭이고 ↓↓ 는 자취 밥상이다. 새 단언은 ↓ Enter → 유로트럭으로 썼다. 「첫 ↓ 가 아무 변화 없음」은 화면상 먹통처럼 보여 택하지 않았다.
- 참고: 캡처에서 lite 목록 아래에 TKT-226 의 「노선도/승강장」 탭이 보인다(상대 작업).
- 캡처: `docs/tickets/captures/TKT-227/lite-first-{375,1440}.png`, `lite-selected-{375,1440}.png` (1·2행 문구: 「환승 홀」/「▶ 여행」, 안내 「여행 선택 · Enter 들어가기」).

## 질문/에스컬레이션
(없음)

## 검증
- build(root)·build(--base=/workaround.co.kr-platform/) 통과. unit 46/46.
- `HallV09.e2e.mjs` 21/21 통과(TKT-226 지도 테스트 포함, 상대 변경 상태 그대로). playwright 는 워크트리에 node_modules 가 없어 메인 저장소 advisor 의 것을 NODE_PATH 로 사용.
- `git diff --check` 클린. 375 다크 실렌더 확인(overflow 0, 항목 ≥44px, 영어 간판 0 은 e2e 단언).

## 리뷰 기록
(PM)

- r1 통과 (2026-11-22, PM) — `docs/reviews/REV-TKT-227-r1.md`
