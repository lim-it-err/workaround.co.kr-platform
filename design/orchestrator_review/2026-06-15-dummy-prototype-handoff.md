문서 상태: 작성완료

# 2026-06-15 더미 프로토타입 handoff

## 요약

- 디자이너 더미 프로토타입을 `frontend/src/App.vue`, `frontend/src/styles.css` 에 직접 반영했다.
- 메인 페이지는 더 이상 기능 패널을 펼치는 대시보드가 아니라, `Main Junction` 환승 홀로만 동작한다.
- 실제 기능 화면은 `Elevator Station`, `Work Manager`, `Runtime Board` 로 분리했다.

## 오케스트레이터가 티켓으로 나누기 좋은 경계

1. `Hub Shell`
   메인 허브, wayfinding bar, 노선 카드, 허브 하단 transfer map, 모바일 스택 구성

2. `Elevator Station`
   수요 프리셋, shaft 상태, 층별 queue/위치 표, 최근 도착 로그

3. `Work Manager`
   5레인 보드, 선택 티켓 상세 패널, preset command zone, activity feed

4. `Runtime Board`
   노드 상태 카드, degraded 정책 목록, release path 보드

5. `Theme / Mobile Polish`
   라이트/다크 토큰, 960px 이하 스택 재배치, 720px 이하 모바일 카드 리듬

## 구현 acceptance 힌트

- 메인 허브에서는 실제 시뮬레이터 보드나 Work Manager 전체 레인을 직접 노출하지 않는다.
- `Main page 환승 홀로` 복귀 동선은 기능 페이지마다 유지한다.
- 모바일은 축소판이 아니라 카드 스택과 세로 스크롤 우선 구조로 다시 읽혀야 한다.
- 오케스트레이터는 이 더미 프로토타입을 기준으로 `TKT-041`, `TKT-039`, `TKT-040`, `TKT-011`, `TKT-021`, `TKT-035` acceptance criteria 를 더 세밀하게 쪼갤 수 있다.

## 오케스트레이터 확인 위치

- 코드 기준 화면: `frontend/src/App.vue`, `frontend/src/styles.css`
- 프런트 방향 문서: `frontend/README.md`
- 디자인 기준 문서:
  - `design/main-page-router-concept-2026-06-15.md`
  - `design/seoul-subway-ui-ux-system-2026-06-15.md`
  - `design/ui-ux-rules.md`
- 오늘 변경 요약: `docs/history/2026-06-15.md` 의 `UI-v0.4.0 더미 프로토타입 정리`

## 오케스트레이터 확인 방법

1. 사용자 기본 흐름은 `http://localhost:7000/` 에서 본다.
2. 오케스트레이터 검수는 `http://localhost:7000/test` 를 기본 테스트 경로로 사용한다.
3. `/test` 기본 첫 화면은 `junction` 으로 본다.
4. `/test` 에서 허브 / Elevator / Work Manager / Runtime 빠른 이동 버튼이 보이는지 확인한다.
5. 필요하면 `?view=junction`, `?view=elevator`, `?view=work`, `?view=runtime` 로 특정 화면을 바로 연다.
6. 메인 허브는 대시보드가 아니라 환승 허브처럼 읽히는지 본다.
7. 각 기능 페이지에서 `Main page 환승 홀로` 버튼으로 허브에 복귀되는지 본다.
8. 화면 폭을 줄여 모바일 레이아웃에서 카드 스택과 세로 스크롤 우선 구조가 유지되는지 본다.

## 오케스트레이터 체크리스트

- 메인 허브에 실제 Elevator dispatch 표가 바로 노출되지 않는가
- 메인 허브에 실제 Work Manager 5레인 전체가 바로 노출되지 않는가
- 메인 허브가 "요약 + 선택 + 이동"만 담당하는가
- 기능 페이지마다 역할이 명확히 분리되는가
- 모바일에서 검은 빈 여백보다 정보 카드가 먼저 보이는가
- 허브 / Elevator / Work Manager / Runtime / Mobile 을 별도 티켓 슬라이스로 나눌 수 있을 만큼 경계가 선명한가

## 오케스트레이터가 티켓으로 옮길 때 권장 문장

- `TKT-041` 계열:
  - 메인 페이지는 기능 실행 화면이 아니라 라우터형 환승 허브여야 한다.
  - 메인에서는 노선 카드와 상태 요약만 보여주고 실제 기능 패널은 개별 페이지에서만 노출한다.
- `TKT-039`, `TKT-040` 계열:
  - Work Manager 는 허브와 분리된 운영 페이지로 읽혀야 하며, 5레인 보드와 상세/command zone 경계가 유지되어야 한다.
- `TKT-011`, `TKT-021`, `TKT-035` 계열:
  - Elevator Station 은 수요 분포, shaft 상태, 층별 queue 를 독립 페이지에서 보여줘야 한다.

## 디자이너 메모

- 지금 더미 프로토타입은 "완성 디자인"보다 "구조와 티켓 경계가 선명한 디자인 베이스"에 더 가깝다.
- 다음 단계에서는 이 더미를 기준으로 실제 데이터 연결, 모션 디테일, 모바일 polish 를 더하면 된다.
