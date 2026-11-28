문서 상태: 작성완료

# TKT-244 `[INFRA]` Advisor 실습 폴더 만들기 — `tools/advisor-lab.sh` + Codespaces devcontainer

- 상태: ready · **P1 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.9.5`.
- 근거: D-042. PO 「0.9.5는 일단 해보자」.
- scope: `tools/advisor-lab.sh`, `tools/advisor-lab.mjs`, `tools/__tests__/advisor-lab.test.mjs`(node --test), `.devcontainer/advisor-lab/devcontainer.json`, `labs/advisor/README.md`. advisor 프런트 소스는 **읽기만**(import 재사용) — 수정 금지.

## 완료 조건
- [ ] 1. `tools/advisor-lab.sh <미션id> [easy|hard]` (기본: starterTests 있으면 easy, 없으면 hard). 내부는 `node tools/advisor-lab.mjs`. 미션 데이터·zip 엔트리는 `services/advisor/frontend/src/modules/missions/data/sampleContent.js` 와 `utils/zip.js` 의 `buildMissionEntries` 를 **그대로 import** 해 쓴다(화면 zip 과 내용이 같아야 함 — 다르게 만들지 말 것). import 가 vite 전용 구문 때문에 node 에서 안 되면 멈추고 에스컬레이션.
- [ ] 2. 결과: `labs/advisor/<미션id>/` 에 엔트리를 풀고, `labs/advisor/<미션id>/.advisor/mission.json` = `{ id, title, level, rubric, requirements, exportedAt }`(rubric·requirements 는 미션 객체에서). 이미 폴더가 있으면 덮어쓰지 않고 「이미 있습니다 — 지우고 다시 하려면 --force」로 종료 1.
- [ ] 3. 현재 git 브랜치가 `lab/<미션id>` 가 아니면 `git switch -c lab/<미션id>`(이미 있으면 switch) 하고 그 사실을 출력. **커밋·push 는 하지 않는다** — 마지막에 다음 할 일 3줄 출력: 「구현 → `cd labs/advisor/<id> && mvn -q test` → `git add labs/advisor/<id> && git commit -m ... && git push -u origin lab/<id>` 하면 Actions 가 채점합니다」.
- [ ] 4. 알 수 없는 미션 id 면 비슷한 id 3개 제안 후 종료 1. `--list` 는 미션 id·제목·이지 여부 표.
- [ ] 5. `.devcontainer/advisor-lab/devcontainer.json`: 공식 이미지 + features(java 21 + maven, node 20). `postCreateCommand` 없음(무겁게 하지 않음). `customizations.vscode.extensions` 에 Java 확장 팩. 시크릿·토큰 없음.
- [ ] 6. `labs/advisor/README.md`: 이 폴더는 `lab/*` 브랜치 전용이고 main 에 병합하지 않는다, 사용법 3단계.
- [ ] 7. 검증: `node --test tools/__tests__/advisor-lab.test.mjs`(임시 디렉터리 대상 — 엔트리 목록이 `buildMissionEntries` 결과와 같음·mission.json 필드·중복 거부·알 수 없는 id). 실제로 `tools/advisor-lab.sh s7-parcel-01 easy` 를 **scratch 클론이 아닌 임시 출력 경로 옵션 `--out <dir>`**(테스트·검증용, 브랜치 전환 생략)으로 돌려 `mvn -q test` 가 「구현 안 됨」으로 실패하는지(컴파일은 됨) 확인 로그. `git diff --check`. 작업 트리의 브랜치를 바꾸지 말 것(`--out` 사용).

## 구현 메모

## 질문/에스컬레이션

## 리뷰 기록
