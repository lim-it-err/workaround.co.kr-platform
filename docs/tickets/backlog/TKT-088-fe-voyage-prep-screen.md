# TKT-088
## 메타데이터
- 문서 상태: 작성완료
- 제목: Line V 준비 화면 (개찰구 앞) — 체크리스트·여정 요약·예산
- 우선순위: P1 (출발 일정 제약) / 상태: `ready` / 담당: `[FE]`
- 의존: TKT-091 (토큰·노선 등록이 먼저). `design/voyage-line-spec.md` 는 **불요** — 이 티켓 본문 + `voyage.js` 가 스펙이다 (PM 정정 2026-08-18, TKT-084 는 데이터 완성으로 종료)
- 진행 판정: `진행 불가` (`blocked` — PM 결정 대기)
- scope: `frontend/src/**` (신규 voyage 모듈 + 라우팅 연결부만)
- 데이터: `frontend/src/data/voyage.js` (단일 소스 — **수정 금지**, 렌더만)
## 목표
V 노선 진입 시 여행 전 상태(`status: 'preparing'`)의 화면: ①여정 요약(기간·항공편·도시 체인) ②체크리스트(voyage.checklist — 로컬스토리지로 체크 상태 저장) ③예산 표(voyage.budget) ④운영 원칙 5개(voyage.principles) 카드.
## 완료 게이트
- `npm run build` + 다크/라이트 + 모바일 375px 오버플로 0
- StationHeader(코드 V01, line-v 액센트 — TKT-091 토큰 사용) + 카피 원칙 준수(자기 해설 금지)
- 체크 상태가 새로고침 후 유지 (localStorage)

## 질문/결정 기록

- [열림, codex-1, 2026-08-17] TKT-088 완료 게이트는 TKT-091의 `line-v` 토큰을 요구하지만, TKT-091은 TKT-088~090 완료를 선행 조건으로 둔다. 순환 의존성을 해소하도록 TKT-091을 먼저 허용하거나 TKT-088 게이트의 토큰 요구를 분리해 달라.
- [열림, codex-1, 2026-08-17] TKT-084가 산출하기로 한 `design/voyage-line-spec.md`가 아직 없고 TKT-084 상태도 `started`다. 화면 스펙이 확정되기 전에는 FE가 레이아웃·상호작용을 임의 결정할 수 없다.

## Notes

- 위 두 시작 게이트가 해소될 때까지 코드 변경 없이 착수를 중단한다.
