문서 상태: 작성완료

# TKT-102 `[목업]` 톤 전환 전 화면 정적 HTML 목업 — codex-4 전담

- 상태: `need_review` (r8 통과 — PM 2026-09-14, PO 홈 형태 최종 확인 후 finished; r9·r10 은 후속 라운드)
- 우선순위: P1 (PO 지시 2026-09-09 — "모든 변경될 화면이 html로 있으면 좋겠어")
- 담당: codex-8 디자이너 (r8 이후; r1~r6 제작 이력은 codex-4)
- 관련: `design/tone-principles-2026-09-09.md` (원칙 4) · 기준 목업 `design/mockups/tone-pitch-r1.html`
- scope: **`frontend/public/mockups/**` 만** — frontend/src 등 앱 코드는 읽기 전용. 위반은 블로커.

## 목표

원칙 4(박스는 조작부에만 / 주인공 1 / 노선색은 선 / 영어 간판 제거)를 전 화면에 번역한 **정적 HTML 목업**을 만든다. PO 가 폰에서 검토할 승인용이자, 승인 후 [FE] 구현의 마크업·CSS 출발점이다 (버리는 산출물이 아니다 — 클래스·구조를 이식 가능하게 깔끔히).

## 산출물

`frontend/public/mockups/` 아래 (Vite 가 public/ 을 dist 로 복사 → Pages 에서 `/mockups/<파일>.html` 로 열림):

1. `index.html` — 목업 목차 (화면 링크 + 원칙 4 요약)
2. `home.html` — 환승 홀 (노선도 SVG 는 이미지/플레이스홀더 허용, 아래 목록이 본체)
3. `voyage-prep.html` · `voyage-daily.html` · `voyage-archive.html`
4. `blog-hub.html` · `blog-archive.html` · `blog-post.html`
5. `writing-studio.html` — **`design/writing-studio-spec.md` 레이아웃을 따를 것** (TKT-100 과 동일 설계)
6. `simhub.html` — 미스터리 트레인 격납고 (TKT-101 · D-012)
7. `work.html` · `runtime.html`

## 요구사항

- 각 파일 최상단에 고정 배너: `MOCKUP — 실화면 아님 · tone r1`. 실데이터 대신 현실적인 예시 텍스트(lorem 금지, 실제 화면의 실카피 재사용 권장 — frontend/src 읽기는 허용).
- **모바일 390px 우선** + 데스크톱 대응(max-width 컨테이너). 색·타이포는 `frontend/src/styles.css` 의 실토큰 값을 복사해 사용.
- 외부 CDN·폰트·JS 프레임워크 금지 — 순수 HTML+CSS 단일 파일(파일당 완결).
- 기준 목업(tone-pitch-r1.html)의 목업 A·B 를 스타일 기준으로 삼는다.

## 완료 조건

1. 위 11개 파일이 존재하고 `npm --prefix frontend run build` 후 `frontend/dist/mockups/` 에 복사됨 (빌드 그린).
2. 각 화면이 원칙 4 를 만족: 면을 가진 요소는 조작부뿐, 화면당 컬러 룰 주인공 1개, 영어 섹션 간판 0.
3. need_review 전환 시 티켓에 파일 목록 + 확인 URL 경로 기재.

## 질문/에스컬레이션

(비어 있음)

## 리뷰 기록

### 구현 인계 (codex-4, 2026-09-09)

- 파일: `frontend/public/mockups/index.html` 및 화면 11종(`home`, `voyage-prep`, `voyage-daily`, `voyage-archive`, `blog-hub`, `blog-archive`, `blog-post`, `writing-studio`, `simhub`, `work`, `runtime`) — 합계 12개 HTML.
- 확인 URL: `/mockups/index.html`에서 전체 화면으로 이동. 개별 화면은 `/mockups/<파일명>.html`.
- 검증: `npm --prefix frontend run build` 통과(Vite 33 modules), `frontend/dist/mockups/`에 12개 복사 확인, 각 파일 고정 배너 1회·viewport 선언·외부 URL/CDN/스크립트 없음 확인.
- 제약: 앱 코드(`frontend/src/**`)는 수정하지 않았고 정적 목업만 추가했다.

### r2 재작업 인계 (codex-4 전속부관, 2026-09-10)

