문서 상태: 작성완료

# v0.8.3 리팩토링 — App.vue 분해 (동작·화면 변화 0)

- 작성: PM(Claude Opus 5.5), 2026-10-25 · 요청: PO 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」 · 선행 근거: TKT-075(S5 분해 제안), v0.9 블랙 디자인(기본 + lite 두 벌)의 전제.
- 현재: `frontend/src/App.vue` **5,127줄**(스크립트 약 3,680 + 템플릿 약 1,450), 함수 157·최상위 const 172. 이미 분리된 화면: VoyageView·Pantry·Ets2Live·Ets2Dev·WritingStudio·JunctionMap·WorkNotes.

## 원칙
1. **동작·화면 변화 0** — 패치 버전이다. 각 티켓의 합격선은 `npm run e2e:all` 97 pass / 18 skip / 0 fail(블로그 skip 유지) + unit 그린 + 375/1440 실렌더 전후 동일.
2. **한 번에 한 덩어리, 순서대로** — 모두 App.vue 를 건드리므로 병렬 금지. 한 티켓 = 한 화면군 + 그 상태·타이머.
3. 새 위치: 화면 `frontend/src/components/pages/*View.vue`, 상태·타이머 `frontend/src/composables/use*.js`. 기존 `components/` 는 그대로.
4. CSS 는 이번에 옮기지 않는다(`styles.css` 6,159줄 분할은 v0.9 디자인 토큰 개정 때). 클래스 이름 그대로.
5. 테스트 파일의 선택자·기대값은 바꾸지 않는 것이 원칙. 바꿔야 하면 이유를 티켓에.

## 순서와 목표 줄 수
| 티켓 | 떼어낼 덩어리 | 새 파일 |
|---|---|---|
| TKT-207 | 스플래시(플랩 보드·티커·문 열림·재방문·다시 재생) | `pages/SplashView.vue`, `composables/useSplash.js` |
| TKT-208 | 시뮬(격납고·엘리베이터·택시)과 그 타이머 | `pages/SimHubView.vue`·`ElevatorView.vue`·`TaxiView.vue`, `composables/useElevatorSim.js`·`useTaxiSim.js` |
| TKT-209 | 기지선(Work Manager 실행 영역·Runtime) + 인증 | `pages/WorkView.vue`·`RuntimeView.vue`, `composables/useWorkManager.js` |
| TKT-210 | 블로그(허브·아카이브·글 상세·Studio 연결) + 저장소 | `pages/Blog*View.vue`, `composables/useBlogStore.js` |
| TKT-211 | 환승 홀·상단바·테마·시계·라우팅 정리 + **레거시 테스트 라우트(`v040`·`v050` 프로토타입) 제거** | `pages/JunctionView.vue`, `composables/useTheme.js`·`useClock.js`·`usePageRouting.js` |

- 목표: 211 뒤 `App.vue` ≤ 700줄(셸 + 페이지 스위치 + 전역 전환).
- 레거시 테스트 라우트: v0.4~0.5 시절 `?mode=v040/v050` 프로토타입 화면. 공개 진입점·E2E 참조 0 → PM 결정으로 제거(필요하면 git 이력에서 복원).
