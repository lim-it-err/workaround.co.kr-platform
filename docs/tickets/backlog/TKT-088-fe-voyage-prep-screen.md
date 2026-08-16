# TKT-088
## 메타데이터
- 제목: Line V 준비 화면 (개찰구 앞) — 체크리스트·여정 요약·예산
- 우선순위: P1 (출발 일정 제약) / 상태: `ready` / 담당: `[FE]`
- scope: `frontend/src/**` (신규 voyage 모듈 + 라우팅 연결부만)
- 데이터: `frontend/src/data/voyage.js` (단일 소스 — **수정 금지**, 렌더만)
## 목표
V 노선 진입 시 여행 전 상태(`status: 'preparing'`)의 화면: ①여정 요약(기간·항공편·도시 체인) ②체크리스트(voyage.checklist — 로컬스토리지로 체크 상태 저장) ③예산 표(voyage.budget) ④운영 원칙 5개(voyage.principles) 카드.
## 완료 게이트
- `npm run build` + 다크/라이트 + 모바일 375px 오버플로 0
- StationHeader(코드 V01, line-v 액센트 — TKT-091 토큰 사용) + 카피 원칙 준수(자기 해설 금지)
- 체크 상태가 새로고침 후 유지 (localStorage)
