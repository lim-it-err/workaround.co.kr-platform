문서 상태: 작성완료

# TKT-112 `[FE]` 여행 목록 + 노선도 톤 정합 (D-019 재정의)

- 상태: finished (2026-09-14, REV-TKT-112-r1 통과) · 우선순위: P1 · 담당: codex-1 · 의존: TKT-110, TKT-108, TKT-127 finished
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/components/Voyage*.vue`, `components/voyage/**`, `frontend/src/styles.css`, voyage 테스트

## 목표
`mockups/voyage-prep.html` · `voyage-daily.html` · `voyage-archive.html`. 기록 화면은 일차별 경과 + 한 줄 감상 + **지출 한 줄**(컬렉션 스펙 §1-1 `spend`), 헤더에 누적/계획 진행선. 여정 노선도·시각표 카드는 TKT-109 가 담당 — 이 티켓은 3화면 톤·구조만.


## PM 재정의 (2026-09-14, D-019)
- 준비·일일·기록 3화면 톤 전환은 **폐기** — TKT-127 이 세 화면을 노선도로 흡수한다. 이 티켓은 **여행 목록(108)과 노선도(109/127) 의 톤 정합**(시각표 행·hairline·주인공 1·구 배너 제거)만. 127 need_review 이후 착수.
- (127 통과 후 추가) 홈 `lines.js` 여행 서브링크를 `노선도` 하나로 / 노선도 접힘 상태는 ≥900px 에서 항상 펼침.

## 구현 내역
- 여행 목록의 구 `StationHeader` 역 간판을 제거하고 V 배지·제목·홈 이동만 남긴 hairline 헤더로 정리했다. 현재 여행 하나만 왼쪽 노선색 선의 히어로 유지하고, 지난 여행은 시각표 행과 업무용 hairline으로 나뉠다.
- 노선도의 큰 영문 상태·여행명 배너를 작은 V 배지·여행명·`노선도`로 축소해 지도를 데스크톱 주인공으로 복원했다. 900px 이상으로 넓어지면 접힌 상태에서도 지도가 즉시 펼쳐지고, 다시 모바일로 돌아오면 사용자가 본 상태를 유지한다.
- 환승 홀의 V 노선 `준비·노선도·기록` 중복 진입을 `노선도` 하나로 합쳤고, SVG 정차 라벨과 목록 서브링크가 같은 단일 계약을 쓰게 했다.

## 검증
- 전체 프런트 unit 20/20: 노선 단일 진입, 여행 컬렉션·커버리지·저장 이행, 노선·지출 계산, 정적 라우팅, 백업, SIM 회귀 통과.
- 기본 build와 GitHub Pages base build `vite build --base=/workaround.co.kr-platform/` 모두 통과(각 48 modules).
- Chromium E2E 6/6: 환승 홀·여행 목록·노선도를 각각 375px dark / 1440px light에서 확인. 900px 경계 자동 펼침과 모바일 재접기, 진입 포커스, 정차역 편집 회귀, 가로 overflow 0, 브라우저 오류·경고·API 요청 0.
- 대표 캡처 6개를 직접 비교해 목록의 단일 히어로·노선도의 지도 중심 위계·환승 홀의 V 단일 진입을 확인했다.

## 질문 / 반박
- 없음. PM 재정의와 TKT-127 r1 답변을 그대로 반영했다.

## 남은 위험
- Safari/WebKit과 실제 GitHub Pages 배포 환경은 미검증이다. PM 최종 판정과 commit/push가 필요하다.

## 리뷰 기록

- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-112-r1.md`. [중요] `ACTUAL` 눈썹 라벨 잔존 → TKT-118 이관. 커밋은 TKT-117 과 묶음.
