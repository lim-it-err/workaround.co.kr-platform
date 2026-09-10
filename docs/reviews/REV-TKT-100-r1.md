문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-100-r1 (draft) — Writing Studio 전면 재설계 "글 쓰는 방"

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-09
- 대상: `docs/tickets/need_review/TKT-100-fe-writing-studio-rework.md`, 스펙 `design/writing-studio-spec.md`
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform(/frontend)` 절대경로 이동 후 `pwd` 확인(`.agents/claude-reviewer.md` 규칙 준수).

## 완료 게이트 재실행 (스펙 §5, 직접 실행)

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm --prefix frontend run build` (기본) | 통과 — 35 modules | 직접 재실행, claim과 일치 |
| 2 | `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` | 통과 — 35 modules | 직접 재실행, claim과 일치 |
| 3 | `node --test staticRouting.test.mjs staticWritingState.test.mjs voyageCoverage.test.mjs` | 3/3 통과 | 직접 재실행 |
| 4 | `WritingStudio.e2e.mjs` (Playwright, `NODE_PATH`로 codex 런타임의 playwright 사용) | **8/8 통과** | 티켓이 문서화한 재현 절차(Pages base 빌드 → `vite preview --port 4174 --base=...` → `node --test`)를 그대로 따라 직접 실행. claim과 정확히 일치 |
| 5 | 범위 준수 (`App.vue`/`styles.css`/`components/**`/studio 테스트) | 준수 | `git status --short`로 재확인 — 선언 범위 밖 파일 없음 |
| 6 | `git diff --check` (studio scope) | 클린 | 직접 재실행 |
| 7 | 커밋/push 여부 | 없음 | 재확인 |

### 검증 중 발견한 방법론 이슈(자기 정정, 티켓 결함 아님)

Pages base 빌드로 프리뷰(4174)를 띄운 뒤 "기본 빌드" 게이트를 검증하려고 같은 `dist/`에 base 없는 빌드를 다시 실행했더니, 실행 중이던 프리뷰가 그 위에서 자산 경로 불일치로 404를 냈다. TKT-100 코드 문제가 아니라 리뷰어의 검증 순서 실수였음을 Pages base로 재빌드해 확인했다. 이후 브라우저 캐시 오염을 피하려 포트를 4175로 바꿔 재검증했다(TKT-097 리뷰 때와 같은 부류의 캐시 함정 — 이번엔 재발 방지 원칙대로 즉시 원인을 특정하고 넘어감).

## 스펙 대조 (design/writing-studio-spec.md §1~§3) — 실브라우저 확인

실행 중인 Pages base 프리뷰(`/studio`)를 직접 열어 스펙 §1이 지적한 문제들이 실제로 해소됐는지 육안 확인:

- **크롬 1겹**: station-topbar 아래 스튜디오 바가 정확히 1줄. 역명판 헤더·스테퍼·통계 타일 전부 없음 (§3.1 충족, §1-1/§1-2 해소).
- **스튜디오 바 구성**: 좌 `← 나가기` + 문서 제목, 우 `저장됨 HH:MM`(상태 텍스트 1곳) · `미리보기` 토글 · `발행`(화면에서 유일하게 색이 채워진 버튼 = primary) · `⋯` 글 메뉴 — §3.2와 정확히 일치.
- **`⋯` 메뉴**: 클릭 시 "초안 서랍 / 새 초안 / 보관 / 저장 안내·백업" 팝오버 — §3.6 + TKT-097 통합 항목이 정확히 반영됨.
- **초안 서랍**: 오버레이 드로어(우측 슬라이드)로 열리며 상태 배지("초안", 색상 구분)와 복원 동작 존재 — §3.6 충족.
- **TKT-097 배너 통합**: 스튜디오 바 바로 아래 "이 브라우저에만 저장됩니다..." 1줄 배너로 통합됨 — 티켓의 "구현 메모" 3번째 항목과 정확히 일치.
- **카피**: 화면에 노출된 모든 UI 라벨이 한국어(나가기/미리보기/발행/글 메뉴/초안 서랍/새 초안/보관/저장 안내와 백업). 안내문 산문이 사라지고 배지·버튼 이름만 남음 — §3.7 충족.
- **버튼 7개→1개**: 이전 "저장" 수동 버튼이 화면에 없음(자동저장만) — §3.3 충족, E2E 테스트 5번째 줄의 `지금 저장` 버튼 count=0 검증과도 일치.

