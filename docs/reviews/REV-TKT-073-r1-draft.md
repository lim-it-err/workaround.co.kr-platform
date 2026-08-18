# REV-TKT-073-r1-draft — UI 재구현 S3: 블로그 시안 A 정제 + StatusBadge (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/components/StatusBadge.vue`(신설) + `App.vue`(bloghub/blogArchive/blogPost/Studio) + `styles.css`. 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).

## 요약 권고: **통과 — 완료 기준(원본 4개 + R2 추가 1개) 전부 코드 추적 + 실브라우저 재현으로 확인, 블로커 없음**

## ⚠ 먼저 밝힐 것: TKT-056과의 관계, 그리고 이번 라운드의 테스트 오염 사고

- 이 티켓의 Notes가 스스로 명시하듯 **TKT-056(지난 리뷰어 사이클에서 이미 통과 권고한 티켓)의 배지 부분을 이 티켓이 흡수/대체한다.** 실제로 확인해보니 지난 라운드에 리뷰했던 `.status-chip.status-draft/published/archived`(CSS class 직접 바인딩) 방식은 이제 전부 `<StatusBadge :status="...">` 컴포넌트로 교체돼 있다(`App.vue` 전역 검색 결과 blog 관련 `.status-chip` 잔존 0건, 남은 `.status-chip`은 무관한 다른 카드/노드 상태용). **TKT-056 리뷰 문서(`REV-TKT-056-r1-draft.md`)가 인용한 CSS 클래스명·바인딩 코드는 이제 이 티켓으로 대체된 옛 코드다** — 다만 그때 검증한 "복원 로직"(`restoreArchivedPost`)과 "3색 구분" 자체의 **동작**은 이번에 `StatusBadge` 기준으로 다시 확인했고 여전히 유효하다. PM은 TKT-056을 finished 처리할 때 배지 관련 지적은 이 문서를 최신으로 참조하면 된다.
- 라이브 검증 초반에 `/blog`에 draft 글("도시 신호실 메모")이 "공개"로 노출되는 것처럼 보여 놀랐는데, 확인해보니 **내가 지난 TKT-056 리뷰에서 같은 dev 서버 포트(7012)에 남긴 localStorage(`workaround-blog-posts`)가 이번 세션에 그대로 로드된 것**이었다(그 글을 지난 라운드에 테스트용으로 "공개로 복원"까지 했었음). `localStorage.clear()` 후 재확인하니 정상(published 2편만 노출)이었다 — **TKT-073 코드 결함이 아니라 내 테스트 오염**이었음을 명시한다. 이후 리뷰어 세션은 매번 라이브 테스트 시작 시 localStorage를 비우는 게 안전하다는 교훈을 남긴다.

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, **17 modules** — `StatusBadge.vue` 신설로 16→17, 티켓 claim과 일치).
- **라이브 브라우저 검증(localStorage 초기화 후 재실행, 전부 성공)**.

## 완료 기준 대조

### ① 배지 3색 시각 구분 (슬레이트/그린/브론즈, archived≠위험색)
`getComputedStyle`로 직접 측정(다크 테마): `badge-pub` → `rgb(107,213,155)`(`#6BD59B`) · `badge-draft` → `rgb(174,184,200)`(`#AEB8C8`) · `badge-arch` → `rgb(220,187,126)`(`#DCBB7E`). 라이트 테마에서 `badge-pub`는 `rgb(0,121,58)`(`#00793A`)로 재확인. 세 값 모두 명확히 다른 색상군(청회/녹/황갈)이라 완료 기준 충족. `--danger`(적색 계열)와 `badge-arch`(황갈 계열)도 확실히 다른 색상.

### ② 공개 아카이브·상세에는 published만 노출
localStorage 초기화 후 `/blog` 재확인: "공개 글 목록 2편"(seed의 실제 published 2건만), draft 시드 글은 미노출. 코드 근거: `publishedBlogPosts`/`activeBlogPost`가 published만 필터링(TKT-055에서 이미 확인한 것과 동일 메커니즘, 이 티켓은 그 위에 배지·레이아웃만 얹음).

