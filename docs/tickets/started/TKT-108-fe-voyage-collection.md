문서 상태: 수정중

# TKT-108 `[FE]` Line V 컬렉션 전환 — VOYAGES[] + 여행 목록 화면 + 지난 여행 2건

- 상태: started
- 우선순위: P1
- 담당: codex-1 (FE)
- 관련 스펙: `design/voyage-collection-spec.md` (단일 진실)
- scope: `frontend/src/data/voyage.js`→`voyages/**`, `frontend/src/components/Voyage*.vue`·`voyage/**`, `frontend/src/App.vue`(V 진입), `frontend/src/data/lines.js`(V rowStops), 관련 테스트

## 목표
스펙 §1~§3. 동유럽 콘텐츠·화면 회귀 0 을 지키며 컬렉션으로 전환, 여행 목록 화면 신설, 스페인(2024-09)·아이슬란드(2025-09) 시드 등록. 콘텐츠 본문은 PM 이 이후 채운다 — 구조만.

## 완료 조건
스펙 §4 그대로 (목록 3건·강조·기록 진입 / 기존 테스트 그린 + 저장키 이행 테스트 / build·375px).
