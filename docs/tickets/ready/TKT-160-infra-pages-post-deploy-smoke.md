문서 상태: 작성완료

# TKT-160 `[INFRA]` Pages 배포 후 스모크 — 정적 경로·Advisor alias 200 확인

- 상태: ready · P2 · 담당: codex-2 · 의존: TKT-115 와 워크플로 파일 공유(먼저 잡는 쪽이 `공유 파일:` 표기). 브랜치 `codex/v0.7.0-tone` — 워크플로 변경은 PM 이 트렁크로 cherry-pick.
- 근거: 배포 성공 = 아티팩트 업로드 성공일 뿐, 라이브 경로가 실제로 200 인지는 사람이 본다(AS-R006 ③ 404 SPA 폴백 관찰 이후 자동화 없음).
- scope: `.github/workflows/deploy-github-pages.yml`(deploy 뒤 `smoke` job), `infra/public-site/smoke-pages.mjs`(신규 — 경로 목록은 `frontend/src/staticRouting.js` 를 읽어 생성, 중복 하드코딩 금지).

## 완료 조건
1. [ ] 정적 8경로 + `/advisor/`·`/advisor/today`·`/advisor/learn`·`/advisor/history` + 파비콘 + 404 폴백(임의 딥링크 → 200 HTML) 을 `curl -fsS` 로 확인, 하나라도 실패하면 job red(배포 자체는 유지).
2. [ ] `workflow_dispatch` 로 톤 브랜치에서 dry-run 가능(115 와 겹치면 `공유 파일:`).
3. [ ] 실행 시간 ≤1분, 결과를 job summary 표로.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