- 대상: `REV-TKT-102-r1`의 [중요] 1건. 구현 변경은 `frontend/public/mockups/writing-studio.html` 하나뿐이며, 나머지 목업 11개는 재작업 전후 SHA-256 동일함을 검증했다.
- 원인 재현: Chromium 390×844에서 기존 제목 `input`의 `scrollWidth=367`, `clientWidth=350`으로 내부 17px 잘림 확인. 페이지 전체 overflow는 0이어서 요소 자체 측정이 필요했다.
- 수정: 같은 제목·30px/34px 글꼴 크기를 유지하며 여러 줄 `textarea`로 전환했다. `field-sizing:content`로 내용에 맞춰 높이를 늘리고, 미지원 환경에는 `rows=2`와 세로 크기 조절을 남겼다. 단어 단위 줄바꿈 및 긴 단어 줄바꿈을 허용했다. 외부 의존성·스크립트·앱 로직 변경 없음.
- 브라우저 검증: 빌드된 HTML을 Chromium에서 375×812, 390×844, 540×844, 541×844, 1440×844로 직접 열었다. 모두 제목 내부 가로/세로 잘림 0·페이지 가로 overflow 0, primary 1개, 최초 화면 본문 클릭·타이핑 성공. 긴 제목으로 변경 시 높이 자동 확장도 확인했다. 390px 결과는 `clientWidth=scrollWidth=350`, `clientHeight=scrollHeight=75`이며 390px/1440px 스크린샷을 직접 육안 확인했다.
- 호환성 확인: Chromium에서 `field-sizing:fixed`를 강제로 적용해 2행 fallback에서도 예시 제목 전체 표시를 확인했다. 별도 WebKit 브라우저는 설치되어 있지 않아 Safari 실기 검증은 하지 않았다.
- 완료 게이트: `npm --prefix frontend run build` 통과(Vite 6.4.3, 36 modules), `frontend/dist/mockups/` 12개와 원본 바이트 일치, 12개 모두 고정 배너 1회·viewport·외부 URL/스크립트 없음, `git diff --check` 통과.
- 확인 URL: `/mockups/index.html` → `/mockups/writing-studio.html`. 이번 변경은 로컬이며 공개 Pages 반영은 PM 판정·커밋·배포 이후다.
- 검증 자료: `/private/tmp/tkt102-r2.muTOW1/`의 `verify.cjs`, `before-hashes.json`, `before-results.json`, `after-results.json`, `before-chromium-390.png`, `after-chromium-390.png`, `after-chromium-1440.png` (임시 경로, 정리 시 소실 가능).
- 재현 명령: Playwright가 설치된 Node 환경에서 `node /private/tmp/tkt102-r2.muTOW1/verify.cjs after`. 이번 실행은 `NODE_PATH=/Users/imjeonghan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`를 사용했다.
- 브랜치: `codex/v0.6.0-line`. git commit·push·배포·PM 최종 판정은 수행하지 않았다.


## r3 지시 (PM, 2026-09-11 — PO 목업 검토 피드백)

대상: `home.html` 1개 파일 (+ 필요 시 `index.html` 목차 문구). 나머지 10개는 무변경 (SHA 유지).

1. **간단 노선도 삽입** — 점선 플레이스홀더 자리에 인라인 SVG 약도. 원칙 6: 색 라인+노선명만, 상태·부제·통계 금지, 미개통(발견·취향·배움 미개통분)은 저채도 점선, 선 두께 얇게. 실좌표는 frontend/src/data/lines.js 를 참고하되 목업은 단순화 허용.
2. **목록을 카테고리 위계로** — 원칙 5 의 6묶음(글쓰기/여행/배움/놀이/운영/개통 예정). 노선 동급 나열 금지. 글쓰기 카테고리 안에 공개 아카이브·글 상세·Writing Studio 가 들어간다.
3. 검증: 390px 잘림 0·오버플로 0 (r2 와 동일 절차), 변경 파일 외 SHA 동일.

### r3 재작업 인계 (codex-4 전속부관, 2026-09-11)

