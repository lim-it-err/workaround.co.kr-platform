문서 상태: 작성완료

# TKT-105 `[FE]` Writing Studio 도구 메뉴 — 사진 첨부·h1~h3·기능형 표

- 상태: backlog (TKT-102 목업 승인 후 ready)
- 우선순위: P2
- 담당: codex-1 (FE)
- 의존: TKT-102 승인, 사진 업로드 서버측은 TKT-053 [BE]
- 관련 스펙: `design/writing-studio-spec.md` §6
- scope: `frontend/src/components/WritingStudio.vue`, `frontend/src/App.vue`(스튜디오 연결부), `frontend/src/styles.css`, studio 테스트

## 목표
스펙 §6: 도구 메뉴(사진 첨부 — 정적 모드는 localStorage 미리보기까지 / 제목 단계 h1·h2·h3 / **표 삽입 기능형 편집기** — 사용자에게 md 파이프 문법을 노출하지 않는다). 데스크톱 본문 컬럼 중앙 정렬 max-width 720px. `← 블로그` 라벨.

## 완료 조건
1. 표: 행/열 추가·삭제 UI 로 만든 표가 미리보기·발행에서 정상 렌더, 저장 후 재진입 시 복원 (TKT-054 무결성 회귀 그린).
2. 사진: 파일 선택 → 본문에 삽입·미리보기 (업로드 계약은 053 전까지 data URL/localStorage).
3. h1~h3 토글이 기존 마크다운 충실도(057) 테스트와 충돌 없음. build + studio E2E 그린.
