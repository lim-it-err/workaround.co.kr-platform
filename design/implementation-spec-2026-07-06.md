문서 상태: 작성완료

# workaround central UI 재구현 구현 스펙 (2026-07-06)

## 0. 개요

이 문서는 2026-07-05 사용자 확정 방향("시안 A 골격 + 환승 홀만 시안 C 노선도 + 다크 기본 + 아래→위 플랩")을 실제 앱(`frontend/src/App.vue`, `frontend/src/styles.css`)에 적용하기 위한 워커(Codex) 실행용 청사진이다. 워커는 이 문서만 보고 추측 없이 구현할 수 있어야 한다.

- 근거 문서:
  - `design/orchestrator_review/2026-07-05-ux-overhaul-mockups.md` (§ "2026-07-05 방향 확정 orchestrator")
  - `design/mockups/2026-07-05/variant-a-seoul-signage.html` (골격: 사인 시스템/토큰/타이포/역명판 헤더)
  - `design/mockups/2026-07-05/variant-c-night-line.html` (환승 홀 노선도만)
  - `design/ui-ux-rules.md`, `design/seoul-subway-ui-ux-system-2026-06-15.md`
  - `design/blog-district-ui-system-2026-06-26.md` (§6 상태 배지)
  - `docs/feature-definition.md` (페이지 책임/경계 — 위반 금지)

- 확정 방향(구속력 있음):
  1. 골격 = 시안 A(서울 사인 정제). 색 토큰, 타이포, 여백/위계, 역명판(station-name-plate) 페이지 헤더를 A 문법으로 통일.
  2. 환승 홀(Main Junction)만 = 시안 C의 route-map(블로그 = 굵은 본선, 시뮬레이터/운영/실험 = 지선/노드).
  3. 기본 테마 = 다크(라이트는 토글 전용, TKT-069로 이미 반영). 라이트도 1급 짝 설계.
  4. 색감은 A·C 팔레트 모두 사용 가능. 본 스펙은 다크가 기본이라 노선 코어는 C(선명), 라이트 코어는 A/C 라이트를 정합해 사용한다.
  5. 신규 노선: Line D(Discovery, 발견), Line P(Palate/Taste, 취향)을 환승 홀 노선도에 지선으로 추가(둘 다 미개통/예정 표기, 대상 버전 v0.8.0/v0.9.0).
  6. 플랩 아래→위 방향은 별도 티켓(TKT-070). 본 문서는 플랩 연출을 스펙하지 않는다(스플래시 크롬/토큰만 다룸).

- 페이지 경계(절대 위반 금지, `docs/feature-definition.md` 기준):
  - 메인 허브(환승 홀)는 "요약 + 선택 + 이동"만. Work Manager 5레인 전체 보드, Elevator dispatch 그리드, 실질 명령 버튼을 홀에 직접 펼치지 않는다.
  - 실제 조작은 각 승강장(기능 페이지)에서만.
  - 블로그 공개 목록/상세에는 `published`만 노출. `draft`/`archived`는 Writing Studio 안에서만.

---

## 1. 색 토큰 확정

토큰은 `frontend/src/styles.css` 최상단 `:root`(다크 기본) 및 `.app-shell[data-theme='light']`(라이트)에 정의한다. 현재 파일은 `:root { color-scheme: dark; ... }`에 다크를 두고 `.app-shell[data-theme='light']`로 라이트를 덮는 구조다. 이 구조를 유지하되 아래 값으로 전면 교체한다.

명명 규칙:
- 노선 색은 코어 토큰 `--line-{x}`(채우기/띠/roundel 배경/틱)와 텍스트 틴트 `--line-{x}-text`(다크 배경 위 노선명 텍스트, WCAG 대비 확보용)로 짝을 이룬다. `{x}` = `b/e/t/w/r/d/p`.
- 시안 A/C의 `--lb-c`(코어)/`--lb-t`(틴트) 짝을 이 규칙으로 흡수한다. (A/C의 `-c` → `--line-x`, `-t` → `--line-x-text`)

### 1.1 구조/표면/텍스트/액센트/상태 토큰

| 토큰 | 다크(기본) | 라이트 | 용도 |
|---|---|---|---|
| `--bg` | `#0D131C` | `#EDF1F6` | 앱 배경(역 내부 톤) |
| `--bg-2` | `#111721` | `#E4EAF2` | 보조 배경/오목면 |
| `--panel` | `#1A212D` | `#FFFFFF` | 카드/패널 표면 |
| `--panel-2` | `#212A38` | `#F5F8FC` | 패널 내부 2단/리스트 표면 |
| `--panel-soft` | `rgba(255,255,255,0.045)` | `rgba(16,24,38,0.045)` | 태그/코드 인라인 배경 |
| `--line` | `rgba(255,255,255,0.09)` | `rgba(16,24,38,0.12)` | 기본 hairline 보더 |
| `--line-strong` | `rgba(255,255,255,0.16)` | `rgba(16,24,38,0.22)` | 강한 보더/구분선 |
| `--text` | `#F3F6FB` | `#16202E` | 1차 텍스트 |
| `--text-2` | `#AEB8C8` | `#45536A` | 2차 텍스트 |
| `--muted` | `#7C8AA0` | `#6B7A92` | 캡션/라벨/보조 |
| `--safety` | `#F3C544` | `#E9B92B` | Safety Yellow — 현재 위치/포커스/섹션 레일 전용 |
| `--safety-ink` | `#201A05` | `#201A05` | Safety Yellow 위 텍스트 |
| `--exit` | `#17A757` | `#0E8A46` | Exit Green — 진입(way-out) CTA 전용 |
| `--exit-hover` | `#129149` | `#0B7038` | Exit CTA hover |
| `--danger` | `#E06A7A` | `#C24557` | 오류/파괴 경고(삭제 아님) |
| `--shadow` | `0 18px 44px rgba(2,6,12,0.42)` | `0 16px 40px rgba(53,77,114,0.14)` | 카드 그림자 |
| `--head-bg` | `rgba(13,19,28,0.86)` | `rgba(237,241,246,0.88)` | sticky 헤더/모바일 상태바 배경(blur) |
| `--map-node` | `#0D131C` | `#FFFFFF` | 노선도 역 원 내부(=배경톤) |
| `--code-bg` | `#10161F` | `#101724` | 코드블록 배경(라이트에서도 어두운 판 유지) |
| `--quote-bg` | `rgba(243,197,68,0.06)` | `rgba(233,185,43,0.10)` | 인용문 배경 |