- 구현 변경 파일: `frontend/public/mockups/home.html`, `frontend/public/mockups/index.html`(원칙 5·6 요약 문구만). 다른 목업 10개는 착수 시 SHA-256과 동일하며, r2의 `writing-studio.html` 수정도 그대로 보존했다.
- 홈 노선도: `lines.js`의 중앙 환승점과 좌우 8개 지선을 모바일용 인라인 SVG로 단순화했다. 경로는 2px 선, B·V·S·W·R은 실토큰 색, 미개통 A·D·P는 저채도 점선이다. 그림에는 노선명·원형 문자 배지만 표시하고 상태·부제·통계는 넣지 않았다. 접근성용 제목/설명과 상단 원형 배지를 유지했다.
- 목록: 글쓰기 / 여행 / 배움 / 놀이 / 운영 / 개통 예정의 6개 카테고리 아래 시각표 행으로 묶었다. 글쓰기 안에 공개 아카이브·글 상세·Writing Studio, 여행 안에 중부유럽 순환선과 준비·일일 안내·기록 진입을 배치했다. 운영 2개 행은 보호 구역, Advisor는 연결 준비 중, 발견·취향은 준비 중으로 표시한다. 미개통 항목은 작동하는 척하는 링크 없이 비활성 텍스트로 둔다.
- 브라우저 검증: 빌드된 HTML을 Chromium 151.0.7922.34에서 320/375/390/540/541/1440×844로 검증했다. 6개 폭 모두 페이지 가로 overflow 0, 요소 내부 가로 잘림 0, SVG 라벨 화면 밖 잘림 0, 라벨 간 겹침 0이다. 390px/1440px 전체 스크린샷을 직접 육안 확인했다.
- 이동 검증: 홈의 링크 10개를 실제 클릭해 목적 HTML로 이동 확인, 목차→홈 복귀 확인, Tab→공개 아카이브→Enter 이동 확인. 390px 루트 글자 200%에서도 가로 overflow·요소 내부 잘림 0. 브라우저 오류 0. 미개통 링크 0·내용 행 배경 채움 0·A/D/P 점선 확인.
- 완료 게이트: `npm --prefix frontend run build` 통과(Vite 6.4.3, 36 modules), `frontend/dist/mockups/`의 12개 HTML이 원본과 바이트 단위 일치. 모든 파일에 고정 배너 1회·viewport 존재, 외부 의존성/스크립트 없음, 로컬 링크 대상 존재. `git diff --check` 통과.
- 확인 URL 경로: `/mockups/index.html` → `/mockups/home.html`. 이번 수정은 로컬 목업만이며 공개 Pages 반영은 PM 판정·커밋·배포 이후다. 스플래시와 실제 앱(`frontend/src/**`)은 무변경.
- 검증 자료: `/private/tmp/tkt102-r3.ixTEnq/verify.cjs`, `results.json`, `home-390.png`, `home-1440.png`, `home-390-text-200.png`(임시 파일, 정리 시 소실 가능). 결과 JSON에 전체 파일 SHA-256·뷰포트별 측정치를 포함했다.
- 재현: `NODE_PATH=/Users/imjeonghan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules node /private/tmp/tkt102-r3.ixTEnq/verify.cjs`. 로컬 임시 브라우저만 사용했다. macOS sandbox의 브라우저 기동 제한은 해당 검증 명령에 한해 승인된 실행으로 해결했다.
- 제약: Safari/WebKit 실기 미검증. PowerShell 부재로 수정 문서 3개의 BOM/UTF-8은 Node의 fatal UTF-8 decoder와 BOM 바이트 검사로 확인했다. 최종 판정·commit·push·배포는 하지 않았다. 브랜치 `codex/v0.6.0-line`.


## r4 지시 (PM, 2026-09-12 — PO "초입부도 mock 이쁘게")

대상: 신규 `splash.html` 1개 + `index.html` 목차에 링크 추가. 기존 12개 무변경(SHA 유지).

**컨셉 — "문이 열리기 전 10초"**: 지하철역 진입 의식. 톤 원칙 문서의 "지키는 것" 3항 준수:
1. **10초 인트로 유지** — CSS 애니메이션(keyframes)만으로 10초 진행을 표현 (얇은 라인 프로그레스 또는 숫자 카운트다운, 면 채움 금지). 외부 스크립트 금지 원칙 유지 — 인라인 JS 도 쓰지 않는다(순수 CSS).
2. **지하철 원형 번호 배지가 주인공** — 큰 원형 배지 + `workaround.co.kr` 워드마크 + 한 줄 안내문("곧 문이 열립니다" 수준, 자기해설 금지). 화면당 주인공 1.
3. **플랩 보드는 간단하게 포함 (PO 2026-09-12 정정: 선택→필수·간소)** — 한 줄 플랩(역명 또는 워드마크)만, 통계·상태 행 없음. 순수 CSS 플립. 2안 제출 불필요.
3-1. **멘트는 유지** — 현행 스플래시의 notice 티커 문구(`frontend/src/App.vue` `tickerPool`, 예: "에스컬레이터 방향 다수결로 정하는 중…")를 그대로 쓴다. 새 문구 창작 금지, "10초 후 자동 전환" 안내도 유지.
4. 10초 끝에 "문 열림" 전환 힌트(좌우로 갈라지는 얇은 두 선 정도)를 CSS 로만.
5. 검증: 390·1440px 오버플로 0, 애니메이션 `prefers-reduced-motion` 시 정지, 파일 규칙(배너·viewport·외부 의존 0) 동일.

### r4 구현 인계 (codex-4 전속부관, 2026-09-12)

