문서 상태: 작성완료

# TKT-117 `[FE]` 정차역 상세 편집 — 식당·메뉴·금액·메모·사진·구글 지도 링크 (정적 모드)

- 상태: ready · P1 · 담당: codex-6 · 의존: TKT-109 (need_review 시)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/**`(정차역 시트), `frontend/src/staticWritingState.js`(패턴 재사용), 테스트

## 목표
정차역 시트(데스크톱 우측 패널/모바일 바텀시트)에서 `meals`/`spend`/`photos`/`mapUrl` 을 **현장에서 입력**할 수 있게: 식당명·먹은 것·금액(현지통화+원화)·메모·사진(파일 선택 → data URL 미리보기, TKT-097 localStorage 패턴)·구글 지도 URL(새 탭 링크만, 임베드 금지). 입력값은 여행 id 프리픽스 localStorage, 백업/복원은 097 UI 재사용. 데이터 파일 시드값과 병합 표시(입력값 우선).

## 완료 조건
1. 입력→새로고침→복원. 2. 요금 열·일차 합계·헤더 누적이 입력값으로 갱신. 3. 375px 바텀시트에서 키보드 올라와도 저장 버튼 보임.
