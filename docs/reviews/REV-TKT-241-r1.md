문서 상태: 작성완료

# REV-TKT-241-r1 — 맥 로컬 종료 명령 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- 아무것도 없을 때 `tools/local-stop.sh --dry-run` → 「떠 있는 것 없음」.
- advisor vite(5173)를 이 저장소에서 백그라운드로 띄움 → `--dry-run` 「내릴 대상: 포트 5173 …」, 실행 → 「내림: 포트 5173 …」, `lsof` 로 5173 해제 확인.
- macOS ControlCenter(AirPlay)가 쥔 7000 은 「건너뜀: 다른 프로젝트」 — 남의 프로세스 보호 규칙 동작.
- 구현자: `./local.sh stop` 다른 셸에서 8080·5173 해제, 저장소 밖 `http.server 8080` 건너뜀, `bash -n`·`zsh -n`.

## 지적
- `[제안]` 7000 을 늘 AirPlay 가 쥐고 있어 매번 「건너뜀: … ControlCenter」 한 줄이 나온다. `/System/` 프로세스는 출력에서 숨기거나, 메인 vite 포트를 7000 이 아닌 값으로 옮기는 것을 다음 후보로.
- `[제안]` `infra/home` compose down 실경로는 미검증(compose 미기동) — .100 이 아니라 맥에서 홈 스택을 띄울 일이 생기면 확인.