- 구현: `frontend/public/mockups/splash.html`을 새로 만들고 `index.html` 목차에 `/mockups/splash.html` 링크를 추가했다. 큰 W 원형 배지와 워드마크를 단일 주인공으로 두고, 얇은 10초 진행선과 종료 시 좌우로 열리는 두 선을 CSS keyframes만으로 표현했다.
- 정정 반영: 한 줄 `WORKAROUND` 플랩 10칸을 순수 CSS `rotateX` 애니메이션으로 넣었다. 현행 `tickerPool` 첫 문구 `에스컬레이터 방향 다수결로 정하는 중…`와 `10초 후 자동 전환` 안내를 그대로 사용했다. 인라인·외부 스크립트와 외부 의존성은 없다.
- 브라우저 검증: 빌드 산출물을 Chromium 151.0.7922.34에서 390×860, 1440×860으로 직접 열어 초기·10.3초 후를 검사했다. 두 폭 모두 가로 overflow 0, 배너 1회, viewport 존재, 외부 의존·script 0이다. 10초 후 진행선은 100%이고 중앙의 두 선은 각각 111.5px 좌우로 이동했다.
- 모션 감소: `prefers-reduced-motion: reduce`에서 진행선·문 열림·원형 링·플랩 애니메이션의 계산값이 모두 `animation-name: none`이며 600ms 뒤 위치 변화가 없음을 확인했다.
- 완료 게이트: `npm --prefix frontend run build` 통과(Vite 6.4.3, 37 modules), 목차 링크의 source/dist 대상 존재 확인, `git diff --check` 통과. r3 산출물 중 목차를 제외한 기존 화면 11개 SHA-256은 착수 시점과 동일하다.
- 육안 확인: 390px/1440px의 초기·문 열림 완료 스크린샷을 확인했다. 검증 자료는 `/private/tmp/tkt102-r4.ocG5Ob/`의 `verify.cjs`, `390-start.png`, `390-open.png`, `1440-start.png`, `1440-open.png`에 있다(임시 경로라 정리 시 소실 가능).
- 제약: 정적 승인 목업이므로 실제 10초 라우팅은 구현하지 않았다. 앱 코드(`frontend/src/**`)는 읽기만 했고 수정하지 않았다. Safari/WebKit 실기·실배포는 미검증이며 commit·push·배포·최종 판정은 수행하지 않았다.


## r5 지시 (PM, 2026-09-13 — PO 최종 리뷰 피드백)

대상 4개 파일: `splash.html` `home.html` `writing-studio.html` `index.html`. 나머지 무변경(SHA).

1. **splash.html** (PO "너무 좋아") — ①티커 멘트가 10초 동안 **3회 교체**(순수 CSS keyframes, tickerPool 문구 3개 순환) ②문 열림을 **느끼게**: 마지막 ~1.5초에 좌우 패널 2장이 갈라지며 배지가 드러나는 CSS 연출 + 소문자 `doors opening` 한 줄. 투머치 금지 — 패널은 단색 면, 그림자·글로우 없음.
2. **home.html** — ①노선도를 **현행 가로형(lines.js 1000×460 좌표) 기준**으로 다시: 톤 다이어트만(선 2px, 배지+노선명, 상태 없음, 미개통 점선). 글꼴 크기·선 두께 비율을 데스크톱/모바일 각각 CSS 로 ②**데스크톱(≥900px) 2단**: 좌 노선도 · 우 목록 ③목록을 **3묶음**으로: 경험(B·V) / 학습·놀이(A·S·D·P, 미개통 흐리게) / 운영(W·R). 노선당 행 1개, 하위 진입은 행 안 인라인 서브링크. '개통 예정' 섹션 삭제 ④가능하면 `home-alt.html` 로 노선도 모양을 바꾼 비교안 1개(선택).
3. **writing-studio.html** — ①데스크톱에서 본문 컬럼 중앙 정렬 max-width 720px(현재 우측 치우침 결함) ②우측 도구 메뉴 목업: 사진 첨부 · h1/h2/h3 · 표 삽입(기능형 — 행/열 버튼) ③`←` 라벨을 `← 블로그`로.
4. **index.html** 목차 문구 갱신. 검증은 r3/r4 절차(390·1440 오버플로 0, 링크, 배너, script 0 — splash 만 CSS 애니).
5. **voyage-archive.html 실콘텐츠 (추가, PO 2026-09-13)** — `design/voyage-log-draft-2026-09-13.md` 의 DAY 1~6 기록을 그대로 얹는다(문구 수정 금지 — PM 콘텐츠). 구조: 진행 중 여행 헤더(중부유럽 순환선 · DAY 6/11) → 일차별 기록(날짜·도시·경과 불릿·한 줄 감상은 인용체) → 남은 정류장 흐리게. 원칙 1·2 준수(면 없음, 주인공은 오늘 DAY 6). `voyage-daily.html` 은 무변경.

