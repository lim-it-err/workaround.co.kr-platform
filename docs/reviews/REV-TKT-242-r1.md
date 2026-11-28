문서 상태: 작성완료

# REV-TKT-242-r1 — 맥 로컬 시작 명령 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증
- `tools/local-start.sh` → 「메인 실행: http://127.0.0.1:7000」, 다시 실행 → 「이미 실행 중」, `tools/local-stop.sh` → vite·npm 내림, `.local/*.pid` 삭제 확인.
- 구현자: `all`(mock) 메인+advisor 기동·`/health` profile mock·전부 해제, `--profile claude` 키 없이 rc=1·잔여 없음, `bash -n`·`zsh -n`.

## 지적
- `[제안]` 7000 이 AirPlay 와 겹쳐도 vite 가 127.0.0.1:7000 에 붙어 공존 — 7001 밀림 경로는 미검증. 메인 포트를 7000 에서 옮기는 것은 별도 판단.