### ③ 시안 A 문서형 정제 (blog-primary/archive-item/post-detail)
`.post-detail` 클래스 존재 확인, 375px 스크린샷으로 실제 레이아웃 확인: 상단 5px Line-B 보더, 메타 라인(발행/수정/읽기시간), H1, 리드 문단, 태그+배지, H2 hairline, blockquote 좌측 강조, 리스트 마커 안전색(`--safety`, 노란 점) — 스펙 CSS 지시사항과 시각적으로 일치. `archive-item`도 시간 칸+제목(버튼)+요약+태그+배지 순서로 렌더 확인(제목 자체가 클릭 가능한 버튼이 됨 — 기존 별도 "글 읽기" 버튼에서 변경).

### ④ (R2 승인 추가 기준) 연재(시리즈) 뷰
**라이브 재현**: 기존 published 글 하나의 태그에 `series:리뷰어 테스트 시리즈`를 추가해 저장 → `/blog` 재방문 → **"SERIES / 리뷰어 테스트 시리즈 / 1편" 섹션이 실제로 생성되고 해당 글이 그 아래 묶여 표시됨을 확인.** 태그 목록에는 제어용 `series:...` 태그가 보이지 않고 `blog, design`만 표시(`visibleBlogTags` 필터 확인). 나머지 글은 시리즈에 안 묶이고 일반 목록에 그대로 남음. 코드(`blogSeriesGroups:991-1005`, `isBlogSeriesTag:2631-2633`, `standalonePublishedBlogPosts:1006-1008`)가 전부 `publishedBlogPosts` 기반이라 draft/archived 글이 시리즈를 통해 우회 노출될 경로도 없음.

### ⑤ production build
위 참조.

## UI 실검수 (다크/라이트 + 375px + 카피)
- **375px**: bloghub·blogArchive·blogPost·Writing Studio 전부 `scrollWidth===innerWidth===375`(오버플로 0) 확인, post-detail 스크린샷 확보.
- **다크/라이트**: 배지 3색 전부 두 테마에서 값 대조(위 ①).
- **콘솔 에러**: 0건.
- **카피**: "공개 글만 노출 · 초안과 보관은 Studio에서 관리" 등 legend 문구는 상태 안내이지 화면 자기해설이 아님.

## [제안] (경미, 블로커 아님)
- `StatusBadge.vue`의 `.badge-pub` 텍스트 색이 `var(--status-pub)`가 아니라 **`var(--line-w-text)`**(Work Manager/Line W용 토큰)를 참조한다(`styles.css:883`). 지금은 둘 다 초록 계열이라 시각적으로 문제없지만, 이름상 무관한 기능(Line W)의 토큰에 블로그 배지가 암묵적으로 결합돼 있어 향후 Line W 색을 바꾸면 블로그 공개 배지 색도 의도치 않게 같이 바뀐다. `--status-pub`로 정정하는 후속 정리를 권장.
- `.badge-draft`는 `var(--status-draft)`를 전혀 참조하지 않고 `--text-2`/`--line-strong`/`--panel-soft`(범용 토큰)만 쓴다 — 이건 티켓 스펙 원문에 그대로 명시된 값이라 구현 이탈은 아니지만, TKT-056이 확립한 `--status-draft` 토큰이 이제 이 배지 시스템에서는 안 쓰이는 상태다. 토큰 정리 시 참고.
- 티켓 문서의 "추가 수용 기준 (R2 승인, **2026-08-18**)" 날짜가 오늘(2026-08-17) 이후다 — 오타로 보임, 기능 자체는 정상 동작하니 블로커는 아니고 문서 날짜만 확인 권장.

## 상태 제안 (판정은 PM)
블로커 0. 원본 4개 + R2 추가 1개 기준 전부 실측 확인. **finished 전환 권장.** TKT-056 처리 시 위 "먼저 밝힐 것" 참고.
