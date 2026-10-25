문서 상태: 작성완료

# TKT-205 `[FE]` 스플래시 티커 — 마지막(4번째) 문구를 `관리자 몰래 내맘대로 홈페이지 로딩하는 중.` 으로 고정

- 상태: ready · **P1 · v0.8.2** · 담당: dev 서브에이전트(Haiku) · 브랜치 `codex/v0.8.2`(작업 트리 `/Users/imjeonghan/newProject/wa-082`) · **TKT-196 끝난 뒤 착수(같은 App.vue)**.
- 근거: PO 2026-10-25 「무조건 시작 안내 문구 마지막 4번째는 관리자 몰래 오픈하는 중(지금 있는 거)로 고정해줘」.
- scope: `frontend/src/data/splashTicker.js`(고정 문구 상수·선택 함수), `frontend/src/App.vue`(`rotateSplashTicker` 의 마지막 틱 처리), `frontend/src/splashTone.e2e.mjs`.

## 완료 조건
1. [ ] 첫 방문·`다시 재생` 의 4번째(마지막, 4,500ms) 티커는 항상 `관리자 몰래 내맘대로 홈페이지 로딩하는 중.`(풀 20번 원문 그대로). 1~3번째는 지금처럼 무작위이되 이 문구는 나오지 않는다.
2. [ ] 재방문(2.5초, 2개)은 두 번째(마지막)가 이 문구. reduced-motion 도 마지막 틱이 이 문구.
3. [ ] 풀 39개·1.5초 간격·직전 반복 금지·타이머 정리 계약 유지.
4. [ ] E2E: 첫 방문·다시 재생·재방문·reduced-motion 의 마지막 티커 = 고정 문구, 앞 문구에 고정 문구 0. `npm --prefix frontend run e2e:all` 그린, unit, `git diff --check`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
