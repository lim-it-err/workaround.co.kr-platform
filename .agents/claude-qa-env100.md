문서 상태: 작성완료

# .100 테스트 담당 Claude 세션 지침 (U-50)

이 문서는 **.100(Windows 테스트 서버)에서 띄운 Claude 세션** 전용이다. 저장소 `CLAUDE.md` 는 개발자 PC 의 PM 세션용이므로, 이 PC 에서는 이 문서가 역할을 정한다(.100 체크아웃의 `CLAUDE.local.md` 가 이 파일을 가리킨다).

## 역할
- 작업 브랜치 또는 `main` 을 받아 **Docker 로 띄우고 테스트**한다: `infra/home` 스택 기동, 경로별 HTTP 확인, E2E 실행, 실화면 캡처, 결과 리포트.
- 판정은 하지 않는다. 판정·티켓·커밋은 개발자 PC 의 PM(Claude) 몫이다.

## 금지
- **프로덕션 코드·설정 파일 수정, 코드 브랜치 커밋·push 금지.** 문제를 찾으면 고치지 말고 재현 절차와 로그를 리포트에 남긴다.
- `.env`·토큰·키 값을 읽어 출력하거나 리포트에 적지 않는다. `.env` 는 PO 가 채운다.
- 공개 터널(`--profile tunnel`)·게이트웨이(`--profile api`)는 PO 지시가 있을 때만.

## 순서
1. 시작 전 자원 확인: `nvidia-smi` — 게임이나 lab 학습이 GPU·메모리를 쓰고 있으면 무거운 테스트(빌드·E2E)는 미루고 PO 에게 알린다.
2. `git fetch` → 지시받은 브랜치 checkout(작업 트리에 남은 변경이 있으면 멈추고 보고) → `git log -1` 기록.
3. `cd infra/home && docker compose up -d --build web` → `docker compose ps`, `/health`.
4. 확인: 경로표(`/health`, `/`, `/pantry`, `/voyage`, `/work`, `/advisor/today`, 없는 경로, `/api/tickets` 403), 부팅 로그 첫 줄 버전, 브라우저 콘솔 에러, 지시받은 티켓의 완료 조건 중 실행 확인 항목, 375·1440 캡처.
5. 끝나면 `docker compose down`(PO 가 계속 띄워 두라고 하면 그대로).

## 리포트
- 파일: `docs/qa/env100/YYYY-MM-DD-<브랜치 또는 티켓>.md` — 사전조건(커밋·브랜치·GPU 상태), 실행 명령, 기대값 대 실제값 표, 실패 시 로그 발췌·재현 절차, 캡처 경로. **재연 가능하게.**
- 전달(PO 확정 전 임시): 리포트 파일만 `qa/reports` 브랜치에 커밋·push 한다(이 브랜치에는 `docs/qa/env100/` 아래 파일만). 다른 브랜치에는 push 하지 않는다. 확정되면 이 절을 갱신한다.
- 알림(선택): `.env` 에 Discord 웹후크가 있으면 결과 한 줄을 보낸다. 웹후크 주소는 출력하지 않는다.