### r5 구현 인계 (codex-4 전속부관, 2026-09-13)

- 변경 파일: `frontend/public/mockups/splash.html`, `home.html`, `writing-studio.html`, `voyage-archive.html`, `index.html` 5개. 확인 URL은 `/mockups/index.html`에서 각 화면으로 진입한다. 나머지 목업 8개 SHA-256은 착수 시점과 동일하다.
- 스플래시: 10초 동안 현행 `tickerPool`의 첫 세 문구를 순서대로 3회 노출한다. 마지막 1.5초에 그림자·글로우 없는 단색 좌우 패널이 갈라져 W 배지를 드러내고, 얇은 진행선 아래 `doors opening`을 표시한다. 플랩과 전환 전체는 CSS keyframes만 사용하며 script는 없다.
- 홈: `lines.js`의 `viewBox="0 0 1000 460"`과 8개 path 좌표를 그대로 옮기고 모든 선을 2px로 다이어트했다. D·P만 저채도 점선으로 두고 상태·통계는 제거했다. 목록은 경험(B·V) / 학습·놀이(A·S·D·P) / 운영(W·R) 세 묶음, 노선당 한 행과 인라인 하위 링크로 정리했다. 900px 이상은 좌 노선도·우 목록 2단, 모바일은 같은 SVG를 위에 쌓는다. `home-alt.html`은 선택 사항이고 PO가 현행 가로형을 선호한 상태라 비교안을 늘리지 않았다.
- Writing Studio: 본문을 뷰포트 정중앙의 최대 720px 컬럼으로 고정하고 우측에 사진 첨부, H1/H2/H3, 행·열 추가/삭제와 2×2 미리보기를 갖춘 표 도구를 배치했다. Markdown 파이프 문법은 노출하지 않았고 라벨은 `← 블로그`로 변경했다. 이는 TKT-105 구현 전 승인용 정적 목업이며 업로드 동작은 넣지 않았다.
- 여행 기록: `design/voyage-log-draft-2026-09-13.md`의 DAY 1~6 경과·한 줄·남은 정류장 25개 원문 행을 모두 그대로 포함했다. 진행 중 헤더는 `중부유럽 순환선 · DAY 6/11`, 오늘 DAY 6을 주인공으로 두고 남은 정류장은 흐리게 처리했다. `voyage-daily.html`은 SHA가 유지됐다.
- 브라우저 검증: Chromium 151.0.7922.34에서 390×900·1440×900을 검사했다. 전 화면 가로 overflow 0, 홈 3묶음·8행·D/P 비활성 및 데스크톱 2단/모바일 스택, 스튜디오 중앙 오차 0px·폭 720px·primary 1개·제목 잘림 0, 여행 DAY 6개·원문 25행 일치, 목차 링크 12개를 확인했다. 스플래시는 0초/3.4초/6.7초 티커 문구와 10.2초 패널 개방·배지 노출·진행선 완료를 확인했다.
- 접근성/의존성: `prefers-reduced-motion`에서 패널·플랩·티커·진행선 애니메이션이 모두 `none`이고 배지와 첫 티커가 정적으로 보인다. 13개 목업 모두 배너 1회·viewport 선언·외부 의존·script 0, source/dist 바이트 일치다.
- 완료 게이트: `npm --prefix frontend run build` 통과(Vite 6.4.3, 37 modules), `git diff --check` 통과. 390/1440px 스크린샷을 육안 확인했다. 자료는 `/private/tmp/tkt102-r5.KSBYbK/`의 `verify.cjs`와 PNG 9개에 있다(임시 경로라 정리 시 소실 가능).
- 제약: 실제 Vue 화면·라우팅·업로드·표 편집 기능은 scope 밖이라 수정하지 않았다. Safari/WebKit 실기와 실배포는 미검증이며 최종 판정·commit·push·배포는 수행하지 않았다.


## r6 지시 (PM, 2026-09-14 — PO "노선도 형태를 바꿔줘. 분류별로 노선도를 빼는 게 맞지 않아?")

대상: `home.html` (+`index.html` 문구). 나머지 무변경(SHA).

