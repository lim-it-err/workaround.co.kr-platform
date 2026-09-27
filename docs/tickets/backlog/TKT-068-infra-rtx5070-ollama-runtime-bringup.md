문서 상태: 작성완료

# TKT-068

## 메타데이터

- 제목: RTX5070 Ollama 실제 구동과 게이트웨이 연결 검증
- 우선순위: P2
- 대상 버전: `infra`
- 상태: `backlog`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-068-rtx5070-ollama-bringup`

## 목표

RTX5070 호스트에서 Ollama 를 실제로 구동하고 모델을 준비한 뒤, 게이트웨이가 이를 안정적으로 호출/헬스체크하도록 연결을 검증한다. 발견 노선 depth 확장(`TKT-066`)과 이후 LLM 기능의 공용 런타임 기반이다.

## 작업 내용

1. RTX5070 호스트 준비를 점검한다. `infra/rtx5070-host/preflight.ps1` 로 GPU/드라이버/Docker(WSL2) 상태를 확인한다.
2. Ollama 를 설치/구동한다. `infra/rtx5070-host/ollama-runtime.ps1` 을 활용해 `ollama serve`(기본 `11434`)를 띄운다.
3. 모델을 pull 한다. ~12GB VRAM 기준 7B 급으로 시작한다(예: `qwen2.5:7b` 또는 `qwen2.5-coder:7b`). `docs/ollama-policy.md` 권장을 따른다.
4. 게이트웨이 연결: `OLLAMA_BASE_URL`(기본 `http://rtx5070-host:11434`, 같은 PC면 `http://localhost:11434` 또는 `http://host.docker.internal:11434`)을 실제 환경에 맞춘다.
5. 헬스/저하 흐름을 검증한다. 워커/게이트웨이가 Ollama 상태를 `ok`/`degraded`/`unavailable` 로 읽고, down 이어도 플랫폼이 죽지 않는지 확인한다(`TKT-009` 기준).
6. 간단한 프롬프트 왕복(한국어 2~4문장 생성)으로 실사용 지연/품질을 1회 확인하고 결과를 기록한다.

## 범위

- 포함: Ollama 구동, 모델 pull, 게이트웨이 URL 연결, 헬스/저하 검증, 왕복 확인, 운영 메모.
- 제외: 모델 파인튜닝, 다중 모델 라우팅, 부하 테스트, 자동 부팅 서비스 등록(별도).

## 완료 기준

- RTX5070 에서 Ollama 가 `11434` 로 응답한다.
- 게이트웨이가 `OLLAMA_BASE_URL` 로 헬스와 생성 왕복을 확인한다.
- Ollama 를 내려도 플랫폼이 죽지 않고 저하 상태로 읽힌다.
- 사용한 모델명, URL, 지연/품질 관찰을 운영 메모로 남긴다.

## 선행 조건

- RTX5070 물리 머신 접근과 설치 권한(사용자). Ollama 설치 자체는 사용자가 해당 머신에서 수행해야 할 수 있다.

## 질문/결정 기록

- 결정(2026-07-05, 사용자): 발견 노선 등 LLM 기능은 무료 우선으로 로컬 Ollama(RTX5070)를 쓴다. 외부 유료 API 미사용.
- 열린 질문: 시작 모델 선택(`qwen2.5:7b` 기본안). VRAM 여유 보고 조정.
- 열린 질문: RTX5070 이 같은 PC 인지 LAN 별도 장비인지에 따라 URL 이 달라진다. 사용자 환경 확인.

## 선행 읽기

- `README.md`
- `docs/ollama-policy.md`
- `infra/rtx5070-host/README.md`
- `docs/tickets/finished/TKT-007-infra-docker-and-gpu-runtime-on-rtx5070-host.md`
- `docs/tickets/finished/TKT-008-infra-ollama-gpu-model-serving-on-rtx5070.md`
- `docs/tickets/finished/TKT-009-infra-worker-to-ollama-health-and-degraded-flow.md`

## 작업자 산출물

- 브랜치 이름
- 설치/구동 방식과 사용한 모델
- 게이트웨이 연결 URL과 헬스 확인 결과
- 지연/품질 관찰 메모
- 저하 처리 확인 결과

## 검토 메모

- 없음

## Notes

- 이 티켓은 `TKT-066`(발견 depth 확장)의 선행이다. 취향 노선의 선택적 설명 API 를 나중에 열 때도 이 런타임을 재사용한다.
- 실제 하드웨어 접근이 필요하므로, worker 가 자동 진행할 수 없는 단계(물리 설치)는 사용자 확인 항목으로 명시하고 멈춘다.
