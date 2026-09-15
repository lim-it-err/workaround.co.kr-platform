문서 상태: 작성완료

# TKT-147 `[FE]` 디자이너 제안 소묶음 — 재방문 플랩 읽기 시간·저장 안내 원 크기

- 상태: ready · P3 · 담당: codex-1 · 의존: TKT-140·138 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: UX-TKT-140-r1 [제안] S1 — 재방문 3초 흐름에서 최종 문구 정착이 2.60~2.68초라 읽을 시간이 0.4초뿐. UX-TKT-138-r1 [제안] S1 — 스튜디오 저장 안내 원은 시각 28px 로 두고 hit area 만 40px.
- scope: `frontend/src/App.vue`(재방문 타이머·저장 안내), `frontend/src/styles.css`, `frontend/src/splashTone.e2e.mjs`, `frontend/src/components/WritingStudio.e2e.mjs`.

## 목표
1. 재방문 스플래시: 최종 문구(`DOORS OPENING`) 정착 후 **1.0초 이상** 보이고 전환(총 3.6~4.0초). `다시 재생` 10초 전체 흐름·첫 방문 10초는 그대로.
2. 글쓰기 스튜디오 저장 안내 원: 시각 지름 28px, 실제 hit area ≥40×40 유지(138 계약).

## 완료 조건
1. [ ] 재방문 흐름 E2E: 정착 시각과 전환 시각 차 ≥1.0초 단언, 첫 방문·다시 재생 회귀 0.
2. [ ] 저장 안내 원 computed 지름 28px·hit ≥40 E2E(375/1440).
3. [ ] 375/1440 × 다크/라이트 스크린샷, overflow 0.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
