문서 상태: 작성완료

# TKT-105 `[FE]` Writing Studio 도구 메뉴 — 사진 첨부·h1~h3·기능형 표

- 상태: need_review (codex-1 완료 2026-09-13 — PM 최종 판정 대기)
- 우선순위: P2
- 담당: codex-1 (FE)
- 의존: 없음 (사진 업로드 서버측은 TKT-053 [BE] — 그 전까지 정적 미리보기). r5 목업의 도구 메뉴 배치는 참고만, 차단 아님
- 관련 스펙: `design/writing-studio-spec.md` §6
- scope: `frontend/src/components/WritingStudio.vue`, `frontend/src/App.vue`(스튜디오 연결부), `frontend/src/styles.css`, studio 테스트

## 목표
스펙 §6: 도구 메뉴(사진 첨부 — 정적 모드는 localStorage 미리보기까지 / 제목 단계 h1·h2·h3 / **표 삽입 기능형 편집기** — 사용자에게 md 파이프 문법을 노출하지 않는다). 데스크톱 본문 컬럼 중앙 정렬 max-width 720px. `← 블로그` 라벨.

## 완료 조건
1. 표: 행/열 추가·삭제 UI 로 만든 표가 미리보기·발행에서 정상 렌더, 저장 후 재진입 시 복원 (TKT-054 무결성 회귀 그린).
2. 사진: 파일 선택 → 본문에 삽입·미리보기 (업로드 계약은 053 전까지 data URL/localStorage).
3. h1~h3 토글이 기존 마크다운 충실도(057) 테스트와 충돌 없음. build + studio E2E 그린.

## 작업자 산출물 (codex-1, 2026-09-13)

- 데스크톱에서는 중앙 720px 본문 오른쪽에 선형 도구 레일을, 1100px 미만에서는 스튜디오 바 `⋯` 옆에 `＋` 도구 버튼을 배치했다. 나가기 라벨은 `← 블로그`로 바꿨다.
- H1·H2·H3는 현재 선택 줄의 단계를 적용·교체·해제하며 textarea 선택 위치를 유지한다.
- 표는 행·열 추가/삭제와 헤더·셀 입력으로만 편집한다. Markdown 파이프 문법은 만들거나 노출하지 않고, 본문에는 표 블록 참조만 둔 뒤 `tables` 구조화 데이터로 localStorage 저장·복원·미리보기·발행 렌더링을 처리한다.
- 사진은 PNG/JPEG/GIF/WebP/AVIF, 1.5MB 이하 파일만 FileReader data URL로 본문에 삽입한다. 렌더러는 길이와 MIME/base64 형식을 다시 검증하며 SVG data URL과 기존 위험 URL 스킴은 차단한다.
- 기존 자동저장·현재 상태 유지·최초 `publishedAt` 보존·slug 잠금 로직은 변경하지 않고 `tables` 필드만 snapshot/persistence에 포함했다.

## 완료 게이트

- [x] `npm --prefix frontend run build` — Vite 6.4.3, 37 modules, 성공.
- [x] `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 성공.
- [x] `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` — 3/3 통과.
- [x] `frontend/src/components/WritingStudio.e2e.mjs` — Chromium 9/9 통과.
  - TKT-105: H1~H3 적용·교체·해제, 표 행/열 추가·삭제, 파이프 문법 비노출, 사진 첨부, 자동저장, 미리보기, 공개 글, 새로고침 복원.
  - TKT-054/055/056/057/097: 저장 실패 이탈 가드, 공개 상태·최초 발행일, 딥링크·보관 복원, Markdown/XSS, 로컬 백업 회귀 통과.
  - PNG data URL 허용, SVG data URL·`javascript:`·raw HTML 이벤트 속성 차단.
  - 375×812 다크/라이트에서 도구·표 시트와 document/body/scroller/dialog 가로 오버플로 0. 데스크톱 본문 폭 720px 이하 단언 및 캡처 육안 확인.
- [x] `git diff --check` — 성공.

## 검토 메모

- 서버 업로드·원격 동기화는 TKT-053 전까지 의도적으로 구현하지 않았다. 큰 사진이 localStorage 전체 저장 한도를 잠식하지 않도록 파일당 1.5MB 제한을 둔다.
- 최종 리뷰·커밋·배포는 PM 소관이며 이번 작업에서는 수행하지 않았다.


## PM 정정 (2026-09-14 — 긴급) — 표 삽입 UX

- **목업(`mockups/writing-studio.html`)의 우측 패널 미니 표·+행/+열은 오인 소지 — 따르지 말 것.** 스펙 §6 개정판이 기준: 도구 메뉴 = 버튼 3개(사진 첨부·제목 H1/H2/H3·표 삽입). '표 삽입' 클릭 → **본문 커서 위치에 2×2 표 삽입**, 편집은 **본문 안 표 위에서**(hover 가장자리 `+열`/`+행`, 셀 `⋯` 삭제, Tab 셀 이동). 패널에는 표 편집 UI 없음.
- 이미 패널형으로 만들었다면 인라인형으로 전환하고 history 에 한 줄. need_review 상태라면 리뷰에서 이 기준으로 판정한다.
