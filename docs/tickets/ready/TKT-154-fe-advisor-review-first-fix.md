문서 상태: 작성완료

# TKT-154 `[FE]` Advisor 리뷰 화면 — 먼저 고칠 것 하나, 상태에 맞는 CTA

- 상태: ready · P2 · 담당: codex-6/codex-1 · 의존: TKT-130 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: UX-ADVISOR-2026-09-14 Review [개선](`ReviewPage.vue:94,139,153,178,224`) — 점수·항목별 피드백·히든 케이스·평판·시나리오가 길게 쌓이고, 미제출 상태에서도 `재제출/다음 미션` 이 보인다. TKT-130 은 완료 요약(`기록에 저장됨`)만 다뤘다.
- scope: `services/advisor/frontend/src/modules/missions/pages/ReviewPage.vue`, 관련 store·E2E.

## 목표
결과 화면 상단 = 점수 한 줄 + **먼저 고칠 것 1개**(가장 큰 감점 항목) + `코드 고쳐서 재제출` 하나. 항목별 피드백·히든 케이스·평판·시나리오는 펼침(면 없음). 샘플 경고는 유지.

## 완료 조건
1. [ ] 미제출 상태: 재제출/다음 미션 CTA 비노출, 대신 `제출하러 가기`(미션 편집으로).
2. [ ] `다음 미션` 목적지가 실제 다음(코스 순서 또는 배우기 필터 문맥)일 때만 그 라벨, 목록으로 가면 라벨 `배우기로`.
3. [ ] 375 결과 화면 첫 스크롤 안에 점수·고칠 것·CTA 모두 노출(스크린샷).
4. [ ] E2E 3건(미제출·제출 후·다음 목적지), 46+ 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
