문서 상태: 작성완료

# TKT-077

## 메타데이터

- 제목: 스플래시 플랩 split-flap 정합 (글자 배치/회전 방향/settle 역할) — 오케스트레이터 직접
- 우선순위: P1
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `orchestrator`
- 권장 브랜치: `codex/v0.6.0-line` (직접 수정)

## 목표

`TKT-069`/`TKT-070` 후에도 플립이 "글자에 모션만 얹은" 느낌으로 어색했다(사용자 지목). 시안 A(`variant-a-seoul-signage.html`)와 코드를 1:1 대조해 근본 원인을 진단하고, 오케스트레이터가 직접 시안대로 정합했다.

## 진단 (근본 원인)

Codex 구현이 시안 A 대비 세 가지를 통째로 반대로 배치하고 있었다.

1. **flip 글자 배치 반대**: `topFlip=다음`, `bottomFlip=현재` (시안은 `topFlip=현재`(낙하), `bottomFlip=다음`(착지)). `topStatic`/`bottomStatic`도 서로 반대.
2. **회전 방향 반대**: `top-flip`이 `rotateX(-89.8→0)`(올라옴), `bottom-flip`이 `rotateX(0→89.8)`(내려감) — 시안은 top `0→-89.8`(낙하), bottom `89.8→0`(착지).
3. **delay/settle 역할 뒤바뀜**: top에 delay+settle, bottom 즉시 — 시안은 top 즉시 낙하, bottom delay 착지 + settle 반동.

이 세 반전이 겹쳐 물리적으로 안 맞는 어색한 모션이 됐다.

## 작업 내용 (완료)

1. `frontend/src/App.vue` `animateSplashCellFlip`: `topStatic=next`, `bottomStatic=current`, `topFlip=current`, `bottomFlip=next` 로 시안 배치 복원.
2. `frontend/src/styles.css` flip: `.flap-top-flip` 시작 `rotateX(0)` 즉시 `waTop`, `.flap-bottom-flip` 시작 `rotateX(89.8)` delay 0.38 `waBottom`, settle 을 `bottom-flip` 으로 이동. z-index top 4 / bottom 3.
3. `frontend/src/styles.css` keyframes: `splitFlap*` → `waTop`(0→-89.8, brightness 1→0.32) / `waBottom`(89.8→0, brightness 0.45→1) / `waBottomSettle`(반동 10.5°→-2.5°→0).

## 완료 기준

- `tools/run-frontend-build.ps1` 통과 (확인).
- 시안 A처럼 위 반쪽이 낙하하며 어두워지고, 아래 반쪽이 착지하며 밝아지고, 마지막 반동이 붙는다. 사용자 실제 화면 확인이 최종 검증.

## 선행 조건

- 없음. `TKT-070` finished 위에서 정합.

## 질문/결정 기록

- 사용자 요청(2026-07-08): 플립을 오케스트레이터가 직접 티켓 끊어 수정. Codex 두 차례(069/070)로도 어색했다.
- 결정: 시안 A 플립을 정확히 이식. 방향은 시안 정통(위 낙하 + 아래 착지)이 "실제 기계식" 손맛이며 사용자가 처음 좋게 본 연출이다.

## 선행 읽기

- `design/mockups/2026-07-05/variant-a-seoul-signage.html` (플립 레퍼런스)
- `frontend/src/App.vue`, `frontend/src/styles.css`

## 작업자 산출물

- 오케스트레이터 직접 수정, 3곳 diff.
- 빌드 통과.

## 검토 메모

- 없음 (오케스트레이터 직접 수정, 사용자 실제 화면 확인이 최종 검증).

## Notes

- `TKT-070` finished 는 유지하되, 이 티켓이 그 후속 정합이다. 향후 플립 관련 문의는 이 진단을 참고한다.
