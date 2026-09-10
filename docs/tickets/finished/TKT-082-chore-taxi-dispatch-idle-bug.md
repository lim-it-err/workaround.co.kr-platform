# TKT-082

## 메타데이터

- 제목: 택시 디스패치 버그 — 유휴 차량이 대기 큐를 집지 않는다
- 우선순위: P1
- 대상 버전: `chore` (버그)
- 상태: `finished` (REV-TKT-082-r1 통과, PM 판정 2026-09-10)
- 문서 상태: `작성완료`
- 담당: codex-1 `[SIM]` (2026-09-09 PM 인박스 포인터 우선 적용, 기존 claude 직접 담당 표기 갱신)
- scope: `frontend/src/**` (택시 코어 로직)

## 재현 (PO 실사용 보고, 2026-08-17)

> "몇 개 수동 호출 해봤는데 그냥 모든 택시가 경로가 결정되어있어서 놀고 있고, 큐는 줄지 않아"

수동 호출 수 건 → activeRequests 누적, 차량은 idle/기존 경로 고정 상태로 신규 요청을 집지 않음.

## 추정 원인 (진단 필요)

- 배차 루프가 "차량이 idle 로 전이되는 순간"에만 매칭하고, "요청이 들어온 순간 유휴 차량 스캔"을 안 하거나
- 경로 완료 후 상태 전이가 누락돼 차량이 영구 busy 로 남거나
- 수동 호출이 랜덤 호출과 다른 큐에 들어가 매칭 대상에서 빠짐

## 완료 조건

- [x] 원인을 코드 근거(파일:라인)로 특정해 티켓에 기록
- [x] 수동 호출 N건 → 유휴 차량이 있으면 즉시 배차, 큐 감소가 화면에서 보임
- [x] 회귀 테스트: 배차 로직 순수 함수에 "유휴 차량 + 대기 요청 → 매칭" 케이스 추가
- [x] `npm run build` 통과

## 관련

- TKT-074(S4): 지도형 그리드에서 차량 이동·배차가 눈에 보이면 이런 버그가 즉시 드러난다 — 지도가 관측성 장치이기도 하다.

## 착수 기록 (2026-09-10)

- 인박스 우선순위에 따라 착수. TKT-097/100/101은 need_review, TKT-079는 외부 결정 대기이므로 건너뛰었다.
- 선행 스펙 `design/sim-taxi-spec.md` §1에 따라 코어 버그·순수 함수 회귀만 수행한다. §2~3 지도/레이아웃(TKT-074)은 이 티켓에 섞지 않는다.

## 진단·원인 근거

1. **수동/자동 큐 분리는 아니었다.** 둘 다 `spawnTaxiRequest`의 `state.activeRequests.push(request)`를 쓰고, 수동 입력 직후에도 기존 매칭 호출이 있었다. 현재 연결부는 `frontend/src/App.vue:1710`, 공통 요청 추가는 `frontend/src/App.vue:2430`에 유지했다.
2. **같은 구역 배정의 0-hop 전이가 빠져 있었다.** 수정 전 `App.vue:2515`는 차량을 무조건 `to-origin`으로 지정하고 `:2517`에서 경로의 출발 구역을 제거했다. 차량이 호출 구역에 이미 있으면 `route=[]`인데, `:1711`의 빈 경로 분기는 `pickup`/`dropoff`만 처리해 `:1725`에서 `idle`로 돌렸다. 요청은 `assigned`로 남고, 다음 배차가 그 차량의 요청 ID를 덮어쓸 수 있어 요청이 영구 미완료로 남았다. 수정 전 사본은 `/tmp/tkt082-check.D6yZri/App.before.vue`에 보존했다.
3. **완료 직후 재매칭도 누락돼 있었다.** 수정 전 `App.vue:1708`은 이동 루프 전에만 매칭했다. 루프의 `:1746`에서 차량이 완료/idle로 바뀌어도 다음 1.2초 틱까지 대기 요청을 다시 읽지 않았다. 이는 영구 누락과 별개로 스펙의 '첫 idle 전이 시 즉시 배차'를 위반했다.

## 구현 결과

