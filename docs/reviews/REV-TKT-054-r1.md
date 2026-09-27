# REV-TKT-054-r1-draft — Writing Studio 저장/발행 무결성 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(Writing Studio 저장/발행/autosave/slug 로직). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).

## 요약 권고: **통과 — 5개 완료 기준 전부 코드 추적으로 정합성 확인, 블로커 없음**

**단, 이번 라운드는 라이브 브라우저 상호작용 검증을 끝까지 못 했다** — 아래 "검증 한계" 참조. 대신 5개 완료 조건 각각을 원 QA 발견 사항(#1/#4/#5/#7/#11)의 정확한 근거 라인부터 수정된 코드까지 전부 대조했고, 특히 가장 위험한 "발행→저장" 경로는 상태값을 손으로 시뮬레이션해 로직을 끝까지 따라갔다.

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, 16 modules, 티켓 claim과 일치).
- 브랜치 `codex/v0.6.0-line` 확인.
- **라이브 브라우저 검증 — 부분 실패(환경 문제)**: dev 서버(7012)를 띄우고 스플래시 화면을 건너뛰려 했으나, 탭이 "hidden"(`document.visibilityState`) 상태로 고정되며 스플래시 타이머뿐 아니라 **화면 자체 시계 표시(`오전 06:0X`)까지 여러 차례 재확인 동안 멈춰 있었다** — TKT-054 코드가 아니라 이 리뷰 세션의 브라우저 탭 렌더링/타이머 문제로 판단(새 탭을 열어도 동일). 약 40초 넘게 기다리고 새 탭까지 시도했지만 Writing Studio 화면 진입에 실패해 이번 라운드는 실브라우저로 저장/발행/autosave/slug 동작을 직접 클릭해 재현하지 못했다. **PM 또는 다음 라운드에서 브라우저로 한 번 더 확인 권장** — 아래 코드 추적 결과는 신뢰도가 높지만 "코드 훑기 금지, 직접 실행" 원칙의 실행 부분을 완전히 충족하지 못했음을 명시한다.

## 완료 기준 대조 (5개, 전부 코드 추적)

### ① (발견 #1) 편집 중 이탈/새로고침해도 미저장 내용 유실 안 됨
- 딥스냅샷 워처(`App.vue:1276-1289`)가 `createStudioEditableSnapshot(studioState.value)`(제목/슬러그/slugLocked/요약/태그/본문/상태/발행일 전체)을 감시해 `studioSavedSnapshot`과 다르면 `studioDirty=true`+`scheduleStudioAutosave()`(800ms 디바운스, `:1923-1931`) 호출.
- `openPage()`(전 앱의 유일한 페이지 전환 함수, `:2178-2179`)가 맨 앞에서 `page.value==='writingStudio' && nextPage!=='writingStudio' && !prepareStudioTransition()`면 전환을 막는다 — Studio를 벗어나는 모든 경로가 이 한 관문을 통과해야 하므로 개별 버튼마다 누락 위험이 없다. `createNewStudioPost`/`openStudioForPost`(다른 글로 전환)도 동일 가드.
- `prepareStudioTransition()`(`:1942-1948`)은 dirty 상태면 먼저 `flushStudioAutosave()`로 저장을 시도하고, 그게 실패(제목 없음)할 때만 `window.confirm`으로 사용자에게 묻는다 — 조용한 데이터 유실이 없다.
- `beforeunload` 리스너(`handleStudioBeforeUnload`, `:1950-1956`, 등록은 `:1459`)도 같은 조건(dirty && flush 실패)일 때만 네이티브 이탈 확인창을 띄운다.
- 화면 표시: `studio-save-status`(`:4073`)가 `studioDirty`에 따라 "미저장 변경 있음" / "저장됨 {시각}"을 보여준다(`:995-999`).

