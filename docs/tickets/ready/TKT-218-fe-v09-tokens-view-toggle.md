문서 상태: 작성완료

# TKT-218 `[FE]` v0.9 디자인 토큰 — 검은 기본 + lite(CRT) 보기 전환, 라이트 테마 제거

- 상태: ready · **P1 · v0.9.0** · 담당: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.9.0`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: D-035 보완(기본 A + lite C, 라이트 테마 폐지, 토글 `기본 / lite`, `?view=lite`), D-036. 시안 `design/mockups-v0.9/hall-12.html`.
- scope: `frontend/src/composables/useTheme.js`(→ 보기 상태), `frontend/src/App.vue`(상단바 토글·루트 속성만), `frontend/src/styles.css`(토큰 블록·`[data-theme=light]` 규칙 제거·lite 토큰 추가), 테마 관련 E2E 기대값.

## 목표
사이트 전체가 검은 바탕 하나로 고정되고, 상단바에서 `기본 / lite` 를 바꿀 수 있다. lite 는 녹색 인광(CRT) 팔레트와 주사선. 각 화면의 정보 축약(lite 에서 보조 정보 숨김)은 화면별 티켓에서 한다 — 이 티켓은 팔레트·전환 장치만.

## 완료 조건
1. 라이트 테마 제거: 해·달 버튼과 `[data-theme="light"]` 스타일 규칙 0. 저장값 `workaround-theme=light` 가 남아 있던 브라우저도 검은 화면으로 열린다.
2. 보기 전환: 상단바 `기본 | lite` 2칸 토글(각 ≥40px, `aria-pressed`). 루트에 `data-view="base|lite"`. 선택은 localStorage `workaround-view` 에 기억(읽기·쓰기 try/catch). URL `?view=lite` 로 열면 lite(저장값보다 우선, 저장값은 바꾸지 않음).
3. 토큰: 시안 `hall-12.html` `:root` 의 기본 팔레트(바탕 #0c0c0c 계열·노선 5색)와 lite 팔레트(#031008 바탕·#8dffb0 글자·주사선 `::after`, `pointer-events:none`)를 `styles.css` 토큰으로. lite 에서 노선색은 모두 인광 녹색 하나. 주사선·글로우는 `prefers-reduced-motion` 과 무관(정적)하나 `forced-colors` 에서는 끈다.
4. 기존 화면이 기본 보기에서 깨지지 않는다: 환승 홀·여행·자취 밥상·운영 노트·유로트럭 375/1440 캡처에서 글자 대비 4.5:1 이상(본문), overflow 0. 화면 모양은 크게 바뀌어도 된다(검은 기본 = 기존 다크와 거의 같음).
5. 게이트: build, unit, `e2e:all`(라이트 테마 전제 테스트는 삭제가 아니라 「라이트 없음」 단언으로 교체), `git diff --check`. 375/1440 × 기본/lite 캡처 경로 기록.

## 구현 메모
- 글꼴은 이번엔 바꾸지 않는다(고정폭 전환은 화면별 티켓에서 판단).
- 검증 행렬은 지금의 다크/라이트 자리를 기본/lite 로 바꾼다(D-035).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- (대기)
