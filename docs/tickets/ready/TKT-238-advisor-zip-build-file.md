문서 상태: 작성완료

# TKT-238 `[FE]` Advisor 코드 zip 에 빌드 파일 — 압축 풀고 IntelliJ 로 바로 열기

- 상태: ready · **P2 · v0.9.3** · 담당: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.3`.
- 근거: REV-TKT-236-r2 후 PM 의문 「zip 에 빌드 파일이 없어 IDE 로 바로 못 연다」 → PO 「너 의문 그대로 해소해도 될 것 같아」.
- scope: `services/advisor/frontend/src/modules/missions/utils/zip.js`, `utils/__tests__/zip.spec.js` 만. (TKT-237 이 같은 모듈의 다른 파일을 동시에 고친다 — 다른 파일 금지.)

## 완료 조건
- [ ] 1. 미션 zip 맨 위에 `pom.xml` 을 넣는다 — groupId `kr.workaround.advisor`, artifactId = mission.id(영문·숫자·하이픈으로 정리), Java 21(`maven.compiler.release` 21), UTF-8, 의존성 JUnit Jupiter 5.10.2(test scope) + maven-surefire 3.2.5. 외부 저장소·플러그인 추가 없음.
- [ ] 2. 미션 파일 중 이미 `pom.xml`·`build.gradle`·`build.gradle.kts` 가 있으면 넣지 않는다(미션 것이 우선).
- [ ] 3. README.md 에 「압축 풀기 → IntelliJ 에서 폴더 열기(Maven 자동 인식) → `mvn -q test`」 세 줄 추가.
- [ ] 4. 검증: `npx vitest run src/modules/missions/utils` — pom 존재·artifactId 정리·기존 빌드 파일 있을 때 생략 단언. 그리고 **실제로** 미션 하나의 zip 을 단위 테스트에서 만든 바이트로 임시 폴더에 풀어 `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -q -o compile` 은 오프라인이라 어려우면 `mvn -q compile` 로 컴파일이 되는지 1회 확인하고 구현 메모에 결과(성공/실패와 이유). advisor `vite build` 통과, `git diff --check`.

## 구현 메모
(구현자)

## 질문/에스컬레이션
(없음)

## 리뷰 기록
(PM)
