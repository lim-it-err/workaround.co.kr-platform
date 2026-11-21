문서 상태: 작성완료

# REV-TKT-221-r1 — v0.9 환승 홀 손질 (PM 판정: **통과**)

- 판정: PM(Claude Opus 5.5), 2026-11-21 · 구현: dev 서브에이전트(Haiku 5.5) · 브랜치 `codex/v0.9.0`.
- 진행: 1차에서 범위 밖 기존 E2E 3개(JunctionMap·WorkNotes·staticRouting)가 새 화면과 어긋나 Haiku 가 스스로 blocked → PM 이 기대값만 바꾸는 범위 확장 승인(단언 삭제 없음).

## PM 직접 실행
- unit 46/0 · 관련 E2E 5파일 50 pass / 2 skip / 0 fail(서브에이전트 전체 121/20/0) · `git diff --check` 통과.
- 캡처 확인(`docs/tickets/captures/TKT-221/board-base-375.png`): 7행, 유로트럭 「샘플」·운영 노트 「공개」, 블로그 행 없음, 넘침 없음.
- 버전: `RELEASE_VERSION=0.9.0` 빌드 → `workaround 0.9.0 기동`, 값 없음 → `workaround 기동`(서브에이전트 HallV09 18/0 · 16/2).

## 지적
- [중요·후속] 저장소 변수 `RELEASE_VERSION` 은 PO 가 GitHub 설정에서 만든다(Settings → Secrets and variables → Actions → Variables). 릴리스마다 값 갱신. 실제 Actions 에서는 미검증.
- [중요·후속] `.100` 웹 이미지(`infra/home/web.Dockerfile`, codex/v1.0.0)도 빌드 인자로 `RELEASE_VERSION` 을 넘겨야 같은 표기가 된다 — v1.0.0 쪽 후속.
