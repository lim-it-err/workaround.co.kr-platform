문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-102-r1 (draft) — 톤 전환 전 화면 정적 HTML 목업

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-09
- 대상: `docs/tickets/need_review/TKT-102-mockup-tone-all-screens.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend)` 절대경로 이동 후 `pwd` 확인(`.agents/claude-reviewer.md` 규칙 준수).

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | 파일 존재 (index + 11화면 = 12개) | 통과 | `ls frontend/public/mockups/*.html` → 12개, 티켓 "구현 인계"의 파일 목록과 정확히 일치 |
| 2 | `npm --prefix frontend run build` | 통과 — 35 modules | 직접 재실행. 티켓 claim은 33 modules — **불일치는 이 티켓의 문제가 아님**: 같은 워킹트리에 TKT-097(신규 staticRouting.js 등)·TKT-100(WritingStudio.vue 등)의 미커밋 변경이 공존해 전체 모듈 수가 시점마다 달라짐. `frontend/dist/mockups/`가 실제로 생성되는지가 이 티켓의 실질 게이트임 |
| 3 | `frontend/dist/mockups/` 복사 확인 | 통과 — 12개 전부 복사됨 | 직접 확인 |
| 4 | 범위 준수 (`frontend/src/**` 읽기 전용) | 통과 | `git status --short -- frontend/src`에서 TKT-097/TKT-100 소유 파일 외 추가 변경 없음 — TKT-102는 `frontend/public/mockups/**`만 추가 |
| 5 | 커밋/push 여부 | 없음 | `git status`로 재확인 |

## 형식 요건 일괄 검사 (12개 파일 전부)

- **고정 배너** `MOCKUP — 실화면 아님 · tone r1`: 12/12 파일에 정확히 1회씩 존재.
- **외부 CDN/폰트/스크립트**: `grep -l "http://\|https://\|<script" *.html` → 0건. 순수 단일 파일 HTML+CSS 요건 충족.
- **viewport meta**: 12/12 존재.
- **디자인 토큰 재사용**: `frontend/src/styles.css`의 실제 다크모드 토큰(`--bg:#0D131C`, `--text:#F3F6FB`)이 12개 파일 전부에서 그대로 발견됨 — 임의 색상이 아니라 실토큰을 복사해 썼다는 claim이 사실로 확인됨.

## 원칙 4 실시각 검수 (390px, 12개 파일 전부 — 코드 훑기 아닌 실제 렌더링)

`frontend/dist/mockups/` 빌드 산출물을 `file://`로 직접 열어 390×844에서 스크린샷 + `scrollWidth/clientWidth` 측정을 12개 파일 모두에 대해 수행.

- **11/12 클린**: `home`, `voyage-prep`, `voyage-daily`, `voyage-archive`, `blog-hub`, `blog-archive`, `blog-post`, `simhub`, `work`, `runtime`, `index` — 전부 `overflow: 0`, 조작부(버튼·입력창)에만 면(박스)이 있고 화면당 단일 강조색, 영어 섹션 간판 없음(라벨 전부 한국어). `index.html`은 원칙 4 문구 자체를 한국어로 다시 노출해 기준 목업과 일치.
- **1/12 결함 발견 — 아래 [중요] 참조.**

## 지적사항

### [중요] `writing-studio.html`의 제목 입력란이 390px에서 텍스트를 잘라먹음 — "모바일 390px 우선" 요건 미충족

- **위치**: `frontend/public/mockups/writing-studio.html` — `.title` 클래스의 `<input>` 요소(대략 CSS `max-width:540px` 미디어쿠리 부근, 파일 내 `.title{font-size:30px}` 규칙과 함께 정의).
- **재현**: `frontend/dist/mockups/writing-studio.html`를 390×844 뷰포트로 열면 제목 "낯선 도시에서 속도를 고르는 법"이 "...고르는 t" 근처에서 시각적으로 잘려 보임. JS로 직접 측정: `title.scrollWidth=367` vs `title.clientWidth=350`, `computedOverflow: "clip"` — 17px만큼 실제 콘텐츠가 잘려나간다(페이지 전체 가로 스크롤은 0이라 `document.documentElement` 레벨 체크로는 안 잡히고, 입력란 내부 클리핑이라 개별 요소를 직접 측정해야 드러남).
- **적대적 관점**: 티켓의 "검증" 절엔 "viewport 선언... 확인"만 적혀 있고, 실제로 390px에서 렌더링해 콘텐츠가 잘리지 않는지는 육안/측정을 거치지 않은 것으로 보인다 — `<meta viewport>` 존재 확인만으로 "모바일 390px 우선"을 형식적으로 통과 처리한 사례. 나머지 11개 파일은 전부 클린이라 스타일링 실수가 이 화면에 국한된 것으로 보인다.
- **가중 사유**: 이 화면은 티켓 자체가 "`design/writing-studio-spec.md` 레이아웃을 따를 것(TKT-100과 동일 설계)"라고 못박은 화면이라, 실구현(TKT-100)의 참고 기준으로 쓰이기 전에 고쳐두는 편이 안전하다.
- **판단**: 블로커는 아니다 — 정적 목업 1개 파일의 CSS 폭 계산 오류로, 원칙4 위반(상자/주인공색/간판)이 아니라 순수 레이아웃 버그이고 나머지 11개·전체 게이트는 클린하다. finished 반려보다는 `.title` 요소의 `width`/`max-width`를 컨테이너 안쪽으로 조정하는 즉시 수정을 권고.

## 종합 의견 (초안 — 최종 판정은 PM)

