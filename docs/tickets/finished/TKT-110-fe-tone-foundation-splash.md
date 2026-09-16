문서 상태: 작성완료

# TKT-110 `[FE]` 톤 전환 기반 + 스플래시 — 토큰·크롬·행 컴포넌트, 플랩 3단계

- 상태: `finished` (REV-TKT-110-r1 통과, PM 2026-09-14)
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
- 스플래시의 영문 간판·시계·4개 메타 행·통계 타일·건너뛰기 설명을 제거하고, 사이트 W 배지를 톤 원칙의 기본안(단색 링 + 12시 기점 점) 순환선 심볼로 교체했다. 심볼은 `SiteLoopSymbol.vue` 단일 컴포넌트로 모아 스플래시와 환승 홀이 함께 사용한다. CSS 플립/좌우 문짝 연출은 최신 PO 정정대로 사용하지 않았고 전역 상단 제목은 한국어로 바꿨다.
- `StationHeader`는 면·그림자·영문 부제를 제거하고 노선색 세로선·원형 역 코드·hairline 정보행만 남겼다. `components/tone/`에 순환선 심볼, 라벨 좌/값 우 시각표 행, 구간 룰, 데스크톱 우측 패널/모바일 바텀시트 공용 컴포넌트와 export 진입점을 추가했다. 라이트 스플래시는 밝은 역 표면과 검은 물리 플랩보드로 분리해 제목·티커·조작부 대비를 보정했다.

## 완료 게이트

- [x] `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/` — 각 45 modules 성공.
- [x] `node --test src/staticRouting.test.mjs src/staticWritingState.test.mjs src/data/voyageCoverage.test.mjs src/sim/taxiDispatch.test.mjs` — 11/11 통과.
- [x] `src/splashTone.e2e.mjs` — Chromium 2/2 통과. 375px 다크 실제 10초에서 3개 플랩 문구·3개 티커·기존 반쪽 패널 run·환승 홀 전환, 1440px 라이트 reduced-motion 정적 결과와 테마 적용, 두 폭 overflow 0, API 요청/브라우저 오류 0을 검증했다.
- [x] 기존 `WritingStudio.e2e.mjs` — Pages base Chromium 9/9 통과(App.vue/styles.css 교차 회귀).
- [x] Vue compiler로 신규 `ToneScheduleRow.vue`, `ToneSectionRule.vue`, `ToneDetailPanel.vue`, `SiteLoopSymbol.vue` script/template 개별 컴파일 4/4 통과.
- [x] Chromium 실렌더: 375×812 다크 애니메이션 마지막 프레임과 1440×900 라이트 reduced-motion 첫 프레임을 직접 확인했다. 가로 overflow 0, 스플래시 주인공 1개, 통계 타일 0, 라이트 대비 정상, 배경/플랩보드/모션 엔진 유지.

## 질문/에스컬레이션

- [해소] TKT-102 r9의 심볼 확정 전에는 단색 링 + 12시 기점 점을 `SiteLoopSymbol.vue`로 사용한다. PM 답변에 따라 다른 안이 선택되면 후속 소형 티켓에서 심볼 CSS를 교체하며 파비콘은 scope 밖으로 유지한다.
- [해소] 좌우 패널은 넣지 않는다. PM이 TKT-110 현행 UI 기준을 우선하고 r9의 패널 유지 지시를 정정했으므로, 지정된 네 항목만 반영한 현재 구현으로 리뷰를 요청한다.

- [차단 중 디자이너 의견] (codex-8, 2026-09-13) r9 목업의 플랩 품질 기준도 현행 상·하 반쪽 접힘·시차·글자 정합이다. 좌우 패널은 이를 대신하는 주인공이 되지 않도록 배경의 마지막 전환으로만 약하게 표현하는 방향을 검토하겠다. 당시에는 PM 정합 확인이 필요하다고 보았으며, 위 두 [해소] 항목과 아래 PM 답변이 이 의견을 최종 대체한다.

## 남은 위험

- Safari/WebKit과 실제 Pages 배포 환경은 미검증이다. 파비콘은 이 티켓의 허용 scope 밖이라 기존 파일을 건드리지 않았다.
- r9에서 다른 심볼 안이 확정되면 후속 소형 티켓이 필요하다.
- PM 안내대로 `App.vue`·`styles.css`의 TKT-105 연결부가 함께 포함되므로 리뷰 범위에 포함한다. 그 밖의 타 레인 변경은 건드리지 않았고 commit/push 없음.


## PM 답변 (2026-09-14) — blocked 해제

- **Q1 심볼**: 임시 1안(단색 링 + 12시 기점 점)으로 **그대로 진행해 need_review 전환**. r9 에서 다른 안이 뽑히면 교체는 후속 소형 티켓(심볼 CSS·파비콘 한 곳) — 그러니 심볼은 토큰/단일 컴포넌트로 모아 두라. 파비콘은 scope 밖 유지.
- **Q2 좌우 패널**: **TKT-110 이 우선 — 넣지 않는다.** 현행 UI(패널 없음) 기준으로 4항목(문구 3단계·티커 3회·심볼·군더더기 제거)만. r9 목업 지시의 "패널 유지"는 정정한다(디자이너 의견 채택: 패널은 주인공이 아니라 배경의 마지막 전환으로만 약하게 — 이것도 목업 한정, 구현은 현행 엔진 그대로). r9 실파일 대조는 need_review 후 리뷰에서 한다 — 기다리지 말 것.
- 워킹트리 공존 메모: `App.vue`·`styles.css` 에 TKT-105 연결부 hunk 가 남아 있다(105 는 finished, WritingStudio.* 만 커밋됨). 110 커밋에 함께 실린다 — 리뷰 범위에 포함.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-110-r1.md`. [제안] 플랩보드 높이·티커 상자 면은 114/118.
