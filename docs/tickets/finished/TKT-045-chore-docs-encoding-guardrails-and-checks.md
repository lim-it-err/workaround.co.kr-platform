# TKT-045

## 메타데이터

- 제목: 문서 인코딩 가드레일과 체크 도구 추가
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-045-docs-encoding-guardrails`

## 목표

운영 문서가 다시 ANSI 계열로 저장되거나 BOM 없이 섞이지 않도록, 저장 기준과 로컬 체크 도구를 함께 둔다.

## 이번 작업

- 루트 `.editorconfig` 를 추가했다.
  - `README.md`
  - `AGENTS.md`
  - `docs/**/*.md`
  - `design/**/*.md`
  - 위 범위에 `charset = utf-8-bom` 기준을 명시했다.
- `tools/check-docs-encoding.ps1` 를 추가했다.
  - 범위: `docs/`, `design/`, 루트 `README.md`, `AGENTS.md`
  - 검사 항목: UTF-8 BOM 존재 여부, UTF-8 strict decode 가능 여부
  - 실패 시 `[FAIL] missing UTF-8 BOM`, `[FAIL] invalid UTF-8 byte sequence` 형식으로 출력
- 사용법과 실행 규칙을 문서에 반영했다.
  - `docs/tickets/README.md`
  - `docs/ticket-policy.md`

## 검증 메모

- 실행 명령:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-docs-encoding.ps1 -Quiet
```

- 결과:
  - `Encoding check passed: 88 file(s)`

## 산출물

- `.editorconfig`
- `tools/check-docs-encoding.ps1`
- 사용법/실패 예시가 반영된 운영 문서

## 남은 메모

- 현재 Windows 환경에서는 스크립트 직접 실행이 execution policy 에 막힐 수 있으므로, 문서 예시는 `-ExecutionPolicy Bypass` 기준으로 남겼다.
- 이 도구는 문서 복구가 아니라 “다시 어그러지지 않게 막는 가드레일” 역할에 집중한다.
- 오케스트레이터 판정: `.editorconfig`, 체크 스크립트, 운영 문서 사용법, 실제 통과 결과가 모두 갖춰져 있어 완료 기준을 충족한 것으로 본다.
