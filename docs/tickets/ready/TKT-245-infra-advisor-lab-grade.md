문서 상태: 작성완료

# TKT-245 `[INFRA]` Advisor 실습 push 채점 — `.github/workflows/advisor-lab.yml`

- 상태: ready · **P1 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 의존: TKT-244(`.advisor/mission.json` 형식) · 브랜치 `codex/v0.9.5`.
- 근거: D-042.
- scope: `.github/workflows/advisor-lab.yml`, `tools/advisor-lab-grade.py`(surefire 파싱·result.json), `tools/advisor-lab-review.py`(Claude 리뷰), `tools/__tests__/advisor-lab-grade.test.py`(또는 같은 폴더 fixture), `labs/advisor/README.md` 에 채점 단락 추가.

## 완료 조건
- [ ] 1. 트리거: `push` — `branches: ['lab/**']`, `paths: ['labs/advisor/**']`. 작성자가 `github-actions[bot]` 인 커밋·메시지에 `[skip ci]` 가 있으면 돌지 않는다(되먹임 방지). `concurrency: advisor-lab-${{ github.ref }}`, cancel-in-progress.
- [ ] 2. 바뀐 미션 폴더 찾기: `git diff --name-only ${{ github.event.before }} ${{ github.sha }}`(첫 push 면 브랜치 전체) 중 `labs/advisor/<id>/` 의 `<id>` 목록. `.grade/` 만 바뀐 건 제외.
- [ ] 3. 미션마다 `mvn -B -q test`(JDK 21 temurin, maven cache) — 실패해도 다음 미션 계속. `tools/advisor-lab-grade.py` 가 `target/surefire-reports/*.xml` 을 읽어 `labs/advisor/<id>/.grade/result.json` = `{ missionId, level, commit, gradedAt, compiled, tests, passed, failed, errors, skipped, cases:[{class,name,status,message(앞 300자)}] }`. 컴파일 실패면 `compiled:false` + 빌드 로그 끝 40줄을 `buildTail`. `$GITHUB_STEP_SUMMARY` 에 미션별 표.
- [ ] 4. Claude 리뷰: `secrets.ANTHROPIC_API_KEY` 가 비어 있으면 「키 없음 — 리뷰 건너뜀」 한 줄만. 있으면 `tools/advisor-lab-review.py` 가 `.advisor/mission.json`(rubric·requirements) + 학습자가 바꾼 `src/main/**` 파일(합계 60KB 상한) + result.json 요약으로 Messages API 호출 → `.grade/review.md`(루브릭 항목별 점수·한 줄 근거·총평, 한국어). 모델은 저장소 변수 `vars.ADVISOR_REVIEW_MODEL`, 기본 `claude-opus-5-5`. 표준 라이브러리 `urllib` 만(설치 없음). 키는 env 로만 받고 **로그·파일에 출력 금지**. API 오류면 review.md 에 「리뷰 실패: <HTTP 코드>」 만.
- [ ] 5. 결과 커밋: `permissions: contents: write` 는 이 job 에만. `github-actions[bot]` 로 `.grade/` 만 add → `advisor-lab: <id> 채점 <passed>/<tests> [skip ci]` 커밋 → 같은 브랜치 push. 바뀐 게 없으면 커밋 안 함.
- [ ] 6. 안전: `pull_request_target` 쓰지 않음. 포크 PR 에서는 돌지 않음(push 트리거만). 학습자 코드가 키를 읽지 못하게 — mvn 단계 env 에 키를 넣지 않는다(리뷰 단계에만).
- [ ] 7. 검증: grade.py 단위 테스트(통과·실패·컴파일 실패 fixture XML) `python3 -m unittest`. review.py 는 `--dry-run`(API 호출 대신 보낼 프롬프트 길이·파일 목록 출력)으로 테스트. 워크플로 문법은 `actionlint` 가 있으면 돌리고 없으면 python yaml 로드로 대신하고 그 사실을 적는다. 실제 GitHub 실행은 PM 이 lab 브랜치 push 로 확인(구현자는 push 금지).

## 구현 메모

## 질문/에스컬레이션

## 리뷰 기록
