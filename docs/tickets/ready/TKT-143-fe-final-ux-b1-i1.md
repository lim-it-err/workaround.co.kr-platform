문서 상태: 작성완료

# TKT-143 `[FE]` 최종 UX 검수 반영 — 읽기용 카드 면 2곳 제거(B1) + 오늘 CTA 카드 목적지 보존(I1)

- 상태: ready · P1 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. **병합 전 필수**(UX-TONE-FINAL B1). **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: `docs/reviews/UX-TONE-FINAL-2026-09-14.md` B1·I1 (codex-8).
- scope: Advisor `pages/InflightPage.vue`(`.flight-card`)·`app/styles.css`(`:is(a,button).card` 링크 면)·`pages/TodayPage.vue`·`store/missions.js`(추천 링크)·`routes.js`(`/games` 리다이렉트 query 보존), 메인 `frontend/src/App.vue`(`.path-steps`)·`styles.css`. 콘텐츠 3파일 불가침.

## 목표
1. **B1-a** Advisor 오늘 › 오프라인 세션 › `이번 비행 추천` 3개: 라운드 박스 → 제목·시간·화살표 **한 행 + hairline**. 글자 크기·줄 간격·시간 프리셋 등 실제 조작부 면은 유지.
2. **B1-b** Runtime › 오프로드·배포 기준 › `배포 레일` 5단계 pill → 순서·이름을 선과 타이포로(번호 + hairline).
3. **I1** 오늘 주인공이 특정 독서 카드일 때 `오늘의 첫 판 시작` 이 그 카드로 간다. 현재 `/games?card=…` → `/learn#practice` 리다이렉트에서 query 소실. 해결: 카드 딥링크를 practice 라우트(`/games/practice/<gameId>/<roundId>`)로 직접 만들거나 리다이렉트가 query 를 보존해 카드가 선택된 상태로 열리게. 검증은 **추천한 카드 1개와 도착 화면 제목 일치**.

## 완료 조건
1. [ ] 4환경(375/1440 × 다크/라이트)에서 `.flight-card`·`.path-steps` 채움/외곽선/radius 0(computed), 행 hairline.
2. [ ] E2E: 오늘 CTA → 추천 카드 제목 일치(독서 카드 케이스 1건), 출발 문맥(`from`) 보존.
3. [ ] 기존 Advisor E2E·ToneTools 그린, build.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
