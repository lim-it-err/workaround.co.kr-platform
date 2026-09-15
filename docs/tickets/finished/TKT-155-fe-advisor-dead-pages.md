문서 상태: 검토요청

# TKT-155 `[FE]` Advisor 죽은 페이지·컴포넌트 정리 (3표면 이후)

- 상태: finished (2026-09-15, PM 통과) · P3 · 담당: codex-1 · 의존: TKT-129·135 finished. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: D-020 이후 `/routine /season /games /inflight …` 는 redirect 다(`routes.js:35~60`). `RoutinePage.vue`·`SeasonPage.vue`·`HomePage.vue`·`RecordsPage.vue` 등 도달 불가 페이지가 소스에 남아 원칙 4(렌더 안 되는 것) 잔존·번들 비대. TKT-134(메인) 와 같은 패턴.
- scope: `services/advisor/frontend/src/modules/missions/pages/**`, `components/**`, 관련 spec — 참조 0 인 것만.

## 완료 조건
1. [x] 라우트에서 도달 불가한 페이지·전용 컴포넌트·spec 삭제 목록(파일별 참조 grep 결과)을 티켓에. `/routine/swipe`처럼 살아 있는 하위 라우트는 보존.
2. [x] alias 7개 E2E 유지, Playwright 46+·unit 그린, build 모듈 수 변화 기록.
3. [x] 3표면 375/1440 렌더 diff 0(innerText 동일).

## 삭제·참조 감사

| 삭제 파일 | 줄 수 | `src`·`e2e` 참조 grep | 대체 경로 |
|---|---:|---|---|
| `pages/HomePage.vue` | 369 | 0건 | `/learn`의 `LearnPage.vue` |
| `pages/ProjectsPage.vue` | 101 | 0건 | `/learn#projects` + `/projects/:id` |
| `pages/RoutinePage.vue` | 249 | 0건 | `/today`의 `TodayPage.vue` |

- 삭제 합계 719줄. 세 파일은 `routes.js`, 다른 Vue 파일, E2E 어디에서도 import·문자열 참조가 없었다.
- 삭제 전용 컴포넌트·spec은 0개다. 세 파일 모두 Vue·`useMissions`만 직접 사용해 함께 지울 하위 파일이 없었다.
- 보존 증거: `RecordsPage.vue`는 `/history` 라우트 본체이고 `HistoryPage.vue`·`SeasonPage.vue`를 임베드한다. `TodayPage.vue`는 `InflightPage.vue`를 비동기 임베드한다. `CoursesPage.vue`는 `/courses`, `/routine/swipe`는 `SwipeReviewPage.vue`로 계속 라우팅된다.

## 구현·검증 기록
- 제품 동작 코드는 바꾸지 않고 참조 0인 페이지 3개만 삭제했다. 기존 미커밋 Advisor 변경과 보호 콘텐츠 3파일은 건드리지 않았다.
- 빌드 모듈 수는 삭제 전 117 → 삭제 후 117(변화 0)이다. 이 파일들은 삭제 전부터 import graph 밖이라 Vite 번들에 포함되지 않았고, 소스 719줄만 정리됐다.
- `npm run test:unit`: 15 files, 93/93.
- `npx playwright test e2e/advisor-surfaces.spec.ts`: 6/6. 이 중 첫 검증이 `/routine`·`/inflight`·`/missions`·`/games`·`/projects`·`/missions/history`·`/season` 7개 alias를 확인한다.
- `npm run test:e2e`: Chromium 56/56. `/routine/swipe`와 모든 상세 딥링크 포함.
- 삭제 전·후 각각 고정 시각에서 `/today`·`/learn`·`/history`의 `body.innerText` SHA-256을 비교했다. 375px 3개와 1440px 3개가 모두 동일했고 가로 overflow 검증도 통과했다.
- `npm run build`: 117 modules, 경고 0. commit/push 없음.

| 폭 | `/today` 전=후 | `/learn` 전=후 | `/history` 전=후 |
|---:|---|---|---|
| 375 | `ca9ef306…325b` | `2f5c51f4…158c7` | `7c227406…8ad3` |
| 1440 | `0da0f915…d68b` | `d2c7cb7c…0387` | `386d74c0…b2cc` |

## 질문/에스컬레이션
- [반박][해결] 티켓 근거의 `RecordsPage.vue` 도달 불가 예시는 사실과 다르다. 현재 `/history`의 직접 라우트 본체이므로 보존했다. 같은 이유로 새 표면에 임베드된 `HistoryPage.vue`·`SeasonPage.vue`·`InflightPage.vue`, 직접 라우트인 `CoursesPage.vue`도 삭제 대상에서 제외했다.
- [반박][해결] “번들 비대/모듈 수 감소” 가정도 실제 import graph와 다르다. 참조 0 파일은 삭제 전 빌드에도 들어가지 않아 모듈 수는 117→117이다. 감소를 만들기 위해 살아 있는 모듈을 지우는 것은 UX와 기능을 훼손하므로, 정직하게 변화 0과 소스 719줄 감소를 기록했다.

## 리뷰 기록
- 없음.
- 2026-09-15 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-155-r1.md`.
