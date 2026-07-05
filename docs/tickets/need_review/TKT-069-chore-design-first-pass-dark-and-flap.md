문서 상태: 작성완료

# TKT-069

## 메타데이터

- 제목: 확정 디자인 1차 반영 - 다크 기본 + 플랩 아래→위
- 우선순위: P2
- 대상 버전: `chore`
- 상태: `need_review`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-069-design-first-pass`

## 목표

확정된 디자인 방향 중 빠르게 눈에 보이는 두 가지를 먼저 실제 화면에 반영한다: 사이트 기본 테마를 다크로 고정하고, 플랩(행선판) 연출을 아래에서 위로 넘어가는 방향으로 바꾼다. 큰 재구현(A 골격 + C 노선도 환승 홀 + App.vue 컴포넌트 분해)은 디자이너 통합 스펙 이후 별도 티켓으로 다룬다.

## 작업 내용

1. 기본 테마를 다크로 고정한다. `frontend/src/styles.css`/`App.vue` 의 테마 초기값을 다크로 두고, 라이트는 토글로만 진입하게 한다(사용자 미선택 시 다크).
2. 플랩 방향을 아래→위로 바꾼다.
   - 현재는 위 플랩이 `rotateX(0 → -90deg)` 로 떨어지는 위→아래 연출이다.
   - 상단 고정판 아래에서 다음 글자가 올라오는(아래→위) 연출로 회전축/키프레임을 뒤집는다.
   - 참조 구현: `design/mockups/2026-07-05/variant-a-seoul-signage.html` 와 `variant-c-night-line.html` 의 플랩 CSS/JS 를 기준으로 하되 방향만 아래→위로 조정한다.
   - `prefers-reduced-motion` 시 결과만 표시, `다시 재생` 유지.
3. 회귀 확인: 스플래시 → 메인 허브 전환, 다크에서 대비/가독성, 플랩 완주가 자연스러운지 본다.

## 범위

- 포함: 다크 기본 고정, 플랩 아래→위 방향 전환, 관련 CSS/JS 조정, 회귀 확인.
- 제외: A 골격 전면 적용, C 노선도 환승 홀, App.vue 컴포넌트 분해, 색 토큰 대개편(모두 후속 UI 재구현 티켓).

## 완료 기준

- 사이트가 기본으로 다크로 뜨고, 라이트는 토글로만 들어간다.
- 플랩이 아래에서 위로 넘어가며 자연스럽게 완주한다.
- `tools/run-frontend-build.ps1` 빌드가 통과한다.

## 선행 조건

- 없음. 디자인 방향은 `design/orchestrator_review/2026-07-05-ux-overhaul-mockups.md` 2026-07-05 방향 확정 항목으로 고정됨.

## 질문/결정 기록

- 결정(2026-07-05, 사용자): 기본 테마 다크, 플랩 아래→위.
- 결정: 큰 재구현(A 골격 + C 노선도)은 이 티켓 범위 밖. 디자이너 통합 스펙 후 별도.
- 보류: 플랩 최종 속도감은 사용자 재확인 대상(현재는 mockup 기본값 유지).

## 선행 읽기

- `README.md`
- `design/orchestrator_review/2026-07-05-ux-overhaul-mockups.md`
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`, `variant-c-night-line.html`
- `docs/frontend-ux.md`

## 작업자 산출물

- 브랜치 이름: `codex/tkt-069-design-first-pass`
- 다크 기본 처리 방식: `readInitialTheme()` 기본값을 `dark` 로 고정해 사용자 저장값이 없을 때 항상 다크로 시작하게 했고, 라이트는 기존 토글로만 진입하게 유지했다.
- 플랩 방향 전환 방식(회전축/키프레임 변경 요약): 스플래시 행선판을 단일 타일 애니메이션에서 상/하 분할 플랩 구조로 바꾸고, 하단 플랩이 먼저 접힌 뒤 상단으로 글자가 올라오도록 키프레임을 재구성했다. `prefers-reduced-motion` 에서는 결과만 노출하고 `다시 재생` 버튼은 유지했다.
- 회귀 확인 결과: 스플래시에서 메인 허브로 자동 전환이 유지되고, 다크 기본 테마에서 대비가 유지되며, 플랩은 아래→위 방향으로 완주한다.
- 테스트 결과:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1` 통과
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-gateway-tests.ps1` 통과
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-docs-encoding.ps1` 통과
- 미검증 항목: 없음
- PR 준비 메모: 스플래시 체감 변화만 빠르게 반영한 1차 티켓이다. 큰 UI 재구성(A 골격/C 환승 홀/App.vue 분해)은 후속 디자인 통합 티켓에서 이어서 다룬다.

## 검토 메모

- 리뷰 포인트: 플랩 속도감과 반동 강도는 CSS 키프레임만 조정하면 되므로, 사용자 취향 피드백이 오면 후속 미세조정이 쉽다.

## Notes

- 이 티켓은 "디자인이 언제 실제로 바뀌나"에 대한 빠른 1차 답이다. 큰 재구현 티켓은 디자이너 통합 확정 시안/스펙(`design/ui-ux-rules.md` 개정)이 나온 뒤 슬라이스한다.
