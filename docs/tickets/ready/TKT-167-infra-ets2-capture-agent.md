문서 상태: 작성완료

# TKT-167 `[INFRA]` 유로트럭 캡처 에이전트 — `.100` 2초 스크린샷 → R2 푸시

- 상태: ready · **P1** · 담당: codex-2 · 의존: 없음(R2 자격은 PO Q-018 — 없으면 로컬 파일·`/health` 까지 구현하고 업로드는 `.env` 대기). 브랜치 `codex/v0.7.0-tone`. **[반박]·[구체화 질문] 의무.** 스펙 `design/ets2-live-spec.md` §3·§4·§6.
- scope: `services/ets2-capture/**`(신규: `capture.py`·`publisher.py`·`requirements.txt`·`run.ps1`·`.env.example`·`README.md`), `.gitignore`(`services/ets2-capture/.env`, `latest.jpg`). 프런트 무변경.

## 목표
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
