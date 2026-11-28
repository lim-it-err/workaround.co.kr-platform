문서 상태: 작성완료

# TKT-244 `[INFRA]` Advisor 실습 폴더 만들기 — `tools/advisor-lab.sh` + Codespaces devcontainer

- 상태: finished · **P1 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.9.5`.
- 근거: D-042. PO 「0.9.5는 일단 해보자」.
- scope: `tools/advisor-lab.sh`, `tools/advisor-lab.mjs`, `tools/__tests__/advisor-lab.test.mjs`(node --test), `.devcontainer/advisor-lab/devcontainer.json`, `labs/advisor/README.md`. advisor 프런트 소스는 **읽기만**(import 재사용) — 수정 금지.

## 완료 조건
- [x] 1. `tools/advisor-lab.sh <미션id> [easy|hard]` (기본: starterTests 있으면 easy, 없으면 hard). 내부는 `node tools/advisor-lab.mjs`. 미션 데이터·zip 엔트리는 `services/advisor/frontend/src/modules/missions/data/sampleContent.js` 와 `utils/zip.js` 의 `buildMissionEntries` 를 **그대로 import** 해 쓴다(화면 zip 과 내용이 같아야 함 — 다르게 만들지 말 것). import 가 vite 전용 구문 때문에 node 에서 안 되면 멈추고 에스컬레이션.
- [x] 2. 결과: `labs/advisor/<미션id>/` 에 엔트리를 풀고, `labs/advisor/<미션id>/.advisor/mission.json` = `{ id, title, level, rubric, requirements, exportedAt }`(rubric·requirements 는 미션 객체에서). 이미 폴더가 있으면 덮어쓰지 않고 「이미 있습니다 — 지우고 다시 하려면 --force」로 종료 1.
- [x] 3. 현재 git 브랜치가 `lab/<미션id>` 가 아니면 `git switch -c lab/<미션id>`(이미 있으면 switch) 하고 그 사실을 출력. **커밋·push 는 하지 않는다** — 마지막에 다음 할 일 3줄 출력: 「구현 → `cd labs/advisor/<id> && mvn -q test` → `git add labs/advisor/<id> && git commit -m ... && git push -u origin lab/<id>` 하면 Actions 가 채점합니다」.
- [x] 4. 알 수 없는 미션 id 면 비슷한 id 3개 제안 후 종료 1. `--list` 는 미션 id·제목·이지 여부 표.
- [x] 5. `.devcontainer/advisor-lab/devcontainer.json`: 공식 이미지 + features(java 21 + maven, node 20). `postCreateCommand` 없음(무겁게 하지 않음). `customizations.vscode.extensions` 에 Java 확장 팩. 시크릿·토큰 없음.
- [x] 6. `labs/advisor/README.md`: 이 폴더는 `lab/*` 브랜치 전용이고 main 에 병합하지 않는다, 사용법 3단계.
- [x] 7. 검증: `node --test tools/__tests__/advisor-lab.test.mjs`(임시 디렉터리 대상 — 엔트리 목록이 `buildMissionEntries` 결과와 같음·mission.json 필드·중복 거부·알 수 없는 id). 실제로 `tools/advisor-lab.sh s7-parcel-01 easy` 를 **scratch 클론이 아닌 임시 출력 경로 옵션 `--out <dir>`**(테스트·검증용, 브랜치 전환 생략)으로 돌려 `mvn -q test` 가 「구현 안 됨」으로 실패하는지(컴파일은 됨) 확인 로그. `git diff --check`. 작업 트리의 브랜치를 바꾸지 말 것(`--out` 사용).

## 구현 메모

- 구현 내역: `tools/advisor-lab.sh`(얇은 래퍼) → `tools/advisor-lab.mjs`. 미션은 `sampleContent.js` 의 `default.missions` 를, 엔트리는 `utils/zip.js` 의 `buildMissionEntries`·`safeZipPath` 를 그대로 import(vite 전용 구문 없음, node 20 에서 바로 로드됨). 소스 수정 0. 경로 규칙(안전하지 않은 경로·중복 → `files/<n>.txt`)은 `buildZip` 과 같게 `resolveEntries` 로 재현.
- 추가 파일: `labs/advisor/.gitignore`(`**/target/` 만 제외 — `.advisor/`·`.grade/` 는 커밋 대상). scope 밖이지만 mvn 산출물 커밋 사고 방지용, 불필요하면 PM 이 삭제.
- 설계 선택: `--out <dir>` 은 `labs/advisor` 를 대체하는 **기준 폴더**(결과는 `<dir>/<id>/`)이며 브랜치 전환·`git` 호출을 전부 생략. `--force` 는 기존 폴더를 지우고 재생성. `mission.json` 의 `level` 은 실제로 푼 난이도(easy/hard), 미션에 `level` 필드는 없음. 브랜치 전환은 폴더 중복 검사 뒤·쓰기 앞에 수행(중복이면 브랜치도 안 바뀜).
- 확신 없는 점: `git switch` 경로(`--out` 없음)는 이 작업 트리의 브랜치를 바꾸면 안 되어 실행 검증하지 못함 — 코드 리뷰로만 확인. 작업 트리가 더러우면 switch 가 충돌로 실패할 수 있음(그대로 오류 노출).
- `.devcontainer/advisor-lab/devcontainer.json`: `devcontainers/base:ubuntu-22.04` + features java 21(Maven 포함)·node 20, `postCreateCommand` 없음, 확장 `vscjava.vscode-java-pack`. JSON 파싱 확인.
- 카피 점검: 사용자 대면 문자열은 한국어 · 내부 티켓 번호 노출 없음. UI 변경 없어 375/1440 실렌더 해당 없음. `[반박]` 없음.

## 검증

- `node --test tools/__tests__/advisor-lab.test.mjs` → tests 6 / pass 6 / fail 0 (엔트리 목록·내용이 `buildMissionEntries` 와 동일(easy·hard), mission.json 필드, 난이도 기본값, 중복 거부·`--force`, 알 수 없는 id, `--list`). 테스트는 starterTests 유무로 미션을 고르며 특정 미션 내용에 묶지 않음.
- `tools/advisor-lab.sh s7-parcel-01 easy --out <scratch>/lab1` → 파일 7개 생성(pom.xml·README.md·.advisor/mission.json·src/main 4·src/test 1), 다시 실행하면 「이미 있습니다 — 지우고 다시 하려면 --force」 rc=1, 오타 id(`s7-parcl-01`) → 「비슷한 id: s7-parcel-01, s7-tariff-01, s7-tide-01」 rc=1.
- 생성 폴더에서 `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q -o test` → 컴파일 성공, `Tests run: 13, Failures: 0, Errors: 13` 전부 `UnsupportedOperation 아직 구현되지 않았습니다`(의도한 「구현 안 됨」 실패).
- `git diff --check` 통과. 작업 트리 브랜치 `codex/v0.9.5` 유지.

## 질문/에스컬레이션

## 리뷰 기록
- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-244-r1.md`
