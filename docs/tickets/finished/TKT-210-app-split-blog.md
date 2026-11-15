문서 상태: 작성완료

# TKT-210 `[FE]` App.vue 분해 — 블로그(허브·아카이브·글 상세·Studio 연결) (동작 변화 0)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.3`**(작업 트리 `/Users/imjeonghan/newProject/wa-083`) · 스펙 `design/app-vue-decomposition-v0.8.3.md`.
- 근거: PO 2026-10-25 「0.8.3에서 그럼 app.vue 분해 포함 리팩토링해줘」.
- scope: `frontend/src/App.vue`, 신규 `pages/BlogHubView.vue`·`BlogArchiveView.vue`·`BlogPostView.vue`·`composables/useBlogStore.js`. **CSS 이동 금지**(클래스 이름 그대로), 다른 화면 코드 이동 금지.

## 완료 조건
1. [x] 해당 덩어리의 템플릿·상태·함수·타이머가 새 파일로 옮겨지고, App.vue 는 컴포넌트를 쓰기만 한다. 전역에 필요한 값은 props/emit 또는 composable 반환값으로만 주고받는다(전역 변수 공유 금지).
2. [x] 타이머·이벤트 리스너는 옮긴 쪽의 `onBeforeUnmount` 에서 정리된다(누수 0).
3. [x] **동작·화면 변화 0**: `npm --prefix frontend run e2e:all` 97 pass / 18 skip / 0 fail, unit 그린, `git diff --check`. 테스트 파일 수정 0(바꿔야 하면 이유를 적고 PM 판단).
4. [x] 375/1440 × 다크/라이트에서 해당 화면 전후 캡처 비교 `/private/tmp/tkt210/before-*`·`after-*`(같은 시점·같은 난수 시드에서 눈으로 차이 0).
5. [x] App.vue 줄 수 전/후 기록.
6. [x] `BLOG_LINE_OPEN` 스위치·주소 가드(D-031) 동작 그대로, 블로그 E2E 는 계속 skip.

## 구현 내역
- 새 파일: `frontend/src/composables/useBlogStore.js`(글 목록·활성 슬러그·Studio 상태·자동저장·보관 복원·발행/보관/복원·백업, 목록 파생값), `frontend/src/composables/blogMarkdown.js`(마크다운 렌더러·슬러그·Studio 표 정규화 — 상태 없는 순수 함수; **scope 밖 파일 1개 추가** — 렌더러가 230줄이라 스토어에서 분리), `components/pages/BlogHubView.vue`·`BlogArchiveView.vue`·`BlogPostView.vue`(템플릿 그대로, 클래스 그대로, 패턴은 WorkView 와 같은 `store` prop + `toRefs(reactive())`).
- `App.vue`: 블로그 상태·함수·마크다운·저장소 헬퍼 약 880줄 제거, `useBlogStore({ page, openPage, createEntityId, initialSlug, voyageArchiveStorageKey })` 호출 + 컴포넌트 3개 + 기존 `WritingStudio` 연결(이벤트 `studioViewMode = $event`·`blogMessage = ''` 직접 대입은 스토어의 `setStudioViewMode`·`clearBlogMessage` 로 정리).
- **경계(D-031)**: `BLOG_LINE_OPEN`·`isBlogClosedPage`·`BLOG_LINE_PAGES`·닫힌 주소 토스트(`blogClosedNotice`·타이머)·`readInitialBlogSlug`·popstate/`syncLiveLocation` 의 슬러그 처리는 라우팅이라 App.vue 에 남겼다. 스토어는 스위치를 모른다.
- 타이머·리스너: 자동저장 타이머 `clearTimeout` 과 `beforeunload` 해제를 스토어의 `onBeforeUnmount` 로 이동(App 의 해당 줄 제거). `beforeunload` 등록은 스토어 `onMounted`(App 의 onMounted 보다 먼저 등록돼 순서만 앞선다 — 동작 동일). `initializeBlogWorkspace()` 호출 위치는 App onMounted 그대로.
- 남긴 것(TKT-211 몫): `BLOG_STATUS_LABELS`·`countWords`·`formatDate`(블로그에서 쓰이지 않는 죽은 코드)·레거시 v040/v050·fallback 상수. `saveStudioDraft` 는 원래 호출처가 없어 스토어에도 옮기지 않고 복사만 했다(미반환).
- 공유 파일 없음. 테스트 파일 수정 0. `staticWritingState.js`·CSS 수정 0.

## 검증
- 기준선(변경 전) — 스위치 꺼짐 `e2e:all` **99 pass / 18 skip / 0 fail**(blogClosed 16 통과). 스위치 임시 true: **98 / 16 / 3**(BlogTone 2 · WritingStudio 14 · ToneTools 12 통과; 실패 3 은 블로그 외 — JunctionMap 1440 dark·light 노선 개수 기대, staticRouting TKT-177 index.html 복제. 스위치 켠 상태가 원래 안 맞는 기존 실패).
- 변경 후 — 꺼짐 **99 / 18 / 0**(blogClosed 16 통과), 켠 상태 **98 / 16 / 3**(통과·실패 파일·건수 전후 동일: BlogTone 2·WritingStudio 14·ToneTools 12). 스위치는 `false` 로 되돌림(`git diff` 에 `lines.js` 없음).
- unit 46/46, `npm run build` · `--base=/workaround.co.kr-platform/` 빌드 통과, `git diff --check` 깨끗.
- App.vue 줄 수 **2,847 → 1,908**(−939).
- 캡처(켠 상태 root-base 빌드, 허브·아카이브·글 상세·Studio × 375/1440 × 다크/라이트 16장): `/private/tmp/tkt210/before-*.png` ↔ `after-*.png` **16쌍 바이트 동일**, 가로 overflow 0(scrollWidth=innerWidth). 시드 글은 고정이라 난수 영향 없음.

## 질문/에스컬레이션
- 없음. [구체화 질문] 없음. [반박] 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-210-r1.md`.
- 없음.
