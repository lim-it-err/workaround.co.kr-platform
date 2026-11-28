문서 상태: 작성완료

# TKT-236 `[FE]` Advisor 미션 — 코드 한 번에 내려받기 · 내 파일 올려서 제출

- 상태: ready · **P1 · v0.9.3** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.3`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PO 2026-11-28 「devloperadvisor는 일단 웹버전 다시 돌리고, 그전에 먼저. 소스 코드를 다운받게 해줘. 모든 게 복붙하려니까 힘들어」.
- 현상(PM): 미션 화면(`MissionPage.vue`)의 「구현할 뼈대/물려받은 코드」(`mission.legacyFiles`)와 「제공 코드 — 엔진」(`mission.providedFiles`)은 `CodeViewer.vue` 에서 **파일 하나씩 「📋 복사」**만 된다. 한 미션에 파일이 여러 개(예: `src/main/java/com/daehan/fin/...` 4~6개)라 IDE 로 옮기려면 파일마다 복사 + 경로 만들기를 반복한다. 제출도 `FileSubmitEditor.vue` 에 경로와 본문을 손으로 붙여 넣어야 한다.
- scope (모두 `services/advisor/frontend/` 아래, 모듈 격리 규칙 — `src/modules/missions/` 밖 참조 금지):
  - 신규 `src/modules/missions/utils/zip.js`(의존성 없는 무압축 ZIP 작성기 — CRC32 포함) + `src/modules/missions/utils/__tests__/zip.spec.js`
  - `src/modules/missions/components/CodeViewer.vue`(파일 하나 받기 버튼)
  - `src/modules/missions/pages/MissionPage.vue`(「코드 전체 내려받기」 버튼 배치만)
  - `src/modules/missions/components/FileSubmitEditor.vue`(파일·폴더 올리기)
  - e2e: 신규 `e2e/mission-code-transfer.spec.ts`
  - **금지**: 콘텐츠 파일(`data/sampleContent.js`·`sampleProjects.js` 등 data/ 전부) 수정, 새 npm 의존성 추가, 백엔드·API 계약 변경.

## 완료 조건
- [ ] 1. **코드 전체 내려받기**: 미션 화면 「구현할 뼈대/물려받은 코드」 카드 머리에 「⬇ 코드 전체 받기 (.zip)」 버튼. 받는 파일 이름 `<mission.id>.zip`. 안에는 `legacyFiles` + `providedFiles` 를 **각 `path` 그대로의 폴더 구조**로, 그리고 맨 위 `README.md`(미션 제목, 요구사항 목록, 「제공 코드는 수정하지 않는다」 한 줄). 경로가 비었거나 `..`·절대경로면 `files/<n>.txt` 로 안전하게 바꾼다.
- [ ] 2. **파일 하나 받기**: `CodeViewer` 의 복사 버튼 옆에 「⬇ 받기」 — 현재 탭 파일을 파일명(경로의 마지막 조각)으로 내려받는다. 복사 버튼은 그대로.
- [ ] 3. 내려받기는 `Blob` + `URL.createObjectURL` + 임시 `<a download>` 클릭 → `revokeObjectURL`. 한글 주석·본문이 UTF-8 로 깨지지 않는다(ZIP 일반 비트 11 = UTF-8 파일명).
- [ ] 4. **파일 올려서 제출**: `FileSubmitEditor` 에 「파일 올리기」(여러 파일 `<input type=file multiple>`)·「폴더 올리기」(`webkitdirectory`)·끌어다 놓기. 올린 파일은 행으로 채워지고 경로는 `webkitRelativePath`(폴더면) 또는 파일명. 기존 빈 행 하나만 있으면 대체, 아니면 뒤에 추가, 같은 경로는 덮어쓰기. 텍스트 확장자(.java .kt .xml .gradle .kts .properties .yml .yaml .md .txt .json .sql)만, 파일당 200KB·합계 50개 제한 — 넘으면 이유 한 줄 안내하고 건너뛴다. `target/`·`build/`·`.git/`·`.idea/`·`node_modules/` 아래는 무시.
- [ ] 5. 정적(Pages) 모드에서도 동작한다(전부 브라우저 안에서 처리, 서버 호출 없음).
- [ ] 6. 검증: `npm --prefix services/advisor/frontend run build` 통과, `npm --prefix services/advisor/frontend run test:unit`(zip: 무압축 ZIP 을 직접 파싱해 파일 목록·내용·CRC 일치 단언, 한글 경로/본문), playwright 새 spec — 미션 화면에서 「코드 전체 받기」 → download 이벤트의 zip 을 열어 legacyFiles 경로가 다 들어 있음 / 「⬇ 받기」 → 파일명 / 「파일 올리기」로 2개 올리면 행 2개·경로·내용 / 무시 폴더·큰 파일 안내. 기존 advisor e2e 중 미션 화면 관련 spec 회귀 없음(돌린 spec 과 숫자 기록). 375·1440 캡처 `docs/tickets/captures/TKT-236/`. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
