문서 상태: 작성완료

# TKT-128 `[FE]` 원칙 4 잔존 일소 — 영어 눈썹 라벨·구 보드 라벨·빈 수치 노출

- 상태: ready · P3 · 담당: codex-1 · 의존: TKT-114 finished
- 스펙: `design/tone-principles-2026-09-09.md` 원칙 4(영어 간판 0) + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/VoyageIndexView.vue`, `frontend/src/App.vue`(Work 접힌 상세 블록), `frontend/src/styles.css`, 관련 테스트

## 목표
톤 전환 시리즈가 지나간 뒤 남은 영어 눈썹 라벨·숫자 0 노출을 화면 단위로 걷어낸다. 기능·데이터 구조는 바꾸지 않는다.

## 완료 조건
1. [ ] `/voyage` 일차 패널 "이 날의 기록" 위 `ACTUAL`(`VoyageRouteMap.vue:687` 근처) 제거 또는 한글 눈썹(`기록`)으로.
2. [ ] Work 접힌 상세(`App.vue` `tone-work-manager-details` 내부) 의 영어 눈썹 라벨(`VERSION HEADER` 등 `.eyebrow`)을 한글로 — 목록을 구현 기록에 남긴다. 구 보드의 기능(5레인·상세 편집·command gate)은 그대로.
3. [ ] 여행 목록 지난 여행 행: 도시 수 0 이면 `0개 도시` 를 숨긴다(`노선도` 만).
4. [ ] 전 화면 375/1440 에서 대문자 영어 눈썹 라벨 0 — 검사 방법(정규식 `\b[A-Z]{4,}\b` 등)과 결과를 구현 기록에.
5. [ ] build + 기존 테스트 그린.

## 구현 메모
- REV-TKT-112-r1·REV-TKT-114-r1 에서 이관. 라이트 테마(118)와 무관 — 토큰이 아니라 카피.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
