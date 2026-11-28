문서 상태: 작성완료

# REV-TKT-236-r2 — Advisor 코드 내려받기·올리기 재작업 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- `npx vite build --base=/workaround.co.kr-platform/advisor/` 통과.
- `vitest run src/modules/missions/utils`: 4/4.
- `playwright test e2e/mission-code-transfer.spec.ts`: 6/6 (폴더 올리기 경로 `src/B.java` — 최상위 폴더 제거 단언 포함, 안내 문구 단언).
- 구현자: playwright 전체 67 pass.
- r1 블로커(최상위 폴더명) · 중요(안내 문구) 해소.

## 남은 것
- `[제안]` 폴더 드롭·50개 초과는 수동 확인 대상(PO 실사용 때).
- `[제안]` `src/app/platformTheme.spec.js` 기존 실패 1건 — 별도 정리.
