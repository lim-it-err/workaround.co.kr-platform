문서 상태: 작성완료

# TKT-177 `[INFRA]` Pages 딥링크 HTTP 200 — 정적 경로별 `index.html` 복제 (404 셸 폴백은 유지)

- 상태: ready · P2 · 담당: codex-2 · 의존: 없음. 브랜치 `codex/v0.8.0-live`. 근거: AS-R010 제안 1(딥링크가 사람에겐 정상이나 봇·미리보기·상태코드 모니터엔 404), PM [의문] 2026-09-27.
- scope: `infra/public-site/prepare-github-pages.mjs`(정적 8경로 + `/pantry`·`/ets2` + Advisor 3표면·주요 alias 에 `<경로>/index.html` 복제 — `staticRouting.js`·Advisor routes 를 단일 출처로 읽기), `staticRouting.e2e.mjs`(복제 경로 200 단언), README(Pages 절).

## 완료 조건
1. [ ] 위 경로 직접 진입이 HTTP 200(curl)이고 새로고침·`404.html` 폴백은 그대로 동작(임의 경로는 여전히 404 셸).
2. [ ] 경로 목록 하드코딩 0(라우팅 모듈에서 생성), 복제본이 원본과 동일(해시 비교), 산출물 크기 증가 기록.
3. [ ] TKT-160 스모크와 통합(있으면).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
