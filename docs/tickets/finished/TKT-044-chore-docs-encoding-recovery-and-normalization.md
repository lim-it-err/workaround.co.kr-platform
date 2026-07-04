# TKT-044

## 메타데이터

- 제목: 문서 인코딩 복구와 UTF-8 BOM 정규화
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-044-docs-encoding-recovery`

## 목표

`docs/`, `design/`, 루트 `README.md`, `AGENTS.md` 의 운영 문서 저장 인코딩을 `UTF-8 with BOM` 기준으로 통일한다.

## 이번 작업

- 루트 `README.md`, `AGENTS.md`, `docs/**/*.md`, `design/**/*.md` 를 조사했다.
- 총 `88`개 운영 문서를 UTF-8 with BOM 기준으로 재저장했다.
- 실제 의미 수정은 하지 않고 인코딩만 정규화했다.
- 대표 문서를 `Get-Content -Encoding UTF8` 기준으로 다시 읽어 한글 표시를 확인했다.

## 검증 메모

- BOM 누락 재검사 결과: `remaining=0`
- 대표 확인:
  - `README.md`
  - `docs/tickets/board.md`
  - `docs/ticket-policy.md`
  - `design/designer-role.md`
- 현재 범위 기준 실제 텍스트 손상보다 “BOM 유무 혼재”가 주요 원인임을 다시 확인했다.
- 오케스트레이터 판정: 정규화 대상 범위와 재검증 결과가 명확하므로 완료 기준을 충족한 것으로 본다.

## 산출물

- UTF-8 BOM 정규화 완료
- 재검증 명령과 결과
- 후속 가드레일 티켓(`TKT-045`)이 바로 실행 가능한 상태가 됨

## 남은 메모

- 이 티켓은 문서 인코딩 정규화까지만 담당한다.
- 자동 점검 도구와 실행 규칙은 `TKT-045` 에서 마무리한다.
