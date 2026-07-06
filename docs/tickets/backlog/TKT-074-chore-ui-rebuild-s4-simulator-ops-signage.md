문서 상태: 작성완료

# TKT-074

## 메타데이터

- 제목: UI 재구현 S4 - 시뮬레이터/운영 페이지 시안 A 헤더 + 토큰
- 우선순위: P2
- 대상 버전: `chore`
- 상태: `backlog`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-074-ui-rebuild-s4-sim-ops-signage`

## 목표

슬라이스 S4를 구현한다. elevator/taxi/work/runtime/simhub 다섯 승강장에 StationHeader(S1 산출물)를 적용하고, 본체를 시안 A 통계 타일·패널·car-row·slider·chip-btn 문법으로 스킨한다. Work Manager 의 preview/locked/live 시각 규칙과 드래그/시스템 소유 구간 구분을 명확히 한다. 도메인 계약(사람 단위 엘베 등)은 불변, UI만 스킨한다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §3.1(StationHeader, S1 산출물 재사용), §3.6(공통 프리미티브), §4(elevator/taxi/work/runtime/simhub), §6(S4), §7.

1. elevator (스펙 §4 elevator, 현재 App.vue L3224) — Line E(sky). StationHeader(code `E01`, band `--line-e`, prev "← 환승 홀", status "실시간 운행", summary "23층 · car 4대 · 정원 20명"). 본체 순서: (1) `.stat-row`/`.stat-strip` 큰 수치 요약(대기/탑승/운행 car/평균 대기, `.num`) → (2) 운행 현황 `.car-row`(`.car-id` E1.. + `.car-mid` 방향·다음정차·`.load-track` + `.car-pax .num` `9/20`) → (3) 수요 조작 `.preset-row`(한산/보통/혼잡 `.chip-btn`) + `.slider-block`(수요강도/car수) + `.queue-btns`(상행/하행 1명 추가·리셋). 슬라이더 트랙/thumb 액센트 = `--line-e` 또는 `--safety`. 도메인 유지: 사람 단위 모델, 상·하행 대칭, 연속 위치·보간(워프 금지). UI만 스킨.
2. taxi (스펙 §4 taxi, 현재 App.vue L3423) — Line T(gold). 배너 `line-p` → `line-t`(S1에서 이미 리매핑, 여기서 본문 정합). StationHeader(code `T01`, band `--line-t`). 본체 유지: 9구역 `district-grid`/`district-card`, active/completed request, 차량 상태, reward/penalty/net. 카드 액센트는 노선 T 1색 + 수요 강도만 톤 차등. 통계 `.num` 적용.
3. work (스펙 §4 work, 현재 App.vue L3876) — Line W(green). StationHeader(code `W01`, band `--line-w`, status "조회 공개 / gate locked|unlocked"). 5레인 보드·버전 헤더·worker ownership·command gate·activity feed 는 기능 유지, 표면/배지/버튼만 토큰 통일. 시각 규칙: preview=점선 + 약한 노랑, locked=주황/황색 경고(빨강 아님, `--safety` 계열 warning), live=선명한 초록/파랑. 드래그 가능 구간(`Backlog→Ready`)과 시스템 소유 구간(`Ready→Started`)을 시각적으로 명확히 구분(끌 수 있는 것 vs 레일). 경계: 이 전체 보드는 Work 페이지에서만, 홀로 역류 금지.
4. runtime (스펙 §4 runtime, 현재 App.vue L2943 계열) — Line R(blue). StationHeader(code `R01`, band `--line-r`). 본체: 노드 역할(`ion2`/`rtx5070`/`gateway`) 카드 + degraded 정책 + release path 요약 + Ollama 상태를 `.stat`/도착 정보 바(§3.5B `.arrival-grid`)로 요약. 세부 인프라 매뉴얼 전량 쏟기 금지.
5. simhub (스펙 §4 simhub, 현재 App.vue L3153) — 노선 아님. 배너 `line-p`(금색)를 StationHeader가 아닌 **중립 하위 허브 헤더**로(노선색 없음: `--panel` 배경 + 좌측 레일 `--line-strong`). 본체는 LineCard(§3.2) 2장 = Elevator(E, sky)·Taxi(T, gold), 필요 시 Blog 보조 진입 카드. 각 카드 상태 요약 + 진입 CTA. 금지: 제품 전체 재요약, 택시/엘베 조작 패널 직접 노출. (LineCard.vue 는 여기서 처음 실사용 — S5에서 프리미티브로 승격.)
6. 공통 규칙 (스펙 §4 공통, §3.6). 모든 승강장은 색을 해당 노선 1색만(멀티 액센트 금지), 복귀 CTA 항상 노출. 통계 타일 `strong.num`(1.5~1.9rem, tabular-nums), `.load-track > i`(배경=노선색), `.chip`/`.chip-btn`, `.btn-exit`(진입)/`.btn-ghost`(보조) 규칙 통일.

시안 재사용 포인터(스펙 §7): 승강장 본문은 시안 A `.stat-row`/`.stat-tile`/`.car-row`/`.load-track`/`.preset-row`/`.chip-btn`/`.slider-block`/`input[type=range]`(CSS L589~654, DOM L1156~1231). 큰 수치 스트립은 시안 C `.stat-strip`(L515~525). LineCard 는 시안 A `.line-card` 계열(L432~449) + DOM(L918~961). StationHeader 는 S1 산출물(시안 A `.station-sign`~`.station-sub` L554~587).

## 범위

- 포함: elevator/taxi/work/runtime 에 StationHeader + 시안 A 통계 타일·패널·car-row·slider·chip-btn 스킨, simhub 중립 하위 허브 헤더 + LineCard 2장, Work preview/locked/live 시각 규칙 및 드래그/시스템 소유 구간 구분, taxi 배너 본문 `line-t` 정합.
- 제외: 색 토큰/타이포/StationHeader 컴포넌트 자체(→ TKT-071/S1 선행), 환승 홀 노선도(→ TKT-072/S2), 블로그 페이지·배지(→ TKT-073/S3), 페이지 뷰 컴포넌트 전면 분리(→ TKT-075/S5), 모바일 재배치(→ TKT-076/S6). 도메인 계약(사람 단위 엘베, 상·하행 대칭, 연속 위치) 변경 금지.

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- elevator/taxi/work/runtime 상단이 StationHeader(각 노선색 band + code)이고, 본체 통계/패널/car-row/slider/chip 이 시안 A 스킨으로 통일된다.
- simhub 헤더가 노선색 없는 중립 톤이고, 본체가 Elevator(E)·Taxi(T) LineCard 2장으로 구성된다.
- Work Manager 에서 preview(점선/약한 노랑)/locked(주황·황색 경고, 빨강 아님)/live(선명 초록·파랑)가 시각 구분되고, 드래그 가능 구간(Backlog→Ready)과 시스템 소유 구간(Ready→Started)이 구분된다.
- 각 승강장이 노선 1색만 쓰며 복귀 CTA 가 항상 노출되고, 도메인 동작(엘베 사람 단위 등)에 회귀가 없다.

## 선행 조건

- `TKT-071`(S1: 토큰/타이포/StationHeader) 선행. StationHeader 컴포넌트와 노선 토큰, `--safety`/`--exit` 규약, `.stat`/`.chip`/`.btn` 프리미티브가 있어야 한다.

## 질문/결정 기록

- 결정(스펙 §4): Sim Hub 는 노선이 아니라 하위 환승면 → 전용 노선색 없이 중립 헤더. E/T 두 색은 각 LineCard 에서만.
- 결정(스펙 §4 work): Work 의 preview/locked/live 는 색+상태로 구분, locked 는 빨강이 아니라 주황/황색 경고. 드래그(Backlog→Ready) vs 시스템 소유(Ready→Started) 시각 분리.
- 결정(도메인): 엘베 사람 단위/상·하행 대칭/연속 위치 등 feature-definition 계약 불변. UI만 스킨.

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (특히 §3.1/§3.2/§3.6/§4 elevator·taxi·work·runtime·simhub/§6/§7)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`

## 작업자 산출물

- 브랜치 이름
- 페이지별 StationHeader code/band/summary 적용 요약
- Work preview/locked/live 및 드래그/시스템 소유 구분 요약
- simhub 중립화 + LineCard 요약
- 도메인 회귀 없음 확인
- 검증 결과(run-frontend-build)

## 검토 메모

- 없음

## Notes

- LineCard 는 이 슬라이스(simhub)에서 처음 실사용되며, S5(TKT-075)에서 재사용 프리미티브(`components/LineCard.vue`)로 정식 승격된다. 여기서 마크업/클래스를 시안 A `.line-card` 규약으로 맞춰두면 분해가 쉽다.
- Work 5레인은 파일 폴더 5단계(backlog/ready/started/need_review/finished)와 1:1 대응이다. 시각 규칙이 이 의미(드래그 제안 vs 시스템 확정)를 흐리지 않게 한다.
