문서 상태: 작성완료

# TKT-102 `[목업]` 톤 전환 전 화면 정적 HTML 목업 — codex-4 전담

- 상태: `need_review` (r3 통과 — PM 2026-09-11, PO 최종 육안 승인 대기)
- 우선순위: P1 (PO 지시 2026-09-09 — "모든 변경될 화면이 html로 있으면 좋겠어")
- 담당: codex-4 (전속부관 — 예외적 제작 티켓, 앱 코드 무접촉)
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
