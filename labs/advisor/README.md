# Advisor 실습 폴더

이 폴더는 `lab/*` 브랜치 전용입니다. **main 에 병합하지 않습니다.**

## 사용법

1. `tools/advisor-lab.sh <미션id> [easy|hard]` — 실습 폴더와 `lab/<미션id>` 브랜치를 만듭니다 (`--list` 로 미션 목록).
2. `labs/advisor/<미션id>/` 를 구현하고 `mvn -q test` 로 확인합니다.
3. `git add labs/advisor/<미션id> && git commit -m "..." && git push -u origin lab/<미션id>` — push 하면 Actions 가 채점합니다.

## 채점 (push 하면 자동)

- `lab/*` 브랜치에 `labs/advisor/**` 를 push 하면 GitHub Actions(`advisor-lab`)가 미션 폴더마다 `mvn -B -q test` 를 돌립니다. 몇 분 뒤 같은 브랜치에 봇 커밋(`advisor-lab: <id> 채점 통과/전체`)이 올라옵니다 — `git pull` 로 받으세요.
- 결과는 `labs/advisor/<id>/.grade/result.json`(컴파일 여부·테스트별 통과/실패)과 `review.md`(루브릭별 점수·총평)입니다. `review.md` 는 저장소에 리뷰용 키가 설정돼 있을 때만 생깁니다.
- 학습자 코드는 키·쓰기 권한이 없는 잡에서만 실행되고, 채점 결과 커밋은 코드를 실행하지 않는 별도 잡이 합니다. 포크 PR 은 채점하지 않습니다.
- 자동 채점은 연습용입니다 — `.grade/` 는 시험 성적이 아니라 힌트로 보세요.
