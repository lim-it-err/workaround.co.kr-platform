문서 상태: 작성완료

# REV-TKT-236-r1 — Advisor 코드 내려받기·올리기 (PM, 2026-11-28)

판정: **반려** (블로커 1 — 작은 수정. 나머지는 통과 수준)

## 확인한 것
- 구현자 게이트: advisor build(Pages base) 통과, playwright 67 pass(신규 6), zip.spec 4 pass. unit 실패 1건 `src/app/platformTheme.spec.js`(--bg 기대 #0c0c0c ≠ #0D131C)는 이번 변경과 무관 — `src/app/` 는 origin/main 대비 diff 0.
- 캡처 직접 확인: `mission-1440.png`(카드 머리 「⬇ 코드 전체 받기 (.zip)」, 파일 탭 옆 「📋 복사」「⬇ 받기」), `submit-375.png`(파일·폴더 올리기, 끌어다 놓기 영역, 넘침 없음).

## 지적
- `[블로커]` 폴더 올리기 경로에 최상위 폴더명이 붙는다(`proj/src/B.java`). IntelliJ 프로젝트 폴더를 올리면 `wine-advisor/src/main/java/...` 가 되어 미션의 경로(`src/main/java/...`)와 어긋난다 — 리뷰·같은 경로 덮어쓰기가 깨진다. 스펙(webkitRelativePath 그대로)을 쓴 PM 실수. → 올린 파일이 모두 같은 최상위 폴더를 공유하면 그 한 단계를 떼어 낸다(끌어다 놓은 폴더도 같은 규칙). 단위 또는 e2e 단언 추가.
  → 반영: `FileSubmitEditor.ingest` 에서 올린 파일이 모두 같은 최상위 폴더를 공유하면 한 단계를 뗌(드롭도 같은 경로 사용). e2e 단언 `proj/src/B.java` → `src/B.java`.
- `[중요]` 제출 탭 안내 문구가 아직 「…파일들을 붙여넣으세요」 다. → 「IDE 에서 작업한 파일을 올리거나 붙여넣으세요.」 꼴로(파일 올리기가 먼저).
  → 반영: 「IDE 에서 작업한 파일을 올리거나 붙여넣으세요.」 로 교체, e2e 에 문구 단언 추가.
- `[제안]` 폴더 드롭·50개 초과는 e2e 미검증 — 이번엔 수동 확인으로 둔다.
- `[제안]` platformTheme.spec 기존 실패 — 별도 정리.
