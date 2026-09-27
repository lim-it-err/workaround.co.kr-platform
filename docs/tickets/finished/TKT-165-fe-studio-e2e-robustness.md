문서 상태: 작성완료

# TKT-165 `[FE]` 글쓰기 E2E 견고화 — 순간 상태 대기 제거·자체 preview 포트 격리

- 상태: finished (2026-09-17, PM r1 통과) · P2 · 담당: codex-1 · 의존: TKT-164 finished. 브랜치 `codex/v0.7.0-tone`. 제품 코드 무변경(테스트·러너만). TKT-159(통합 러너, codex-2)와 겹치면 `공유 파일:` 표기.
- 근거: REV-TKT-164-r1 — 공유 포트 4174 배치 루프에서 375 두 건이 run2~5 연속 red, 격리 포트에서는 3/3 그린. `WritingStudio.e2e.mjs:111` 의 `저장 중…` **순간 상태** `waitForFunction` 은 부하 시 상태가 먼저 지나가면 30초 타임아웃으로 실패한다. 기본 URL 이 고정 포트 4174 라 다른 워커의 preview·`pkill vite preview` 와 충돌한다.
- scope: `frontend/src/components/WritingStudio.e2e.mjs`(순간 상태 대기 → 최종 상태 또는 이벤트 훅 대기), `frontend/scripts/`(스위트가 자체 preview 를 임의 포트로 띄우고 종료 시 PID 로 정리 — `STUDIO_TEST_URL` 미지정 시), 같은 패턴의 다른 `*.e2e.mjs` 점검.

## 구현 내역
- `STUDIO_TEST_URL`이 없으면 `e2e-isolated-preview.mjs`가 사용 가능한 임의 포트를 확보하고 Vite preview를 직접 PID로 띄운 뒤 HTTP readiness를 확인한다. 테스트 종료 시 해당 PID에만 TERM을 보내고 3초 안에 끝나지 않으면 KILL한다.
- 외부 `STUDIO_TEST_URL` 계약은 유지하고 끝 슬래시만 정규화했다. 기본 고정 포트 4174 의존은 제거했다.
- 375 dark/light 저장 입력에서 지나갈 수 있는 `저장 중…` exact 대기를 제거하고, 기존의 안정적인 최종 `저장됨 HH:MM` 대기를 완료 기준으로 사용한다.
- 같은 패턴 점검: Writing Studio의 나머지 `저장됨`·`저장 실패`는 최종 상태, taxi의 `__taxiClockReady`는 단조 readiness 플래그다. `저장 중`·`발행 중`·`삭제 중`·`복원 중` 같은 순간 문구 대기는 전체 `*.e2e.mjs`에서 0건이다. 사진 첨부 안내는 타이머로 사라지지 않고 다음 도구 동작까지 유지되는 결과 상태다.
- TKT-159는 아직 ready이며 현재 동일 파일 변경은 없다. 새 helper는 후속 통합 러너에서 재사용할 수 있다.

## 완료 조건
1. [x] `저장 중…` 류 순간 상태 대기 0건(목록을 티켓에), 최종 상태 대기로 대체.
2. [x] 기본 실행이 고정 포트에 의존하지 않음(임의 포트·PID 정리), 두 터미널 동시 실행 3회 모두 13/13.
3. [x] 제품 코드 diff 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 2026-09-16 codex-1: Pages-base build 49 modules 통과. 기본 self-host 실행 13/13 통과 후, 두 프로세스를 동시에 실행하는 라운드를 3회 반복해 총 6개 스위트·78/78 통과했다. 종료 뒤 `vite.js preview` 잔존 PID는 0건이었다.
- 첫 샌드박스 실행은 로컬 포트 바인딩 권한 부재(`listen EPERM`)로 테스트 hook이 열리지 않았고, 로컬 preview 권한으로 동일 명령을 재실행해 통과했다. 앱·테스트 로직 실패로 집계하지 않는다.
- `git diff --check` 통과. 변경 파일은 테스트 `WritingStudio.e2e.mjs`, 신규 테스트 helper, 티켓·보드·히스토리뿐이며 Vue/CSS/데이터 등 제품 코드 diff는 0이다. 375/1440 dark/light 렌더 계약은 기존 13개 스위트에 포함된다. commit·push는 하지 않았다.
- 2026-09-17 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-165-r1.md`. 다음 배치.
