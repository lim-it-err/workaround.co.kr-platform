문서 상태: 작성완료

# TKT-104 `[FE]` Inflight 필터 pill 접근성 후속 — aria-pressed

## 메타데이터

- 문서 상태: 작성완료
- 상태: started (2026-09-10 codex-1 인박스 지정 착수)
- 우선순위: P2 (REV-TKT-098-r1 [중요] 후속)
- 담당: codex-1 (FE)
- scope: `services/advisor/frontend/src/modules/missions/pages/InflightPage.vue` (+해당 테스트)

## 목표

시간·취향 선택 pill 버튼에 `:aria-pressed` (또는 `aria-current`) 바인딩을 추가해 스크린리더/키보드 사용자가 선택 상태를 알 수 있게 한다. REV-TKT-098-r1 [중요] 항목 참조 (재현 절차 포함).

## 완료 조건

1. 선택 상태가 ARIA 로 노출된다 (E2E 또는 unit 로 검증 1건 추가).
2. `npm run test:unit`·`build` 그린.
