문서 상태: 작성완료

# TKT-213 `[INFRA]` 배포 경로 규칙 공용 모듈 — prepare·smoke 중복 제거

- 상태: ready · **P2 · v0.8.3** · 담당: dev 서브에이전트(**Haiku 5.5**) · 브랜치 `codex/v0.8.3`(작업 트리 `/Users/imjeonghan/newProject/wa-083`).
- 근거: REV-TKT-160-r1 [제안] — 어떤 경로를 복제(200)하고 어떤 경로를 404 셸로 둘지 규칙이 `prepare-github-pages.mjs` 와 `smoke-pages.mjs` 에 따로 있어, 한쪽만 고치면 점검이 거짓 결과를 낸다.
- scope: 신규 `infra/public-site/route-rules.mjs`, `prepare-github-pages.mjs`·`smoke-pages.mjs`(공용 모듈 사용으로만 수정).

## 완료 조건
1. [ ] `route-rules.mjs` 가 메인 경로(staticRouting.js)·Advisor 경로(routes.js) 추출, 블로그 스위치 판단, 제외 목록(`/runtime`·`/ets2/dev`·`/blog*`·`/studio`)을 한 곳에서 export. 두 스크립트는 이것만 쓴다(정규식·목록 중복 0).
2. [ ] 결과 동일: prepare 후 복제 경로 목록이 변경 전과 같음(전후 출력 비교), `smoke-pages.mjs` 라이브(v0.8.2) 기본 모드 그린.
3. [ ] `node --check` 두 스크립트, unit, `git diff --check`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
