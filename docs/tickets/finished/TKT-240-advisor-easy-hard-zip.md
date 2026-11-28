문서 상태: 작성완료

# TKT-240 `[FE]` Advisor 코드 받기 — 이지(테스트 포함) / 하드(뼈대만)

- 상태: finished · **P1 · v0.9.4** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.4`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PO 2026-11-28 「난이도 이지하고 하드로 나눠서 이지는 테스트 코드를 미리 만들어주는거 어때 테스트 코드 구성하는게 시간이 너무 걸려서」 → D-040.
- 설계(PM): 미션 콘텐츠에 **선택 필드 `starterTests: [{ path, content }]`** 를 더한다(PM 이 미션별로 채움 — 이 티켓은 받는 쪽만). 기존 `difficulty`(규칙 복잡도 Easy/Normal/Hard)와는 별개 축이라 화면 용어는 **「이지 — 테스트 포함」 / 「하드 — 테스트 직접」**.
- scope (`services/advisor/frontend/` 아래): `src/modules/missions/utils/zip.js`(+ `__tests__/zip.spec.js`), `src/modules/missions/pages/MissionPage.vue`(받기 버튼 영역만), `e2e/mission-code-transfer.spec.ts`. 콘텐츠 data/ 파일 금지(PM 이 동시에 채운다 — 테스트에는 가짜 미션 객체를 쓸 것).

## 완료 조건
- [x] 1. `buildMissionEntries(mission, { level })` — `level: 'easy' | 'hard'`(기본 hard). easy 면 `starterTests` 를 각 path 그대로 넣는다. hard 면 넣지 않는다. 미션의 legacyFiles 에 이미 같은 경로의 테스트 뼈대가 있으면 easy 에서는 starterTests 쪽이 그 파일을 **대체**한다(같은 경로 두 번 금지).
- [x] 2. README: easy 는 「테스트가 미리 들어 있습니다 — `mvn -q test` 를 돌리면 처음엔 실패합니다. 전부 초록이 되게 구현하세요. 테스트 파일은 고치지 않습니다.」, hard 는 「테스트는 직접 씁니다 — 채점 기준의 테스트 항목을 보세요.」 한 단락씩.
- [x] 3. 파일 이름: `<mission.id>-easy.zip` / `<mission.id>-hard.zip`.
- [x] 4. 미션 화면 카드 머리: `starterTests` 가 있는 미션은 버튼 둘 — 「⬇ 이지 — 테스트 포함」(먼저, 강조) · 「⬇ 하드 — 테스트 직접」. 없는 미션은 지금처럼 「⬇ 코드 전체 받기 (.zip)」 하나(파일명 `<id>.zip` 유지). 버튼 아래 한 줄 설명(dim): 「이지는 채점용 테스트가 들어 있어 구현에만 집중합니다.」. 375 에서 두 버튼 세로 쌓기, 높이 ≥44px.
- [x] 5. 검증: `npx vitest run src/modules/missions/utils`(easy/hard 목록·대체·README 문구·파일명), playwright — starterTests 있는 미션에서 두 버튼 각각 download zip 의 목록 확인(테스트 경로 포함/미포함), 없는 미션은 버튼 하나. advisor `npx playwright test` 전체, `vite build --base=/workaround.co.kr-platform/advisor/`, `git diff --check`. playwright 의 「starterTests 있는 미션」은 PM 이 `s7-parcel-01` 에 채울 예정 — 아직 없으면 route/주입 없이 단위 테스트로 갈음하고 e2e 는 PM 콘텐츠 반영 후 PM 이 돌린다고 적는다. 캡처 375·1440 `docs/tickets/captures/TKT-240/`.

## 구현 메모
- `zip.js`: `buildMissionEntries(mission, { level })`(기본 hard). easy 는 같은 경로(safeZipPath 정규화 기준)의 기존 legacy/provided 파일을 걸러내고 starterTests 를 뒤에 붙임 → 경로 중복 없음. README 단락은 easy 항상, hard 는 `starterTests` 가 있는 미션에서만 넣음(없는 미션 README 는 기존 그대로 — 「채점 기준의 테스트 항목」이 없을 수 있어서). `downloadMissionZip(mission, level?)`: level 있으면 `<id>-<level>.zip`, 없으면 `<id>.zip`.
- `MissionPage.vue`: `hasStarterTests` 시 버튼 둘(이지는 `btn primary`) + dim 설명 한 줄, 없으면 기존 버튼. 375 에서 세로 쌓기·높이 44px. 기존 `@media(max-width:480px){.btn.primary{min-height:40px}}`(L785)가 이지 버튼을 40px 로 낮춰서 `.zip-levels .btn.primary.zip-btn` 로 44 를 명시.
- e2e: `mission-code-transfer.spec.ts` 에 분기 테스트 추가 — s1-wine-01 에 starterTests 가 없으면 단일 버튼만 확인, 있으면 이지/하드 download 목록 비교. 현재 s1-wine-01 은 starterTests 없음 → 단일 버튼 분기만 실행됨. 이지/하드 download 실검증은 PM 이 `s7-parcel-01` 에 채운 뒤 필요(그때 이 테스트의 MISSION 상수·파일명은 해당 미션으로 바꾸거나 별도 테스트 추가 필요).
- 캡처용으로 playwright route 로 sampleContent 에 가짜 starterTests 를 주입해 이지/하드 두 버튼 렌더·download 파일명(`s1-wine-01-easy.zip`)·가로 overflow 0 을 확인(임시 스펙은 삭제).
- 공유 파일 없음(data/ 미접촉).

## 검증
- `npx vitest run src/modules/missions/utils`: 10 passed(신규 4: easy 포함·대체·중복 없음 / hard 제외 / README 문구 / 비starter README 불변).
- 전체 `npx vitest run`: 123 passed · 1 failed — `src/app/platformTheme.spec.js`(--bg `#0D131C` vs `#0c0c0c`), 내 변경과 무관한 테마 토큰 불일치.
- `npx playwright test` 전체: 72 passed.
- `vite build --base=/workaround.co.kr-platform/advisor/` OK, `git diff --check` OK.
- 캡처: `docs/tickets/captures/TKT-240/mission-375.png`·`mission-1440.png`(가짜 starterTests 주입). 375: 버튼 둘 세로 쌓기 44/44px, 1440: 가로 나란히 44px, overflow 0.

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-240-r1.md`
