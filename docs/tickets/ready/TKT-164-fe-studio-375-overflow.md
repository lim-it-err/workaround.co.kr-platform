문서 상태: 작성완료

# TKT-164 `[FE]` 글쓰기 375 상단바 — `.writer-save` 가 줄어들지 않아 생기는 간헐 1px 가로 넘침

- 상태: ready · **P1 병합 전(릴리스 게이트 red)** · 담당: codex-1 · 의존: TKT-147 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: AS-R009 09-15·09-16 재판정 — `WritingStudio.e2e.mjs:88` 375 dark/light `.writing-room` overflow `1 !== 0`(푸시 트리 `git archive` 재현). PM 재현: 같은 두 테스트가 실행마다 11/13 ↔ 13/13 을 오간다(REV-TKT-138 에서 "재현 안 됨"으로 닫은 것이 오판).
- PM 실측(dev 375, `.writing-room` clientWidth 321): 상단바 `.writer-bar`(flex, gap 4) 자식 = `writer-exit` 59.05 · `writer-document` 0 · **`writer-save` 60.76(flex 1 1 0%, `min-width:auto`)** · ghost 61.19 · primary 40 · tool-trigger 40 · `writer-more` 40 + gap 24 = **325.0** → 상태 문구 길이에 따라 `.writer-more` 우측이 346.46(컨테이너 346)까지 밀림. 저장 문구가 "저장됨 hh:mm" 일 땐 정확히 321, 더 길면 소수점 초과 → Chromium 반올림에 따라 scrollWidth 1px.
- 원인: `.writer-save` 는 `flex: 1 1 0%` 이지만 `min-width: auto` 라 텍스트 폭 아래로 줄지 않고, 나머지 6개는 `flex: 0 0 auto`(고정) — 합이 컨테이너를 넘으면 줄어들 곳이 없다.
- scope: `frontend/src/styles.css`(`.writer-save` — `min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`, 또는 `.writer-bar` 폭 계약 재정리), `frontend/src/components/WritingStudio.e2e.mjs`(긴 저장 문구 상태 케이스 추가 — 예: `저장 안 됨` 경고 상태·`저장됨 23:59`).

## 완료 조건
1. [ ] 375 dark/light `.writing-room`·`.page-scroller`·`html` overflow 0 — 같은 명령 **5회 연속** 13/13(실행 기록 첨부).
2. [ ] 저장 문구의 모든 상태(작성 중·저장됨·저장 실패·백업 안내)에서 상단바 우측 버튼 3개가 컨테이너 안(`right ≤ container.right`)·40px 유지.
3. [ ] 1440 회귀 0, ToneTools 12/12, 제품 시각 변화는 저장 문구 말줄임 외 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