액센트 절제 규칙(A 시연): 노랑(`--safety`)은 현재 위치·포커스·섹션 레일에만, 초록(`--exit`)은 진입 CTA에만. 한 화면에서 포인트 색 2개 이상 경쟁 금지.

### 1.2 노선 색 토큰 (E/W/R/B/T + 신규 D/P)

다크 코어는 시안 C(야간 노선도, 선명), 라이트 코어는 A/C 라이트 정합값. 텍스트 틴트는 다크 배경에서 노선명/링크 텍스트에 사용.

| 노선 | 코어 토큰 | 다크 코어 | 다크 텍스트 `--line-{x}-text` | 라이트 코어 | 라이트 텍스트 |
|---|---|---|---|---|---|
| B · Blog(본선) | `--line-b` | `#E14D78` | `#F07CA0` | `#C0264F` | `#A81F43` |
| E · Elevator | `--line-e` | `#3FC1FF` | `#7BD4FF` | `#0090C8` | `#006E99` |
| T · Taxi | `--line-t` | `#F0B33C` | `#F5C86E` | `#C8830E` | `#96650E` |
| W · Work Manager | `--line-w` | `#35C275` | `#6BD59B` | `#00A84D` | `#00793A` |
| R · Runtime | `--line-r` | `#5B8DEF` | `#8FB0F5` | `#0052A4` | `#0052A4` |
| D · Discovery(신규) | `--line-d` | `#9B6BF2` | `#BCA1F7` | `#6E3FC0` | `#5A2FA8` |
| P · Palate/Taste(신규) | `--line-p` | `#22C3A7` | `#5AD9C2` | `#0E9C86` | `#0B7D6C` |

색 선택 근거: 기존 5색이 rose(B)/cyan(E)/amber(T)/green(W)/blue(R)로 색상환을 점유하므로 신규는 미점유 구간에 배치했다. D=보라(발견/호기심, 5호선 계열), P=틸/블루그린(취향·테이스팅 감각, E cyan과 문자 배지+라벨로 구분). 접근성상 색만으로 구분하지 않고 항상 `색+문자+라벨`을 함께 쓴다.

### 1.3 토큰 리매핑 주의 (기존 → 신규)

현재 `styles.css`의 노선 토큰과 충돌·이동이 있다. 워커는 아래 매핑을 의식적으로 반영한다.

- 현재 `--line-p: #c7a23a`(금색, "premium/9호선"이며 **Sim Hub·Taxi 배너가 차용 중**) → 신규에서 `--line-p`는 **틸(Palate)**로 의미 변경된다. 금색 역할은 `--line-t`(Taxi)로 이관.
- 현재 `--line-v: #8d5cff`(보라, 미사용에 가까움) → `--line-d`(Discovery)로 통합/개명(값은 위 표대로 재튜닝).
- `--line-b: #7e294f`(어두운 마룬) → `--line-b: #E14D78`(선명 rose)로 교체. 블로그가 본선이므로 존재감 강화.
- `--line-e/-w/-r`은 개념 유지, 값만 위 표로 재튜닝.
- 클래스 사용부 변경:
  - Taxi 페이지 배너 `platform-banner line-p` → `line-t` (App.vue 약 L2768, L3424).
  - Sim Hub 배너 `platform-banner line-p` → 단일 노선색 대신 **중립 처리**(아래 4장 simhub 참고). Sim Hub는 노선이 아니라 하위 환승면이므로 전용 노선색을 주지 않는다.
  - 환승 홀 하단 미니맵 station-badge의 `line-p`(9, Sim Hub), `line-b`(B, Blog) 등은 S2에서 JunctionMap으로 대체되며 제거.
- `styles.css`에 노선 modifier 클래스가 코어/틴트를 함께 물도록 확장한다. 예:
  ```css
  .line-b  { --accent: var(--line-b);  --accent-text: var(--line-b-text); }
  .line-e  { --accent: var(--line-e);  --accent-text: var(--line-e-text); }
  .line-t  { --accent: var(--line-t);  --accent-text: var(--line-t-text); }
  .line-w  { --accent: var(--line-w);  --accent-text: var(--line-w-text); }
  .line-r  { --accent: var(--line-r);  --accent-text: var(--line-r-text); }
  .line-d  { --accent: var(--line-d);  --accent-text: var(--line-d-text); }
  .line-p  { --accent: var(--line-p);  --accent-text: var(--line-p-text); }
  ```
  이후 배너/카드/헤더는 하드코딩 대신 `var(--accent)`, `var(--accent-text)`를 참조하게 리팩터한다(로컬 스코프 오염 없음).

### 1.4 상태 색 토큰 (블로그 배지 — 설계 §6: slate / green / bronze)

`design/blog-district-ui-system-2026-06-26.md` §6 권장: draft=회청/슬레이트, published=짙은 초록/블루그린, archived=갈회/브론즈. archived를 위험/삭제 색과 동일하게 두지 않고, draft·archived를 한 회색으로 퉁치지 않는다.

| 상태 | 토큰(코어) | 다크 | 라이트 | 텍스트 틴트(다크/라이트) |
|---|---|---|---|---|
| draft(슬레이트) | `--status-draft` | `#7C8AA0` | `#6B7A92` | 텍스트=`--text-2`, 보더=`--line-strong`, 배경=`--panel-soft` |
| published(그린) | `--status-pub` | `#35C275` | `#00A84D` | 텍스트=`--line-w-text`, 보더/배경=`color-mix(--status-pub 45%/12%, transparent)` |
| archived(브론즈) | `--status-arch` | `#C69A54` | `#9A6E2E` | 텍스트=(다크)`#DCBB7E`/(라이트)`#7C5A24`, 보더/배경=`color-mix(--status-arch 45%/12%, transparent)` |

