문서 상태: 작성완료

# TKT-238 `[FE]` Advisor 코드 zip 에 빌드 파일 — 압축 풀고 IntelliJ 로 바로 열기

- 상태: finished · **P2 · v0.9.3** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.3`.
- 근거: REV-TKT-236-r2 후 PM 의문 「zip 에 빌드 파일이 없어 IDE 로 바로 못 연다」 → PO 「너 의문 그대로 해소해도 될 것 같아」.
- scope: `services/advisor/frontend/src/modules/missions/utils/zip.js`, `utils/__tests__/zip.spec.js` 만. (TKT-237 이 같은 모듈의 다른 파일을 동시에 고친다 — 다른 파일 금지.)

## 완료 조건
- [x] 1. 미션 zip 맨 위에 `pom.xml` 을 넣는다 — groupId `kr.workaround.advisor`, artifactId = mission.id(영문·숫자·하이픈으로 정리), Java 21(`maven.compiler.release` 21), UTF-8, 의존성 JUnit Jupiter 5.10.2(test scope) + maven-surefire 3.2.5. 외부 저장소·플러그인 추가 없음.
- [x] 2. 미션 파일 중 이미 `pom.xml`·`build.gradle`·`build.gradle.kts` 가 있으면 넣지 않는다(미션 것이 우선).
- [x] 3. README.md 에 「압축 풀기 → IntelliJ 에서 폴더 열기(Maven 자동 인식) → `mvn -q test`」 세 줄 추가.
- [x] 4. 검증: `npx vitest run src/modules/missions/utils` — pom 존재·artifactId 정리·기존 빌드 파일 있을 때 생략 단언. 그리고 **실제로** 미션 하나의 zip 을 단위 테스트에서 만든 바이트로 임시 폴더에 풀어 `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q -o compile` 은 오프라인이라 어려우면 `mvn -q compile` 로 컴파일이 되는지 1회 확인하고 구현 메모에 결과(성공/실패와 이유). advisor `vite build` 통과, `git diff --check`.

## 구현 메모
구현자: dev 서브에이전트(Haiku 5.5), 2026-11-28.
- `zip.js`: `toArtifactId`(영문·숫자·하이픈 정리, 소문자, 빈 값이면 `mission`), `buildPomXml`(groupId `kr.workaround.advisor`, release 21, UTF-8, junit-jupiter 5.10.2 test, surefire 3.2.5) 추가. `buildMissionEntries` 가 pom.xml 을 맨 앞에 넣고, README 에 3줄 추가. 빌드 파일 판정은 legacyFiles+providedFiles 의 **루트 경로**가 pom.xml/build.gradle/build.gradle.kts 와 같을 때만 생략한다 (하위 폴더의 같은 이름 파일은 무시 — 해석 여지, 아래 참고).
- `zip.spec.js`: 기존 `README 맨 위` 단언을 `pom.xml, README.md, ...` 순서로 갱신(완료 조건 1 에 따른 기대값 변경). pom 내용·artifactId 정리·빌드 파일 생략 단언 추가. import 에 `buildPomXml`, `toArtifactId` 추가.
- mvn 실제 결과: 미션 `check-mission`(legacy `src/main/java/App.java` 1개)을 `buildZip(buildMissionEntries(...))` 로 zip 한 뒤 스크래치패드에 풀어 `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q compile` → **exit 0**, `target/classes/App.class` 생성. (온라인 실행, 의존성 해석 포함.)
- 확신 없는 점: (1) 루트 경로만 빌드 파일로 치는 해석, (2) artifactId 소문자 변환 여부(티켓에는 없음), (3) README 3줄은 번호 목록으로 작성.
- `docs/tickets/board.md` 는 scope 밖이라 손대지 않음 (PM 이 갱신).

## 검증
- `npx vitest run src/modules/missions/utils` (services/advisor/frontend): 1 file, **6 passed (6)**.
- `npm --prefix services/advisor/frontend run build`: `✓ built in 1.10s` (exit 0 확인 — 출력 마지막 줄 기준).
- `git diff --check -- services/advisor/frontend/src/modules/missions/utils docs/tickets`: 출력 없음, exit 0.
- `mvn -q compile` (unzip 한 샘플 미션): exit 0.
- 실렌더 확인 없음 — 순수 유틸 변경이라 화면 영향 없음.
- scope 밖 변경 없음 (`git status` 상 `zip.js`, `zip.spec.js` 및 티켓 이동만 내 변경; 나머지 파일은 다른 서브에이전트 작업).

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)

- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-238-r1.md`
