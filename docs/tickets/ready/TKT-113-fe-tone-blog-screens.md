문서 상태: 작성완료

# TKT-113 `[FE]` 블로그 3종 톤 전환 (허브·공개 아카이브·글 상세)

- 상태: ready · 우선순위: P2 · 담당: codex-1 · 의존: TKT-110
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/App.vue`(bloghub/blogArchive/post 섹션), `frontend/src/styles.css`, `frontend/src/components/StatusBadge.vue`, 블로그 테스트(055/056/057 회귀 필수)

## 목표
`mockups/blog-hub.html` · `blog-archive.html` · `blog-post.html`. 글 목록 = 시각표 행, 상세는 본문 중앙 720px. 딥링크·3상태 배지·XSS 회귀 0.
