문서 상태: 작성완료

# TKT-235 `[QA]` 낡은 e2e 17건 정리 — 전체 e2e 그린 복구

- 상태: finished · **P1 · v0.9.3** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.3`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: REV-TKT-234-r1 `[중요]` — 전체 e2e 순차 실행 시 17건 실패, `main`(61241bd·4b40c18)에서도 동일. 지금은 「전 e2e 그린」을 릴리스 게이트로 못 쓴다.
- scope(r1 확장 승인: `frontend/scripts/run-e2e.mjs` prepareStage 의 VERSION 복사 한 줄): `frontend/src/components/SimTone.e2e.mjs`, `frontend/src/components/ToneTools.e2e.mjs`, `frontend/src/components/VoyageAdvisorTransfer.e2e.mjs`, 필요하면 `frontend/src/e2eContext.mjs`. **프로덕션 코드(.vue·.js·css) 수정 금지** — 테스트가 맞고 화면이 틀렸다고 판단되면 고치지 말고 `## 질문/에스컬레이션` 에 근거(스크린샷·DOM)를 적는다.

## 실패 17건 (순차 실행, Pages base 빌드)
- 엘리베이터·택시 「캔버스와 시각표 행」(375 dark·1440 light), 「무인 30초 동안 엘리베이터와 택시 화면이 모두 변한다」
- 격납고 「한 히어로와 세 시뮬레이션 행」, Work 「검토 히어로 뒤에 기능 보드」, Runtime 「경고 히어로와 상태 행」(각 375 dark·1440 light)
- 「전 정적 경로의 렌더 영어 대문자 간판은 0건」(375 dark·1440 light)
- Runtime 「배포 레일은 면 없는 번호 행」(375 light·1440 dark)
- 「벨베데레와 Advisor 미션을 왕복한다」(375 dark·1440 light)
- 재현: `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` → `NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test --test-concurrency=1 frontend/src/components/*.e2e.mjs`

## 판단 기준 (PM)
- 라이트 테마는 TKT-218(D-036)에서 없앴다 → 「light」 변형은 같은 단언의 dark 판과 중복이면 삭제, 아니면 dark 로 바꾼다.
- v0.9(D-035 보완·D-036)로 화면 구조가 바뀐 단언(히어로·행 개수 등) → 지금 화면의 의도(정보 위계·가독성)를 지키는 단언으로 다시 쓴다. 단순히 셀렉터를 맞추느라 의미를 버리지 말 것.
- 정적 모드에서 원래 열리지 않는 화면(Advisor 등)을 기다리다 타임아웃 → 정적 모드 기대 동작(안내 표시)으로 단언하거나, 정적 모드에서 skip 하고 이유를 주석.
- 「영어 대문자 간판 0건」은 살아 있는 원칙 — 실제 간판이 나오면 테스트를 약화하지 말고 에스컬레이션.
- 삭제하는 테스트는 구현 메모에 「테스트명 — 삭제 이유」 한 줄씩.

## 완료 조건
- [x] 1. 전체 e2e fail 0 — 게이트는 `npm --prefix frontend run e2e:all` 로 정정(r1 [반박] 수용). 재현 명령 직접 실행은 전제 불일치 파일이 skip 된다.
- [x] 2. 17건 각각의 처리(수정/삭제/skip/에스컬레이션)와 이유가 구현 메모 표에 있다.
- [x] 3. 같은 명령을 두 번 돌려도 그린(타이밍 의존 없음 — 무인 30초 테스트 포함).
- [x] 4. unit 전부, `git diff --check`.

## 구현 메모
**진단**: 17건 중 15건은 화면이 아니라 **실행 환경 불일치**였다. 재현 명령(`node --test frontend/src/components/*.e2e.mjs`)은 파일마다 다른 전제를 맞추지 않는다 — SimTone 은 root-base preview 4175 가 떠 있어야 하고(ECONNREFUSED), ToneTools 는 root-base dist 여야 하며(Pages-base 로 서빙하면 에셋 404 → `.portal-stage` 타임아웃), Voyage 왕복은 dist/advisor 가 합쳐져 있어야 한다(ENOENT). 이 전제를 맞춰 주는 게 이미 있는 러너 `npm --prefix frontend run e2e:all`(scripts/run-e2e.mjs, TKT-159)이다. 러너로 돌리면 17건 중 실제 실패는 대문자 간판 2건뿐이었다.

**변경**: ① 라이트 변형은 `useTheme.js` 가 저장값 light 를 무시(검은 화면)하므로 theme 값이 아무 효과 없는 중복 → 세 파일 모두 `1440 light` → `1440 dark`. ② 전제가 안 맞는 dist/서버로 돌리면 타임아웃 대신 **이유를 적어 skip**(e2eContext.mjs 에 `readDistKind`·`fileExists`·`isReachable` 추가). 러너로는 전부 실행된다. ③ (r1) 대문자 간판 테스트는 **원래 정규식 그대로**(JSON 허용 제거) — 원인 문구는 PM 이 `operatingModel.js` 에서 「결과 파일을」로 고침. ④ (r1) `scripts/run-e2e.mjs` prepareStage 에 루트 `VERSION` → stage 복사 한 줄. ⑤ (r2) `VoyageAdvisorTransfer` 에 `http://localhost:8080/**` route stub 추가 — TKT-237(bbf26a5)이 Advisor 에 모드 배지용 `localhost:8080/health` 조회를 넣어, 백엔드 없는 테스트에서 「Failed to load resource: ERR_CONNECTION_REFUSED」 콘솔 오류가 생겨 `e2e:all` 의 Voyage 2건이 새로 깨졌다(테스트가 오래된 게 아니라 TKT-237 이 만든 신규 회귀).

