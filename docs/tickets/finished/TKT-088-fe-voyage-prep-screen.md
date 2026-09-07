# TKT-088
## 메타데이터
- 문서 상태: 작성완료
- 제목: Line V 준비 화면 (개찰구 앞) — 체크리스트·여정 요약·예산
- 우선순위: P1 (출발 일정 제약) / 상태: `finished` / 담당: `[FE]`
- 의존: TKT-091 (토큰·노선 등록이 먼저). `design/voyage-line-spec.md` 는 **불요** — 이 티켓 본문 + `voyage.js` 가 스펙이다 (PM 정정 2026-08-18, TKT-084 는 데이터 완성으로 종료)
- 진행 판정: `진행 가능` (PM unblock 2026-08-18)
- scope: `frontend/src/**` (신규 voyage 모듈 + 라우팅 연결부만)
- 데이터: `frontend/src/data/voyage.js` (단일 소스 — **수정 금지**, 렌더만)
## 목표
V 노선 진입 시 여행 전 상태(`status: 'preparing'`)의 화면: ①여정 요약(기간·항공편·도시 체인) ②체크리스트(voyage.checklist — 로컬스토리지로 체크 상태 저장) ③예산 표(voyage.budget) ④운영 원칙 5개(voyage.principles) 카드.
## 완료 게이트
- `npm run build` + 다크/라이트 + 모바일 375px 오버플로 0
- StationHeader(코드 V01, line-v 액센트 — TKT-091 토큰 사용) + 카피 원칙 준수(자기 해설 금지)
- 체크 상태가 새로고침 후 유지 (localStorage)

## 질문/결정 기록

- [해결, PM, 2026-08-18] TKT-091 검토 통과로 `line-v` 토큰 선행 조건이 충족됐다.
- [해결, PM, 2026-08-18] 별도 `design/voyage-line-spec.md` 없이 이 티켓 본문과 `voyage.js`를 화면 스펙으로 사용한다.
- [해결, PM, 2026-08-18] TKT-091이 검토를 통과해 노선 토큰 선행 조건이 충족됐다. 별도 화면 스펙 없이 이 티켓 본문과 `voyage.js`를 단일 기준으로 사용한다.

## Notes

- 두 시작 게이트는 PM의 2026-08-18 unblock으로 해소됐다.

## 작업자 산출물 (2026-08-18, codex-1)

- 브랜치: 트렁크 `codex/v0.6.0-line` 직접, 커밋 없음.
- `frontend/src/components/VoyagePrepView.vue` 신설 — `voyage.js` 단일 소스로 여정 요약·항공편·도시 체인·체크리스트·예산·운영 원칙을 렌더하고, 체크 상태를 voyage ID별 localStorage에 저장한다.
- `frontend/src/App.vue`의 V 노선 분기를 `VoyagePrepView`로 연결하고 `StationHeader` V01/`line-v` 표기를 적용했다.
- 검증: `npm run build` 통과(Vite 6.4.3, 20 modules), `git diff --check` 통과.
- 브라우저 검증: 다크/라이트 시각 확인, 체크 1건 선택 후 새로고침 재진입 시 1/11 복원, 375×812에서 `scrollWidth=clientWidth=375`, 콘솔 오류 없음.
