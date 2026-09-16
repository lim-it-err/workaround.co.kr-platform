문서 상태: 작성완료

# TKT-152 `[FE]` Advisor 초기 청크 lazy-load — 502kB 경고 해소

- 상태: finished (2026-09-15, PM 통과) · P2 · 담당: codex-1 · 의존: TKT-129 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: REV-TKT-129-r1 [제안], 빌드 경고 `502.28kB` (TKT-143 에서도 잔존).
- scope: `services/advisor/frontend/src/modules/missions/routes.js`(라우트별 동적 import), `vite.config.*`(manualChunks 최소), 로딩 중 표시.

## 목표
`/today` 첫 진입 JS 를 줄인다. 게임 엔진 4종·코스·사건 파일은 해당 라우트에서만 로드. 로딩 중은 스켈레톤 면이 아니라 hairline 한 줄 텍스트(`불러오는 중`).

## 완료 조건
1. [x] 초기 진입 청크 합계 ≤250kB(minified, gzip 전 — 빌드 로그 인용), 빌드 경고 0.
2. [x] Playwright 46/46·unit 81/81, alias 7개 회귀 0.
3. [x] 375 `/today` → `/learn` → 코스 상세 전환에서 빈 화면 플래시 없음(스크린샷 3장).

## 질문/에스컬레이션
- `[구체화 질문][해결]` `routes.js`의 모든 화면은 이미 동적 import였지만 공통 `App.vue`가 `missions.js`를, 접힌 오늘 화면이 전체 기내 팩을 즉시 읽어 목표를 달성할 수 없었다. AC의 실제 첫 진입 의존 그래프를 기준으로 같은 Advisor 프런트 안의 공통 셸·저장소·요약 카탈로그까지 최소 분리했고, 지정한 콘텐츠 불가침 3파일은 수정하지 않았다.

## 리뷰 기록
- 없음.

## 구현 기록
- 첫 화면·목록 전용 미션/비엔나 코스/루틴 요약 카탈로그를 분리하고, 548kB 원문 미션 콘텐츠와 비엔나 상세 데이터는 미션·리뷰·코스/게임 상세 라우트가 열릴 때만 주입하도록 했다.
- Probe·Boundary 데이터와 엔진은 각 게임 페이지가 열릴 때 저장소에 주입한다. 오늘 화면의 사건·카드 추천은 제목·ID·일수만 가진 요약을 써 사건 원문과 게임 덱을 초기 그래프에서 제외했다.
- 접힌 `오프라인 세션 만들기`의 기내 팩은 실제로 펼칠 때 동적 import한다. 닉네임 프롬프트도 공통 셸에서 분리하고 작은 반응형 식별자만 유지했다.
- Vue/marked/기타 vendor를 최소 manual chunk로 분리했다. 라우트 탐색 중에는 카드·스켈레톤 면을 추가하지 않고 `불러오는 중` hairline 텍스트 한 줄을 표시한다.
- 기존 `routes.js`의 14개 화면 동적 import와 7개 별칭 redirect는 그대로 보존했다.

## 검증
- `npx vite build --manifest` — 114 modules, 경고 0. manifest의 `index.html` + `TodayPage.vue` 정적 의존 JS 합계 **205,850 bytes = 201.03KiB**(gzip 전): index 10.63 + Vue 93.97 + Today 3.20 + missions 51.98 + inflight content 16.23kB 및 바이트 단위 합산. 기존 단일 index 505.82kB에서 감소했다.
- `npm run build` — 114 modules, 500kB 초과 경고 0. 283.97kB `sampleContent`는 미션/리뷰 상세 전용 lazy chunk로 남았다.
- `npm run test:unit` — **81/81** 통과.
- `npm run test:e2e` — 요구 46건을 포함한 현행 **49/49** 통과. `advisor-surfaces.spec.ts`의 기존 주소/별칭 7개 회귀 0.
- `lazy-chunks.spec.ts`에서 Learn/CourseDetail 모듈 응답을 250ms 늦추고도 이전 화면이 유지되며 hairline 로딩 문구가 보이는지 검증했다. 375px `today-375.png`·`learn-375.png`·`course-vienna-375.png` 3장을 생성해 육안 확인했고 빈 화면·가로 overflow가 없었다.
- `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js` diff 0, `git diff --check` 통과. Safari/WebKit·VoiceOver·실 Pages는 미검증이며 commit/push 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-152-r1.md`.
