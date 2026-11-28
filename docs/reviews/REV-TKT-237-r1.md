문서 상태: 작성완료

# REV-TKT-237-r1 — Advisor 로컬 모드 · 배포 버전 구분 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- `./run.sh test`(JDK 21) 통과. advisor `vitest run` 111/112 — 실패 1건은 기존 `platformTheme.spec.js`(무관).
- advisor `npx playwright test` 전체 **70 passed / 0 failed** — 배지 spec 3건 포함. 앞서 21건 실패는 PM 쪽 원인(미션 추가로 206→207, TKT-238 zip 첫 파일 변경)이었고, 개수에 흔들리지 않는 단언으로 바꿈(PM 서브에이전트 수정: advisor-surfaces·core-flows·learn-index·course-container·label-bundle·mission-code-transfer spec).
- 375 팝오버 실렌더(PM 캡처, mock 백엔드 응답): 「…연습 / 리뷰입니다」 단어 단위 줄바꿈, `./local.sh claude` 복사 영역, 배지 「로컬 · 연습 리뷰」.
- 구현자 실측: `/health` → `profile:"mock"`, `LANG= LC_ALL= ./run.sh demo` 끝까지 성공, `./local.sh` 기동·Ctrl-C 정리(8080·5173 해제).

## 판단
- 스펙 밖 `WebCorsConfig` 에 `/health` GET CORS 추가 — 수용. 없으면 백엔드가 떠도 배지가 항상 「배포」로 나온다. `/health` 는 비밀 없는 상태 응답이라 공개해도 무방.
- `local.sh` 가 CORS 허용 목록에 `127.0.0.1:5173` 를 기본으로 넣는 것 — 수용(사용자 지정값 우선).

## 지적
- `[제안]` 리뷰 화면의 「연습 리뷰 — LLM 아님」 표식이 회색 한 줄이라 약하고, 아래 기존 노란 경고(「미리 생성된 샘플 리뷰」)와 말이 겹친다. 다음 손질 때 하나로.
- `[제안]` 팝오버를 열면 미션 칩 줄을 가린다 — 다시 누르면 닫힘. 그대로.
- `[제안]` `local.sh claude` 실제 키로 1회 실행은 PO 몫(키는 PO 환경 변수에만).
