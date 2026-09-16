문서 상태: 작성완료

# TKT-147 `[FE]` 디자이너 제안 소묶음 — 재방문 플랩 읽기 시간·저장 안내 원 크기

- 상태: finished (2026-09-16, PM r2 통과) · P3 · 담당: codex-1 · 의존: TKT-140·138 finished. 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: UX-TKT-140-r1 [제안] S1 — 재방문 3초 흐름에서 최종 문구 정착이 2.60~2.68초라 읽을 시간이 0.4초뿐. UX-TKT-138-r1 [제안] S1 — 스튜디오 저장 안내 원은 시각 28px 로 두고 hit area 만 40px.
- scope: `frontend/src/App.vue`(재방문 타이머·저장 안내), `frontend/src/styles.css`, `frontend/src/splashTone.e2e.mjs`, `frontend/src/components/WritingStudio.e2e.mjs`.

## 목표
1. 재방문 스플래시: 최종 문구(`DOORS OPENING`) 정착 후 **1.0초 이상** 보이고 전환(총 3.6~4.0초). `다시 재생` 10초 전체 흐름·첫 방문 10초는 그대로.
2. 글쓰기 스튜디오 저장 안내 원: 시각 지름 28px, 실제 hit area ≥40×40 유지(138 계약).

## 완료 조건
1. [x] 재방문 흐름 E2E: 정착 시각과 전환 시각 차 ≥1.0초 단언, 첫 방문·다시 재생 회귀 0.
2. [x] 저장 안내 원 computed 지름 28px·hit ≥40 E2E(375/1440).
3. [x] 375/1440 × 다크/라이트 스크린샷, overflow 0.

## 질문/에스컬레이션
- `[구체화 질문][해결]` 저장 안내 DOM은 현재 `WritingStudio.vue`가 소유하지만 티켓 scope에는 해당 파일이 없다. scope에 포함된 전역 `styles.css`에서 기존 40px 버튼은 유지하고 28px `::before` 원만 그려 컴포넌트 파일을 건드리지 않고 목표를 충족했다.

## 리뷰 기록
- r1: PM 반려 — 실난수 4환경 중 3환경에서 정착 후 읽기 시간 1.0초 미달.
- r2: 반려 블로커 B1만 정정하고 재검토 요청.

## 구현 기록
- 재방문 스플래시 총 시간을 3.0초에서 3.8초로 조정했다. 첫 방문과 `다시 재생`은 기존 10초를 그대로 사용한다.
- Playwright 가상 시계에서 `DOORS OPENING`의 실제 렌더 문자열과 실행 중 셀 0개를 함께 관찰해 정착 시점을 찾고, 3.8초 전환까지 남은 시간이 1,000ms 이상인지 단언한다. 9,999/10,000ms 첫 방문 경계와 재생 10초 회귀도 유지했다.
- 저장 안내 버튼의 실제 40×40px 영역은 유지하면서 중앙에 28×28px 원을 별도 의사 요소로 그렸다. 375/1440 × 다크/라이트에서 computed 크기·hit area·overflow 0을 자동 검증한다.
- 공유 파일 메모: `splashTone.e2e.mjs`의 TKT-146 가상 시계 안정화 변경 위에 TKT-147 정착 관찰과 3.8초 계약만 추가했으며, 기존 변경은 보존했다.

## 검증
- `npm run build -- --base=/workaround.co.kr-platform/` — 49 modules 통과.
- `node --test --test-concurrency=1 src/splashTone.e2e.mjs` — Chromium 6/6 통과(첫 방문 10초·재방문 정착 후 ≥1초·다시 재생 10초).
- `node --test --test-concurrency=1 src/components/WritingStudio.e2e.mjs` — Chromium 13/13 통과(신규 4환경 포함).
- `storage-help-{375,1440}-{dark,light}.png` 및 재방문 스플래시 캡처를 육안 확인했다. 4환경 모두 overflow 0, 저장 안내 원 28×28px, hit area ≥40×40px.
- `git diff --check` 통과. Safari/WebKit·VoiceOver·실 Pages는 미검증이며 commit/push 없음.

## PM 반려 (2026-09-15, r1) — `docs/reviews/REV-TKT-147-r1.md`
- [블로커] B1 재방문 정착 후 정지 노출 0.72~0.90초(디자이너 실측 3/4 환경) → 전환 = max(3.8초, 정착+1.0초), 정착 상한 2.8초, 최악 난수 E2E 추가.
- 저장 안내 원은 통과. 이 한 건만 고치고 need_review. 146·134 커밋이 이 r2 를 기다린다 — 최우선.

## r2 구현 기록
- 재방문 전용 플랩은 회전 수·셀 지연·스텝 시간을 줄여 최악 난수에서도 `DOORS OPENING` 정착을 2.8초 안으로 제한했다. 첫 방문과 `다시 재생`의 기존 3문구·10초 애니메이션 매개변수는 바꾸지 않았다.
- 각 셀의 마지막 flip 완료를 모아 실제 정착 시각을 기록하고 전환 절대 시각을 `min(4.0초, max(3.8초, 정착+1.0초))`로 다시 예약한다. 2.8초 안전 타이머는 지연된 셀을 최종 문구로 정착시켜 총 4초 상한과 읽기 시간 계약을 함께 지킨다.
- `Math.random=0.99` 최악 경로 E2E를 추가해 정착 ≤2.8초·총 시간 ≤4.0초·전환 직전까지 화면 유지·375px overflow 0을 고정했다.
- PM이 통과시킨 저장 안내 원의 제품 코드와 계약은 변경하지 않았다.

## r2 검증
- `npm run build -- --base=/workaround.co.kr-platform/` — **49 modules 통과**.
- 메인 unit — **25/25 통과**.
- `splashTone.e2e.mjs` — Chromium **7/7 통과**(최악 난수 신규 1건, 첫 방문·재방문·다시 재생 포함).
- `WritingStudio.e2e.mjs` — Chromium **13/13 통과**(저장 안내 4환경 포함). 첫 시도는 preview base 누락으로 실행 불가했고, base 정정 후 일시적 1px 측정 2건은 단독 2/2와 전체 13/13 재실행에서 재현되지 않았다.
- 최악 난수 375px 다크 정착 화면을 육안 확인했고 문구·티커·조작 위계와 overflow 0을 확인했다.
- `git diff --check` 통과. Safari/WebKit·VoiceOver·실 Pages·저사양 실기기는 미검증이며 commit/push 없음.
- 2026-09-16 PM: **r2 통과 → finished** — `docs/reviews/REV-TKT-147-r2.md`. 146·134 와 묶음 커밋.
