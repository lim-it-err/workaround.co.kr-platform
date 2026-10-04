문서 상태: 작성완료

# TKT-167 `[INFRA]` 유로트럭 PoC 편입 마감 + R2 퍼블리셔 (개정 v2 — 캡처 에이전트 신규 개발 폐기)

- 상태: ready · **P1** · 담당: **codex-7 (`.100` Windows, [ETS2-WIN])** — 2026-10-05 D-028 재배정(구 codex-2) · 의존: 없음(R2 자격은 PO Q-018 — 없으면 로컬 파일·`/health` 까지 구현하고 업로드는 `.env` 대기). 브랜치 `codex/v0.8.0-live`. **[반박]·[구체화 질문] 의무.** 스펙 `design/ets2-live-spec.md` §3·§4·§6.
- scope(v2): `services/ets2-adas/publisher/**`(신규), `services/ets2-adas/README.md`·`.env.example`, `services/ets2-adas/server.js`(`POC_ALLOWED_ORIGINS` 1개만), `.gitignore`. 프런트 무변경. PoC 제어·네이티브 코드 불가침.

## 개정 (2026-09-27 밤, PM) — 스펙 v2 §C
PO 제공 PoC 를 `services/ets2-adas/` 에 편입했다(PM, 개인정보 치환·바이너리 제외 — `IMPORT-NOTE.md`). **캡처를 새로 만들지 말 것.** 이 티켓의 범위:
1. 편입 마감: README 에 사이트 연동 절·서비스 계약 예외(Dockerfile 없음)·`.gitignore` 제외 목록, `tests/*.cjs` 가 `node --test` 로 macOS 에서도 도는지(네이티브 제외) 확인.
2. `publisher/publish.py`(Python 표준 라이브러리 + boto3): 2초마다 `GET /api/frame.jpg`(변경 시만)·`GET /api/state` → R2 `latest.jpg`·`meta.json`(읽기 값만, 스펙 v2 §A 스키마). `DRY_RUN`·재시도·`blank` 처리. 단위 테스트(스키마·변경 감지·백오프).
3. `server.js` 에 `POC_ALLOWED_ORIGINS`(쉼표 목록) 환경변수 1개 — 기본은 현행(루프백만). 개발자 페이지의 SSH 포워드 접근용. 이 외 PoC 제어 로직은 수정하지 않는다.
4. `mods/` 는 그대로 보존.

## (구) 목표 — v1, 폐기
Windows `.100` 데스크톱 세션에서 ETS2 창(제목 `Euro Truck Simulator 2`)을 `CAPTURE_INTERVAL`(기본 2초)마다 캡처 → 1280px JPEG q70 → 로컬 `out/latest.jpg` + `out/meta.json` 갱신 → R2(S3 호환, boto3) 로 두 파일 업로드(재시도 3회·지수 백오프, 실패해도 로컬은 계속). `http://127.0.0.1:8010/health` 가 마지막 캡처·업로드 시각·연속 실패 수를 JSON 으로. 검은 화면(평균 밝기 < 5%) 이면 업로드 생략 + `blank: true`. `MASK_REGIONS`(x,y,w,h 목록) 으로 HUD 가림.

## 완료 조건
1. [ ] macOS 에서도 개발 실행 가능(창 매칭 실패 시 전체 화면 폴백) — 리뷰어가 로컬에서 5회 캡처·meta 갱신 확인 가능해야 한다.
2. [ ] R2 자격 없이 `DRY_RUN=1` 로 업로드를 로그로만 — 단위 테스트: 캡처 루프·meta 스키마·blank 판정·마스킹·백오프.
3. [ ] README: Windows 작업 스케줄러 등록(`run.ps1`), 세션 잠금·전체화면 독점 모드 한계, 비밀값 `.env` 만, `/health` 예시. 서비스 계약 예외(Dockerfile 없음) 명시.
4. [ ] 실제 `.100` 실행은 PO 협조(Q-018) — 실행 로그 5분치를 `docs/qa/env100/` 에 남기면 finished.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