구현은 시안 A의 `.badge`/`.badge-pub`/`.badge-draft`/`.badge-arch` 규칙을 그대로 이식(아래 3.4).

---

## 2. 타이포 스케일

폰트는 **시스템/설치형만**(외부 CDN 금지). 설치된 경우에만 Pretendard를 우선.

```css
--font-sans: "Pretendard Variable", Pretendard, "Noto Sans KR", "Malgun Gothic",
             "Apple SD Gothic Neo", "Segoe UI", system-ui, sans-serif;
--font-mono: "Cascadia Code", Consolas, "SF Mono", "Roboto Mono", monospace;
```

`body`: `line-height: 1.6; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;`

숫자(시각/티켓번호/카운트/좌표/적재)는 반드시 tabular figures:
```css
.num { font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }
```
`.num`을 시계, 통계 타일 `strong`, 아카이브 날짜 `time`, car 적재 `x/20`, 층수 등에 적용.

크기/굵기 스케일(‑em/rem, clamp로 반응):

| 역할 | 크기 | 굵기 | letter-spacing | 비고 |
|---|---|---|---|---|
| Display(스플래시 타이틀) | `clamp(1.7rem, 4vw, 2.6rem)` | 800–900 | `-0.04em` | `h1` |
| Page H2(섹션 표제) | `clamp(1.5rem, 3vw, 2.1rem)` | 800 | `-0.03em` | `.sec-head h2` |
| 역명 H3(역명판) | `clamp(1.3rem, 2.6vw, 1.7rem)` | 800 | `-0.02em` | StationHeader 중앙 |
| Post H1(글 제목) | `clamp(1.6rem, 3.4vw, 2.15rem)` | 800 | `-0.035em` | line-height 1.3 |
| H4/카드 제목 | `1.0–1.18rem` | 700 | `-0.02em` | line-card/archive-item |
| Body | `1.0rem` (글 상세 본문 `1rem` / 리스트 `0.9rem`) | 400 | 0 | line-height 본문 1.85 |
| Body-strong 수치 | `1.35–1.9rem` | 800 | `-0.02em` | 통계 타일 `.num` |
| Caption/label | `0.68–0.78rem` | 700 | `0.12–0.24em` | 대문자 eyebrow/역 코드 |
| Eyebrow | `0.72rem` | 700 | `0.18em` | `text-transform: uppercase; color: var(--muted)` |

eyebrow/코드/영문 보조표기는 대문자 + 넓은 자간, 한글 본문은 대비 우선. 영어는 기능명·시스템명·코드명에만.

권장: 위 값을 CSS 변수로도 노출해 재사용(`--fs-display`, `--fs-h2`, `--fs-body`, `--fs-caption` 등). 필수는 아니나 컴포넌트 분해(S5) 시 유용.

---

## 3. 핵심 컴포넌트 스펙

각 컴포넌트는 (구조 = 요소/클래스) + (핵심 스타일)로 기술한다. 클래스명은 시안 A/C의 것을 그대로 채택해 CSS 이식 비용을 낮춘다.

### 3.1 StationHeader — 승강장 역명판 헤더 (전 기능 페이지 공통)

목적: 모든 기능 페이지 상단을, 실제 역명판 문법(노선색 띠 + 역 코드 원 + 역명 + 인접역 화살표 + 상태 배지 + 환승 홀 복귀)으로 통일. 현재의 `platform-banner line-X`를 대체.

구조(시안 A `.station-sign` 이식):
```
.station-sign.{lineClass}          // 예: .station-sign.line-e
  .band                            // 상단 노선색 띠 (height:8px; background: var(--accent))
  .station-sign-in
    .station-prev  "← 환승 홀" 또는 "← 이전 승강장"
    .station-center
      .station-code  "E01"         // 원형 배지, 노선색 보더
      div > h3 역명 / small 영문 STATION
    .station-next  "다음 승강장 →"
  .station-sub                     // 보조 줄: 상태 chip + 도메인 요약 + 복귀 CTA
    .chip .dot + 상태 텍스트
    span 요약(예: "23층 · car 4대 · 정원 20명")
    .spacer
    a.btn.btn-ghost "환승 홀로 나가기"
```
핵심 스타일:
- `.band { height: 8px; background: var(--accent); }` (노선색 = `--accent`, 1.3의 modifier로 주입)
- `.station-code { width:40px; height:40px; border-radius:50%; border:3px solid var(--accent); color: var(--accent-text); font-weight:900; }`
- `.station-center { flex:1; text-align:center; display:flex; gap:12px; justify-content:center; }`
- `.station-sub { border-top:1px solid var(--line); background: var(--panel-2); font-size:0.8rem; color: var(--text-2); }`
- 래퍼: `border-radius: var(--radius-lg); overflow:hidden; border:1px solid var(--line); background: var(--panel); box-shadow: var(--shadow);`

Props(컴포넌트화 시): `lineClass`, `stationCode`, `title`, `titleEn`, `prevLabel`, `nextLabel`, `status`, `statusTone`('live'|'warn'|'ok'), `summary`. 슬롯: `#actions`(우측 CTA).

접근성: 상태는 색 + 텍스트(chip) 동시. 복귀 CTA는 항상 노출.

### 3.2 LineCard — 노선 카드 (Sim Hub 및 필요 시 홀 보조)

목적: 노선 번호/문자 + 기능명 + 한 줄 설명 + 현재 상태 + 진입 버튼. 환승 홀 본체는 S2에서 노선도로 바뀌므로, LineCard의 주 사용처는 **Sim Hub**(E/T 카드)와 모바일 목록 폴백.

