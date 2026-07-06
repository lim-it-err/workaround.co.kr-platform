문서 상태: 작성완료

# TKT-071

## 메타데이터

- 제목: UI 재구현 S1 - 디자인 토큰 + 타이포 + StationHeader 앱 전역 적용
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `ready`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-071-ui-rebuild-s1-tokens`

## 목표

UI 재구현의 토대인 슬라이스 S1을 구현한다. `design/implementation-spec-2026-07-06.md` §1(색 토큰)·§2(타이포)·§3.1(StationHeader)·§3.6(공통 프리미티브)를 근거로, `frontend/src/styles.css` 토큰을 전면 교체하고 `StationHeader.vue` 를 만들어 전 기능 페이지 상단의 `platform-banner line-X` 를 역명판 헤더로 통일한다. 이 슬라이스가 이후 S2~S6의 색/타이포/헤더 기반이 되므로 반드시 먼저 마감한다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §1, §2, §3.1, §3.6, §6(S1), §7.

1. 색 토큰 전면 교체 (스펙 §1.1). `frontend/src/styles.css` 최상단 `:root`(다크 기본)과 `.app-shell[data-theme='light']`(라이트) 구조는 유지하되 §1.1 표 값으로 교체한다. 대상 토큰: `--bg`/`--bg-2`/`--panel`/`--panel-2`/`--panel-soft`/`--line`/`--line-strong`/`--text`/`--text-2`/`--muted`/`--safety`(#F3C544)/`--safety-ink`/`--exit`(#17A757)/`--exit-hover`/`--danger`/`--shadow`/`--head-bg`/`--map-node`/`--code-bg`/`--quote-bg`.
2. 노선 색 토큰 (스펙 §1.2). `--line-{x}`(코어)와 `--line-{x}-text`(텍스트 틴트) 짝으로 정의한다. 다크 코어/틴트: B `#E14D78`/`#F07CA0`, E `#3FC1FF`/`#7BD4FF`, T `#F0B33C`/`#F5C86E`, W `#35C275`/`#6BD59B`, R `#5B8DEF`/`#8FB0F5`, D `#9B6BF2`/`#BCA1F7`, P `#22C3A7`/`#5AD9C2`. 라이트 코어/텍스트는 §1.2 표대로(B `#C0264F`/`#A81F43` 등).
3. 토큰 리매핑 (스펙 §1.3, 반드시 의식적으로 반영). 팔레트 이동이 있다:
   - Taxi 금색 역할을 `--line-t` 로 이관한다. Taxi 페이지 배너 `platform-banner line-p` → `line-t` (App.vue 약 L2768, L3424).
   - 현재 `--line-p`(금색) → 의미를 **틸(Palate)** 로 변경한다. Sim Hub 배너는 노선색 대신 **중립 처리**(§4 simhub, S4에서 본문 처리·여기서는 배너 노선색 제거).
   - 현재 `--line-v`(보라, 거의 미사용) → `--line-d`(Discovery 보라)로 통합/개명한다.
   - `--line-b` 어두운 마룬 → 선명 rose `#E14D78`(블로그 본선 강화). E/W/R 은 개념 유지, 값만 재튜닝.
   - 노선 modifier 클래스가 코어/틴트를 함께 물게 확장한다: `.line-b { --accent: var(--line-b); --accent-text: var(--line-b-text); }` … `.line-p` 까지(§1.3 코드블록 그대로). 이후 배너/카드/헤더는 하드코딩 대신 `var(--accent)`/`var(--accent-text)` 를 참조하도록 리팩터한다(로컬 스코프 오염 없음).
4. 상태 색 토큰 (스펙 §1.4). `--status-draft`(슬레이트)/`--status-pub`(그린)/`--status-arch`(브론즈)를 §1.4 표 값으로 정의한다. 배지 실렌더는 S3(TKT-073)에서 하되, 토큰 정의는 이 티켓에서 확정한다.
5. 타이포 스케일 (스펙 §2). 외부 CDN 금지, 시스템/설치형 폰트만. `--font-sans`/`--font-mono` 를 §2 값으로 두고 `body { line-height:1.6; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility; }`. 숫자용 `.num { font-variant-numeric: tabular-nums; letter-spacing:0.01em; }` 를 추가하고 시계/통계 타일 strong/아카이브 날짜 time/car 적재 x/20/층수에 적용한다. §2 표의 크기·굵기·자간 스케일(Display/Page H2/역명 H3/Post H1/카드 제목/Body/수치/Caption/Eyebrow)을 clamp로 반영한다. 필요 시 `--fs-display`/`--fs-h2`/`--fs-body`/`--fs-caption` 등 CSS 변수 노출(권장, S5에서 유용).
6. StationHeader 구현 (스펙 §3.1). `frontend/src/components/StationHeader.vue` 를 신설한다. 구조는 시안 A `.station-sign` 이식: `.band`(height:8px; background:var(--accent)) + `.station-sign-in`(`.station-prev` "← 환승 홀" / `.station-center`(`.station-code` 원형 배지 40px·border 3px var(--accent)·color var(--accent-text) + `h3` 역명/`small` 영문 STATION) / `.station-next` "다음 승강장 →") + `.station-sub`(`.chip .dot` 상태 + 도메인 요약 span + `.spacer` + `a.btn.btn-ghost` "환승 홀로 나가기"). Props: `lineClass`/`stationCode`/`title`/`titleEn`/`prevLabel`/`nextLabel`/`status`/`statusTone`('live'|'warn'|'ok')/`summary`, 슬롯 `#actions`. 래퍼는 `border-radius:var(--radius-lg); overflow:hidden; border:1px solid var(--line); background:var(--panel); box-shadow:var(--shadow);`. 접근성: 상태는 색+텍스트(chip) 동시, 복귀 CTA 항상 노출.
7. 전 기능 페이지 헤더 교체. elevator/taxi/work/runtime/bloghub/writingStudio 등 각 기능 페이지 상단의 `platform-banner line-X` 를 StationHeader로 교체한다. 색은 해당 노선 1색만(멀티 액센트 금지), 복귀 CTA 항상 노출. 페이지별 code/band/summary 기본값은 스펙 §4를 따른다(예: elevator `E01`/`--line-e`, taxi `T01`/`--line-t`, work `W01`/`--line-w`, runtime `R01`/`--line-r`, bloghub `B01`/`--line-b`). 본문 세부 스킨은 S3/S4에서 이어간다.
8. 공통 프리미티브 정합 (스펙 §3.6). `.sec-head`/`.sec-rail`(노랑 44x4 막대, background:var(--safety))/`.eyebrow`(대문자), `.btn`/`.btn-exit`(Exit Green 전용, background:var(--exit))/`.btn-ghost`(border:1px solid var(--line-strong)), `.chip`/`.roundel`(34/24px), radius 토큰 `--radius:14px; --radius-lg:20px;`. 기존 `.primary-button`/`.ghost-button` 을 각각 `.btn-exit`/`.btn-ghost` 규칙으로 정합한다(클래스명은 유지 가능, 규칙만 통일). 액센트 절제(§1.1): 노랑(`--safety`)=현재 위치/포커스/섹션 레일 전용, 초록(`--exit`)=진입 CTA 전용. 한 화면에 포인트 색 2개 이상 경쟁 금지.

