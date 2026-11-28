문서 상태: 작성완료

# TKT-247 `[FE]` Advisor 셸을 v0.9 모선 테마로 다시 만들기

- 상태: finished · **P1 · v0.9.6** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.9.6`(작업 트리 `/Users/imjeonghan/newProject/wa-096`).
- 근거: PO 2026-11-28 「developer advisor도 테마에 맞게 다시 만들어줘」. 모선은 v0.9(TKT-218·D-035/D-036)에서 **검은 바탕 하나 + 둥근 프레임 + 상단바(`station-topbar`)** 로 바뀌었는데, Advisor 는 아직 v0.7 시절 남색 토큰(`#0D131C`)·역명판 헤더(`StationHeader`)·**밝게/어둡게 토글**(모선에서 폐지된 라이트 테마)을 쓴다. 그래서 환승 홀 → Advisor 로 넘어가면 다른 사이트처럼 보이고, `platformTheme.spec.js` 가 계속 빨강이다(모선 토큰과 어긋남).
- 기준(읽을 것): `frontend/src/styles.css` 1–95(`:root` 토큰)·96–103(`.app-shell`)·210–217(`.portal-stage` 프레임)·750–770(`.roundel`)·767–820(`.portal-stage`·`.page-scroller`)·4434–4540(`.station-topbar`·`.topbar-actions`·`.ghost-button`), `frontend/src/App.vue` 템플릿의 `<main class="portal-stage">` ~ `.page-scroller`, 실화면 `https://lim-it-err.github.io/workaround.co.kr-platform/pantry`(같은 셸의 서브 화면 예시). `design/mockups-v0.9/lite-pages.html` 70행: **Advisor 는 lite 보기에서 뺀다(PO 지시)**.
- scope (`services/advisor/frontend/` 아래만): `src/app/App.vue`, `src/app/platform.css`, `src/app/styles.css`, `src/app/platformTheme.js`(+spec — 삭제·대체 가능), `index.html`(body 배경·theme 초기화 스크립트가 있으면), 위 grep 에 걸린 e2e 4개(`e2e/platform-frame.spec.ts`·`final-ux-b1-i1.spec.ts`·`season-lifecycle.spec.ts`·`advisor-flow-defects.spec.ts`)의 테마 관련 단언. 모듈 화면(`src/modules/**`)은 **토큰만으로 따라오게** 하고, 하드코딩 색 때문에 검은 바탕에서 깨지는 곳만 최소 수정(파일 목록을 구현 내역에 적는다). `data/` 콘텐츠·메인 `frontend/` 수정 금지.

## 완료 조건
- [x] 1. **토큰**: `platform.css` 의 `:root` 가 모선 `frontend/src/styles.css` `:root` 의 값과 같다(검은 바탕 `--bg #0c0c0c`, `--panel #161616`, `--line #3e3e3e`, `--text #d6d6d6` …, 노선색 포함). Advisor 노선은 모선 지도와 같은 **`line-d`(배움선, `#a9b3ff`)** — 기존 `line-a #7C89F0` 은 버린다. 모듈 어휘 별칭(`--bg-card`·`--fg`·`--accent`·`--good`·`--warn`·`--bad` 등)은 유지해 새 토큰을 가리키게.
- [x] 2. **라이트 테마 제거**: 「밝게 보기/어둡게 보기」 버튼·`:root[data-theme='light']` 블록·`workaround-theme` 키 읽기/쓰기를 없앤다(모선 TKT-218 과 같은 규칙 — 저장값이 light 여도 검은 화면). lite 토글은 **두지 않는다**(Advisor 는 lite 제외). 모선 `workaround-view` 가 `lite` 로 저장돼 있어도 Advisor 는 기본 보기.
- [x] 3. **셸 구조** — 모선과 같은 문법:
   - 바깥 `.app-shell`(padding 18px, 375 에서는 모선 미디어쿼리 값) 안에 둥근 프레임 `.portal-stage`(radius 28px, 1px 테두리, 그림자, 모선 배경 그라디언트).
   - 프레임 첫 줄 `station-topbar`: 노선 원(`roundel`, line-d, 글자 `A`) + 제목 「Developer Advisor」(모선 지도 표기와 동일) + 오른쪽 `topbar-actions` 에 닉네임 칩(있을 때) · 「환승 홀」 ghost 버튼(Pages 에서는 플랫폼 홈으로, 로컬 단독 실행이면 「오늘」로 — 기존 `exitAdvisor` 동작 유지). 하단 3px 노선색 선.
   - 그 아래 탭(오늘/배우기/기록)은 상단바 바로 밑 한 줄, 활성 탭 밑줄 = 노선색. 44px 터치 높이 유지.
   - 본문은 프레임 안 스크롤 영역(`page-scroller` 상당). 푸터 문구(「학습 기록은 이 브라우저에 우선 저장됩니다」)는 프레임 안 맨 아래 작은 글씨로.
   - 기존 `StationHeader` import 는 제거(Advisor 셸 전용 마크업으로). 모선 컴포넌트 파일은 건드리지 않는다.