1. **노선도 재구성 (D-015)**: 노선 3개 = 경험선 / 학습·놀이선 / 운영선. 정류장 = 서비스 8개 — 경험선: 블로그 본선(B) → 여행 노선(V) / 학습·놀이선: Developer Advisor(A) → 미스터리 트레인(S) → 발견(D) → 취향(P) / 운영선: Work Manager(W) → Runtime Board(R). 세 노선이 **환승 홀(중앙 환승역)**에서 만난다. D·P 구간은 점선(연장 예정), 역명 흐리게.
2. 노선색 3개(기존 토큰에서 선택: 경험=--line-b 계열, 학습·놀이=--line-a 계열, 운영=--line-w 계열). 역은 라인 위 원(흰 테두리), 역명은 옆에, 서비스 문자(B·V·A…)는 역 번호처럼 작은 배지로.
3. **SVG 하나, 비율 둘**: 데스크톱(≥900px) 가로형 + 우측 목록 2단, 모바일은 세로형(노선이 위에서 아래로 흐르는 형태 허용) 라벨 하한 11px, 오버플로 0.
4. **홈 목록 단순화**: 3묶음 헤더 대신 **노선별 정류장 열거** — 노선명 한 줄(색 룰) 아래 정류장 행(서비스명 · 우측 한 마디 · 하위 진입 인라인). 미개통 행 흐리게.
5. **(PO 추가 — 주안 변경) 순환선 안을 `home.html` 로, 위 1~4 의 3노선 교차 안은 `home-alt.html` 비교안으로.** 순환선 안: 사이트 = 원형 순환선 1개(굵기 4~6px). 원 위에 역 8개(서비스), 원의 호를 분류 3구간으로 색 분할(경험·학습·놀이·운영 — 구간 경계에 작은 구간명 라벨), 미개통 D·P 는 점선 호 + 역명 흐리게, 상단 12시 위치에 **환승 홀**(기점, 큰 원). 역명은 원 바깥쪽 방사형 또는 수평 정렬(가독 우선), 서비스 문자 배지는 역 번호처럼 작게. **모바일은 원 그대로**(정사각, 폭 100%), 데스크톱은 좌 원·우 목록 2단. 목록은 순환선 순서(시계방향)대로 구간 헤더 → 역 행.
6. 검증은 r5 절차. 두 안 모두 390·1440 오버플로 0. 어느 안이 나은지 근거 한 줄.
7. **(r6 추가, PO 2026-09-14) voyage-archive.html 지출 표시** — `design/voyage-log-draft-2026-09-13.md` "지출" 절: 헤더에 누적 지출/계획 856만원 진행선(얇은 라인, 원칙 3), 일차별 기록 끝에 지출 한 줄(항목 · 합계). 실수치 없는 일차는 "지출 입력 전". 사전 결제 450만원은 "출발 전" 행. 면 채움 없이 텍스트+라인.
8. **(r6 추가, PO 2026-09-14) splash.html 플랩 문구 시퀀스** — 한 줄 플랩 보드가 10초 동안 4단계로 바뀐다(순수 CSS): `WORKAROUND` → `WORKING AROUND`(14) → `MIND THE GAP`(12, PM 선정 — 런던 지하철 안내 방송이자 '틈을 우회한다'는 workaround 의 말장난) → `DOORS OPENING`(13, 문 열림 연출과 동기). 셀 14칸 고정, 짧은 문구는 양쪽 빈 셀. 각 전환은 플립 애니메이션, 티커 멘트 3회 교체와 박자를 맞춘다. 현행 `doors opening` 소문자 텍스트 줄은 플랩이 대신하므로 제거 가능.


## r7 — PM 직접 제작 (2026-09-14, PO "너가 기획하고 만들고 목업에 바로 반영") — 여정 노선도 목업 `voyage-route.html` 완료. 부관은 r7 대신 **r6 항목 9**: `voyage-archive.html` 을 `design/voyage-log-draft-2026-09-13.md` "실제 경과" 절로 갱신(문구 그대로).

신규 `voyage-route.html` 1개 (+ index 링크). 요구 전문: `design/voyage-route-map-spec.md` §5. 핵심: 실좌표 9도시 지리 충실형 순환선, 구간=일차, hover 툴팁·:target 카드(DAY 2·3·4 실콘텐츠), 접시 아이콘, 계기판 헤더, 무스크립트, 모바일 세로/데스크톱 2단.

### r6 구현 인계 (codex-4 전속부관, 2026-09-14)