구조(시안 A `.line-card` 이식):
```
.line-card.{lineClass}
  .line-card-top
    .roundel.{le|lt|...}  문자      // 원형 노선 배지
    .names > strong 기능명 / small "Line E · Elevator"
    (우측) .status-chip 상태
  p 한 줄 설명
  .foot
    .chip .dot 상태요약
    a.enter "승강장 입장 →"          // 또는 .line-cta 버튼
```
핵심 스타일:
- `.line-card { border:1px solid var(--line); border-radius: var(--radius); background: var(--panel); padding:18px; display:flex; flex-direction:column; gap:10px; transition: transform .18s, border-color .18s, box-shadow .18s; }`
- hover: `transform: translateY(-3px); border-color: var(--line-strong); box-shadow: var(--shadow);`
- `.roundel { width:34px; height:34px; border-radius:50%; background: var(--accent); color:#fff; font-weight:900; display:grid; place-items:center; }` (`.sm` = 24px)
- 진입 링크 hover 시 `color: var(--safety)`.

주의: 환승 홀에는 LineCard 그리드를 다시 깔지 않는다(노선도가 대체). feature-definition의 "요약+선택+이동" 유지.

### 3.3 JunctionMap — 시안 C 노선도 환승 홀 (환승 홀 전용, 핵심)

목적: 환승 홀 첫 화면을 문자 그대로의 노선도로. 블로그 = 굵은 본선(아카이브 → 글 상세 → Writing Studio 종점), 실험/운영/시뮬 = 가는 지선. 노란 링은 오직 현재 위치(환승 홀)에만.

구현 방식 결정: **인라인 SVG**(CSS 아님). 시안 C의 `<svg class="route-map">`를 이식하되 D/P 지선 2개를 추가. 좌표 갱신 비용 우려(mockup 열린질문 5)를 고려해, 최종적으로는 **데이터 배열 기반 렌더링**을 권장(아래 "데이터 소스"). 다만 워커가 추측 없이 착수할 수 있도록 아래 정적 좌표 baseline을 그대로 제공한다.

좌표계: `viewBox="0 0 1000 460"`, 현재 위치(환승 홀) 노드 = `(300, 230)`.

노선 경로(`<path class="rl rl-{x}">`, stroke = 해당 노선 코어색; 본선 B만 `stroke-width:11`, 지선 `stroke-width:6`):

| 노선 | path d | 종점 chip 좌표 | 라벨 정렬 |
|---|---|---|---|
| B 본선 | `M300 230 H852` | 종점 스튜디오 `(772,230)` 이중원 + 캡 `M840 214 V246` | 정차역 라벨 하단 중앙 |
| W(운영) | `M300 230 L180 140 H96` | `(96,140)` | 좌·상, 라벨 위/중앙 |
| R(운영) | `M300 230 L180 320 H96` | `(96,320)` | 좌·하, 라벨 아래/중앙 |
| D(발견·신규) | `M300 230 L440 96 H600` | `(600,96)` | 우·상 외곽, 라벨 우측 |
| E(엘베) | `M300 230 L440 158 H600` | `(600,158)` | 우·상 내측, 라벨 우측 |
| T(택시) | `M300 230 L440 302 H600` | `(600,302)` | 우·하 내측, 라벨 우측 |
| P(취향·신규) | `M300 230 L440 364 H600` | `(600,364)` | 우·하 외곽, 라벨 우측 |

본선 정차역(`<circle class="stn" r="7.5">` + `.name.name-c`/`.sub.sub-c` 하단 라벨):
- 공개 아카이브 `(472,230)` → name y≈268, sub y≈286
- 글 상세 `(620,230)`
- Writing Studio 종점 `(772,230)`: `.term`(이중원, 바깥 r=11 + 안쪽 `fill:var(--line-b)` r=4)

지선 종점 노드(`<circle class="lchip" r="13" fill="var(--line-{x})">` + `.lchip-txt` 흰 문자):
- 각 지선 끝 좌표에 문자 배지 D/E/T/P/W/R. 옆에 `.name`(기능명) + `.sub`(상태/요약, 신규 D·P는 "예정 · v0.8.0"/"예정 · v0.9.0").

현재 위치(환승 홀) 마커:
```
<circle class="pulse" cx="300" cy="230" r="17"/>   // 노란 확산 링(애니메이션)
<circle class="xfer"  cx="300" cy="230" r="12"/>   // 이중 환승역 원(stroke:var(--text))
<circle fill="var(--text)" cx="300" cy="230" r="3.5"/>
<text class="name name-c" x="300" y="178" ...>환승 홀</text>
<text class="sub  sub-c" x="300" y="196">Main Junction</text>
```

핵심 스타일(시안 C `route-map` 블록 이식, 토큰만 A로 치환):
- `.map-panel { border:1px solid var(--line); border-radius: var(--radius-lg); background: var(--panel); box-shadow: var(--shadow); overflow-x:auto; padding: clamp(10px,2vw,22px); }`
- `.route-map { width:100%; min-width: 820px; height:auto; }`
- `.rl { fill:none; stroke-linecap:round; stroke-linejoin:round; stroke-width:6; } .rl-b { stroke-width:11; }`
- `.stn/.term { fill: var(--map-node); stroke: var(--line-b); } .xfer { stroke: var(--text); } .lchip { stroke: var(--map-node); stroke-width:2.5; }`
- `.pulse { fill:none; stroke: var(--safety); animation: mapPulse 2.6s ease-out infinite; transform-box:fill-box; transform-origin:center; }` + keyframes `scale(0.55)→scale(1.55) opacity 1→0`.
- `.name { fill: var(--text); font-weight:700; font-size:15px; } .sub { fill: var(--muted); font-size:11px; } .linetag { fill: var(--muted); font-size:11px; letter-spacing:0.14em; }`
- `prefers-reduced-motion`: `.pulse { animation:none; opacity:0.5; }`.

노선도 + 동일 데이터의 행 목록(`.route-rows`) 병기(시안 C 그대로). 행 목록이 접근성·모바일 폴백이자 실제 이동 링크다:
```
.route-rows (border-top:2px solid var(--text))
  a.route-row.primary  style="--tick: var(--line-b)"   // 블로그 본선(가장 큼)
    .tick / .rr-main (strong=roundel+명, small=요약, .rr-stops=정차역) / .rr-status / .rr-go →
  a.route-row  (E/T/W/R)  각각 --tick 노선색
  a.route-row.upcoming  (D/P)  상태 "예정", 비활성 톤(muted), 클릭 시 정의서/로드맵 안내 또는 disabled
```
- `.route-row { display:grid; grid-template-columns:6px 1fr auto auto; gap:18px; align-items:center; border-bottom:1px solid var(--line); }` hover `background: var(--soft)`(= `--panel-soft`).
- `.tick { background: var(--tick); }` (노선색 세로 막대)
- D/P는 `.upcoming`으로 `opacity:0.6`, status="예정", `--tick` 노선색은 유지(발견 보라/취향 틸 식별).

