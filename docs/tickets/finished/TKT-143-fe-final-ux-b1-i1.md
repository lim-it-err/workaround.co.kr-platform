문서 상태: 작성완료

# TKT-143 `[FE]` 최종 UX 검수 반영 — 읽기용 카드 면 2곳 제거(B1) + 오늘 CTA 카드 목적지 보존(I1)

- 상태: finished (2026-09-15, REV-TKT-143-r1 통과) · P1 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. **병합 전 필수**(UX-TONE-FINAL B1). **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: `docs/reviews/UX-TONE-FINAL-2026-09-14.md` B1·I1 (codex-8).
- scope: Advisor `pages/InflightPage.vue`(`.flight-card`)·`app/styles.css`(`:is(a,button).card` 링크 면)·`pages/TodayPage.vue`·`store/missions.js`(추천 링크)·`routes.js`(`/games` 리다이렉트 query 보존), 메인 `frontend/src/App.vue`(`.path-steps`)·`styles.css`. 콘텐츠 3파일 불가침.

## 목표
1. **B1-a** Advisor 오늘 › 오프라인 세션 › `이번 비행 추천` 3개: 라운드 박스 → 제목·시간·화살표 **한 행 + hairline**. 글자 크기·줄 간격·시간 프리셋 등 실제 조작부 면은 유지.
2. **B1-b** Runtime › 오프로드·배포 기준 › `배포 레일` 5단계 pill → 순서·이름을 선과 타이포로(번호 + hairline).
3. **I1** 오늘 주인공이 특정 독서 카드일 때 `오늘의 첫 판 시작` 이 그 카드로 간다. 현재 `/games?card=…` → `/learn#practice` 리다이렉트에서 query 소실. 해결: 카드 딥링크를 practice 라우트(`/games/practice/<gameId>/<roundId>`)로 직접 만들거나 리다이렉트가 query 를 보존해 카드가 선택된 상태로 열리게. 검증은 **추천한 카드 1개와 도착 화면 제목 일치**.

## 완료 조건
1. [x] 4환경(375/1440 × 다크/라이트)에서 `.flight-card`·`.path-steps` 채움/외곽선/radius 0(computed), 행 hairline.
2. [x] E2E: 오늘 CTA → 추천 카드 제목 일치(독서 카드 케이스 1건), 출발 문맥(`from`) 보존.
3. [x] 기존 Advisor E2E·ToneTools 그린, build.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## 구현 내역
- 기내 `이번 비행 추천`을 2열 라운드 카드에서 제목·종류/시간·화살표가 한 행에 놓이는 단일 시각표로 바꿨다. 행은 투명 배경·반경 0·좌우/상단 외곽선 0이며, 52px 진입 영역과 행 사이 hairline만 유지한다.
- Runtime `배포 레일`은 pill 다섯 개를 의미 있는 순서 목록으로 바꾸고 `01`~`05` 번호·타이포·hairline으로 표현했다. 읽기 단계에는 채움이나 둥근 면을 두지 않았다.
- 오늘 루틴의 독서·시사회 카드는 `/games?card=…` 별칭을 거치지 않고 각각 `/games/practice/reading/<cardId>`와 `/games/practice/cinema/<cardId>`로 직접 연결한다. 기존 `TodayPage.surfaceLink()`의 history state를 그대로 사용해 연습 화면의 제목과 `← 오늘` 복귀 문맥을 함께 보존했다.
- 공유 파일: `frontend/src/App.vue`(TKT-140 스플래시 변경 보존), `frontend/src/styles.css`(TKT-138·139·140 변경 보존), `docs/tickets/board.md`, `docs/history/2026-09-15.md`.
- 불가침 콘텐츠 `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`는 수정하지 않았다.

## 검증
- Advisor 집중 E2E 5/5 통과: 375/1440 × 다크/라이트 `.flight-card` computed 투명·radius 0·3면 border 0·하단 hairline, 독서 CTA 추천/도착 제목 일치, `history.state.from='/today'`, 실제 오늘 복귀.
- Advisor 전체 Chromium E2E 46/46, unit 14 files·81/81 통과. root/Pages-base build 각각 110 modules 성공(기존 500kB 청크 경고 유지).
- 메인 ToneTools 12/12 통과: 기존 10경로 회귀와 보충 2환경을 합쳐 Runtime 배포 레일을 375/1440 × 다크/라이트에서 computed 값·번호·hairline·overflow 0으로 검증했다. 메인 unit 21/21, root/Pages-base build 각각 49 modules 통과.
- 여덟 실화면을 육안 확인했다. 두 읽기 목록 모두 조작부 면보다 후퇴하고 제목·시간/순서가 한 흐름으로 읽히며, 375px 가로 넘침이 없었다.

## PR 메모
- 리뷰 초점: 기내 추천 행의 긴 제목 말줄임이 시간·화살표를 밀지 않는지, Runtime 번호가 순서를 충분히 전달하는지, 오늘 독서 카드가 정확한 연습 판과 `오늘` 복귀를 함께 여는지.
- Safari/WebKit·VoiceOver·실 GitHub Pages 배포는 미검증이다. Advisor의 기존 500kB 초기 청크 경고가 남는다. commit/push 없음.
- r1 (2026-09-15, PM): **통과 → finished**. `docs/reviews/REV-TKT-143-r1.md`.
