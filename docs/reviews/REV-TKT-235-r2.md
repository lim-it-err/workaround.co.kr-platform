문서 상태: 작성완료

# REV-TKT-235-r2 — 낡은 e2e 정리 재작업 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- `npm --prefix frontend run e2e:all`: **pass 150 / skip 20 / fail 0** (215.8s). skip 20 = WritingStudio 14·BlogTone 2·ToneTools Studio 2·HallV09 캡처 2 — 기존 사유.
- r1 블로커 해소: 대문자 간판 검사 원래 정규식 복귀(`JSON` 허용 없음, 원인 문구는 PM 콘텐츠 수정), `run-e2e.mjs` prepareStage 에 VERSION 복사.
- 구현자: e2e:all 2회 fail 0, unit 56/56.

## 결정
- **전체 e2e 게이트 = `npm --prefix frontend run e2e:all`** (구현자 [반박] 수용). 저장소 `CLAUDE.md` 안내를 이 기준으로 고친다.

## 지적
- `[중요]` 구현자 발견 — TKT-237 의 모드 판별이 공개 Pages 에서도 방문자의 `localhost:8080/health` 를 조회한다. 콘솔에 `ERR_CONNECTION_REFUSED` 가 남고, 브라우저에 따라 「로컬 네트워크 접근」 권한 요청이 뜰 수 있다. → TKT-239: 화면이 localhost·127.0.0.1 에서 열렸을 때(또는 `VITE_ADVISOR_API` 를 명시했을 때)만 조회. `VoyageAdvisorTransfer.e2e.mjs` 의 localhost stub 은 그 뒤 불필요해지면 걷는다.
