문서 상태: 작성완료

# REV-TKT-245-r2 — 통과

- r1 [블로커] 반려: review.py 가 학습자 잡이 만든 changed.txt 를 접두사만 보고 읽음 → `src/main/../../../../proc/self/environ` 로 키가 프롬프트·공개 review.md 에 실릴 수 있음.
- r2 반영 확인: `safe_main_file()`(`..`·절대경로·realpath 포함 검사), publish 잡이 변경 목록을 직접 계산(fetch-depth 0), artifact 는 result.json 만. 테스트 10 OK, yaml 로드 OK.
- 설계 승인: grade(읽기·시크릿 없음·persist-credentials false) / publish(쓰기·키, 학습자 코드 미실행) 2잡 분리. server-side fallbacks 추가 승인.
- 위험: 실제 Actions 실행 미검증 — PM 이 lab 브랜치 push 로 확인 예정. result.json 은 학습자가 조작 가능(연습용 채점, README 명시).

판정: 블로커 0 → finished.
