문서 상태: 작성완료 (PM 추인 2026-09-09 — 대리 발행 초안을 정식 승격)

# TKT-097 — GitHub Pages용 여행·글쓰기 정적 UX 준비

## 메타데이터

- 문서 상태: 작성완료
- 발행자: codex-4 전속부관 (**PM 대리인**, PO 직접 지시)
- 발행 시각: 2026-09-08 KST
- 우선순위: P0 (여행 중 노트북 OFF 열람·작성)
- 상태: `finished` (REV-TKT-097-r1 통과, PM 판정 2026-09-10)
- 담당: `codex-1 화면` `[FE]` 단독
- 대상: 모선 Vue의 Line V·Blog District 정적 사용성
- 배포 티켓: TKT-DRAFT-20260908-0336 (`codex-2 플랫폼` 별도 소유)

## 목표

GitHub Pages처럼 API가 없는 정적 환경에서도 여행 콘텐츠와 글쓰기 기능이 정상적으로 보이고, 같은 브라우저에서 작성 내용이 복원되게 한다. 이 티켓은 프런트 UX만 소유하며 GitHub Actions·Pages 설정은 수정하지 않는다.

## 작업 내용

1. GitHub project base 아래에서도 모선 내부 이동과 Line V/Blog District 진입이 동작하게 한다.
2. `/api` 기능 실패가 앱 전체 오류로 번지지 않게 정적 모드를 분리한다. 서버 전용 기능은 숨기거나 `정적 공개본에서는 사용할 수 없음`으로 표시한다.
3. V03 도시 기록과 Blog District 글쓰기 스튜디오에 `이 브라우저에만 저장됩니다. 다른 기기와 동기화되지 않습니다.` 고지를 둔다.
4. 두 글쓰기 화면에 `저장 중`/`저장됨`/`저장 실패` 피드백을 제공한다.
5. 새로고침 뒤 여행 메모·블로그 초안·현재 편집 대상을 복원한다.
6. 브라우저 데이터 삭제·시크릿 모드·다른 기기에서는 기록이 이어지지 않는다는 제한을 도움말에 적는다.
7. 여행 메모와 블로그 초안을 JSON 또는 Markdown으로 내려받는 `내 기록 백업`을 제공한다. 서버 업로드·로그인은 추가하지 않는다.
8. TKT-DRAFT-0334에서 구현한 공유 링크 전체 여행 콘텐츠와 9/8·9/9 독립 상세 세션을 정적 모드에서 읽을 수 있게 한다.

## 범위

- 수정 허용: `frontend/src/**`, `frontend/vite.config.js`, 관련 프런트 단위/E2E 테스트.
- 금지: `.github/workflows/**`, `infra/**`, gateway/API 구현, Developer Advisor, 계정 동기화, PM 외 commit/push.

## 완료 기준

- 로컬 GitHub Pages base 빌드에서 Line V의 9/8·9/9 상세, 전체 일정, 준비 체크리스트, 도시 기록을 375px로 열 수 있다.
- Blog District에서 초안을 작성하고 저장 피드백을 본 뒤 새로고침해도 내용이 남는다.
- V03 여행 메모도 새로고침 뒤 남는다.
- 여행 메모와 블로그 초안 백업 파일을 내려받을 수 있다.
- 로컬 저장 범위와 손실 조건이 두 글쓰기 화면에서 명확하다.
- API가 없어도 여행·블로그 화면에 미처리 오류가 없다.
- project base 내부 이동과 직접 진입에 깨진 링크가 없다.
- `npm --prefix frontend run build`와 관련 단위/E2E 테스트가 통과한다.

## 질문/결정 기록

- [확정, PO, 2026-09-08] GitHub Pages 1차 공개 대상은 여행 콘텐츠와 글쓰기다.
- [확정, PO, 2026-09-08] 협조 개념 없이 각 worker가 단독 티켓을 소유한다.
- [잠정, PM 대리인] 이 티켓은 codex-1 단독, 배포 티켓은 codex-2 단독으로 분리한다.

## 선행 조건

- TKT-DRAFT-0334의 여행 콘텐츠를 같은 codex-1이 먼저 끝낸 뒤 이 티켓을 수행한다.
- TKT-DRAFT-0336의 배포 구현은 별도 티켓으로 취급한다. 양쪽 완료 후 PM이 통합 검증한다.

## 작업자 전달

- 타이머는 현재 비활성이다. PO가 수동 착수를 지시하면 `codex-1 화면`이 단독 수행한다.

## 구현 결과 (codex-1, 2026-09-09)

- `import.meta.env.BASE_URL`을 기준으로 project base를 보존하는 내부 경로·직접 진입 라우팅을 추가했다. `/voyage`, `/blog-district`, `/blog`, `/blog/:slug`, `/studio`와 기존 검수 경로가 `/workaround.co.kr-platform/` 아래에서도 동작한다.
- project base 빌드를 정적 모드로 분리해 gateway/API 폴링을 시작하지 않고, Work·Runtime·Elevator·Taxi 진입은 `정적 공개본에서는 사용할 수 없음`으로 표시한다. Line V와 Blog District는 정적 이용 가능 상태로 유지한다.
- V03 도시 기록과 Writing Studio에 동일한 로컬 저장 고지·손실 조건을 추가하고, `저장 중`/`저장됨`/`저장 실패` 피드백을 실제 localStorage 기록 결과에 연결했다.
- 여행 스탬프·메모와 블로그 초안을 한 JSON 파일로 내려받는 `내 기록 백업`을 두 글쓰기 화면에 추가했다. 서버 업로드·로그인·계정 동기화는 추가하지 않았다.
- 여행 메모, 블로그 초안, Writing Studio의 현재 편집 대상 복원을 실제 새로고침으로 확인했다. 9/8·9/9 독립 상세 세션도 정적 project base에서 각각 열었다.

## 완료 게이트

- [x] `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` — 3/3 통과.
- [x] `npm --prefix frontend run build` — Vite production build 통과(33 modules).
- [x] `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — Pages base build 통과(33 modules).
- [x] 실제 Chromium 375×812 다크/라이트에서 V03·Writing Studio 확인 — document/body/scroller 가로 overflow 0, 로컬 저장 고지 노출.
- [x] 브라우저 실동작 — 1·2일차 상세, 메모 저장→새로고침 복원, 초안 저장→현재 편집 대상 복원, JSON 백업, 정적 서버 노선 차단, 콘솔 `/api` 오류 0.
- [x] `git diff --check` 통과. 커밋·push 없음.
