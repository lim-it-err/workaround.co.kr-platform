문서 상태: 작성완료

# TKT-114 `[FE]` Writing Studio 톤 정합 + 격납고·Work·Runtime 톤 전환

- 상태: finished (2026-09-14, REV-TKT-114-r2 통과) · 우선순위: P2 · 담당: codex-1 · 의존: TKT-110, TKT-105 finished
- 스펙 = **목업 파일이 스펙**: `frontend/public/mockups/<화면>.html` (톤 r5~r7) + 규칙 `design/tone-principles-2026-09-09.md` + 카피 원칙 `design/ux-copy-audit-2026-08-16.md`. 목업의 HTML/CSS 구조·클래스는 이식 출발점으로 재사용한다.
- 브랜치: **`codex/v0.7.0-tone`** (D-016). 트렁크 커밋 금지.
- 공통 완료 조건: 원칙 1~6 충족(면은 조작부만·주인공 1·노선색은 선·영어 간판 0·분류 3묶음·지하철 배지 유지), 375/1440 오버플로 0, build + 기존 테스트 그린, 카피는 목업 문구 그대로.
- scope: `frontend/src/components/WritingStudio.vue`, `frontend/src/App.vue`(simhub/work/runtime 섹션), `frontend/src/styles.css`

## 목표
`mockups/writing-studio.html`(도구 메뉴 배치·중앙 720px·`← 블로그`) · `simhub.html`(격납고 카드 배열, 화이트채플은 TKT-107) · `work.html` · `runtime.html`. 보호 구역 표시는 행 우측 한 마디.

## 구현 내역
- Writing Studio 본문을 최대 720px 중앙 컬럼으로 고정하고 데스크톱 글 도구를 본문 우측 hairline 메뉴로 정렬했다. 모바일 시트·사진 첨부·H1/H2/H3·기능형 표·저장/발행 동작은 그대로 보존했으며 상단 복귀 문구는 `← 블로그`를 유지한다.
- 격납고는 데이터의 `name`과 `/elevator`·`/taxi` 딥링크를 유지하면서 표시 카피만 목업 r2의 `멈춘 엘리베이터`(시스템 설계)·`심야 택시`(제품 판단)로 매핑했다. 두 진입 버튼은 `시작`으로 통일했고 화이트채플은 범위대로 TKT-107에 남겼다.
- Work는 검토 대기 하나를 주인공으로 두고 검토·진행·다음 작업을 세 행으로 요약했다. 버전/작업자/저장 기준과 5레인 보드·상세 편집·command gate는 각각 접힌 상세로 내려 첫 화면의 정보 밀도를 줄이면서 기능을 보존했다. `보호 구역`은 히어로 우측 한 번만 표시한다.
- Runtime은 경고 히어로와 실행 환경 상태 네 행, 새로고침 순서로 재배치했다. API raw 상태는 `정상`·`지연`·`중단`·`확인 중`으로 매핑하고 응답 시간이 있으면 `상태 · n ms`로 함께 표시한다. 오프로드·배포 기준은 접힌 상세로 보존했고 경고 카피는 승인 목업과 일치시켰다.
- 전용 `ToneTools.e2e.mjs`를 추가해 위 네 화면의 375px dark / 1440px light 구조·가로 overflow·브라우저 오류·도구 위치를 고정했다. r2에서는 격납고 표시 카피와 Runtime 한글 상태·응답 시간, raw 상태 비노출 단언을 보강했다.

## 검증
- r2 기본 build와 GitHub Pages base build `vite build --base=/workaround.co.kr-platform/` 모두 통과(각 48 modules).
- r2 전체 프런트 unit 20/20 통과.
- r2 ToneTools Chromium 8/8: 격납고 표시 카피·버튼 2개, Runtime `지연 · 82 ms`·`중단`·`정상 · 41 ms`·`지연 · 126 ms`, raw 영어 상태 0건을 포함해 375px dark / 1440px light를 검증했다. 가로 overflow와 브라우저 오류·경고는 0이다.
- 기존 Writing Studio Chromium 9/9 재통과: 자동 저장·발행·보관·미리보기·표/사진·로컬 백업 회귀 없음.
- r2 격납고·Runtime 대표 캡처 4개를 직접 비교해 다크/라이트와 375/1440px의 위계·판독성·가로 overflow 0을 확인했다.

## 질문 / 반박
- 없음. 전체 기능 보드는 삭제하지 않고 progressive disclosure로 보존해 목업의 첫 화면 밀도와 기존 Work 계약을 함께 지켰다.

## 남은 위험
- Safari/WebKit과 실제 GitHub Pages 배포 환경은 미검증이다. Work·Runtime 실서버 응답 대신 격리 모의 API로 화면 계약을 검증했으며 PM r2 최종 판정과 commit/push가 필요하다.

## PM 답변 r1 (2026-09-14, 반려 — `docs/reviews/REV-TKT-114-r1.md`)
- [블로커 1] Runtime 상태 열: raw `degraded/unavailable/online/unknown` → 한글 매핑(`정상`/`지연`/`중단`/`확인 중`) + 응답 시간 있으면 `정상 · 82 ms`. 근거 `App.vue:874·881→4537`.
- [블로커 2] 격납고 카피: 목업 **r2**(`mockups/simhub.html`, PM 정정) 기준 — 히어로 `멈춘 엘리베이터`(시스템 설계 / "재시도와 상태 복구를 설계합니다." / `시작`), 행 `심야 택시`(제품 판단 / "제한된 정보로 안전한 선택을 만듭니다." / `시작`). 표시 카피만 매핑, 데이터 `name`·딥링크·Line 라벨은 그대로. 목업과 다르면 다음부터 `[구체화 질문]` 을 남긴다.
- [중요] Work 접힌 상세의 영어 눈썹 라벨은 TKT-128 로 분리 — 이 티켓에서 손대지 않는다.
- 재작업 범위: 위 2건 + `ToneTools.e2e.mjs` 단언. r2 → need_review.

## 리뷰 기록
- r1 (2026-09-14, PM): **반려 → started**. 블로커 2(Runtime 영어 상태 토큰·격납고 영어 제목), [중요] 1(→128), [제안] 1.
- r2 (2026-09-14, codex-1): 블로커 2건과 전용 단언을 수정하고 전체 완료 게이트를 재통과해 need_review 요청.
- r2 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-114-r2.md`. 블로커 2건 해소 실화면 확인.
