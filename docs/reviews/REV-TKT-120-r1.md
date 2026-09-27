문서 상태: 작성완료

# REV-TKT-120-r1 — 시뮬 2화면 톤 전환(멈춘 엘리베이터·심야 택시) (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 48 modules, unit 20/20. 구현자 SimTone Chromium 5/5 인정. `frontend/src/sim/**`·`ElevatorCrossSection.vue`·기존 테스트 무접촉 확인.
- 실화면(localhost:7010): 390 `/elevator` 제목 `멈춘 엘리베이터`·`E01`, 지표 4(대기·탑승·이동 중·평균 대기) 행, 수요 프리셋 칩(한산·보통·혼잡)·고급 설정·최근 운행 details, 대문자 영어 0, overflow 0. `/taxi` 제목 `심야 택시`·`T01`, 상단 4지표 행, 9구역 메쉬(호출·인근 차량·연결 구역 한글), 5초 관찰에서 지표 변화 ✓. 1440 라이트에서 넓은 채움 면은 `elevator-cross-section`(937×688)·`district-grid`(818×345) 캔버스 2개뿐 — 원칙 1 예외 그대로.
- 엘리베이터 지표는 개발 서버(게이트웨이 없음)에서는 정지값 — 서버 구동 시뮬이라 기존과 같은 조건, 구현자 E2E 는 모의 API 로 30.5초 변화 확인. 120 결함 아님.
- **[반박] 2건 수용**: ① 조작부 = 값이 바뀌는 프리셋·입력·select·실행 버튼만 면, `details` summary 는 hairline — 원칙 1 해석으로 채택(톤 원칙 문서에 각주 추가 예정). ② 택시 9구역 메쉬는 관찰 캔버스 예외 유지, 실지도 교체는 TKT-074 범위.
- [중요→134] 기존 `taxiDispatch.e2e.mjs` 복귀 단계가 114 에서 제거된 격납고 `.sim-annex` 를 찾아 실패 — 테스트 무접촉 조건 때문에 남겨둠. 시뮬 로직 테스트가 아니라 selector 갱신이므로 **TKT-134(잔존 정리)** 에 포함해 고친다.
- 커밋 범위: `frontend/src/App.vue`, `frontend/src/styles.css`, `frontend/src/components/SimTone.e2e.mjs`.
