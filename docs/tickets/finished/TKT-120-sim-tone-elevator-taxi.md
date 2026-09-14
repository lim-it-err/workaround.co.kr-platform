문서 상태: 작성완료

# TKT-120 `[SIM]` 시뮬 2화면 톤 전환 — 엘리베이터·택시

- 상태: finished (2026-09-14, REV-TKT-120-r1 통과) · P2 · 담당: codex-1 · 의존: TKT-110, TKT-114(격납고)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/App.vue`(elevator/taxi 섹션), `frontend/src/components/ElevatorCrossSection.vue`, `frontend/src/sim/**`(표시부만), `frontend/src/styles.css`

## 목표
격납고 안 두 캐비닛의 화면을 원칙대로: 통계 타일→시각표 행, 조작 버튼만 면, 시뮬 캔버스는 그림(원칙 1 예외). 기존 시뮬 로직·테스트(082·083·094) 무접촉. **[반박] 환영** — 시뮬 화면은 조작부가 많아 원칙 1 적용이 과할 수 있다. 어디까지가 조작부인지 티켓에 제안.

## PM 추가 (2026-09-14, REV-TKT-114-r1)
- 시뮬 내부 화면 제목은 D-012 기믹명 — `멈춘 엘리베이터`(Elevator)·`심야 택시`(Taxi). 격납고(`mockups/simhub.html` r2)와 같은 이름을 쓴다. 데이터 `name`·딥링크는 그대로.

## 완료 조건

- [x] 엘리베이터·택시 제목을 격납고 기믹명과 맞추고 영문 눈썹·설명 라벨을 제거하거나 한글화했다.
- [x] 통계·점수·차량·호출·로그를 카드가 아닌 hairline 시각표 행으로 전환했다.
- [x] 엘리베이터 단면과 택시 9구역 메쉬만 시뮬레이션 캔버스 면으로 남겼다.
- [x] 375px dark·1440px light에서 가로 overflow 0, 브라우저 오류·경고 0을 확인했다.
- [x] 엘리베이터와 택시를 동시에 30.5초 무인 관찰해 두 화면의 지표 변화가 모두 보이는지 확인했다.

## 구현 내역

- `/elevator`는 `멈춘 엘리베이터`로 이름을 통일하고, 4개 지표를 단일 시각표 행으로 바꿨다. 수요 프리셋·범위 입력·초기화만 조작 면으로 유지하고 고급 설정·최근 운행 외곽 카드는 hairline으로 걷어냈다.
- `/taxi`는 `심야 택시`로 이름을 통일하고 상단 4지표, 보상/패널티, 차량, 호출, 완료, 이벤트 로그를 행 구조로 바꿨다. 9구역 메쉬는 하나의 관찰 캔버스로 묶고 노선색은 각 구역 상단 선에만 사용했다.
- 택시 화면의 영어 설명 라벨과 상태 표시는 한글로 바꾸되 `idle/pending/assigned/pickup/dropoff` 내부 상태값은 DOM 텍스트에 보존해 기존 시뮬레이션 계약을 건드리지 않았다. 이벤트 로그도 화면 formatter에서만 한글화했다.
- `SimTone.e2e.mjs`를 추가해 다크/라이트·모바일/데스크톱의 캔버스 예외, 투명 행, 조작 면, 제목, overflow와 두 시뮬레이션의 무인 30초 변화를 고정했다. `frontend/src/sim/**`·`ElevatorCrossSection.vue`·기존 테스트 파일은 수정하지 않았다.

## 질문/에스컬레이션

- **[반박] 조작부 경계 제안**: 값이 실제로 바뀌는 프리셋 칩·입력·select·실행 버튼만 면으로 본다. `details` summary는 조작 가능하지만 정보 공개용이라 면을 주지 않고 hairline으로 남겼다. 이 구분이 버튼 밀도를 낮추면서도 실제 조작점을 가장 빨리 찾게 한다.
- **[반박] 택시 캔버스 경계**: 현재 9구역 메쉬를 이 티켓에서는 관찰 캔버스 예외로 유지했다. 이를 실지도 컴포넌트로 교체하면 `TKT-074`의 blocked 범위와 충돌하므로, 이 티켓은 톤만 바꾸고 지도 구조 재설계는 하지 않았다.

## 검증

- `node --test` 메인 프런트 unit 20/20 통과. 택시 엔진 8개 계약을 포함해 기존 로직 결과는 유지됐다.
- 신규 `SimTone.e2e.mjs` Chromium 5/5 통과: 375 dark·1440 light에서 엘리베이터/택시 각 1회, 두 페이지 동시 30.5초 무인 관찰 1회. 가로 overflow·브라우저 오류/경고 0.
- 기존 `taxiDispatch.e2e.mjs`의 375 dark 단일 시나리오는 배차·6호출 소진까지 통과한 뒤, TKT-114에서 제거된 격납고 `.sim-annex`를 찾는 복귀 단계에서만 실패했다. 테스트 무접촉 조건에 따라 이 티켓에서 고치지 않았다.
- 기본 build와 Pages-base build `npm run build`, `npm run build -- --base=/workaround.co.kr-platform/` 각각 48 modules 통과.
- 375px dark·1440px light 실렌더 4장을 직접 확인했다. 모바일은 9구역 3열 캔버스와 2열 지표가 본문 폭 안에 들고, 데스크톱은 관찰 캔버스/조작부와 차량/호출 행이 명확히 분리됐다.
- Safari/WebKit·실제 Pages 배포·실 엘리베이터 서비스 연결은 미검증. commit/push 없음.

## 리뷰 기록

- 구현 완료, PM r1 검토 대기.

## PR 준비 메모

- 제목: `feat(sim): apply timetable tone to elevator and taxi`
- 본문: 엘리베이터와 택시의 통계·운행 정보를 hairline 행으로 전환하고, 단면/구역 메쉬만 시뮬레이션 캔버스로 유지한다.
- 검증: unit 20/20, SimTone Chromium 5/5, 기본·Pages-base build 각 48 modules, 375/1440 overflow 0, 두 시뮬 30.5초 변화.
- 미검증: Safari/WebKit, 실제 Pages 배포, 실 엘리베이터 서비스.
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-120-r1.md`. [반박] 2건 수용. 구 taxi E2E selector 갱신 → TKT-134.