데이터 소스(권장): `frontend/src/data/lines.js`에 단일 배열로 정의하고 JunctionMap/RouteRow/LineCard가 공유한다:
```
{ code:'B', letter:'B', name:'Blog District', nameKo:'블로그 본선', color:'--line-b',
  page:'bloghub', status:'운행 중', kind:'trunk',
  node:{x:472,y:230}, terminus:true, stops:[...], upcoming:false }
```
지선은 `kind:'branch'`, `node`=chip 좌표, `path`=위 표 d값(또는 각도/길이로 계산). D/P는 `upcoming:true, targetVersion:'v0.8.0'|'v0.9.0'`.

경계 준수: 노선도는 "이동"만. 클릭 시 각 페이지로 라우팅(홀에서 조작 없음).

### 3.4 StatusBadge — 블로그 상태 배지 (draft/published/archived)

구조(시안 A `.badge` 이식):
```
span.badge.badge-pub    "공개"    // published
span.badge.badge-draft  "초안"    // draft
span.badge.badge-arch   "보관"    // archived
```
핵심 스타일:
```css
.badge { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:6px;
         font-size:0.72rem; font-weight:800; letter-spacing:0.04em; border:1px solid transparent; }
.badge-pub   { color: var(--line-w-text); border-color: color-mix(in srgb, var(--status-pub) 45%, transparent);
               background: color-mix(in srgb, var(--status-pub) 12%, transparent); }
.badge-draft { color: var(--text-2); border-color: var(--line-strong); background: var(--panel-soft); }
.badge-arch  { color: /*다크*/ #DCBB7E; border-color: color-mix(in srgb, var(--status-arch) 45%, transparent);
               background: color-mix(in srgb, var(--status-arch) 12%, transparent); }
```
규칙: 공개 아카이브·글 상세에는 `badge-pub`만 등장. `badge-draft`/`badge-arch`는 Writing Studio 내부에서만. 배지 문구는 짧게(공개/초안/보관) — 본문 리듬 보호(§6 금지).

현재 코드 연결: App.vue는 `BLOG_STATUS_LABELS[post.status]`를 `.status-chip`으로 렌더 중(L3643/3704/3727). 이를 `StatusBadge`(status prop)로 교체하고 라벨 매핑 published→공개/draft→초안/archived→보관 유지.

### 3.5 Wayfinding / ArrivalBar — 현재 위치·환승 안내·도착 정보 바

(A) 환승 홀 상단 현재 위치 줄(시안 A `.wayfinding` / 시안 C `.here-line`). 홀에서만 사용:
```
.wayfinding (border-left:4px solid var(--safety); border-radius:12px; background: var(--panel);)
  .here "현재 위치 · 환승 홀"     // ::before 노란 점 + 링(box-shadow)
  .sep |
  .transfer 환승 가능 + roundel(sm) B E T W R (D P는 예정 회색)
  .sep |
  .chip .dot "게이트 정상"
```
- `.here::before { width:9px; height:9px; border-radius:50%; background: var(--safety); box-shadow: 0 0 0 4px color-mix(in srgb, var(--safety) 22%, transparent); }`

(B) 도착 정보 바(시안 A 스플래시 `.arrival-grid` 및 seoul 시스템 §도착 정보 바). 실시간 상태 요약(장식 금지):
```
.arrival-grid > article > span(라벨) + strong(값)   // 예: runtime=ollama status, main page=10초 후 전환
```
`--muted` 라벨 + `--text` 값, `.num` 적용. 상태 문장 톤은 feed/ticket/runtime 공통.

### 3.6 공통 프리미티브 (섹션 골격/버튼/칩/통계/roundel)

- 섹션 헤더(시안 A): `.sec-head { .sec-rail(노란 44x4 막대) + .eyebrow(대문자) + h2 + .sec-note }`. `.sec-rail { background: var(--safety); }` — 노랑은 여기(섹션 레일)까지 허용.
- 버튼:
  - `.btn` 기본 + `.btn-exit`(진입 CTA, `background: var(--exit); color:#F2FFF7;` hover `--exit-hover`) — Exit Green 전용.
  - `.btn-ghost`(보조, `border:1px solid var(--line-strong)`, hover `border-color: var(--safety)`).
  - 현재 코드의 `.primary-button`/`.ghost-button`은 각각 `.btn-exit`/`.btn-ghost`로 스타일 정합(클래스는 유지 가능, 규칙만 통일).
- 칩: `.chip { border:1px solid var(--line); border-radius:999px; .dot(초록) }`, 경고형 `.chip.warn .dot { background: var(--safety); }`.
- roundel(노선 배지): `.roundel`(34px)/`.roundel.sm`(24px), 배경 = 노선 코어색, 흰 문자. 노선도에서는 `.lchip`(SVG) 사용.
- 통계 타일(시안 A `.stat-tile` / C `.stat-strip`): `span(대문자 라벨) + strong.num(큰 수치) + small(단위)`. `strong { font-size:1.5–1.9rem; font-variant-numeric: tabular-nums; }`.
- 로드 트랙(car 적재): `.load-track > i(width:%)` — i 배경 = 노선색.
- radius 토큰: `--radius:14px; --radius-lg:20px;`(A값). `--page-w`는 앱 셸이 이미 풀폭이므로 컨테이너 max-width만 정합.

---

## 4. 페이지별 적용 지침

공통: 모든 기능 페이지는 상단 `platform-banner line-X` → **StationHeader(3.1)**로 교체하고, 표면/보더/텍스트/그림자를 1장 토큰으로 통일한다. 색은 해당 노선 1색만(멀티 액센트 금지). 복귀 CTA(환승 홀로)는 항상 노출.

