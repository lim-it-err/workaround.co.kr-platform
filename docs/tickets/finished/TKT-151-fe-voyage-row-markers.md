문서 상태: 작성완료

# TKT-151 `[FE]` 여행 시각표 행 기록 표식 — 메모·사진·지출 한눈에

- 상태: finished (2026-09-15, PM 통과) · P3 · 담당: codex-1 · 의존: TKT-141 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: REV-TKT-117-r1 [제안] — 시트를 열어야만 입력값이 보인다. 현장에서 어느 정차역을 채웠는지 행에서 알 수 있어야 한다(후속 미배정 상태).
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`(정차역 행 끝 표식), `frontend/src/components/VoyageRouteMap.e2e.mjs`.

## 목표
값이 있는 정차역 행 끝에 면 없는 짧은 표식: 메모 있음 `·`, 사진 `n장`, 지출 합계(원화). 값이 없으면 아무것도 없음. 톤 원칙(읽기 행에 면·배지 금지) 준수 — 텍스트·점만.

## 완료 조건
1. [x] 375/1440 에서 행 높이 불변, hit area ≥40 유지, overflow 0.
2. [x] E2E 1건: 기록 저장 → 행 표식 갱신, 삭제 → 사라짐.
3. [x] 접근 이름: 표식은 `aria-label`(예: `메모 있음, 사진 2장, 지출 3만원`)로 읽힌다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 2026-09-15 codex-1: 구현·완료 게이트 충족, `need_review` 전환. commit/push 없음.

## 구현 내역
- 브라우저에 저장된 정차역 기록만 기준으로 메모 `·`, 사진 `n장`, 원화 지출을 제목 행 끝에 짧은 텍스트로 표시한다. 원래 일정에 들어 있던 식사·지출 seed만으로는 기록 표식이 생기지 않는다.
- 세 값이 모두 비면 표식 DOM 자체가 사라진다. 정수 만원은 `3만원`, 그 밖의 원화는 쉼표 원 단위로 표시해 폭을 줄이고 금액은 보존했다.
- 표식은 면·테두리·배지 없이 기존 muted text로 두고, 제목과 같은 줄을 공유하되 상세 설명 폭은 줄이지 않아 모바일 행 높이를 보존했다.
- 시각 텍스트는 장식 자식으로 숨기고 표식 컨테이너의 `aria-label`로 `메모 있음, 사진 1장, 지출 3만원`을 제공한다.
- 공유 파일: `frontend/src/components/voyage/VoyageRouteMap.vue`, `frontend/src/components/VoyageRouteMap.e2e.mjs`(직전 need_review TKT-148의 링크 행 변경과 같은 파일).

## 검증
- `node --test src/components/voyage/voyageRoute.test.mjs src/data/voyageCoverage.test.mjs`: 2/2 통과.
- `npm run build -- --base=/workaround.co.kr-platform/`: 49 modules 통과.
- `VoyageRouteMap.e2e.mjs`: Chromium 4/4 통과. 375/1440 × 다크/라이트에서 빈 정차역에 메모·사진 1장·3만원 저장 → 표식/접근 이름 즉시 갱신 → 세 값 삭제 → 표식 소멸을 검증했다.
- 같은 E2E에서 저장 전후 실제 행 높이 동일, 버튼 hit area 40px 이상, `html`·`body`·페이지·여행 화면 overflow 0을 단언했다.
- 네 환경 캡처를 육안 확인했다. 표식은 요금보다 가볍게 읽히며 제목·상세 설명과 겹치지 않고, 카드/배지 면을 만들지 않는다.
- `git diff --check` 통과. Safari/WebKit·VoiceOver·실 Pages는 미검증이다.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-151-r1.md`.
