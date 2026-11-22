문서 상태: 작성완료

# REV-TKT-234-r1 — lite 틀 손질 (PM, 2026-11-22)

판정: **통과** (블로커 0)

## PM 직접 검증 (v0.9.2 전체 게이트 겸)
- 빌드 root·Pages base 통과. unit 56/56. `git diff --check` 클린.
- e2e 전 파일 순차 실행(`--test-concurrency=1`): pass 95 · fail 17 · skip 20.
- **fail 17 은 v0.9.2 와 무관한 기존 실패** — 같은 명령을 `origin/main`(61241bd) 임시 워크트리에서 돌려도 똑같은 17건(엘리베이터·택시·격납고·Work·Runtime·영어 간판·벨베데레↔Advisor, light 테마 포함)이 실패한다. 라이트 테마 제거(TKT-218)·v0.9 개편 이전 단언으로 보인다. v0.9.2 가 더한 lite·환승 홀 e2e 는 전부 통과(main 대비 pass +28).
- 캡처 직접 확인: `captures/TKT-234/pantry-result-375.png`(윗줄 한 줄, 「‹ 뒤로」 같은 줄), `voyage-route-375.png`(펼친 기록이 요약과 같은 열).

## 지적
- `[중요]` 기존 e2e 17건 실패 정리 — 별도 티켓(v0.9.3)로. 지금 상태에서는 「전 e2e 그린」을 릴리스 게이트로 쓸 수 없다.
