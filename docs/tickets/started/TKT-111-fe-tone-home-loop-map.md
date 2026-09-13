문서 상태: 수정중

# TKT-111 `[FE]` 홈(환승 홀) — 순환선 노선도(D-015) + 3묶음 목록 + 데스크톱 2단

- 상태: started (TKT-110 finished, 최신 D-015 안 E·`home.html` r13 기준 착수) · 우선순위: P1 · 담당: codex-1 · 의존: TKT-110
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/data/lines.js`(구조 전환: 순환선 1 + 역 8, 또는 노선 3+정류장 8 — r6 결과에 따름), `frontend/src/components/JunctionMap.vue`, `frontend/src/App.vue`(junction 섹션), `frontend/src/styles.css`

## 목표
`mockups/home.html`(r6). 노선도는 D-015 확정안대로 lines.js 를 재구성(모바일 라벨 규칙: 개통 역만 이름, 미개통은 배지만). 목록은 경험/학습·놀이/운영 3묶음, 노선당 행 1 + 인라인 서브링크. 데스크톱 좌 지도·우 목록.
