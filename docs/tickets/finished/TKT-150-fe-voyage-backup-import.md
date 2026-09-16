문서 상태: 작성완료

# TKT-150 `[FE]` 여행 기록 백업 JSON → 데이터 파일 반영 스크립트

- 상태: finished (2026-09-15, PM r1 통과) · P2 · 담당: codex-1 · 의존: TKT-141 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: 정차역 시트 기록(식사·지출·사진·메모)은 브라우저 localStorage 에만 있고 `내 기록 백업`으로 JSON 을 내려받을 수만 있다. 여행 종료(9/18) 후 PO 백업을 `days[].actual`(`schema.js`)로 옮겨야 정적 공개본의 '기록' 구간이 산다. 지금은 PM 이 손으로 옮겨야 한다.
- scope: `frontend/scripts/voyage-import-backup.mjs`(신규), `frontend/src/data/voyages/schema.js`(순수 병합 함수 export), `frontend/src/data/voyageImport.test.mjs`(신규), `docs/voyage-record-import.md`(신규), `.gitignore`(`*.voyage-backup.json`).

## 목표
`node frontend/scripts/voyage-import-backup.mjs <backup.json> [--write]` — 백업 JSON(`downloadVoyageDayBackup` 형식)을 읽어 해당 여행 데이터 파일의 `days[].actual`(record·meals·spend·photos)에 병합한다. 기본은 dry-run(diff 출력), `--write` 만 파일 갱신.

## 규칙
- 사진(base64)은 `frontend/public/voyage/<tripId>/<YYYY-MM-DD>-<n>.<ext>` 파일로 추출하고 데이터에는 경로만. 장당 크기 경고(>400kB)만 출력, 리사이즈는 범위 밖.
- 충돌 시 백업 우선(현장 기록이 정본), 단 데이터 파일에만 있는 값은 보존.
- 백업 파일 자체는 커밋 금지 — PO 가 로컬에서 실행. 개인정보는 데이터 파일 외 어디에도 남기지 않는다.
- 결과 데이터는 기존 `voyageCoverage.test.mjs` 규칙을 통과해야 한다.

## 완료 조건
1. [x] 합성 백업 fixture(2일·식사 2·사진 1)로 dry-run diff 출력, `--write` 후 데이터 파일 갱신·사진 파일 생성 확인.
2. [x] unit 3건 — 병합·백업 우선·사진 추출 경로.
3. [x] `docs/voyage-record-import.md` 실행 절차(PO 가 폰→맥으로 파일을 옮기는 단계 포함).
4. [x] build·unit 그린, 제품 화면 변경 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 2026-09-15 codex-1: 백업을 바로 쓰지 않고 개수·생성 경로만 보여 주는 dry-run을 기본으로 두었다. `--write`는 일차 `actual`을 재실행 가능한 마커 구간에 반영하고 base64 사진을 공개 자산으로 분리한다. 실제 PO 백업은 읽지 않았고 합성 fixture로만 검증했다.

## 구현 내역
- `mergeVoyageDayRecords()`를 순수 함수로 추가해 백업의 메모·식사·지출·사진을 일차별 `actual`에 병합한다. 같은 정차역은 백업 값을 우선하고 데이터 파일에만 있는 항목은 보존한다.
- CLI는 형식·여행 ID·날짜·금액을 검증하고, dry-run에서 개인 기록 값을 출력하지 않는 구조 diff만 보여 준다. `--write`는 데이터 파일을 임시 파일→rename으로 교체한다.
- data URL 사진은 `frontend/public/voyage/<tripId>/<date>-<n>.<ext>`로 분리하고 400kB 초과 자산은 경고만 출력한다. `*.voyage-backup.json`은 git 추적에서 제외했다.
- `docs/voyage-record-import.md`에 폰→맥 이동, dry-run, 실제 반영, 검증·실패 대응을 기록했다.
- 제품 화면 변경: 0.
- 공유 파일: `frontend/src/data/voyages/schema.js`, `docs/tickets/board.md`, `docs/history/2026-09-15.md`(TKT-148의 미커밋 `links` 기본값·need_review 기록 보존).

## 검증
- `node --test src/data/voyageImport.test.mjs src/data/voyageCoverage.test.mjs src/staticWritingState.test.mjs`: 5/5 통과. 합성 2일·식사 2·사진 1 fixture의 dry-run 무수정, `--write` 데이터·PNG 생성, 재실행 마커 블록 미중복을 확인했다.
- `npm run build -- --base=/workaround.co.kr-platform/`: 49 modules 통과.
- `git diff --check`: 통과.
- 실제 폰 백업 반영·사진 화질 확인·실 Pages 배포는 PO 파일 수신 후 남으며 commit/push 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-150-r1.md`. [제안] 병합 로직 파일 분리는 후속.
