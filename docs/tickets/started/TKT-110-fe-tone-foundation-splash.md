문서 상태: 작성완료

# TKT-110 `[FE]` 톤 전환 기반 + 스플래시 — 토큰·크롬·행 컴포넌트, 플랩 4단계

- 상태: blocked · 우선순위: P1 · 담당: codex-1 · 의존: TKT-102 r9 실파일/PO 확인 (전환 시리즈 1번)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/styles.css`, `frontend/src/App.vue`(스플래시·전역 크롬), `frontend/src/components/StationHeader.vue`, 신규 공용 컴포넌트(`components/tone/*` — 시각표 행·구간 룰·바텀시트/우측 패널)

## 목표
1. 전역: 카드/타일 스타일을 **시각표 행(라벨 좌·값 우·hairline)** 공용 컴포넌트로 대체할 기반 마련. 스테이션 톱바 유지, 원형 배지 유지.
2. 스플래시 — **현행 UI 기준(PO 2026-09-14)**: 배경·플랩보드 구조·**기존 split-flap 엔진(TKT-070/077) 그대로**. 바꾸는 것만: 문구 시퀀스 **3단계** `WORKING AROUND → MIND THE GAP → DOORS OPENING` (첫 WORKAROUND 없음 — PO 2026-09-14; 엔진의 플립으로 전환), 티커 3회 교체, 배지→순환선 심볼(r9 확정안), 통계 타일·군더더기 행 제거. 목업 `splash.html`(r9 개선판)은 문구 시퀀스·배치 참고용 — 플립 동작 자체는 현행 엔진이 기준.
3. 상세 패널 공용: 데스크톱 우측 슬라이드 패널 / 모바일 바텀시트 (여정 노선도·정차역 상세가 씀).

## 구현 결과

- 현행 `flap-board`/상·하 반쪽 패널/`waTop`·`waBottom` 엔진은 유지하고, 단일 14칸 행을 `WORKING AROUND → MIND THE GAP → DOORS OPENING` 순서로 3.3초마다 전환했다. 티커도 목업의 첫 세 문구와 같은 박자로 고정했으며 10초 자동 전환·다시 재생·reduced-motion 결과 고정을 유지했다.
- 스플래시의 영문 간판·시계·4개 메타 행·통계 타일·건너뛰기 설명을 제거하고, 사이트 W 배지를 톤 원칙의 기본안(단색 링 + 12시 기점 점) 순환선 심볼로 교체했다. CSS 플립/좌우 문짝 연출은 최신 PO 정정대로 사용하지 않았다. 환승 홀 상단의 사이트 배지도 같은 심볼로 통일하고 전역 상단 제목을 한국어로 바꿨다.
- `StationHeader`는 면·그림자·영문 부제를 제거하고 노선색 세로선·원형 역 코드·hairline 정보행만 남겼다. `components/tone/`에 라벨 좌/값 우 시각표 행, 구간 룰, 데스크톱 우측 패널/모바일 바텀시트 공용 컴포넌트와 export 진입점을 추가했다.

## 완료 게이트

- [x] `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/` — 각 37 modules 성공.
- [x] `node --test src/staticRouting.test.mjs src/staticWritingState.test.mjs src/data/voyageCoverage.test.mjs src/sim/taxiDispatch.test.mjs` — 11/11 통과.
- [x] `src/splashTone.e2e.mjs` — Chromium 2/2 통과. 375px 실제 10초에서 3개 플랩 문구·3개 티커·기존 반쪽 패널 run·환승 홀 전환, 1440px reduced-motion 정적 결과, 두 폭 overflow 0, API 요청/브라우저 오류 0을 검증했다.
- [x] 기존 `WritingStudio.e2e.mjs` — Pages base Chromium 9/9 통과(App.vue/styles.css 교차 회귀).
- [x] Vue compiler로 신규 `ToneScheduleRow.vue`, `ToneSectionRule.vue`, `ToneDetailPanel.vue` script/template 개별 컴파일 통과.
- [x] Chromium 실렌더: 375×812·1440×900 다크 스플래시와 375×812·1440×900 역 헤더를 직접 확인했다. 가로 overflow 0, 스플래시 주인공 1개, 통계 타일 0, 역 헤더 영문 부제 0, 배경/플랩보드/모션 엔진 유지.

## 질문/에스컬레이션

- [구체화 질문] TKT-102 r9의 심볼 3안이 아직 `started`라, 현재는 해당 티켓의 “선택 전 1안”과 톤 원칙(단색 링 + 12시 기점 점)을 적용했다. PM이 r9에서 다른 안을 고르면 심볼 CSS·파비콘은 후속 교체가 필요하다.
- [구체화 질문] TKT-102 r9 지시는 좌우 패널 갈라짐을 유지하라고 하지만, TKT-110은 현행 UI(좌우 패널 없음)에서 지정된 네 항목만 바꾸라고 한다. 실제 `frontend/public/mockups/splash.html`은 아직 r6라 최종 배치도 대조할 수 없다. 좁은 범위인 TKT-110을 우선해 현재 구현에는 좌우 패널을 넣지 않았으며, r9 실파일과 PM 선택이 도착하면 대조·교정 후 `need_review`로 전환한다.

- [디자이너 의견] (codex-8, 2026-09-13) r9 목업의 플랩 품질 기준도 현행 상·하 반쪽 접힘·시차·글자 정합이다. 좌우 패널은 이를 대신하는 주인공이 되지 않도록 배경의 마지막 전환으로만 약하게 표현하는 방향을 검토하겠다. 다만 TKT-110의 변경 허용 범위와 r9의 패널 유지 지시는 PM의 정합 확인이 필요하므로, r9 시안과 심볼 선택 전에는 현재 기본 심볼을 확정안으로 보거나 blocked 해제로 판단하지 않는다.

## 남은 위험

- Safari/WebKit과 실제 Pages 배포 환경은 미검증이다. 파비콘은 이 티켓의 허용 scope 밖이라 기존 파일을 건드리지 않았다.
- TKT-102 r9 실파일/심볼 선택/좌우 패널 충돌 해소 전까지 최종 완료 게이트는 열려 있다.
- 워킹 트리의 Writing Studio·플랫폼/Advisor 변경은 다른 티켓 산출물이며 수정·정리하지 않았다. commit/push 없음.