시안 재사용 포인터(스펙 §7): 토큰은 `variant-a-seoul-signage.html` `:root[data-theme]`(약 L25~82) 기반 + 다크 노선 코어/틴트는 `variant-c-night-line.html` `:root[data-theme="dark"]`(약 L26~46). 타이포/`.num` 은 시안 A L97 / 시안 C L82, `body` 렌더링 힌트 A L86~94. StationHeader DOM/CSS 는 시안 A `.station-sign`~`.station-sub`(L554~587), 대안 상단 스트립은 시안 C `.station-head`/`.strip`/`.station-route`(L482~513). 섹션 골격/버튼/칩/roundel 은 시안 A L146~198.

## 범위

- 포함: `frontend/src/styles.css` 토큰 전면 교체(§1.1/§1.2/§1.3/§1.4), 타이포 스케일(§2), 노선 modifier 클래스 코어/틴트 주입, `StationHeader.vue` 구현, 전 기능 페이지 `platform-banner line-X` → StationHeader 교체, taxi `line-p`→`line-t`, Sim Hub 배너 중립화, §3.6 공통 프리미티브 정합.
- 제외: 환승 홀 노선도(→ TKT-072/S2), 블로그 상태 배지 실렌더·블로그 페이지 A 처리(→ TKT-073/S3), 시뮬레이터/운영 본문 스킨(→ TKT-074/S4), 컴포넌트 전면 분해(→ TKT-075/S5), 모바일 재배치(→ TKT-076/S6), 스플래시 플랩(→ TKT-070). 도메인 계약(사람 단위 엘베 등) 변경 금지.

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- 다크(기본)/라이트 두 테마 모두에서 전 페이지 대비·위계가 유지된다(색만이 아니라 색+문자+라벨 병행).
- 전 기능 페이지 상단이 StationHeader(노선색 띠 + 역 코드 원 + 역명 + 상태 chip + 복귀 CTA)로 통일되고 `platform-banner line-X` 잔재가 없다.
- Taxi 배너 색이 `line-t`(금색)이고, Sim Hub 배너가 노선색 없는 중립 톤이다.
- 한 화면에 포인트 색(노랑/초록)이 2개 이상 경쟁하지 않는다.

## 선행 조건

- 없음. S1은 UI 재구현의 토대이며 스펙 §6에서 반드시 선행으로 지정된다.

## 질문/결정 기록

- 결정(2026-07-05, 사용자): 골격=시안 A, 환승 홀만 시안 C, 다크 기본. 색 토큰/타이포/역명판을 A 문법으로 통일.
- 결정(스펙 §1.3): 금색은 Taxi(`--line-t`), `--line-p` 는 틸(Palate)로 의미 변경, `--line-v` 는 `--line-d`(Discovery)로 통합. Sim Hub 는 노선이 아니므로 전용 노선색 없음.
- 결정: 상태 색 토큰(§1.4)은 S1에서 정의만, 배지 실렌더는 S3.

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (전체, 특히 §1/§2/§3.1/§3.6/§6/§7)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`

## 작업자 산출물

- 브랜치 이름
- 토큰 교체/리매핑 요약(§1.3 이동 반영 여부)
- StationHeader 적용 페이지 목록
- 다크/라이트 검수 결과
- 검증 결과(run-frontend-build)

## 검토 메모

- 없음

## Notes

- 이 티켓은 S2~S6의 색/타이포/헤더 기반이다. 여기서 정한 `--accent`/`--accent-text` 규약을 후속 슬라이스가 그대로 참조한다.
- 스플래시 플랩(아래→위, 물리 연출)은 TKT-069/TKT-070 소관이므로 건드리지 않는다. 본 티켓은 스플래시 크롬/토큰만 정합한다.