### junction (환승 홀) — 시안 C 노선도로 전면 교체
- 현재(App.vue L3007~3151): `hero-panel`(요약문) + `line-grid`(line-card 4~5장) + `slice-grid`(오케스트레이터 힌트) + `rail-map-panel`(rail-strip 미니맵) + `mobile-panel`.
- 변경:
  1. 상단에 Wayfinding(3.5A) 한 줄.
  2. 본체를 **JunctionMap(3.3)** = 노선도 SVG + `.route-rows` 목록으로 교체. `line-grid`/`rail-strip` 제거.
  3. 블로그 본선 요약(공개/초안/최근 발행)은 route-row.primary의 `small`/`rr-stops`로 축약 노출(대형 대시보드 금지).
  4. `slice-grid`(오케스트레이터 티켓 힌트)는 사용자-facing 홀에서 제거하거나 `/test`로 이동(feature-definition: 홀은 요약+선택+이동만).
  5. 하단 `.junction-note`로 "홀에서는 이동만, 조작은 각 승강장에서" 고정 문구.
  6. 신규 D/P 지선을 노선도·목록에 `upcoming`으로 추가(클릭 시 라우팅 대신 "예정" 안내).
- 금지: Work 5레인/Elevator dispatch/명령 버튼 직접 노출.

### simhub (Sim Hub)
- 현재(L3153): 배너 `line-p`(금색) + 시뮬레이터 카드.
- 변경: 배너를 StationHeader가 아닌 **중립 하위 허브 헤더**로(노선색 없음: `--panel` 배경 + 좌측 레일은 `--line-strong`). Sim Hub는 노선이 아님. E(sky)·T(gold) 두 색은 각 LineCard에서만 등장.
- 본체: **LineCard(3.2)** 2장 = Elevator(E), Taxi(T). 필요 시 Blog 보조 진입 카드. 각 카드 상태 요약 + 진입 CTA.
- 금지: 제품 전체 재요약, 택시/엘베 조작 패널 직접 노출.

### elevator (Elevator Station) — Line E(sky)
- 현재(L3224): 배너 `line-e` + 조작/보드.
- 변경: 상단 StationHeader(code `E01`, band=`--line-e`, prev "← 환승 홀", 상태 "실시간 운행", summary "23층 · car 4대 · 정원 20명").
- 본체 순서(seoul §Elevator + A 스켈레톤): (1) `.stat-row`/`.stat-strip` 큰 수치 요약(대기/탑승/운행 car/평균 대기, `.num`) → (2) 운행 현황 패널(`.car-row`: `.car-id`(E1..) + `.car-mid`(방향·다음정차·`.load-track`) + `.car-pax .num` `9/20`) → (3) 수요 조작 패널(`.preset-row` 한산/보통/혼잡 `.chip-btn`, `.slider-block` 수요강도/car수, `.queue-btns` 상행/하행 1명 추가·리셋). 슬라이더 트랙/thumb 액센트 = `--line-e` 또는 `--safety`(조작 강조).
- 도메인 유지(feature-definition): 사람 단위 모델, 상·하행 대칭, 연속 위치·보간(워프 금지). UI만 스킨.

### taxi (Taxi District Lab) — Line T(gold, 리매핑)
- 현재(L3423): 배너 `line-p` → **`line-t`**.
- 변경: StationHeader(code `T01`, band=`--line-t`). 본체 유지(9구역 `district-grid`/`district-card`, active/completed request, 차량 상태, reward/penalty/net). 카드 액센트 `.district-card`는 노선 T 1색 + 수요 강도만 톤 차등. 통계 `.num` 적용.

### work (Work Manager) — Line W(green)
- 현재(L3876): 배너 `line-w` 유지(개념 동일).
- 변경: StationHeader(code `W01`, band=`--line-w`, 상태 "조회 공개 / gate locked|unlocked"). 5레인 보드·버전 헤더·worker ownership·command gate·activity feed는 기능 유지, 표면/배지/버튼만 토큰 통일.
- 시각 규칙(seoul §Work): preview=점선+약한 노랑, locked=주황/황색 경고(빨강 아님, `--warning`/`--safety`), live=선명한 초록/파랑. 드래그 가능 구간(`Backlog→Ready`)과 시스템 소유 구간(`Ready→Started`)을 시각적으로 명확히 구분(끌 수 있는 것 vs 레일).
- 경계: 이 전체 보드는 Work 페이지에서만. 홀로 역류 금지.

### bloghub (Blog District 허브) — Line B(rose)
- 현재(L3612): 배너 `line-b` + 공개 읽기 레일 + Studio 흐름.
- 변경: StationHeader(code `B01`, band=`--line-b`). 또는 시안 A 환승 홀의 `.blog-primary`(본선 대형 카드) 문법 채택: 좌측 본선 소개+통계(공개 n편/초안 n편/최근 발행)+CTA(아카이브 들어가기=`btn-exit`, Writing Studio=`btn-ghost`), 우측 `.blog-primary-list`(최근 발행 3건 + 전체 보기). 상태 배지는 StatusBadge, 공개만.

### blogArchive (Public Archive) — Line B
- 현재(L3691): `archive-list` + `archive-card`.
- 변경: 시안 A `.archive-item`(제목→요약→발행일→태그→상태 배지 순서 고정) 또는 시안 C `.archive-list`(좌측 날짜 시각표 칸 + 우측 제목/요약/태그) 채택. 문서형 폭/타이포 우선(피드 아님). `.tag`, `time.num`, `StatusBadge(공개)`. 하단 `.badge-legend`로 상태 체계 안내(공개만 노출, 초안·보관은 Studio 관리 명시).

### blogPost (Post Detail) — Line B
- 현재(L3718): `reading-shell post-shell` + `post-meta-line` + `post-header` + `markdown-body` + `post-footer-nav`.
- 변경: 시안 A `.post-detail`(상단 5px `--line-b` 보더 + max-width 720px 문서폭). 순서: `.post-meta-line`(발행/수정/읽기, `.num`) → `h1` → `.post-lead` → `.post-tags`+StatusBadge → `.post-body`(markdown). 본문 타이포: `h2`(상단 hairline+2.2em), 코드블록 `--code-bg`+좌측 `--safety` 4px, 인용 좌측 `--line-b`+`--quote-bg`, `li::marker { color: var(--safety); }`. 하단 `.post-foot-nav`(이전/아카이브로/다음).

