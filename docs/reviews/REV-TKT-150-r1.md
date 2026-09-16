문서 상태: 작성완료

# REV-TKT-150-r1 — 여행 기록 백업 JSON → 데이터 파일 반영 스크립트 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-15. 리뷰어 초안 없음(코드 티켓이나 도착 직후 판정) — PM 직접.
- PM 게이트(2026-09-15 저녁, 워킹 트리 = 142·145·148·150 + 146 진행분): 메인 Pages-base build 49 modules · unit **25/25** · E2E 스위트별 base 로 **52/52**(Junction 4·RouteMap 4·Collection 2·Replay 3·Blog 2·staticRouting 4·Transfer 2·SimTone 5·taxi 5·ToneTools 12; splash 는 TKT-146 이 재작성 중이라 제외) · Advisor build 110 · unit **81/81** · Playwright **48/48**. 추가로 `node --test src/data/voyageImport.test.mjs` **3/3**.
- 확인: dry-run 기본·`--write` 분리, 백업 우선·데이터 전용값 보존, 사진 data URL → `public/voyage/<tripId>/` 분리(400kB 경고), import 마커 재실행 무중복, `*.voyage-backup.json` gitignore, `docs/voyage-record-import.md` 폰→맥 절차·개인정보 비출력 명시. 제품 화면 변경 0.
- [제안] 병합 로직 ~200줄이 앱이 import 하는 `frontend/src/data/voyages/schema.js` 안에 있다. ES 모듈 tree-shaking 으로 번들엔 안 들어갈 것으로 보이나 파일 역할이 섞인다 — 후속(134 또는 별도)에서 `voyageImport.js` 로 분리 권고. 비차단.
- 공유 파일: `schema.js` 의 `links` 기본값 1줄은 TKT-148 소유(r1 반려·재작업 중) — 무해한 추가라 150 커밋에 포함하고 148 r2 에서 재판정.
- 커밋 범위: `frontend/scripts/voyage-import-backup.mjs`, `frontend/src/data/voyageImport.test.mjs`, `frontend/src/data/voyages/schema.js`, `docs/voyage-record-import.md`, `.gitignore`.
