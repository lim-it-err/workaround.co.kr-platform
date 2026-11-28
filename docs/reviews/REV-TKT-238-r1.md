문서 상태: 작성완료

# REV-TKT-238-r1 — Advisor 코드 zip 에 빌드 파일 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- 구현자 게이트: `vitest run src/modules/missions/utils` 6/6, advisor build 성공, diff --check 0.
- **실미션 컴파일**(구현자는 장난감 App.java 로만 확인 → PM 이 실데이터로 재확인): `sampleContent.js` 의 실제 미션 3개(`s1-wine-01` 파일 1개, `s2-zoning-01` 4개, `s3-interest-01` 5개)를 `buildMissionEntries`+`buildZip` 으로 만들어 풀고 `JAVA_HOME=JDK21 mvn -q compile` → 셋 다 exit 0.

## 지적
- `[제안]` 빌드 파일 판정이 루트 경로만 본다 — 미션 파일은 전부 `src/...` 아래라 실해 없음. 그대로.
