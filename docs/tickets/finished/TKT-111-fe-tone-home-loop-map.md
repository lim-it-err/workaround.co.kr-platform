문서 상태: 작성완료

# TKT-111 `[FE]` 홈(환승 홀) — 순환선 노선도(D-015) + 3묶음 목록 + 데스크톱 2단

- 상태: `finished` (REV-TKT-111-r1 통과, PM 2026-09-14 — r14 기준, PO 최종 확인 대기)
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/data/lines.js`(구조 전환: 순환선 1 + 역 8, 또는 노선 3+정류장 8 — r6 결과에 따름), `frontend/src/components/JunctionMap.vue`, `frontend/src/App.vue`(junction 섹션), `frontend/src/styles.css`

## 목표
`mockups/home.html`(r14). 노선도는 D-015 안 F대로 lines.js 를 재구성(모바일 라벨 규칙: 개통 역만 이름, 미개통은 배지만). 목록은 기록선/실험선/기지선 3묶음, 정류장당 행 1 + 인라인 서브링크. 데스크톱 좌 지도·우 목록.

## 구현 결과

- `lines.js`를 기록선(B·V), 실험선(A·S·D·P), 기지선(W·R)의 3노선·8정류장 단일 구조로 바꿨다. 지도 좌표·목록·실제 목적지는 같은 데이터에서 읽고, 기존 App/정적 라우팅 소비자는 평탄 `LINES`로 호환한다.
- `home.html` r14의 방사형 구도를 Vue SVG로 이식했다. 중앙 열린 기점 심볼, 세 노선색, 큰 서비스 역, 데스크톱 세부 화면 역, D·P 점선을 유지하되 보기 영역을 실제 도형에 맞춰 확대하고 라벨 좌표를 조정했다.
- 모바일에서는 세부 화면명과 미개통 역명을 숨기고 개통 서비스 역명·문자 배지만 남겼다. 데스크톱은 좌 지도·우 노선 목록 2단, 모바일은 지도→목록 세로 순서다.
- 목록은 카드 면 없이 3px 노선 룰·hairline·원형 문자 배지로 구성했다. 개통 6역 모두 대표 목적지를 갖고 Blog/Voyage/Sim에는 인라인 서브링크를 제공한다. Work·Runtime 등 정적 비지원 화면은 기존 안내 경계를 보존한다.
- r13 UX 초안의 B1/I1/I2를 구현 게이트에 흡수했다. 표시 중인 SVG 글자는 실측 11px 이상, 모든 이동 타깃은 가로·세로 40px 이상이며, 개통 역 대표 진입 누락은 0건이다. 영어 보조 노선명은 노출하지 않는다.
- App의 중복 환승 안내·기본 설명 문단을 제거해 지도 하나를 홈의 주인공으로 남겼다.

## 질문/결정 기록

- `[구체화 질문][해결]` 착수 시 기준은 D-015 안 E·r13이었으나 구현 직전 PM 표기의 `home.html` r14로 변경됐다. 파일 안정성을 재확인한 뒤 작업했고, 수행 중 PM이 D-015 안 F와 r14를 결정문·톤 원칙에 확정해 최신 기준과 정합됐다.
- 열린 질문 없음.

## 완료 게이트

- `npm --prefix frontend run build` — 통과, 56 modules.
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 통과, 56 modules.
- 신규 `junction.test.mjs` + 기존 정적·여행·SIM 단위 회귀 — 18/18 통과.
- 신규 `JunctionMap.e2e.mjs` — Chromium 2/2 통과. 375×812 dark·1440×900 light에서 3노선·8정류장, 모바일/데스크톱 배치, 개통 대표 목적지, 실제 키보드 이동, 표시 글자 11px 이상, 지도 라벨 겹침 0, 타깃 40px 이상, 가로 overflow 0을 검증했다.
- 기존 VoyageCollection 2/2, VoyageRouteMap 2/2, WritingStudio 9/9, Taxi 5/5, splashTone 2/2를 각 요구 base 미리보기에서 재실행해 브라우저 회귀 총 22/22 통과했다.
- 375px dark·1440px light 전체 화면 캡처를 직접 확인했다. 첫 캡처의 작은 지도·라벨 겹침을 viewBox와 좌표로 보정한 뒤 최종 캡처를 재검수했다.

## 작업자 산출물

- 브랜치: `codex/v0.7.0-tone`.
- 커밋/푸시: 없음(PM 전담).
- 주요 파일: `frontend/src/data/lines.js`, `frontend/src/components/JunctionMap.vue`, `frontend/src/App.vue`, `frontend/src/styles.css`, 신규 unit/E2E.

## 검토 메모

- 여행의 준비/노선도/기록 링크는 현재 한 `VoyageView` 안에서 제공되는 기존 진입으로 연결된다. D-019/TKT-127 일원화가 후속으로 세 화면을 단일 노선도 상태에 흡수한다.
- Safari/WebKit 실기와 실제 GitHub Pages 배포는 미검증이다.
- PM·codex-8의 r14 목업과 UX 산출물은 읽기만 했고 수정하지 않았다.

## PR 준비 메모

- 제목: `feat(home): rebuild junction as radial three-line map`
- 본문 요약: D-015 안 F에 맞춰 홈을 3노선·8정류장 방사형 SVG와 실제 이동 가능한 3묶음 목록으로 전환하고, 375/1440 가독성·타깃·overflow 게이트를 고정한다.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-111-r1.md`.