| # | 실패 (원래) | 처리 | 이유 |
|---|---|---|---|
| 1 | 엘리베이터 캔버스와 시각표 행 375 dark | 유지 + 서버 없으면 skip | 4175 preview 미기동이 원인. 러너 하에서 통과 |
| 2 | 택시 캔버스와 시각표 행 375 dark | 위와 같음 | 위와 같음 |
| 3 | 엘리베이터 … 1440 light | light → dark | 라이트 테마 없음(TKT-218·D-036). 폭 변형 유지 |
| 4 | 택시 … 1440 light | light → dark | 위와 같음 |
| 5 | 무인 30초 엘리베이터·택시가 모두 변한다 | 유지 + 서버 없으면 skip | 4175 미기동이 원인. 러너에서 반복 통과, 타이밍 의존 관찰 없음 |
| 6~7 | 격납고 한 히어로와 세 시뮬레이션 행 (375 dark·1440 light) | 단언 유지, 1440 → dark, root dist 아니면 skip | Pages-base 서빙으로 `.portal-stage` 미렌더가 원인. root dist 에서 현재 화면과 단언 일치 |
| 8~9 | Work 검토 히어로 뒤 기능 보드 | 위와 같음 | 위와 같음 |
| 10~11 | Runtime 경고 히어로와 상태 행 | 위와 같음 | 위와 같음 |
| 12~13 | 전 정적 경로 렌더 영어 대문자 간판 0건 | 1440 → dark, root dist 아니면 skip, 정규식 약화 없음 | 실제 위반은 `/work` 운영 노트 「결과 JSON 을」 1건 → PM 이 콘텐츠를 「결과 파일을」로 수정(r1) |
| 14~15 | Runtime 배포 레일은 면 없는 번호 행 (375 light·1440 dark) | **삭제** | Runtime 히어로 테스트(375·1440 dark)가 같은 `assertPathStepRows`·overflow 단언을 이미 한다 |
| 16 | 벨베데레와 Advisor 미션 왕복 375 dark | 유지 + dist/advisor 없으면 skip, localhost:8080 stub | 재현 명령 빌드에는 Advisor 가 없어 타임아웃. 러너에서 통과 |
| 17 | 벨베데레와 Advisor 미션 왕복 1440 light | light → dark | 라이트 테마 없음 |

삭제한 테스트: 「375px light / 1440px dark: Runtime 배포 레일은 면 없는 번호 행이다」 — Runtime 히어로 테스트에 같은 단언이 있어 중복.
프로덕션 코드(.vue·.js·css) 수정 0. 공유 파일: `frontend/scripts/run-e2e.mjs`(scope 확장 승인).

## 질문/에스컬레이션
- (r1 해소) JSON 허용 → 제거. [반박] 게이트 = e2e:all → PM 수용. 러너 VERSION → scope 확장 승인·반영.
- **[PM 의문·중요] TKT-237 의 배포 콘솔 오류** — Advisor 가 `localhost:8080/health` 를 조회하므로 백엔드 없는 공개 Pages 에서 방문자 콘솔에 연결 거부 오류가 남는다(화면 영향 없음, 모드는 「배포·연습」으로 안전 폴백). 테스트는 stub 으로 가렸을 뿐이다. 배포 빌드에서는 조회 자체를 생략(`VITE_ADVISOR_API` 미설정+비-localhost 이면 skip 등)하는 후속을 권고.
- 다른 작업자가 `services/advisor/frontend/node_modules` 심볼릭 링크를 쓰다 지운 사이 러너가 한 번 깨졌다(Playwright 경로 필수). 지금 그 경로에 내가 메인 저장소 node_modules 를 가리키는 링크를 만들어 두었다(untracked, 커밋 대상 아님) — 정리는 PM·해당 작업자 판단.

## 검증
- r2 `npm --prefix frontend run e2e:all` 2회(1회차 빌드 포함): **pass 150 / skip 20 / fail 0**, 2회차 **pass 150 / skip 20 / fail 0**. skip 20 = WritingStudio 14(D-031)·BlogTone 2·Studio 2·HallV09 2 등 기존 사유(이번 변경으로 늘지 않음; 이전 148/20/2 에서 HallV09 실패 2 → 통과).
- r1 직전 상태: 러너 pass 148 / skip 20 / fail 2(HallV09, stage 에 VERSION 없음). 수정 전 최초: fail 4.
- 티켓 재현 명령 직접 실행(1차 제출 때): 4회 중 3회 pass 95 / skip 35 / fail 0, 1회 HallV09 브라우저 종료 1회성 실패. 전제 불일치 파일은 skip 되므로 게이트로 쓰지 않는다.
- unit `node --test $(find src -name "*.test.mjs")`: 56 tests / pass 56 / fail 0. `git diff --check` 통과.
- 화면 변경 없음(프로덕션 코드 0)이라 실렌더 캡처 해당 없음.

## 리뷰 기록
(PM)

- r1 반려 (2026-11-28, PM) — `docs/reviews/REV-TKT-235-r1.md` (JSON 허용 제거, 러너 VERSION 복사). → r2 반영: 위 구현 메모 ③④, 검증.
- r2 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-235-r2.md`