### writingStudio (Writing Studio) — Line B
- 현재(L3749~): 배너 `line-b` + 편집/미리보기.
- 변경: StationHeader(code `B02` 또는 종점 표기). draft/preview/published/archived 상태 흐름을 StatusBadge로 표기(여기서만 draft/archived 노출 허용). 저장은 자주·비위협적으로, `published` 전환은 가장 강한 액션(별도 강조), `archived`는 삭제와 혼동 금지(브론즈, danger 금지). 편집기/미리보기 2분할은 기능 유지, 스킨만 통일.

### runtime (Runtime Board) — Line R(blue)
- 현재(L2943 계열 prototype 및 live): 배너 `line-r`.
- 변경: StationHeader(code `R01`, band=`--line-r`). 본체: 노드 역할(`ion2`/`rtx5070`/`gateway`) 카드 + degraded 정책 + release path 요약 + Ollama 상태를 `.stat`/도착 정보 바(3.5B)로 요약. 세부 인프라 매뉴얼 전량 쏟기 금지.

### splash (참고만 — 본 스펙 범위 밖)
- 스플래시 크롬(타이틀/시계/ticker/actions)만 토큰/타이포 정합. 플랩 보드 구조·아래→위 방향은 **TKT-070**에서 별도 처리. 다크 기본은 TKT-069로 확정. 여기서 플랩 CSS/JS를 건드리지 않는다.

---

## 5. App.vue 컴포넌트 분해 제안

현재 `frontend/src/App.vue`는 4,352줄 단일 SFC(스크립트 ~2,500 + 템플릿 ~1,840)다. 한 번에 전면 재작성하지 말고, 아래 우선순위로 점진 분해한다. `frontend/src/components/`(공용), `frontend/src/components/pages/`(페이지 뷰), `frontend/src/composables/`, `frontend/src/data/`를 신설.

우선순위 P1 — 재사용 프리미티브(슬라이스 S1~S4에서 자연 도입):
1. `StationHeader.vue` — 3.1. 전 기능 페이지. 최우선.
2. `StatusBadge.vue` — 3.4. bloghub/archive/post/studio.
3. `LineCard.vue` — 3.2. simhub/모바일 폴백.
4. `Roundel.vue` — 노선 문자 배지(34/24px).
5. `JunctionMap.vue` + `RouteRow.vue` — 3.3. 환승 홀. `data/lines.js` 구독.
6. `Wayfinding.vue`, `ArrivalBar.vue` — 3.5.

우선순위 P2 — 페이지 뷰 셸(슬라이스 S5에서 monolith에서 분리):
7. `pages/JunctionView.vue`
8. `pages/SimHubView.vue`
9. `pages/ElevatorStationView.vue`
10. `pages/TaxiLabView.vue`
11. `pages/WorkManagerView.vue` (내부 추가 분해 여지: `WorkLaneBoard`, `TicketDetailPanel`, `CommandGate`, `ActivityFeed`)
12. `pages/BlogHubView.vue` / `pages/BlogArchiveView.vue` / `pages/BlogPostView.vue` / `pages/WritingStudioView.vue`
13. `pages/RuntimeBoardView.vue`
14. `SplashBoard.vue` — 스플래시 + 플랩 엔진 격리(플랩 로직은 TKT-070 소관, 컨테이너만 먼저 분리 가능).

우선순위 P3 — 상태/로직 컴포저블 & 데이터:
15. `data/lines.js` — 노선 단일 소스(코드/명/색토큰/페이지/상태/좌표/upcoming). JunctionMap·RouteRow·LineCard·Wayfinding 공유. **D/P 추가는 여기 한 곳만 수정** → 좌표 갱신 비용 완화(mockup 열린질문 5 대응).
16. `composables/useTheme.js` — 테마 토글/localStorage(`THEME_STORAGE_KEY`).
17. `composables/useBlogStore.js` — 블로그 posts/active slug/studio view(기존 `BLOG_*_STORAGE_KEY`).
18. `composables/useFlapBoard.js` — 플랩 엔진(TKT-070과 조율, 지금은 자리만).
19. `composables/useClock.js`, `composables/useRuntimeState.js`.
20. `App.vue`는 라우팅(`page` 스위치) + 전역 셸(테마/헤더/트랜지션)만 남긴다.

분해 원칙: 각 슬라이스에서 "그 슬라이스가 필요로 하는 컴포넌트만" 추출한다. P1의 StationHeader/StatusBadge/JunctionMap은 각각 S1/S3/S2에서 도입되므로, S5(정리)는 남은 페이지 뷰 셸 분리와 `data/lines.js` 확립에 집중한다.

---

## 6. 구현 슬라이스 제안 (티켓 크기)

각 슬라이스는 독립 PR/티켓 하나 크기. 순서대로 진행하되 S1이 토대(토큰/타이포/StationHeader)라 반드시 선행.

