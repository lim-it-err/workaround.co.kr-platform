문서 상태: 작성완료

# TKT-110 `[FE]` 톤 전환 기반 + 스플래시 — 토큰·크롬·행 컴포넌트, 플랩 4단계

- 상태: started · 우선순위: P1 · 담당: codex-1 · 의존: 없음 (전환 시리즈 1번)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/styles.css`, `frontend/src/App.vue`(스플래시·전역 크롬), `frontend/src/components/StationHeader.vue`, 신규 공용 컴포넌트(`components/tone/*` — 시각표 행·구간 룰·바텀시트/우측 패널)

## 목표
1. 전역: 카드/타일 스타일을 **시각표 행(라벨 좌·값 우·hairline)** 공용 컴포넌트로 대체할 기반 마련. 스테이션 톱바 유지, 원형 배지 유지.
2. 스플래시(`mockups/splash.html`): 10초 유지, 티커 3회 교체, 플랩 4단계 `WORKAROUND → WORKING AROUND → MIND THE GAP → DOORS OPENING`, 종반 좌우 패널 갈라짐. 기존 split-flap 코드는 단순화 허용.
3. 상세 패널 공용: 데스크톱 우측 슬라이드 패널 / 모바일 바텀시트 (여정 노선도·정차역 상세가 씀).
