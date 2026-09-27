문서 상태: 작성완료

# REV-TKT-135-r1 — Advisor 시즌 수명주기 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: `services/advisor/frontend` unit **81/81**, build **110 modules**, `season-lifecycle.spec.ts` Playwright(아래 게이트 출력). 구현자 전체 E2E 41/41 인정. 콘텐츠 3파일 diff 없음.
- 실화면(127.0.0.1:5173 `/history`, 390 — PM 이 localStorage 로 종료 시즌을 만들어 검증, 검증 후 원복):
  - 로드 시 구 `seasonStats` → `seasons{activeId, byId}` 마이그레이션, 구 키 제거 ✓.
  - 종료 시즌(2026-08-01~08-28, gains 2): `시즌 완료` + 4스탯 합계 5 + 최근 적립 2건 + 결말 `조용한 계절`(서사) + **`새 시즌 시작`** CTA ✓. 지난 시즌 0(아직 안 닫힘) ✓.
  - CTA 클릭 → 새 시즌 `season-2026-09-14` active(0 에서 시작), 이전 시즌 `closedAt` 기록·`ending` 고정(`ending-quiet`)·gains 보존 ✓ → `지난 시즌 1개 · 2026-08-01 → 08.28 · 합계 5 · 조용한 계절` hairline 행 → 펼치면 **읽기 전용** 상세(스탯·적립·결말) ✓. `새 시즌을 시작했습니다.` 안내 ✓.
  - 누적 스탯 행 상단 배치 ✓. 채움 면은 `새 시즌 시작` 버튼뿐, overflow 0 ✓.
- 스펙 §2-2(거절 사유 + 대기 적립 재시도)는 E2E·unit 근거 인정(구현: `pendingGains` 큐 — 한 행동 2스탯도 보존, PM 스펙보다 나은 선택).
- 완료 조건 1~4 충족. AS-R008 §5 잔여 결함(28일 후 적립 조용히 사라짐) 해소.
- [제안] 처음 방문(시즌 없음) 상태의 CTA 문구를 `첫 시즌 시작` 으로 — 사소, 후속.
- 커밋 범위: `services/advisor/frontend/{e2e/{core-flows,season-lifecycle}.spec.ts, src/modules/missions/pages/{RecordsPage,ReviewPage,SeasonPage}.vue, src/modules/missions/store/{missions.js,seasonStats.js}, src/modules/missions/store/__tests__/{missions,practice,seasonStats}.spec.js}`.
