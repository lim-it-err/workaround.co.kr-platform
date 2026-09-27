# REV-TKT-055-r1-draft — 블로그 공개 라우팅/딥링크 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(History API 라우팅 + not-found 로직). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).

## 요약 권고: **통과 — 5개 완료 기준 전부 코드 추적 + 실브라우저 재현으로 확인, 블로커 없음**

지난 라운드(TKT-054)는 리뷰 브라우저 탭 타이머 정지로 라이브 검증을 못 마쳤는데, 이 티켓은 `/blog`·`/blog/:slug` 경로가 스플래시를 완전히 우회하도록 설계돼 있어(코드로 먼저 확인) 그 문제를 피해 **이번엔 끝까지 실제 클릭·새로고침·뒤로/앞으로로 재현했다.** 티켓의 "검토 메모"가 지정한 체크리스트를 그대로 수행.

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, 16 modules).
- 브랜치 `codex/v0.6.0-line` 확인.
- **라이브 브라우저 검증(전부 성공)**: dev 서버 7012에서 아래 시나리오를 직접 재현.

## 완료 기준 대조 (5개)

### ① 글 상세 새로고침해도 splash/junction으로 안 튕김
**코드**: `readInitialPage()`(`App.vue:2782-2791`)가 live 모드에서 `readLiveBlogRoute()?.page || 'splash'`를 반환 — pathname이 `/blog/...`면 splash를 거치지 않고 곧장 해당 페이지로 초기화된다. `readLiveBlogRoute()`(`:2800-2821`)가 `/blog/:slug`를 파싱해 `{page:'blogPost', slug}`를 만든다.
**라이브**: `/blog`에서 "글 읽기" 클릭 → URL이 `/blog/why-blog-district-needs-its-own-rhythm`로 pushState됨 확인 → **이 URL로 `navigate(force:true)`(완전 새로고침과 동등)** → 스플래시 없이 곧바로 같은 글 제목·본문이 그대로 복원됨을 `document.body.innerText`로 직접 확인. 원 버그("새로고침하면 splash→junction으로 튕김")가 실제로 재현되지 않음.

### ② 뒤로가기/앞으로가기가 목록↔상세 사이에서 자연스럽게 동작
`handleLocationPopState()`(`:2905-2940`)가 popstate 시 현재 `window.location.pathname`을 `readLiveBlogRoute()`로 재파싱해 `page`/`activeBlogSlug`를 URL 기준으로 복원(이벤트 state 객체에만 의존하지 않아 더 견고함).
**라이브**: `/blog` → 글 클릭(`/blog/:slug`) → **back** → URL이 `/blog`로 복귀 + 아카이브 목록 텍스트("공개 글 목록", "published 상태만") 렌더 확인 → **forward** → URL이 다시 `/blog/:slug`로 복귀 + 글 제목 렌더 확인. 양방향 모두 실측.

### ③ 없는/보관된 슬러그 → not-found (첫 글 폴백 아님)
`activeBlogPost` computed(`:966-971`)가 `publishedBlogPosts`(published만)에서만 슬러그를 찾고 없으면 `null`. 템플릿(`:4085`, `:4114-4119`)이 `v-if="activeBlogPost"` / `v-else`로 전용 404(`"404 / Blog District"`, `"공개 글을 찾을 수 없습니다"`) 렌더.
**라이브 2건 확인**:
- 존재하지 않는 슬러그 `/blog/this-slug-does-not-exist-at-all` → 404 텍스트 렌더 확인.
- **draft 상태 시드 글의 실제 슬러그**(`draft-city-signal-notes`, 소스 `App.vue:2526` 직접 확인)로 접근 → 404 렌더 + **draft 제목/본문("도시 신호실 메모", "아직 공개 전인 메모") 텍스트가 DOM 어디에도 없음을 확인** — 미발행 콘텐츠가 URL 추측으로 새어나가지 않음(단순 기능 검증을 넘어 프라이버시 관점에서도 유의미).

### ④ 공개 글 URL을 복사해 새 탭에서 열면 같은 글이 열림(딥링크)
①·③의 재현 방식 자체가 이 시나리오와 동일하다(매번 `navigate(force:true)`로 완전히 새로 진입) — 별도 항목 없이 위에서 실증됨.

### ⑤ production build 통과
위 "실행 검증" 참조.

## UI 실검수 (다크/라이트 + 375px + 카피)
- **375px**: 글 상세·not-found 페이지 모두 `document.documentElement.scrollWidth === window.innerWidth === 375`(가로 오버플로 0, 직접 측정) — TKT-072에서 발견한 flex `min-width:auto` 패턴 재발 없음.
- **다크/라이트**: 두 테마 모두 글 상세에서 스크린샷 확보, 대비·가독성 문제 없음.
- **콘솔 에러**: `Uncaught|TypeError|ReferenceError|Vue warn` 패턴 매칭 0건(기대되는 502/404 네트워크 에러 — 로컬에 gateway 백엔드가 없어서 발생 — 제외).
- **카피 원칙**: 404 메시지("공개 글을 찾을 수 없습니다", "주소가 바뀌었거나 보관된 글입니다")는 화면 자기해설이 아니라 상태 알림, 내부 용어 노출 없음. 준수.

## [제안] (경미, 블로커 아님)
- `openPage('blogPost')`가 `activeBlogSlug`가 비어 있을 때 `publishedBlogPosts[0]`로 대체하는 분기(`:2185-2187`)가 있다 — 처음엔 finding #10 재발인가 의심했으나, `openBlogPost(slug)`가 항상 `activeBlogSlug`를 먼저 세팅한 뒤 `openPage`를 호출하므로 이 분기는 "슬러그 미지정 일반 진입"에만 쓰이고 URL 기반 not-found 판정(`activeBlogPost` computed)과는 무관함을 코드로 확인. 문제 아님 — 다만 향후 이 분기를 건드릴 사람을 위해 참고로 남김.

## 상태 제안 (판정은 PM)
블로커 0. 5개 완료 기준 전부 코드+라이브 이중 검증. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-08-18)

**통과 → finished.** 리뷰어 게이트 재실행·라이브 재현 결과 수용. 블로커 0.