- 변경 파일: `frontend/public/mockups/home.html`, `home-alt.html`(신규), `splash.html`, `voyage-archive.html`, `index.html`. r6 착수 전 존재하던 나머지 목업 10개는 SHA-256이 유지됐다. 앱 코드(`frontend/src/**`)는 수정하지 않았다.
- 홈 주안: 사이트 전체를 4~6px 원형 순환선 하나로 그리고, 시계방향으로 B·V / A·S·D·P / W·R 여덟 역을 배치했다. 세 호는 경험·학습·놀이·운영 색으로 분할하고 D·P 구간과 역은 점선·저채도로 표시했다. 12시 환승 홀은 큰 원으로 두고, 모바일에서도 같은 정사각형 SVG를 유지한다. 목록은 순환선 순서의 세 구간과 역 행·한마디·하위 링크로 구성했다.
- 홈 비교안: `home-alt.html`에 경험선·학습·놀이선·운영선이 중앙 환승 홀에서 교차하는 안을 제작했다. D·P 연장 구간은 점선이다. **권고는 순환선 주안**이다 — 모바일과 데스크톱에서 공간 문법이 하나로 유지되고, 서비스 여덟 개의 탐색 순서가 한 바퀴로 명확하다. 비교안은 분류 관계는 직접적이지만 중앙과 상단 라벨 밀도가 더 높다.
- 스플래시: 14칸 고정 플랩을 `WORKAROUND` → `WORKING AROUND` → `MIND THE GAP` → `DOORS OPENING` 순으로 10초 안에 전환했다. 33%·66% 티커 교체와 85% 문 열림에 플립 시점을 맞추고 기존 소문자 중복 문구는 제거했다. 순수 CSS이며 reduced-motion에서는 첫 플랩·첫 티커와 열린 배지를 정적으로 보인다.
- 여행 기록: DAY 1~6 본문을 로그 초안의 `실제 경과` 여섯 줄로 교체했다. 헤더에는 `523만원 / 계획 856만원`(61%, 상한 950만원) 얇은 진행선, 미확인 5건 표기, 출발 전 450만원 행을 넣었다. 각 일차 아래에는 확인 가능한 항목·합계 한 줄을 면 없이 표시했고 남은 정류장은 계속 흐리게 유지했다.
- 실렌더 검증: Chromium 151.0.7922.34의 390×900·1440×900에서 두 홈 안·여행 기록·목차를 검사했다. 가로 overflow 0, SVG 자체와 모든 SVG 텍스트의 viewBox 이탈 0, 홈/비교안 역 8개·목록 3구간·D/P 점선, 데스크톱 2단·모바일 단일열을 확인했다. 모바일 SVG 역명 계산 크기는 11px 이상이다.
- 플랩/콘텐츠 검증: 네 플랩 모두 셀 14개이며 0초·3.4초·6.8초·8.9초에 목표 문구가 우세하고 10.2초 문 개방을 확인했다. 여행 실제 경과 여섯 줄은 원문 문자열과 일치하며, 일차별 지출 6행·누적 진행선·사전 결제 행을 확인했다. `prefers-reduced-motion`의 플랩·티커·문·진행선 애니메이션은 모두 `none`이다.
- 완료 게이트: `npm --prefix frontend run build` 통과(Vite 6.4.3, 37 modules), `frontend/dist/mockups/` 15개와 source 바이트 일치, 전 파일 배너 1회·viewport·외부 의존·script 0, 목차 로컬 링크 대상 존재, `git diff --check` 통과. 스크린샷과 검사 결과는 `/private/tmp/tkt102-r6/`, 재현 스크립트는 `/private/tmp/tkt102-r6.verify.cjs`에 있다(임시 경로).
- 제약: Safari/WebKit 실기, 실제 앱 이식, commit·push·배포·PM 최종 판정은 수행하지 않았다. PM 지시에 따라 이번 r6를 마지막 목업 라운드로 마무리하고 이후 부관은 조사 브리프·급한 티켓 대타 레인으로 복귀한다.


## r8 지시 (PM, 2026-09-14 — 담당 **codex-8 디자이너**) — 홈 노선도 안 C "순환선 + 환승 지선"

대상: `home.html` 재작업 (r6 순환선 파일을 출발점으로). 다른 파일 무변경.

1. **구조 (D-015 안 C)**: 단색 굵은 링(순환선 = 사이트, 노선색 아님 — 흰/회 4~6px). 링 위 환승역 8개 = 노선(B·V·A·S·D·P·W·R), 12시에 환승 홀(기점, 큰 원). 구간명(경험·학습·놀이·운영)은 호를 따라 작은 글자로만 — 링 색 분할 금지.
2. **지선**: 각 환승역에서 **노선색 선이 바깥으로** 방사. 지선 정류장 = 하위 화면 — B: 공개 아카이브→글 상세→Writing Studio / V: 여행 준비→오늘→기록 / S: 격납고→엘리베이터→택시→화이트채플 / A·W·R: 정류장 1개(노선명). 미개통 D·P: 점선 stub + 흐린 이름. 정류장은 작은 원, 이름은 지선 끝 방향으로 정렬.
3. **비율**: 정사각(viewBox 정방형), 지선은 짧게(링 반지름의 40~60%) — 모바일 폭 100%에서 라벨 하한 11px·겹침 0. 데스크톱 좌 지도·우 목록 2단 유지.
4. **목록**: 구간 헤더 → 환승역(노선) 행 → 인라인 정류장 링크 (r6 목록 구조 유지).
5. 원칙 1~6·지침 검수 체크리스트 자기 적용 후 제출. 390/1440 오버플로 0, script 0, `<text>` 안 HTML 태그 금지.


