문서 상태: 수정중

# TKT-157 `[콘텐츠]` Advisor 사건 파일 신규 2편 — 중복 결제·환율 캐시

- 상태: started · P3 · 담당: codex-1 · 의존: 없음. 브랜치 `codex/v0.7.0-tone`. 레인: **Advisor(`services/advisor/frontend/`)** — codex-6 기동 시 codex-6, 미기동이면 codex-1 큐 뒤. 콘텐츠 불가침 3파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 수정 금지. **UX 1순위·[반박] 의무.**
- 근거: U-37·D-023. 사건 파일 8편(5일 단서·마지막 날 판정) 구조는 유지 가치 확인(UX-ADVISOR Case [유지]).
- scope: **새 파일** `data/caseFilesSeries2.js`, `data/sampleCaseFiles.js` 는 `extraCaseFiles` 패턴으로 import 한 줄만 추가(기존 편 수정 금지), E2E.

## 편 구성 규칙
5일 단서 · 미끼(red herring) ≥2 · 단서는 전부 사실 · 근본 원인 1개 · 해설에 원인 코드/설정 한 줄. 합성 데이터이며 실제 기관·서비스와 무관함을 파일 머리에.

## 주제 2편
1. **두 번 결제된 비네트** — 결제 재시도·멱등키 부재·타임아웃 이중 처리.
2. **환율이 밤새 바뀐다** — 캐시 TTL·타임존·배치 순서.

## 완료 조건
1. [ ] `/learn#cases` 목록 +2, 각 편 5일 몰아보기 → 판정 → 해설 E2E 1건씩.
2. [ ] 기존 8편 diff 0, 46+ 그린.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
