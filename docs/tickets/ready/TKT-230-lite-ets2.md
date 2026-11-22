문서 상태: 작성완료

# TKT-230 `[FE]` lite 유로트럭 — 지금 주행 한 장면을 크게

- 상태: ready · **P2 · v0.9.2** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.2`.
- 근거: 시안 「유로트럭」 (PO 2026-11-22 승인). **시안과 다른 점(PM 판단)**: 시안의 「출발지→도착지·화물」은 실데이터에 없다. 실제 meta(`public/mockups/ets2-sample/meta-*.json`, 라이브는 `VITE_ETS2_FRAME_URL/meta.json`)에 있는 값만 쓴다.
- 의존: TKT-228.
- scope: `frontend/src/components/lite/LiteEts2.vue`(자리표시 교체), 신규 `frontend/src/components/LiteEts2.e2e.mjs`, 캡처. `Ets2Live.vue`·public 샘플 수정 금지(읽기·fetch 규칙만 참고 — meta 정규화 함수가 필요하면 LiteEts2 안에 같은 규칙으로 둔다).

## 화면
- 큰 숫자 한 개: 현재 속도 `82 km/h`. 그 아래 줄: 크루즈 · 제한 속도 · 남은 거리(`14.2 km`) · 연결 상태(연결됨/끊김/일시정지).
- 샘플 모드(`VITE_ETS2_FRAME_URL` 없음)면 맨 위에 「샘플 · 실제 주행 아님」을 항상 표시하고, ↑↓ 로 샘플 1·2·3 을 넘긴다(「1/3」 표시). 라이브 모드면 ↑↓ 없이 5초마다 갱신, 키 안내 줄은 「Esc 뒤로」만.
- 프레임 이미지·지도 없음. 불러오기 실패 시 「신호 없음 — 잠시 후 다시」 한 줄(빈 화면 금지).
- Esc = 환승 홀.

## 완료 조건
- [ ] 1. 샘플 모드에서 속도 숫자와 「샘플」 표시, ↑↓ 로 1/3→2/3 변화.
- [ ] 2. meta fetch 실패(404) 시 안내 한 줄, 콘솔 에러 0(fetch 실패 외).
- [ ] 3. 375 가로 스크롤 0.
- [ ] 4. 검증: 빌드(Pages base) + `Lite.e2e.mjs`·`HallV09.e2e.mjs`·새 `LiteEts2.e2e.mjs` 통과, 캡처 `docs/tickets/captures/TKT-230/` 375·1440. `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
