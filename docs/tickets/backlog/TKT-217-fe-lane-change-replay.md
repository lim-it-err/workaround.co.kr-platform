문서 상태: 작성완료

# TKT-217 `[FE]` 격납고 「차선변경 시뮬」 — lane_change_sumo 재생 파일 플레이어

- 상태: backlog · **P2 · v0.10.0(제안)** · 담당: dev 서브에이전트(Sonnet 5.5) · 착수 조건: ASK **Q-026** PO 답.
- 근거: `newProject/lane_change_sumo`(U-46 편입, 개발 codex-9) 제공. 계약서 `docs/replay-contract.md`(`lane-change-replay` 1.0), 스키마 `docs/replay.schema.json`, 샘플 `replays/singal/`.
- scope(안): 신규 `frontend/src/components/sim/LaneChangeReplay.vue`, `frontend/public/replays/lane-change/singal/*`(PM 복사본), 격납고 목록 데이터, 라우트 1개, E2E 1파일.

## 목표
격납고에서 신갈JC 합류부의 기준(SUMO 기본)과 RL 정책 재생을 나란히 보고 지표를 비교한다. 정적 파일만 쓰고 외부 호출은 0.

## 완료 조건(안, Q-026 답 뒤 확정)
1. 재생 파일을 내려받아 Canvas 로 차선(중심선+폭)·교차로 면·차량(앞범퍼 기준, 각도 0=북·시계방향, y 뒤집기)을 그린다. 차량 종류 3색(일반·RL 대기·RL 제어 중), 차선 변경 이벤트 표시.
2. 재생·일시정지·속도(1×/2×/4×)·시간 막대. 프레임 사이 선형 보간. `prefers-reduced-motion` 에서 자동 재생 안 함.
3. 1440 은 baseline·policy 나란히, 375 는 전환 탭. 지표 비교표(`index.json` metrics)와 `scenario.data_notice` 출처 표기.
4. `schema_version` 주 버전이 1 이 아니면 재생하지 않고 안내. 파일 로드 실패 안내.
5. 게이트: build, unit(스키마 주 버전 판정·좌표 변환 순수 함수), E2E(로드·재생·탭 전환·375 가로 스크롤 0), e2e:all 기준선 유지.

## 구현 메모
- 파일 복사는 PM 이 한다(계약서 §11-1). 서브에이전트는 lane_change_sumo 저장소를 수정하지 않는다.
- 파일당 약 1.1MB — 격납고 목록에서는 `index.json` 만 읽고, 재생 화면 진입 시 해당 파일만 내려받는다.

## 질문/에스컬레이션
- Q-026 대기.

## 리뷰 기록
- (대기)
