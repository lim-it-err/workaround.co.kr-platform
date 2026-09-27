문서 상태: 작성완료

# TKT-100 `[FE]` Writing Studio 전면 재설계 — "글 쓰는 방"

## 메타데이터

- 문서 상태: 작성완료
- 상태: `finished` (REV-TKT-100-r1 통과, PM 판정 2026-09-10)
- 진행 판정: 진행 가능 (인박스 지정·보드 Ready, TKT-097 need_review 확인)
- 우선순위: P1 (PO 직접 발주 2026-09-09)
- 담당: codex-1 (FE)
- 의존: TKT-097 (need_review 진입 시 착수 가능 — 의존성 완화 규칙)
- 관련 스펙: `design/writing-studio-spec.md` (단일 진실 — 이 티켓은 포인터다)
- scope: `frontend/src/App.vue`, `frontend/src/styles.css`, `frontend/src/components/` (스튜디오 분리 컴포넌트 신설 가능), studio 관련 테스트

## 목표

스펙 §2~§3 구현: 크롬 4겹 → 스튜디오 바 1줄, 버튼 7개 → primary 1개(발행)+⋯ 메뉴, 자동저장 기본, 발행 시트, 미리보기 토글, 초안 오버레이 드로어, 전 라벨 한국어.

## 완료 조건 (스펙 §5 그대로)

1. 진입 시 스크롤 0 에서 본문 타이핑 가능 (375×812).
2. 상태 표기 1곳 · primary 버튼 1개.
3. build + 기존 studio 테스트(054·055·056·057 계열) 전부 그린 — **회귀 게이트, 스펙 §4.**

## 구현 메모

- 저장/발행/보관/전환 가드 로직은 **재사용**한다 — 갈아엎는 건 표피(레이아웃·크롬·카피)다. 무결성 로직 재작성 금지.
- `reports/2026-09-09-editor-ux-survey.md` 가 있으면 참고(부관 서베이 — 없어도 착수 가능, 비차단).
- TKT-097 의 localStorage 고지 UI 와 겹치면 스튜디오 바 아래 1줄 배너로 통합.

## 질문/에스컬레이션

(비어 있음)

## 리뷰 기록

(비어 있음)

## 작업자 산출물 (codex-1, 2026-09-09)

- 브랜치: `codex/v0.6.0-line` — 공유 워킹 트리, commit/push 없음.
- `frontend/src/components/WritingStudio.vue`로 스튜디오 표면을 분리했다. 전역 상단 바는 유지하고 역명판·통계·스테퍼·상시 선반·수동 저장·분할 화면은 제거했다. 제목과 본문만 단일 컬럼에 두고, 저장 상태와 시간은 바 한 곳에 표시한다.
- 발행은 주소·요약·태그·현재 보관 여부를 담은 시트에서 확정한다. 모바일은 하단 시트이며, 열려 있는 동안 바의 발행 버튼은 보조 스타일로 바뀐다. 입력 검증 실패 시 시트와 입력을 유지한다.
- 초안·보관 글을 상태 배지가 있는 오버레이 서랍으로 통합하고 기존 초안/공개 복원 액션을 연결했다. 새 초안·보관·발행 취소는 글 메뉴에 둔다.
- 같은 자리 미리보기 토글은 textarea를 보존해 선택 영역을 유지한다. 모달의 Tab 순환·Escape 닫기·호출 버튼 초점 복귀를 지원한다.
- TKT-097의 브라우저 한정 저장 고지는 바 아래 좁은 배너로 유지한다(375px에서는 자연 줄바꿈). 손실 조건과 `내 기록 백업`은 저장 안내에서 열며, 발행 시트에도 원격 공개가 아닌 브라우저 저장임을 표시한다.
- 기존 `persistStudioPost`, `populateStudio`, 자동저장·발행·보관·복원·이탈 가드 및 `renderMarkdownToHtml` 함수 11개의 본문이 착수 전과 동일함을 비교 확인했다. 레이아웃 이벤트 연결과 화면 모드 기본값만 바꿨다.

## 완료 게이트

- [x] `npm --prefix frontend run build` — Vite 35 modules, 성공.
- [x] `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 성공.
- [x] `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` — 3/3 통과.
- [x] `frontend/src/components/WritingStudio.e2e.mjs` — Chromium 8/8 통과. 기존 054~057의 수동 회귀 시나리오를 재현 가능한 브라우저 테스트로 추가했다.
  - 375×812 다크/라이트: scrollTop 0, 본문 시작 y<400, 상태·primary 각각 1곳, 본문 즉시 입력, document/body/scroller/room/dialog 가로 overflow 0.
  - 054/097: 제목만 초안·자동저장·새로고침·현재 편집 대상·수동 slug 잠금·저장 실패/전환 취소 입력 보존.
  - 054: 발행 필수값 검증, 발행 글 자동저장 시 공개 상태 유지, 발행 취소→재발행 후 최초 publishedAt 보존.
  - 055/056: 보관→초안/공개 복원, 상태별 색 구별, 보관/초안/없는 URL not-found, 공개 상세 새로고침·뒤로/앞으로.
  - 057: 순서/중첩 목록·코드 span·문단·안전 링크, raw HTML/위험 스킴/이벤트 속성 비실행, 미리보기 왕복 선택 영역 유지.
  - 097: 저장 범위·손실 조건 고지, 여행 메모+초안 JSON 실제 다운로드. API 요청과 브라우저 오류/경고 0.
- [x] 모바일 편집·발행 시트·서랍의 다크/라이트 및 데스크톱 미리보기 스크린샷 육안 확인. 기록: `/tmp/tkt100-visuals.kn3V3o/` (임시 검증 자료).
- [x] `git diff --check`, 수정 운영 문서 UTF-8 BOM/디코딩 점검 통과. PowerShell 미설치로 BOM 검사는 Node 대체 검사 사용.

### 브라우저 테스트 재현

1. Pages base 빌드 후 `npm --prefix frontend run preview -- --host 127.0.0.1 --port 4174 --strictPort --base=/workaround.co.kr-platform/`.
2. Playwright가 설치된 Node 환경에서 `node --test frontend/src/components/WritingStudio.e2e.mjs` 실행. 이 실행에서는 번들 런타임 `NODE_PATH=/Users/imjeonghan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`를 사용했다.
3. 다른 로컬 origin은 `STUDIO_TEST_URL`로 지정한다. 테스트는 독립 브라우저 컨텍스트의 가상 데이터만 사용한다. 실제 서비스 저장소·배포는 건드리지 않는다.

## 남은 제약

- 기존 localStorage 모델·수동 slug 정규화·저장 실패 시 기존 이탈 확인 문구는 그대로 유지했다. 다중 탭 충돌·서버 저장·원격 발행은 범위 밖이다.
- 초기 프리뷰 base 불일치와 테스트 fixture의 slugLocked 값 누락을 수정한 뒤 전체 게이트를 재실행했다. 임시 프리뷰 서버는 종료했다.
- TKT-102 톤 목업은 승인 대기인 별도 티켓이므로 앱에 이식하지 않았다. 최종 리뷰·커밋·배포는 PM 소관이다.
