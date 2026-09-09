문서 상태: 작성완료

# TKT-102 `[목업]` 톤 전환 전 화면 정적 HTML 목업 — codex-4 전담

- 상태: ready
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

(비어 있음)