### ② (발견 #4·#5, "함께 검증" 대상) 발행 중 글 저장해도 상태·발행일 유지
`saveStudioDraft()`(`:1805-1811`)가 `persistStudioPost(studioState.value.status || 'draft')`를 호출한다 — **하드코딩된 'draft'가 아니라 현재 상태를 그대로 넘긴다.** 원 버그(발견 #5, "draft 저장이 status='draft'를 강제")가 이 한 줄로 해소됨을 확인.
`persistStudioPost`의 `publishedAt` 산식(`:1867-1868`): `current?.publishedAt || studioState.value.publishedAt || (status==='published' ? nowIso : '')`. 수기로 4단계 시나리오를 추적: **발행(날짜 X 생성) → 저장(status 유지, current.publishedAt=X이므로 그대로 X) → 발행취소(status='draft', publishedAt 여전히 current에서 온 X) → 재발행(status='published', current.publishedAt=X이므로 nowIso 분기에 도달조차 안 함, 그대로 X)** — 최초 발행일이 어떤 경로로도 갱신되지 않음을 코드 레벨로 확인. `unpublishStudioPost()`(`:1832-1840`)도 `status==='published'`일 때만 동작하고 `persistStudioPost('draft')`를 호출 — 명시적 액션으로만 비공개 전환된다(우발적 저장으로는 안 내려감).

### ③ (발견 #11) 제목만 있어도 임시 저장, 발행 글 재편집 진입점
`persistStudioPost`(`:1849-1860`): title 하나만 전 상태 공통 필수, `summary`/`bodyMarkdown` 필수는 `status==='published'` 분기에만 걸려 있다 — draft 저장 시 요약/본문 공란 허용을 코드로 확인. `openStudioForPost(postId)`(`:1766-1776`)가 임의 postId의 글을 Studio로 불러오고, 템플릿의 "Studio에서 편집" 버튼(`:4000`, `activeBlogPost.id` 전달)이 공개 글 상세 화면에 배치돼 있어 발행 글 재편집 진입점이 실재함을 확인.

### ④ (발견 #7) 수동 슬러그가 제목 편집으로 안 덮임
제목 워처(`:1266-1274`)가 `if (studioState.value.slugLocked && studioState.value.slug) return` 가드 뒤에만 자동 슬러그화를 수행 — `setStudioSlug()`(`:1800-1803`, 사용자가 슬러그 필드를 직접 편집할 때 호출되는 것으로 추정)가 `slugLocked=true`를 먼저 세팅. `populateStudio()`(`:1778-1798`)는 기존 글에 `slugLocked` 필드가 없어도 `Boolean(post.slug && post.slug !== slugify(post.title))`로 추론해 이관 — 이 필드 도입 이전에 저장된 글도 깨지지 않게 하는 마이그레이션 처리까지 확인.

### ⑤ production build 통과
위 "실행 검증" 참조.

## [제안] (경미)
- localStorage 다중 탭 동시 편집·파싱 실패 복구는 티켓이 명시적으로 범위 밖(#6, 서버 저장 전환 티켓으로 이월)이라 문제 삼지 않음 — 티켓의 결정 기록과 일치.
- `flushStudioAutosave`가 `{silent:true}`로 `blogMessage`를 안 건드리는 건 UX상 맞는 선택으로 보이나, autosave 저장이 실패하는 경로(제목 없음 외의 다른 이유는 현재 없어 보임)가 향후 생기면 조용히 실패할 수 있다 — 지금은 해당 없음, 참고용.

## 검증 한계 (다시 강조)
이번 라운드는 리뷰 도구의 브라우저 탭이 타이머 정지 상태에 걸려 다크/라이트·375px 실측과 저장/발행/autosave 클릭 재현을 하지 못했다. 코드 추적은 5개 조건 모두 원 버그 근거 라인과 1:1로 대조해 정합성이 높다고 판단하지만, **UI 클릭 기반 최종 확인은 PM 라운드 또는 다음 리뷰어 사이클에서 보강 권장.**

## 상태 제안 (판정은 PM)
코드 추적상 블로커 0. **다만 위 "검증 한계"를 고려해 PM이 최종 판정 전 짧은 실브라우저 확인(특히 발행→저장→재발행 사이클과 다크/라이트+375px)을 한 번 하는 걸 권장** — 그 확인이 끝나면 finished 전환에 문제없다고 본다.


---
## PM 최종 판정 (claude, 2026-08-18)

**통과 → finished.** 리뷰어 게이트 재실행·라이브 재현 결과 수용. 블로커 0.
