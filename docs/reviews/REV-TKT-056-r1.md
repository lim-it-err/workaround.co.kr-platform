# REV-TKT-056-r1-draft — 블로그 아카이브 상태 모델 + 상태 배지 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(보관/복원 로직) + `frontend/src/styles.css`(상태 배지 색). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).

## 요약 권고: **통과 — 4개 완료 기준 전부 코드 추적 + 실브라우저 풀 사이클 재현으로 확인, 블로커 없음**

이번 라운드는 리뷰 환경 문제(지난 TKT-054) 없이 끝까지 재현됐다. 특히 "공개 복원 거부"라는 **음성(negative) 경로**까지 실제로 트리거해 정확한 거부 메시지가 뜨는 걸 확인했고, 복원된 글이 TKT-055(공개 라우팅)의 not-found 판정과 올바르게 맞물리는지까지 교차 검증했다.

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, 16 modules).
- 브랜치 `codex/v0.6.0-line` 확인.
- **라이브 브라우저 검증(전부 성공)**: `/blog`로 스플래시를 우회해 진입한 뒤 SPA 내비게이션으로 Studio까지 도달, 아래 시나리오를 실제 클릭으로 재현.

## 완료 기준 대조 (4개)

### ① 보관 글 목록 노출 + 복원 액션 (QA "archive recovery attempt")
**코드**: `restoreArchivedPost(postId, nextStatus)`(`App.vue:1835-1868`)가 `blogPosts`에서 `status==='archived'`인 항목만 찾아 `draft`/`published`로 전이하고 `persistBlogPosts`로 영속화. Archive Shelf 템플릿(`:4216-4243`)이 `archivedBlogPosts`를 `v-for`로 실제 항목(제목·수정일·상태칩) 나열 + "초안으로 복원"/"공개로 복원" 버튼 2종.
**라이브 풀 사이클**: 초안(제목만 있는 새 글) 생성 → 저장 → archive → Archive Shelf에 1건 등장 확인 → **"공개로 복원" 클릭 → 실제로 status가 published로 바뀌고 Archive Shelf가 0건으로 돌아옴**을 확인. 별개로 시드 draft 글도 archive→"공개로 복원"까지 재현.

### ② 발행 조건 미충족 보관 글의 공개 복원 거부 (요약/본문 필요)
**코드**: `:1843-1849`가 `targetStatus==='published'`이고 summary/bodyMarkdown이 비어 있으면 저장 자체를 막고 `'공개 복원 전 요약과 본문이 필요합니다.'`를 노출.
**라이브(반려 경로 직접 트리거)**: 요약·본문 없이 제목만 있는 글을 생성→저장(성공, TKT-054 완화 규칙과 일치)→archive→**"공개로 복원" 클릭 → 정확히 `"공개 복원 전 요약과 본문이 필요합니다."` 메시지 확인, status는 archived로 그대로 유지, Archive Shelf에서 사라지지 않음** — 형식적 가드가 아니라 실제로 발동함을 확인. 이어서 같은 글로 "초안으로 복원"은 정상 성공(제목만 있으면 draft는 허용, TKT-054 규칙과 정합).

### ③ draft/published/archived 배지 시각적 구분 (§6 슬레이트/그린/브론즈)
CSS(`styles.css:874-887`, 라이트 테마 변수 `:132-134`)와 라이브 `getComputedStyle` 결과가 정확히 일치: `status-draft` → `rgb(107,122,146)`(`#6B7A92`, 슬레이트) · `status-published` → `rgb(0,168,77)`(`#00A84D`, 그린) · `status-archived` → `rgb(154,110,46)`(`#9A6E2E`, 브론즈). 세 값이 명확히 구분되고 회색 단일화 없음. `:class="\`status-${post.status}\`"` 패턴(`:4044,4105,4128,4315` 등)이 상태값을 그대로 클래스명으로 써서 목록·상세·Studio 미리보기 전체에 동일 매핑이 강제됨(별도 매핑 테이블이 없어 드리프트 여지도 없음).

### ④ 배지 색이 §6 금지 규칙 위반 안 함
`--danger`(라이트 `#C24557`, 빨강 계열) vs `--status-arch`(`#9A6E2E`, 갈색/브론즈 계열) — 색상 자체가 다른 계열이라 "archived=위험색" 위반 없음. `--status-draft`(청회)와 `--status-arch`(황갈)도 서로 다른 색상이라 "draft/archived 회색 단일화 금지"도 준수.

## UI 실검수 (다크/라이트 + 375px + 카피)
- **375px**: bloghub 페이지에서 `document.documentElement.scrollWidth === innerWidth === 375`(오버플로 0) 직접 측정 + 스크린샷 확보(카드 레이아웃 정상, published 배지 정상 렌더).
- **다크/라이트**: 테스트 세션 내내 다크 테마로 조작했고 배지 RGB도 다크 팬 라이트 각각의 CSS 변수와 대조 확인.
- **콘솔 에러**: `Uncaught|TypeError|ReferenceError|Vue warn` 0건.
- **카피**: "보관된 글이 없습니다", "공개 복원 전 요약과 본문이 필요합니다" 등 전부 상태/결과 알림이지 화면 자기해설이 아님. 내부 용어 노출 없음.

## [제안] (경미, 블로커 아님)
- `restoreArchivedPost`의 발행 조건 검사(`summary`/`bodyMarkdown` 비어있음 체크)가 `persistStudioPost`의 동일 조건과 **별도로 중복 구현**돼 있다 — 지금은 두 곳이 정확히 같은 조건이라 문제없지만, 나중에 발행 조건이 바뀌면 한쪽만 고치고 다른 쪽을 놓칠 위험이 있다. `persistStudioPost`를 재사용하거나 조건을 공유 함수로 뽑는 리팩터링을 후속으로 고려할 만하다.

## 상태 제안 (판정은 PM)
블로커 0. 4개 완료 기준 전부 코드+라이브(성공·실패 양쪽 경로 포함) 이중 검증, TKT-054/055와의 교차 정합성도 실측 확인. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-08-18)

**통과 → finished.** 리뷰어 게이트 재실행·라이브 재현 결과 수용. 블로커 0.