블로커 0건, 중요 1건. 완료 게이트(파일 12개·build green·dist 복사·범위 준수)를 전부 직접 재실행/재확인했고, 형식 요건(배너·외부의존성 0·viewport·디자인 토큰 재사용)은 12개 파일 전수 검사로 확인했다. 원칙4 실시각 검수(390px)도 12개 파일 전부 직접 렌더링해 11개는 클린, `writing-studio.html` 1개에서 제목 입력란 텍스트 클리핑을 발견했다. 이 결함은 국소적이고 원칙4 자체를 위반하진 않으므로, PM 판단으로 finished 승인 + 해당 파일 즉시 수정 요청, 또는 그 1파일만 짧게 반려하는 것을 권고 — 나머지 11개는 그대로 승인 가치가 있다고 본다.

## PM 판정 (2026-09-10) — **반려 → started (r2 요청)**
[중요] writing-studio.html 390px 제목 잘림 1건 수정 후 재제출. 이 화면은 톤 전환의 대표 화면이라 PO 육안 승인 전에 결함 0 이어야 한다. 나머지 11개 파일·형식 요건은 전부 인정 — r2 는 해당 파일 수정만 확인한다. PO 폰 검토는 r2 통과 + 커밋·배포 후 진행.

## PM r2 판정 (2026-09-10) — **통과 (PO 육안 승인 대기)**

- 수정 방식 인정: 제목 input→textarea(field-sizing:content, rows=2 fallback). 부관이 5개 뷰포트 실측 + 나머지 11개 SHA-256 동일 검증.
- PM 직접 재측정 (390×844, dist 빌드): title scrollWidth=clientWidth=350, scrollHeight=clientHeight=75, 페이지 가로 overflow 0 — [중요] 해소 확인. build 그린, dist 12개 복사 확인.
- finished 전환은 PO 폰 육안 승인 후. 커밋·배포하여 공개 URL 로 검토 요청한다.

## PM r3 판정 (2026-09-11) — **통과 (PO 최종 육안 승인 대기)**

- home.html: 인라인 SVG 약도(8지선, 배지+노선명만, A·D·P 저채도 점선) + 카테고리 6묶음(글쓰기/여행/배움/놀이/운영/개통 예정) 시각표 행. index.html 은 원칙 5·6 문구만.
- PM 직접 측정(390×844, dist): 페이지 overflow 0, SVG 335×278 우측 370(<390), 면 채움 요소 = 배너 1개뿐. 육안: 원칙 1·2·5·6 충족, 조잡하지 않음.
- 부관 검증(6개 폭·링크 10개 클릭·글자 200%) 인정. 나머지 10개 SHA 동일.

## PM r4 판정 (2026-09-12) — **통과 (PO 최종 육안 승인 대기, 13개 완성)**

- splash.html 신규: 원형 W 배지 주인공 + 워드마크 + "곧 문이 열립니다" + 한 줄 플랩(WORKAROUND, 순수 CSS 플립) + 현행 tickerPool 멘트 + "10초 후 자동 전환" + 10s 진행선 + 문 열림 힌트. script 0, prefers-reduced-motion 처리.
- PM 직접 측정(390×844): overflow 0, 높이 844(한 화면). 면 채움은 플랩 셀·배지뿐(장치 요소 — 허용).
- 나머지 12개 무변경. 총 13개 화면 완성 — PO 최종 승인 후 finished.

## PM r5 판정 (2026-09-14) — **통과 (PO 최종 승인 대기)**

- 자동검사: 4파일 script 0 · splash 티커 3종+doors opening+reduced-motion · home viewBox 1000×460(현행 가로형)·3묶음·'개통 예정' 섹션 0·≥900px 2단 · studio 720px·"← 블로그"·사진/표/제목 도구 · archive DAY 1~6 원문(렌터카·인용문 대조).
- 실렌더(PM): home 390 overflow 0 / 1440 에서 SVG 135→840px·목록 888px~ 2단 확인. studio 1440 중앙 컬럼+우측 도구 패널. archive 390 DAY 6 주인공·지나온 정류장. splash 9초 시점 좌우 패널 갈라짐+doors opening.
- **[중요·구현 메모, 목업 비차단]** 모바일(390)에서 가로형 노선도가 154px 높이로 눌려 라벨이 빽빽함 — 구현(FE) 시 규칙: 모바일은 **개통 노선만 이름 표시, 미개통은 배지만**, 라벨 폰트 하한 11px, 필요 시 지도 높이 220px 이상 확보. 톤 원칙 6 에 추가.
- home-alt(선택)는 미제출 — 문제 없음.

## PM r6 판정 (2026-09-14) — **통과 (PO 형태 선택 대기: 순환선 vs 3노선)**

- home.html(순환선, D-015 B안): viewBox 700×700, 3구간 색 호(경험/학습·놀이/운영)·역 8·미개통 D·P 점선 호·12시 환승 홀. 390px svg 335px·overflow 0, 1440 좌 원·우 목록 2단. 목록 = 구간 헤더(경험 구간 · 환승 홀→B→V) + 역 행 + 인라인 서브링크. **PM 권고안.**
- home-alt.html(3노선 교차, A안): 십자 교차 형태, 동일 목록. 비교안으로 유효.
- splash.html: 플랩 4단계(WORKAROUND→WORKING AROUND→MIND THE GAP→DOORS OPENING) + 티커 3종 확인. voyage-archive.html: 실제 경과·Hertz·누적 523만원/856 헤더 반영 확인.
- 지적: 없음. PO 가 형태를 고르면 TKT-111 노선도 부분 확정 → TKT-102 finished.