- **S1 — 디자인 토큰 + 타이포 + StationHeader(앱 전역):** `styles.css` `:root`/`[data-theme='light']` 토큰을 §1 표로 전면 교체(노선 리매핑 §1.3 포함), §2 타이포 스케일/`.num` 적용, 노선 modifier 클래스에 코어/틴트 주입. `StationHeader.vue` 구현 후 전 기능 페이지의 `platform-banner line-X`를 대체. taxi `line-p`→`line-t`, simhub 중립화. 검수: 다크/라이트 전 페이지 대비·위계.
- **S2 — 환승 홀 노선도(시안 C):** `data/lines.js` + `JunctionMap.vue` + `RouteRow.vue` 구현, junction 페이지의 line-grid/rail-strip을 노선도+행목록으로 교체, Wayfinding 한 줄 추가, D/P 지선 `upcoming` 추가, slice-grid 제거/이관. 경계 준수(요약+이동만). 검수: SVG 스크롤/모바일 목록 폴백/`prefers-reduced-motion`.
- **S3 — 블로그 페이지 A 처리 + 상태 배지:** `StatusBadge.vue`(§3.4, slate/green/bronze), bloghub/archive/post를 시안 A `blog-primary`/`archive-item`/`post-detail` 문법으로, 공개 목록·상세는 `published`만. 문서폭/타이포/코드·인용 스타일. 검수: 상태 배지 3종 대비, 초안·보관 비노출.
- **S4 — 시뮬레이터/운영 페이지 A 헤더 + 토큰:** elevator/taxi/work/runtime/simhub에 StationHeader + 시안 A 통계 타일·패널·car-row·slider·chip-btn 스킨 적용. Work의 preview/locked/live 시각 규칙, 드래그/시스템 소유 구분. 도메인 계약 불변(사람 단위 엘베 등). 검수: 조작부 preview/real 구분.
- **S5 — 컴포넌트 분해 정리:** 남은 페이지 뷰를 `components/pages/*`로 분리, 프리미티브(Roundel/LineCard/Wayfinding/ArrivalBar)와 컴포저블(useTheme/useBlogStore/useClock) 추출, `App.vue`를 셸+라우팅으로 축소. 동작 회귀 없음이 수용 기준(리팩터 슬라이스).
- **S6(선택) — 모바일 재배치 + Writing Studio 마감:** 시안 A/C 모바일 프리뷰대로 "축소 아닌 재배치"(상태→본선→놀이터 목록→하단 빠른 환승), Writing Studio 상태 흐름/저장·발행·보관 강조 마감. (플랩 아래→위는 TKT-070 별도.)

---

## 7. 시안 재사용 포인터 (어느 블록/DOM을 들어올릴지)

각 구현 조각별로, 복사 출발점이 되는 시안 파일과 대략 위치.

- 토큰(§1): 시안 A `variant-a-seoul-signage.html` `:root[data-theme="dark"]`/`[data-theme="light"]`(약 L25~82)를 기반, 노선 다크 코어/틴트는 시안 C `variant-c-night-line.html` `:root[data-theme="dark"]`(약 L26~46)에서 채택. `--map-node`/`--code-bg`/`--quote-bg`도 여기서.
- 타이포(§2): 시안 A/C 상단 `--font-sans`/`--font-mono`(각 L16~19), `.num`(A L97 / C L82), `body` 렌더링 힌트(A L86~94).
- StationHeader(3.1): 시안 A `.station-sign` ~ `.station-sub`(L554~587) DOM/CSS. 대안 상단 스트립은 시안 C `.station-head`/`.strip`/`.station-route`(L482~513).
- LineCard(3.2): 시안 A `.line-card` 계열(L432~449) + DOM(L918~961 line-grid 안 article).
- JunctionMap(3.3): 시안 C `.route-map` CSS 블록(L343~370) + `<svg class="route-map">` DOM(L807~861) + `.route-rows`/`.route-row`(L373~398 CSS, L870~919 DOM). 캡션 `.map-caption`(L863~868). D/P는 §3.3 좌표표대로 신규 `<path>`/`<circle class="lchip">`/route-row.upcoming 2개 추가.
- StatusBadge(3.4): 시안 A `.badge`/`.badge-pub`/`.badge-draft`/`.badge-arch`(L201~209) + legend DOM(L1041~1047). §6 색 근거는 `design/blog-district-ui-system-2026-06-26.md` L208~234.
- Wayfinding/ArrivalBar(3.5): 시안 A `.wayfinding`(L356~372) + DOM(L859~871); 도착 grid는 A `.arrival-grid`(스플래시). 시안 C `.here-line`(L320~333)도 대안.
- 블로그 본선 카드(bloghub): 시안 A `.blog-primary`/`.blog-primary-main`/`.blog-primary-list`(L375~421) + DOM(L873~911).
- 아카이브(blogArchive): 시안 A `.archive-item`(L465~487) 또는 시안 C `.archive-list`/`.archive-item`(L403~416, 좌측 날짜 시각표형).
- 글 상세(blogPost): 시안 A `.post-detail` ~ `.post-foot-nav`(L496~549) + DOM(L1050~1120).
- 승강장 본문(elevator 등): 시안 A `.stat-row`/`.stat-tile`/`.car-row`/`.load-track`/`.preset-row`/`.chip-btn`/`.slider-block`/`input[type=range]`(L589~654) + DOM(L1156~1231). 큰 수치 스트립은 시안 C `.stat-strip`(L515~525).
- 섹션 골격/버튼/칩(3.6): 시안 A `.sec`/`.sec-head`/`.sec-rail`/`.eyebrow`(L146~161), `.btn`/`.btn-exit`/`.btn-ghost`(L163~177), `.chip`/`.roundel`(L179~198).
- 모바일 재배치(S6): 시안 A `.phone`/`.m-*`(L659~736) 또는 시안 C 세로 노선띠 `.m-strip`/`.spine`/`.m-stop`(L614~667).

---

## 부록 A. 접근성/반응형 수용 체크

- 노선/상태를 색만으로 구분하지 않는다: 항상 색 + 문자(roundel/코드) + 텍스트 라벨.
- 다크/라이트 둘 다 1급: 각 슬라이스 검수는 두 테마 모두. 다크 기본.
- `prefers-reduced-motion`: 노선도 pulse/트랜지션/플랩 정지 또는 결과만.
- 반응형은 "재배치": 데스크톱 세로 접기 금지. 홀 노선도는 SVG 가로 스크롤 + `.route-rows` 목록 폴백. 모바일 우선순위 = 현재 상태 → 주요 진입 → 핵심 시뮬/Work → 보조 패널.
- 포커스: `:focus-visible { outline: 2px solid var(--safety); outline-offset: 2px; }` 전역.
- 터치 타깃 충분히 크게, 복귀 CTA 항상 노출.

## 부록 B. 인코딩

이 문서는 UTF-8 with BOM. `tools/check-docs-encoding.ps1`가 `docs/`·`design/` 하위 모든 .md의 BOM을 강제한다. 저장 후 재인코딩·검증 필수(작성자 워크플로 참고).
