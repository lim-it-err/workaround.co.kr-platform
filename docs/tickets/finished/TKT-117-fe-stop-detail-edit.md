문서 상태: 작성완료

# TKT-117 `[FE]` 정차역 상세 편집 — 식당·메뉴·금액·메모·사진·구글 지도 링크 (정적 모드)

- 상태: finished (2026-09-14, REV-TKT-117-r1 통과 · 커밋은 112 와 묶음) · P1 · 담당: codex-1 · 의존: TKT-109 finished
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/**`(정차역 시트), `frontend/src/staticWritingState.js`(패턴 재사용), 테스트

## 목표
정차역 시트(데스크톱 우측 패널/모바일 바텀시트)에서 `meals`/`spend`/`photos`/`mapUrl` 을 **현장에서 입력**할 수 있게: 식당명·먹은 것·금액(현지통화+원화)·메모·사진(파일 선택 → data URL 미리보기, TKT-097 localStorage 패턴)·구글 지도 URL(새 탭 링크만, 임베드 금지). 입력값은 여행 id 프리픽스 localStorage, 백업/복원은 097 UI 재사용. 데이터 파일 시드값과 병합 표시(입력값 우선).

## 완료 조건
1. [x] 입력→새로고침→복원.
2. [x] 요금 열·일차 합계·헤더 누적이 입력값으로 갱신.
3. [x] 375px 바텀시트에서 키보드 올라와도 저장 버튼 보임.

## 구현 기록

- 정차역 시트에서 식당명·메뉴·현지 금액/통화·원화 금액·메모·구글 지도 링크·사진 4장을 편집한다. 구글 지도 HTTPS 링크만 새 탭으로 열고 임베드는 만들지 않았다.
- `voyage:<여행 id>:days` 아래 날짜→정차역 id 구조로 입력값을 저장한다. 시드 시간표에 입력값을 우선 병합하고, 원화 금액의 시드 대비 차액을 일차 합계와 상단 누적 지출에 즉시 반영한다.
- 사진은 1.5MB 이하 이미지의 data URL만 보존하며 localStorage 용량 실패를 사용자에게 알린다. 여행 id를 검증하는 전용 JSON 백업/복원을 기존 기록 영역에 추가했다.
- 모바일 바텀시트는 `86dvh` 안에서 스크롤하고 저장 막대를 하단에 고정했다. 데스크톱은 같은 폼을 우측 패널에 유지했다.

## 검증

- [x] `node --test src/components/voyage/voyageRoute.test.mjs src/staticWritingState.test.mjs` — 2/2 통과.
- [x] `npm run build` — Vite 48 modules 통과.
- [x] `npm run build -- --base=/workaround.co.kr-platform/` — Pages base, Vite 48 modules 통과.
- [x] `VoyageRouteMap.e2e.mjs` — Chromium 375px dark·1440px light 2/2 통과. 입력→저장→새로고침 복원, 사진 미리보기, 요금/일차/누적 갱신, 420px 높이에서 저장 버튼 가시성, 가로 overflow 0, API 요청·브라우저 오류/경고 0.
- [x] 캡처 직접 확인 — 모바일 바텀시트와 데스크톱 우측 패널에서 폼 계층·지도 링크·사진·고정 저장 막대가 겹치지 않음을 확인.

## 질문/에스컬레이션

- 없음.

## 남은 위험

- Safari/WebKit 및 실제 GitHub Pages 배포는 미검증이다. 사진은 브라우저 localStorage 용량에 영향을 받으므로 장당 1.5MB·최대 4장으로 제한했고, 용량 실패 시 저장하지 않고 안내한다.

## 리뷰 기록

- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-117-r1.md`. 커밋은 TKT-112 판정 시 묶음(공유 파일 재수정으로 경계 분리 불가).
