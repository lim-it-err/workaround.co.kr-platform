문서 상태: 작성완료

# TKT-070

## 메타데이터

- 제목: 스플래시 플랩 실제 split-flap 재현 (플립 모션 정상화)
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `ready`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-070-real-splitflap`

## 목표

`TKT-069` 에서 플립 방향을 다루었으나, 사용자 확인 결과 "글자에 모션만 얹은" 느낌으로 어색하다. 실제 기계식 split-flap 처럼 각 글자 셀이 위/아래 반쪽으로 나뉘어 물리적으로 접혀 넘어가는 연출로 정상화한다.

## 작업 내용

1. 현재 `frontend/src/App.vue` 의 flap-cell 4분할 구조(`flap-static top/bottom`, `flap-dynamic top-flip/bottom-flip`)와 `frontend/src/styles.css` 의 플립 애니메이션을 점검한다.
2. 사용자 관찰(2026-07-06): 지금은 글자 전체에 모션을 얹은 것처럼 보이고, 반쪽 패널이 실제로 접혀 넘어가는 물리감이 없다. "실제로 그렇게 보여야 한다."
3. 레퍼런스: `design/mockups/2026-07-05/variant-a-seoul-signage.html` 와 `variant-c-night-line.html` 의 플립 CSS/JS. 상단 반쪽(현재 글자)이 `rotateX` 로 접혀 넘어가고, 하단 반쪽(다음 글자)이 이어서 완성되는 진짜 split-flap 구조를 그대로 이식한다.
4. 방향은 확정대로 아래→위(상단 고정판 아래에서 다음 글자가 올라오는 느낌)를 유지하되, 핵심은 "글자에 얹은 모션"이 아니라 반쪽 패널이 실제로 접히는 연출이어야 한다는 점이다.
5. 셀별 시차, 문자판(라틴/숫자/한글), `prefers-reduced-motion`, `다시 재생` 은 유지한다.

## 완료 기준

- 스플래시에서 각 글자 셀이 기계식 split-flap 처럼 반쪽 단위로 접혀 넘어간다.
- "글자에 모션만 얹은" 어색함이 사라진다.
- `tools/run-frontend-build.ps1` 빌드가 통과한다.

## 선행 조건

- 없음. `TKT-069` 위에서 마감한다.

## 질문/결정 기록

- 사용자 피드백(2026-07-06): 현재 플립이 이상하다. 실제 물리적 split-flap 으로 보여야 한다.
- 결정: mockup 의 플립을 정확히 이식. 방향 아래→위 유지.

## 선행 읽기

- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `design/orchestrator_review/2026-07-05-ux-overhaul-mockups.md` (플랩 개선 공통 사양)
- `frontend/src/App.vue` (flap-cell), `frontend/src/styles.css`

## 작업자 산출물

- 브랜치 이름
- 플립 재현 방식 요약(반쪽 패널 회전 구조)
- 검증 결과

## 검토 메모

- 없음

## Notes

- `TKT-069` 가 다크 기본과 방향은 맞췄으나 물리 연출이 미흡했다. 이 티켓이 그 마감이다.