- `frontend/src/sim/taxiDispatch.js`에 입력 상태를 복제해 새 상태를 반환하는 배차/운행 순수 함수를 추출했다. UI의 시계·수동/자동 호출 생성은 그대로 두고 `App.vue:1707`, `:1723`, `:1734`에서 함수 반환값을 반영한다.
- `taxiDispatch.js:85`: 픽업 이동 경로가 비어 있으면 곧바로 `pickup`, 아니면 기존 `to-origin`으로 시작한다. 이동 이벤트가 없는 동일 구역 호출도 다음 틱에 정상 승차한다.
- `taxiDispatch.js:66`: 운행/완료 처리 직후 대기 큐를 한 번 더 매칭해 새로 idle이 된 차량을 같은 틱 안에 배정한다. 새 배정의 이동은 다음 틱부터 하므로 한 틱에 두 구역으로 이동하지 않는다.
- 최단 구역 경로·충분한 정원·거리/차량 ID 순위, 요청의 인원수/발생 순서, 1.2초 시계·자동 호출 주기, 이동 progress/stepDuration, 보상식·차량 추가 패널티는 보존했다.
- 앱 template 전체와 초기 차량/요청 구조는 작업 전 사본과 동일함을 비교했다. 스타일·지도·공용 컴포넌트·다른 시뮬·Pages 정책·다른 작업자의 변경은 건드리지 않았다.

## 검증 결과

- **Red → Green**: 동작 변경 없이 추출한 기존 코어에 순수 함수 회귀 8개를 먼저 실행했다. 5개 통과, 3개 실패(동일 구역 픽업, 첫 idle 전이 재배차, 혼합 요청의 orphan 배정). 두 지점 수정 후 **8/8 통과**.
- `node --test frontend/src/sim/taxiDispatch.test.mjs frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` — **11/11 통과**. 불변 입력, 근접/정원/동률 우선순위, 다중 수동·자동 요청 완료, 이동 progress, 보상 중복 방지 포함.
- `node --test frontend/src/sim/taxiDispatch.e2e.mjs` — **5/5 통과**. 다크/라이트 × 375/1280px에서 성수에 있는 Cab-04로 동일 구역 수동 호출 → 즉시 pickup → 1틱 뒤 dropoff → 2틱 뒤 완료를 확인했다. 이어 수동 6건을 적재해 24틱 내 6개 ID 전부 완료·진행 큐에서 제거됨을 확인했다. 미스터리 트레인 왕복도 정상.
- 브라우저 테스트는 기본 빌드 preview `http://127.0.0.1:4175`에서 실행했다. 모든 `/api/**`는 로컬 fixture로 가로채 실제 backend에 요청하지 않았다. 테스트용 시간 제어는 연속 호출 검증에만 사용했고, 마지막 관찰은 **실제 30.5초** 방치했다.
- 30초 육안 기록: 초기 진행 2/완료 0/보상 48 → 진행 1/완료 7/보상 372.2로 바뀌었고 차량·구역 요청 상태 변화 확인. 실제 브라우저 오류/경고 0.
- 다크/라이트에서 호출 대기·차량 상태·완료 목록·보상 표기가 판독 가능함을 캡처로 확인했다. 375×812에서 document/body/page-scroller/기능 화면의 **가로 overflow 0**.
- `npm --prefix frontend run build` 및 `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 둘 다 성공(36 modules). Pages preview에서 기존 `WritingStudio.e2e.mjs`도 **8/8 통과**.
- `git diff --check` 및 티켓/보드/history UTF-8 BOM·작성완료 검사 통과. 임시 preview 서버 종료. 커밋·push·배포 없음.

## 작업자 산출물·재현

- 코드: `frontend/src/App.vue` 택시 연결부, `frontend/src/sim/taxiDispatch.js`.
- 회귀: `frontend/src/sim/taxiDispatch.test.mjs`, `frontend/src/sim/taxiDispatch.e2e.mjs`. Playwright는 설치본 또는 `NODE_PATH`로 제공하며, `TAXI_TEST_URL`(기본 4175), `TAXI_SCREENSHOT_DIR`(선택)로 로컬 검증 대상을 지정한다.
- 캡처/원본: `/tmp/tkt082-check.D6yZri/` (`queue-before-*`, `completed-*`, `fleet-*`, `taxi-*`, `taxi-before-30s.png`, `taxi-after-30s.png`, `App.before.vue`). 초기 E2E의 exact-label 선택자는 기존 label에 옵션 텍스트가 포함돼 timeout이 발생하여 부분 일치로 보정했고, 최종 전체 실행은 통과했다.
- 남은 범위: TKT-074 지도 개편은 별도 작업이다. 정적 Pages에서 시뮬을 차단하는 TKT-097 정책은 유지했으며, 이번 검증은 실제 배포 검증이 아니다. PM 검토 후 커밋/배포가 필요하다.
