문서 상태: 작성완료

# TKT-140 `[FE]` 스플래시 — 재방문 단축(저장 플래그) + 패널 테두리 면 제거

- 상태: finished (2026-09-15, REV-TKT-140-r1 통과) · P1 · 담당: codex-1 · 의존: TKT-126 finished. 브랜치 `codex/v0.7.0-tone`. **병합 전 반영.** **UX 1순위·[반박]/[구체화 질문] 의무.**
- 근거: PO 2026-09-14 "2번(재방문마다 10초) 나도 그렇게 생각했다 — 캐시를 이용하는 건가" → 서버 없이 브라우저 `localStorage` 플래그로. PM [PM 의문] 6(패널 면) 승인.
- scope: `frontend/src/App.vue`(스플래시 타이머·플래그), `frontend/src/styles.css`(패널 면), `splashTone.e2e.mjs`

## 목표
1. 첫 방문: 현행 10초 3문구 유지. 방문 완료 시 `localStorage['splash:seen'] = ISO 시각` 저장.
2. 재방문(플래그 있음): **3초**(문구 1개 `DOORS OPENING`)로 단축 후 자동 전환. `다시 재생` 을 누르면 10초 전체 재생. 플래그는 30일 지나면 초기화(다시 첫 방문 취급). 시크릿/저장 불가 환경은 첫 방문과 동일(try/catch).
3. `prefers-reduced-motion` 규칙(119)·10초 자동 전환 정지 조건 유지.
4. 스플래시 패널의 옅은 테두리·배경 면 제거 — 목업 `splash.html` r12 대로 투명. 플랩보드·티커 hairline 은 그대로.

## 완료 조건
1. [x] E2E: 첫 방문 10초 → 저장 플래그 → 재방문 3초 → `다시 재생` 10초 — 3경로.
2. [x] 패널 배경/테두리 computed 값 투명(375/1440), 기존 splash E2E 3/3 유지.
3. [x] build·unit 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.

## 구현 내역
- 첫 방문은 기존 10초·세 문구를 유지하고 전환 완료 시 `splash:seen`에 ISO 시각을 저장한다. 30일 이내 재방문은 기존 반쪽 플랩 엔진으로 `DOORS OPENING` 한 문구만 재생한 뒤 3초에 전환한다.
- `다시 재생`은 재방문 여부와 무관하게 즉시 10초 전체 흐름으로 전환하며, 앞선 3초 타이머를 교체한다. 만료·파싱 불가 플래그는 제거하고 저장소 읽기/쓰기가 막힌 환경은 예외를 밖으로 노출하지 않고 첫 방문으로 처리한다.
- 모션 축소 환경도 첫 방문·재방문에 맞는 정적 문구와 동일 타이머를 사용한다. 스플래시 패널의 배경·테두리·모서리 면을 투명하게 만들고 플랩보드와 티커 hairline은 유지했다.
- 공유 파일: `frontend/src/styles.css`(TKT-138 hit-area·TKT-139 노선도 변경 보존), `docs/tickets/board.md`, `docs/history/2026-09-15.md`.

## 검증
- `splashTone.e2e.mjs` Chromium 6/6 통과: 첫 방문 10초·ISO 저장, 최근 재방문 3초·마지막 문구, 재생 뒤 10초 전체 흐름, 30일 만료·저장 불가 fallback, 모션 축소, 기존 파비콘·반쪽 플랩 회귀.
- 375px 다크·1440px 라이트에서 패널 computed background·border 투명을 단언했고, 375/1440 × 다크/라이트 캡처로 패널 면 제거·문구·티커·자동 전환 안내·가로 overflow 0을 육안 확인했다.
- 메인 Node unit 21/21, `npm run build`와 Pages base build 각각 49 modules 통과.

## PR 메모
- 리뷰 초점: 재방문 첫 프레임부터 `DOORS OPENING`만 재생되는지, `다시 재생`이 남은 3초 타이머를 취소하는지, 패널 면만 사라지고 플랩보드·티커 구획은 유지되는지.
- Safari/WebKit·VoiceOver·실 GitHub Pages 배포는 미검증이다. commit/push 없음.
- r1 (2026-09-15, PM): **통과 → finished**. `docs/reviews/REV-TKT-140-r1.md`.
