문서 상태: 작성완료

# TKT-114 `[FE]` Writing Studio 톤 정합 + 격납고·Work·Runtime 톤 전환

- 상태: ready · 우선순위: P2 · 담당: codex-1 · 의존: TKT-110, TKT-105(need_review 진입 시)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/components/WritingStudio.vue`, `frontend/src/App.vue`(simhub/work/runtime 섹션), `frontend/src/styles.css`

## 목표
`mockups/writing-studio.html`(도구 메뉴 배치·중앙 720px·`← 블로그`) · `simhub.html`(격납고 카드 배열, 화이트채플은 TKT-107) · `work.html` · `runtime.html`. 보호 구역 표시는 행 우측 한 마디.
