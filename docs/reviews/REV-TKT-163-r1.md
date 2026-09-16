문서 상태: 작성완료

# REV-TKT-163-r1 — 9/15~9/17 링크 note 에 TKT-149 확인값 반영 [콘텐츠] (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-16 밤. 콘텐츠 판정(출처 대조·원문 무변경).
- 대조: 세체니(07:00~20:00·매표 19:00·퇴장 19:40·13,200/10,500/15,200 Ft·슬리퍼 필수·수영모 랩 풀만), 마차시(09:00~17:00·미사 07:00/18:00), 푸니쿨라(08:00~22:00·정비 9/7·9/21), 어부의 요새 상부(09:00~21:00·1,500 Ft, 새 링크 budavar 공식), 비셰흐라드(묘지 19:00·일몰 19:13), 렌터카 4사(Sixt 반납 동선 변경 `Opletalova 53`·Budget 소지품·Enterprise 18:00·National 미확인), PRG VAT(T1 키오스크→Interchange·최대 3시간)·공항 도로 제한 9/9~9/25·아시아나 카운터(3시간 전~50분 전) — 보고서 §1~§6 값과 일치. `tip`·`am/pm/eve`·OZ546 18:50 무변경(diff 확인), 화면 `[확인]` 0.
- 게이트: coverage unit 1/1 · Pages-base build 49 · RouteMap E2E 4/4.
- [제안] National 링크가 `/pt/` 로케일 URL — `/en/` 으로 교체 후속.
- 커밋 범위: `frontend/src/data/voyages/east-europe-2026.js`, `frontend/src/data/voyageCoverage.test.mjs`.