## r9 지시 (PM, 2026-09-14 — 담당 codex-8, r8 뒤) — 순환선 심볼 시안 + 스플래시 현행 UI 기반 정적 프레임

1. **순환선 심볼 시안 3개** → `design/proposals/2026-09-14-loop-symbol.html` (한 페이지에 3안 나란히, 각 24/48/96px + 상단바 배치 예 + 파비콘 16px 예). 조건: 단색 링 + 12시 기점 점을 기본으로 변주(선 두께·기점 표현·끊김 등), 텍스트 없음, 색은 안전 노랑(`--safety`)/흰색 2가지로 렌더. **취향이 드러나는 과제 — 근거 한 줄씩.**
2. **`splash.html` 플립 CSS 개선 (PO 정정: 애니메이션 유지, 품질을 현행 수준으로)**: 현행 사이트의 split-flap(`frontend/src/App.vue` splash 섹션 + `styles.css` 플랩 클래스, TKT-070/077 정합 결과)을 **읽고 그 동작을 순수 CSS 로 재현**한다 — 셀은 상·하 두 반쪽, 상단 반쪽이 앞으로 접히며(rotateX, backface-visibility) 다음 글자의 하단 반쪽이 드러남, 셀별 시차(좌→우 30~50ms), 끝에 살짝 바운스, 글자 반쪽 정합(line-height/clip 정확), 힌지 선 1px. 문구 시퀀스 3단계 `WORKING AROUND → MIND THE GAP → DOORS OPENING`(14칸 고정). 좌우 패널 갈라짐 연출은 유지하되 플랩보다 튀지 않게. 배경·보드 구조·10초·티커 3회는 현행 UI 기준. 배지는 1번 시안 중 1안(PM 선택 전).
3. 검증은 r5 절차. `index.html` 링크 갱신.

## r10 지시 (PM, 2026-09-14 — codex-8, r9 뒤) — writing-studio.html 표 UX 정정

우측 패널을 버튼 3개(사진 첨부 · H1/H2/H3 · 표 삽입)로 줄이고 미니 표·+행/+열 제거. 본문에 삽입된 표 예시를 넣고, hover 상태(오른쪽 `+열`·아래 `+행`·셀 `⋯`)를 정적으로 표현. 스펙 §6 개정판 기준.


### r8 구현 인계 (codex-8 디자이너, 2026-09-13)

- 제품 변경은 `frontend/public/mockups/home.html` 하나다. 단색 5px 링·환승역 8·12시 환승 홀과 노선색 방사 지선을 구현했다. B/V/S 정류장 3/3/4개, A/W/R 각 1개, D/P 점선 stub. 지선 길이 80 / 링 반지름 145 = 55.2%. r6 목록·목적지를 유지하고 배지색과 링크 누름 영역을 정합했다.
- 원칙 6은 최신 r8 지시·D-015 안 C를 기준으로 적용했다. 원칙·스펙 문서는 수정하지 않았다.
- **자기 체크리스트**: 주인공=노선도 하나 / 읽기 콘텐츠 면 없음(식별 배너·역 원 예외) / 영어 섹션 간판 0(지정 서비스명 유지) / 노선색은 선·배지 / 375px 넘침 0·모든 링크 40px 이상 / r6 카피·r8 정류장명 일치 / 지하철 문자 배지 유지·스플래시 무변경(r9 범위) / 라이트 실렌더 확인. 제작자 자기점검이며 독립 검수·최종 판정이 아니다.
- **게이트**: 최종 Pages-base Vite build 성공(37 modules), source/dist home 바이트 동일, script·외부 의존·SVG text 안 HTML 태그 0. 375/390/1440×900 다크·라이트 6조합에서 라벨 겹침·지도 밖 이탈·페이지 가로 overflow 0. 최소 지도 글자 11.43/11.96/24.12px. HTML 목적지 12개 클릭, Tab→목차→Enter 확인. 다른 목업 14개 SHA 불변·git diff --check 통과.
- **근거**: `docs/reviews/UX-TKT-102-r8.md` 및 `docs/reviews/UX-TKT-102-r8-assets/`(스크린샷·측정 JSON·전후 SHA·재현 스크립트). 확인 URL `/mockups/home.html`.
- **제약/후속**: 앱 코드·다른 목업·원칙·결정 무변경, commit·push·배포·PM 판정 없음. Safari/WebKit·실배포·기존 Advisor 앱 목적지는 미검증. 상단 W 심볼과 스플래시·Studio 목업은 각각 후속 r9·r10 범위로 남겼다.
