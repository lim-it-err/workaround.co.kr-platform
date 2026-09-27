# TKT-091
## 메타데이터
- 문서 상태: 작성완료
- 제목: Line V 노선 등록 — 토큰·lines.js·환승 홀 노출
- 우선순위: P1 / 상태: `finished` / 담당: `[FE]`
- 의존: **없음 — 이 티켓이 088~090 의 선행이다** (091 → 088 → 089 → 090 순서. 순환 아님, PM 문구 정정 2026-08-18)
- scope: `frontend/src/styles.css`(--line-v 토큰 추가만), `frontend/src/data/lines.js`, `frontend/src/App.vue`(라우팅 case 추가만)
## 목표
①`--line-v`/`--line-v-text` 다크·라이트 정의 — 기존 7색과 구분되는 색(권장: 딥 오렌지/앰버 계열 아닌 **버건디/와인** 또는 스틸 그레이-블루 — B rose·T gold 와 혼동 없게, 다크/라이트 대비 검증) + `.line-v` modifier ②lines.js 에 V 지선 추가(`upcoming: false`, 좌표는 D/P 패턴 따라 신규 — 남서 방향 여유 슬롯) ③환승 홀 행 목록·노선도에 V 노출, 클릭 → voyage 준비 화면.
## 완료 게이트
- build + 노선도에서 V 라벨 클릭 이동 + 양 테마에서 7색과 시각 구분 확인

## 작업자 산출물

- 브랜치/커밋: 기존 작업 트리에 구현, 커밋 없음.
- `styles.css`: 다크 `#55738F`/`#9CB8D2`, 라이트 `#36566F`의 스틸 그레이-블루 `--line-v` 토큰과 `.line-v` modifier를 추가했다.
- `data/lines.js`: 남서 여유 슬롯에 V 지선을 등록하고 `upcoming: false`, `page: 'voyage'`로 연결했다.
- `App.vue`: live page·상단 노선·환승 홀 상태·Voyage 라우팅 case와 V01 준비 헤더를 추가했다.

## 검증 결과

- `cd frontend && npm run build`: 통과 (`vite v6.4.3`, 17 modules, 638ms).
- 환승 홀 행 목록과 SVG의 `V 여행 노선` 라벨 클릭이 모두 V01 여행 준비 화면으로 이동함을 확인했다.
- 다크/라이트 육안 확인: B rose·T gold·R blue와 구분되는 스틸 그레이-블루로 표시되고, 흰 글자 대비는 다크 코어 4.96:1·라이트 코어 7.73:1이다.
- 모바일 375×812: `documentElement.scrollWidth === clientWidth === 375`, 비의도 가로 오버플로 0.
- 브라우저 console error/warning 0.