- [x] 4. **모듈 화면 가독성**: 오늘·배우기(코스 목록/코스)·미션(브리핑·미션·리뷰 탭, 받기 줄, 온라인 채점 결과 카드)·기록 화면이 검은 바탕에서 대비 4.5:1 이상, 흰 카드/밝은 배경이 튀는 곳 0. 버튼 주색(강조 버튼)은 노선색 바탕 + 어두운 글자(`--accent-ink`) 로.
- [x] 5. **테스트**: `platformTheme.spec.js` 를 새 규칙으로 바꾼다 — (a) `platform.css :root` 의 공유 토큰이 모선 `:root` 와 일치(20개 이상), (b) light 블록·`workaround-theme` 참조 없음. 알려진 실패 1건이 사라져 **vitest 전부 통과**. 테마 토글을 단언하던 e2e 는 새 셸 단언(상단바·노선 원·환승 홀 버튼·라이트 토글 없음)으로 교체.
- [x] 6. **검증**: `npx vitest run` 전부 통과, `npx playwright test` 전체, `npx vite build --base=/workaround.co.kr-platform/advisor/`, `git diff --check`. 루트에서 `npm --prefix frontend run e2e:all`(Advisor 합친 dist 경로 포함) 통과. 375·1440 가로 overflow 0.
- [x] 7. **캡처** `docs/tickets/captures/TKT-247/`: 1440·375 × {오늘, 배우기, 미션 탭(받기 줄 보이게), 기록} + 비교용 모선 `pantry` 1440 1장. 직접 열어 보고 구현 내역에 한 줄씩 소감.

## 구현 메모
- 모선 CSS 를 import 하지 말고(6천 줄, 모선 페이지 규칙까지 딸려 옴) 필요한 규칙만 `platform.css` 에 옮긴다 — 파일 상단 주석에 「모선 styles.css 몇 행 기준」 출처 표기.
- 모선 `.roundel` 글자색은 `#fff` 인데 line-d(밝은 periwinkle) 바탕엔 대비가 낮다 — 원 안 글자는 `--bg` 색으로.
- 셸 바깥 `body` 배경도 `#0c0c0c`(스크롤 끝에서 남색이 비치지 않게).

## 질문/에스컬레이션
- [PM 의문] 모선 `workaround-view=lite` 이 저장된 사용자도 Advisor 는 기본(검은) 보기다 — 티켓 지시대로. 환승 홀로 돌아오면 모선은 lite 로 열리는데 Advisor 만 다르게 보이는 점은 의도된 것으로 이해함(`lite-pages.html` 70행). 이견 있으면 알려 주세요.
- [구체화 질문] 닉네임 칩은 이모지(👤)를 뺐다(상단바가 좁아서, 이모지 간판 줄이기). 375 에서는 칩이 `max-width: 6em` 말줄임 — 긴 닉네임은 `…` 로 잘리지만 `title="닉네임 변경"` 과 모달에서 전체를 볼 수 있다. 괜찮은지 확인 부탁.
- `[반박]` 없음.