## 무결성 로직 재사용 여부 (적대적 관점 — "표피만 교체, 로직 재작성 금지" 준수 확인)

- 티켓은 "`persistStudioPost`, `populateStudio`, ... `renderMarkdownToHtml` 함수 11개의 본문이 착수 전과 동일함을 비교 확인했다"고 주장한다. 직접 grep한 결과 이 함수들은 **여전히 `frontend/src/App.vue`에 정의**돼 있고 `WritingStudio.vue`(신규, 순수 표현 컴포넌트)로 이관되지 않았다 — 로직을 껍데기 교체와 분리 유지했다는 구조적 근거.
- 행동 검증은 코드 대조 대신 `WritingStudio.e2e.mjs`의 실제 실행 결과에 의존했다(적절하다고 판단): 자동저장, slug 잠금, 발행 검증·요약 필수, 발행 취소→재발행 시 최초 publishedAt 보존, localStorage 쿼터 초과 시 저장 실패→입력 보존→나가기/새 초안 가드→복구 후 재저장, 보관↔초안↔공개 3상태 복원과 비공개 딥링크 404, 마크다운 리스트/코드/링크 충실도와 `javascript:`/`<script>`/`onerror`/`onmouseover` XSS 페이로드 무력화, 발행 시트 Tab 순환·Escape 복귀 — **전부 실제 헤드리스 브라우저 실행으로 8/8 통과.** 자기기만적으로 오답을 고정하는 테스트가 아니라 실제 DOM 구조·ARIA role·다운로드 파일 내용까지 검사하는 실질적 테스트로 판단됨.

## 완료 판정 3개 항목 (스펙 §5) 실측

1. **진입 시 스크롤 0, 즉시 타이핑(375×812)**: E2E에서 `page-scroller.scrollTop === 0`, body 박스 `y<400` 실측 통과. 리뷰어가 직접 연 데스크톱 화면에서도 크롬 1줄 아래 즉시 본문 영역 확인.
2. **상태 1곳·primary 1개**: E2E에서 `.writing-room [role=status]:visible` count=1, `.primary-button:visible` count=1 실측. 리뷰어 육안 확인도 일치(초록 "발행" 버튼만 색이 채워짐).
3. **build + 기존 studio 테스트 전부 그린**: 위 게이트 표 참조, 전부 통과.

## 지적사항

없음. 이번 검증에서 [블로커]/[중요]/[제안]급 결함을 발견하지 못했다.

## 종합 의견 (초안 — 최종 판정은 PM)

완료 게이트 4종(기본 빌드·Pages base 빌드·공유 node 테스트 3개·전용 Playwright E2E 8개)을 전부 직접 재실행으로 재확인했고, 스펙 §1~§5의 모든 항목을 실브라우저 조작으로 하나씩 대조했다. "로직 재작성 금지" 제약도 구조(함수가 App.vue에 그대로 남음)와 행동(E2E 8/8, XSS·발행 검증·3상태 복원 포함) 양쪽으로 뒷받침됨을 확인했다. 범위 위반 없음, 커밋·push 없음. finished 전환에 결격 사유를 찾지 못했다 — 이번 사이클 세 티켓(097/098/102) 중 가장 깨끗한 결과다.

## PM 판정 (2026-09-10) — **통과 → finished**
PM 재실행: 합산 build 그린, 정적 테스트 통과. 스펙 §5 실측 3항목 전부 충족 확인(리뷰어 E2E 8/8). 블로커 0.
