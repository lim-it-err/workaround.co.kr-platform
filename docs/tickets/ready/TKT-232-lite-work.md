문서 상태: 작성완료

# TKT-232 `[FE]` lite 운영 노트 — 목차 → 한 절씩 읽기

- 상태: ready · **P2 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 「운영 노트」 (PO 2026-11-22 승인).
- 의존: TKT-228.
- scope: `frontend/src/components/lite/LiteWork.vue`(자리표시 교체), 신규 `frontend/src/components/LiteWork.e2e.mjs`, 캡처. `data/workNotes/operatingModel.js`·`WorkNotes.vue`·`WorkView.vue` 수정 금지(읽기만).

## 화면
- 1단계 목차: `OPERATING_NOTES` 의 `title` 목록(번호 붙임) + 줄 오른쪽에 status(확정/제안/할 일). 위에 「갱신 OPERATING_NOTES_UPDATED」 한 줄. 첫 줄 선택된 채 시작.
- 2단계 한 절: 「n/N」, 제목, lead 한 문단, points 목록(있으면 flow 는 「→」 로 이은 한 줄). ←→ = 앞뒤 절, ↑↓ = 본문 스크롤, Esc = 목차(고르던 줄 유지).
- Esc(목차) = 환승 홀.

## 완료 조건
- [ ] 1. 목차 항목 수 = `OPERATING_NOTES.length`(하드코딩 금지).
- [ ] 2. 키만으로 목차 → 절 → → 다음 절 → Esc 목차(같은 줄 선택 유지).
- [ ] 3. 375 가로 스크롤 0, 줄 ≥44px.
- [ ] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LiteWork.e2e.mjs` 통과, 캡처 `docs/tickets/captures/TKT-232/` 375·1440 목차·절. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
