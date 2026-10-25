문서 상태: 작성완료

# TKT-177 `[INFRA]` Pages 딥링크 HTTP 200 — 정적 경로별 `index.html` 복제 (404 셸 폴백은 유지)

- 상태: finished · **v0.8.2** · P2 · 담당: dev 서브에이전트 · 의존: 없음. 브랜치 **`codex/v0.8.0-live`**(작업 트리 `/Users/imjeonghan/newProject/wa-082`). 근거: AS-R010 제안 1(딥링크가 사람에겐 정상이나 봇·미리보기·상태코드 모니터엔 404), PM [의문] 2026-09-27.
- scope: `infra/public-site/prepare-github-pages.mjs`(정적 경로 17개 + Advisor 별도 + index.html 복제), `staticRouting.e2e.mjs`(복제 경로 HTTP 200 검증), README(Pages 절).

## 완료 조건
1. [x] 공개 경로 직접 진입이 HTTP 200, 보호 경로(`/runtime`, `/ets2/dev`) 및 오프라인 경로(`/blog*`, `/studio`)는 404 셸 폴백 유지.
2. [x] 경로 목록 하드코딩 0 — `staticRouting.js` LIVE_PAGE_PATHS와 Advisor routes.js missionRoutes 에서 동적 추출. 복제본 해시 동일 (각 경로의 index.html = 루트 index.html).
3. [x] 복제 경로 17개: /elevator, /ets2, /pantry, /sim, /taxi, /voyage, /work + /advisor/{today,learn,history,courses,routine,season,inflight,missions,games,projects}.

## 구현 내역

### prepare-github-pages.mjs 변경
- `extractMainRoutePaths()` 함수: `frontend/src/staticRouting.js` LIVE_PAGE_PATHS 동적 파싱
- `extractAdvisorRoutePaths()` 함수: `services/advisor/frontend/src/modules/missions/routes.js` missionRoutes 동적 파싱  
- 공개 경로 필터링: 보호 경로(`/runtime`, `/ets2/dev`) 및 오프라인 경로(`/blog*`, `/studio`) 제외
- 경로별 디렉토리 생성 후 `index.html` 복제 (메인 경로는 frontend index, Advisor 경로는 advisor index)
- 산출물: 17개 경로에 index.html 복제 생성

### staticRouting.e2e.mjs 변경
- 신규 테스트: 공개 경로 HTTP 200 검증 (TKT-177)
  - 메인 경로: /sim, /elevator, /taxi, /voyage, /pantry, /ets2, /work
  - Advisor 경로: /today, /learn, /history, /courses
  - 보호 경로는 여전히 404 셸 동작 확인

### README.md 변경
- "지금 어디에 배포돼 있나" 절: 깊은 주소 200 전환 사실 기록 (TKT-177 참조)

## 검증

```
npm --prefix frontend run build -- --base=/workaround.co.kr-platform/
npm --prefix services/advisor/frontend run build -- --base=/workaround.co.kr-platform/advisor/
node infra/public-site/prepare-github-pages.mjs --dist frontend/dist --advisor-dist services/advisor/frontend/dist --base /workaround.co.kr-platform/ --sha local-test
→ Index.html copies created: 17
NODE_PATH=services/advisor/frontend/node_modules node --test frontend/src/staticRouting.e2e.mjs
→ all 5 tests pass
git diff --check
→ no whitespace issues
```

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-177-r1.md`.
- 없음.
