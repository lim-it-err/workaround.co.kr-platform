문서 상태: 작성완료

# TKT-113 `[FE]` 블로그 3종 톤 전환 (허브·공개 아카이브·글 상세)

- 상태: `finished` (REV-TKT-113-r1 통과, PM 2026-09-14)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/App.vue`(bloghub/blogArchive/post 섹션), `frontend/src/styles.css`, `frontend/src/components/StatusBadge.vue`, 블로그 테스트(055/056/057 회귀 필수)

## 목표
`mockups/blog-hub.html` · `blog-archive.html` · `blog-post.html`. 글 목록 = 시각표 행, 상세는 본문 중앙 720px. 딥링크·3상태 배지·XSS 회귀 0.

## 구현 결과

- 허브를 최근 글 하나가 주인공인 좌측 노선선 문서형 화면으로 바꾸고, `새 글 쓰기`·`보관함`과 최근 공개 글 시각표 행을 연결했다.
- 공개 보관함을 연도별 74/110px 날짜 열과 제목 열로 구성한 시각표 목록으로 바꿨다. `draft`·`archived` 글은 공개 목록과 딥링크에서 계속 제외된다.
- 글 상세를 최대 720px 중앙 본문으로 정리하고, 좌측 노선선 제목·날짜/분류·본문·`← 보관함`/`이어서 쓰기 →`만 남겼다. 기존 Markdown 이스케이프와 3상태 배지 계약은 보존했다.
- `BlogTone.e2e.mjs`를 추가해 Pages base의 허브→보관함→상세→새로고침과 비공개 딥링크 차단을 375px/1440px에서 회귀 검증한다.

## 완료 게이트

- [x] `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — Vite 48 modules 통과.
- [x] 정적·여행·SIM unit — 19/19 통과.
- [x] `BlogTone.e2e.mjs` — Chromium 2/2 통과. 375×812 dark·1440×900 light에서 6개 화면을 직접 확인했고, 가로 overflow·API 요청·브라우저 오류/경고 0이다.
- [x] `WritingStudio.e2e.mjs` — Chromium 9/9 통과. 055/056/057의 비공개 딥링크·3상태 배지 구분·Markdown XSS 회귀를 포함한다.

## 남은 위험

- Safari/WebKit과 실제 GitHub Pages 배포는 미검증이다. PM 최종 판정과 commit/push가 필요하다.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-113-r1.md`.