## 구현 내역
- `src/app/platform.css` 전면 교체 — 모선 `:root` 토큰(검은 `--bg #0c0c0c`, `--line-d #a9b3ff` 등 모선 값 그대로 복사) + 별칭(`--bg-card`·`--fg`·`--accent`=line-d·`--accent-ink`=`--bg`·`--good/warn/bad`). 라이트 블록·`line-a`·`.station-sign` 계열 제거. `.app-shell`·`.portal-stage`·`.roundel`·`.station-topbar`·`.topbar-actions`·`.ghost-button`·`.page-scroller` 만 모선에서 옮김(상단 주석에 출처 행). `.roundel` 글자는 `--bg`.
- `src/app/App.vue` — `StationHeader`·테마 훅 제거. `.app-shell > .portal-stage.line-d` 안에 상단바(원 `A` + 「Developer Advisor」 + 닉네임 칩 + 「환승 홀」(로컬은 「오늘」) ghost 버튼, aria-label 은 기존 「환승 홀로 나가기」/「오늘로」 유지) → 탭 → 본문 → 푸터 문구. 네비 활성 밑줄은 `--accent`(line-d). 375 에서 제목이 한 줄로 들어가도록 ≤480px 에서 상단바 패딩·버튼 패딩 축소.
- `src/app/platformTheme.js` 삭제(`workaround-theme` 읽기/쓰기 없음). `platformTheme.spec.js` 재작성 — 공유 토큰 20개 이상 모선과 일치, line-d 가리킴·별칭 존재, `data-theme`/`workaround-theme`/라이트 없음, 셸 어휘 사용(4 테스트).
- `index.html` — body 배경 `#0c0c0c` 인라인(로딩 순간 색 보호). `LearnPage.vue` — 필터 배지 `color: white` → `var(--accent-ink)`(밝은 line-d 바탕 대비). 모듈 화면은 그 외 수정 없음(하드코딩 색은 모달 스크림·그림자뿐).
- e2e: `platform-frame.spec.ts` — 라이트 반복 제거, 새 셸 단언(상단바·원 `A`·「Developer Advisor」·오늘로 버튼·밝게/어둡게 버튼 0·`.view-toggle` 0·body `rgb(12,12,12)`·`html[data-theme]` 없음), 옛 저장값 light+lite 를 심어도 기본 화면, 코드 색 `rgb(214,214,214)`/배경 `rgb(16,16,16)`. `final-ux-b1-i1`·`advisor-flow-defects`·`season-lifecycle` 는 data-theme 단언·theme 저장 줄 삭제. (`label-bundle`·`review-first-fix` 의 inert 한 `setItem('workaround-theme')` 은 scope 밖이라 두었음 — 무해.)
- 공유 파일: 없음. PM 이 동시 편집 중인 `sampleContent.js`·`DEV-LOG.md` 건드리지 않음. 보드(`board.md`)에 TKT-247 줄이 없어 보드는 수정하지 않음(PM 발행 시 추가 필요).
- 캡처(`docs/tickets/captures/TKT-247/`, 직접 확인):
  - `today-1440/375`: 검은 둥근 프레임, 상단바 원 A(periwinkle)+제목, 하단 3px 노선선, 활성 탭 밑줄 노선색. 모선 pantry 와 같은 문법. 1440 에서 본문이 가운데 좁게(모듈 max-width) 앉아 양옆이 비어 보이는 건 모듈 기존 레이아웃.
  - `learn-1440/375`: 코스 행·필터 가독 양호, 흰 면 없음. 375 제목 「Developer Advisor」 한 줄.
  - `mission-1440/375`: 맨 위 받기 줄(이지/하드/Codespaces)이 노선색 바탕+어두운 글자 주버튼, 375 첫 화면 안에 들어옴.
  - `history-1440/375`: 통계·빈 상태 대비 양호.
  - `mother-pantry-1440`: 비교용(모선 상단바는 노선색이 cyan, 우측에 보기 토글).
- 다시 보이는 어색함: 로컬(단독 실행)에서는 상단바 「오늘」 버튼이 탭 「오늘」과 겹쳐 보인다(Pages 에서는 「환승 홀」이라 무관). 지시대로 유지.

## 검증
- `npx vitest run` — 21 파일 / 140 테스트 통과(알려진 실패 0).
- `npx playwright test` — 76 passed.
- `npx vite build --base=/workaround.co.kr-platform/advisor/` — 성공.
- 루트 `npm --prefix frontend run e2e:all` — 전체 통과 pass 150 / skip 20 / fail 0 (skip 20 은 WritingStudio 14·ToneTools 2 등 기존 러너 skip, 이번 변경과 무관).
- `git diff --check` — 이상 없음.
- 375·1440 가로 overflow — 캡처 8화면 모두 0 (직접 측정). 영어 간판: 「Developer Advisor」·원 `A` 는 브랜드(허용). 
- 참고: playwright e2e 가 TKT-243·246 캡처를 덮어써서 `git checkout` 으로 되돌림(내 변경 아님).

## 리뷰 기록
- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-247-r1.md`
