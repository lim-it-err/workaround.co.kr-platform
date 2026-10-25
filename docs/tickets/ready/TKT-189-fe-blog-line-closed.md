문서 상태: 작성완료

# TKT-189 `[FE]` 블로그 본선 운행 중단 — 홈·주소 노출 0, 코드 보존(단일 스위치)

- 상태: ready · **P1** · 담당: dev 서브에이전트(**Sonnet**) · 의존: TKT-188 finished. 브랜치 `codex/v0.8.0-live`. **UX 1순위.**
- 근거: PO 2026-10-25 「그리고 큰 결정이야. 블로그는 다시 내려.」 → D-031.
- scope: `frontend/src/data/lines.js`(블로그 노선 플래그·기록선 정의), `frontend/src/components/JunctionMap.vue`·`JunctionMap.e2e.mjs`, `frontend/src/App.vue`(라우팅 가드·네비게이션에서 블로그 진입점 제거), 블로그·스튜디오 E2E 파일(skip 처리만), 새 E2E 1개(`frontend/src/blogClosed.e2e.mjs`). **`frontend/src/styles.css` 는 이번 scope 밖**(TKT-190 이 동시에 수정) — CSS 가 꼭 필요하면 `[구체화 질문]`. **블로그 컴포넌트·데이터·`staticRouting.js` 파싱·`staticWritingState.js` 는 삭제·수정 금지(보존).**

## 완료 조건
1. [ ] **단일 스위치**: `lines.js` 에 `BLOG_LINE_OPEN = false`(이름은 자유, 한 곳). 이 값 하나로 홈 노선도 B 역·소역 3(아카이브·글 상세·스튜디오)·노선 목록의 `블로그 본선` 행·기록선 `order` 문구가 함께 사라진다(`환승 홀 → 여행`). `true` 로 바꾸면 지금과 동일하게 돌아온다(E2E 로 양쪽 확인할 필요는 없음 — 코드 경로만 남긴다).
2. [ ] **지도**: 기록선은 r16 원칙(환승 홀 직선 통과)대로 남긴다 — 왼쪽 구간은 역·라벨 없이 `M290 360` 에서 시작하는 짧은 꼬리(환승 홀 링 왼쪽), 오른쪽은 지금 그대로(여행 V·노선도). 1440·375 × 다크/라이트에서 글자·노선 겹침 0, 남은 소역 10개의 히트(r=26) 소유권 유지. 꼬리 길이가 어색하면 `[반박]` 으로 대안 좌표를 적고 진행.
3. [ ] **주소**: `/blog`·`/blog/<slug>`·`/blog-district`·`/studio` 직접 진입·새로고침·뒤로가기(`popstate`) 모두 **환승 홀**로, 기존 접근 토스트 패턴으로 한 줄 `블로그 노선은 운행을 멈췄습니다`. 정적 공개본(Pages base)과 root base 둘 다. 주소창은 환승 홀 주소로 교체(replace).
4. [ ] **다른 진입점 0**: 상단바·환승 홀 목록·여행 화면의 블로그 상호 링크·Advisor 등에서 블로그/스튜디오로 가는 링크가 렌더되지 않는다(렌더 기준 `블로그`·`Writing Studio`·`스튜디오` 텍스트 검색 0 — 단 이 E2E 의 토스트 문구는 예외).
5. [ ] **E2E**: 블로그·스튜디오 스위트(`Blog*.e2e.mjs`·`WritingStudio*.e2e.mjs` 등 실제 파일명 확인)는 파일 상단에서 스위치가 꺼져 있으면 `test.skip`(사유 `D-031 블로그 운행 중단`) — 테스트 코드는 지우지 않는다. 신규 `blogClosed.e2e.mjs`: 위 3·4 를 375/1440 에서 단언. `JunctionMap.e2e.mjs` 의 소역 13 → 10 등 기대값은 **스위치 상태에서 계산된 값**으로(구현에 맞추지 말고 이유를 적는다).
6. [ ] 게이트: root/Pages-base build, 메인 E2E 전체(Pages-base self-serve 스위트 + root-base SimTone·taxi + ToneTools — `CLAUDE.md`·`.agents/claude-dev.md` 의 실행법), unit 27/27, `git diff --check`, 375/1440 × 다크/라이트 홈 캡처. Advisor 는 무변경이면 build 만.

## 구현 메모
- 이미 `App.vue` 에 `statePage === 'blogArchive' || statePage === 'blogPost' ? 'junction'` 같은 가드 흔적이 있다(3416행 부근) — 같은 자리를 스위치 기반으로 정리.
- 정적 모드의 `STATIC_UNAVAILABLE_PAGES` 처리와 겹치지 않게, 블로그는 "준비 중" 이 아니라 "운행 중단" 으로 따로 다룬다.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
