# TKT-091
## 메타데이터
- 제목: Line V 노선 등록 — 토큰·lines.js·환승 홀 노출
- 우선순위: P1 / 상태: `ready` / 담당: `[FE]`
- 의존: **없음 — 이 티켓이 088~090 의 선행이다** (091 → 088 → 089 → 090 순서. 순환 아님, PM 문구 정정 2026-08-18)
- scope: `frontend/src/styles.css`(--line-v 토큰 추가만), `frontend/src/data/lines.js`, `frontend/src/App.vue`(라우팅 case 추가만)
## 목표
①`--line-v`/`--line-v-text` 다크·라이트 정의 — 기존 7색과 구분되는 색(권장: 딥 오렌지/앰버 계열 아닌 **버건디/와인** 또는 스틸 그레이-블루 — B rose·T gold 와 혼동 없게, 다크/라이트 대비 검증) + `.line-v` modifier ②lines.js 에 V 지선 추가(`upcoming: false`, 좌표는 D/P 패턴 따라 신규 — 남서 방향 여유 슬롯) ③환승 홀 행 목록·노선도에 V 노출, 클릭 → voyage 준비 화면.
## 완료 게이트
- build + 노선도에서 V 라벨 클릭 이동 + 양 테마에서 7색과 시각 구분 확인
