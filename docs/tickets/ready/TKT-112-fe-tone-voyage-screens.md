문서 상태: 작성완료

# TKT-112 `[FE]` 여행 화면 3종 톤 전환 (준비·일일·기록) + 지출 표시

- 상태: ready · 우선순위: P1 · 담당: codex-1 · 의존: TKT-110, TKT-108(컬렉션 — need_review 진입 시 착수 가능)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/components/Voyage*.vue`, `components/voyage/**`, `frontend/src/styles.css`, voyage 테스트

## 목표
`mockups/voyage-prep.html` · `voyage-daily.html` · `voyage-archive.html`. 기록 화면은 일차별 경과 + 한 줄 감상 + **지출 한 줄**(컬렉션 스펙 §1-1 `spend`), 헤더에 누적/계획 진행선. 여정 노선도·시각표 카드는 TKT-109 가 담당 — 이 티켓은 3화면 톤·구조만.
