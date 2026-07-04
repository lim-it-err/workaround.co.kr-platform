# TKT-008

## 메타데이터

- 제목: RTX5070 호스트의 Ollama GPU 모델 서빙
- 우선순위: P2
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-008-ollama-gpu-serving`

## 목표

RTX5070 호스트에서 Ollama 기반 모델 서빙 경로를 재현 가능하게 정리하고, 운영자가 시작/중지/헬스/모델 pull 절차를 같은 명령 집합으로 다룰 수 있게 만든다.

## 작업 내용

- `infra/rtx5070-host/ollama-runtime.ps1` 를 기준 운영 진입점으로 정리했다.
  - `start`
  - `stop`
  - `restart`
  - `pull-models`
  - `health`
  - `logs`
  - `status`
- `ollama-runtime.ps1` 는 `infra/docker-compose.gpu.yml` 과 `/api/tags` 헬스를 묶어, 운영 절차와 워커가 소비할 상태 표현을 같은 JSON 구조로 반환한다.
- `health` 와 `status` 응답에 `composeFileExists`, `runtimePrerequisites.dockerAvailable`, `nextSteps[]` 를 포함하도록 보강해 Docker 자체 부재와 컨테이너 미기동을 더 빨리 구분할 수 있게 했다.
- `infra/rtx5070-host/README.md`, `docs/ollama-policy.md` 기준과 현재 스크립트 경로를 다시 맞춰, URL 기준, 첫 모델 후보, GPU 경쟁 시 중지 절차를 같은 운영 기준으로 정리했다.

## 범위

- 포함: Ollama 운영 스크립트, compose 기반 서빙 경로, health/status JSON 규약, 운영 문서
- 제외: 실제 Docker 설치, 실제 모델 다운로드 완료, 실제 `/api/tags` 2xx 성공 증거, 14B 이상 모델 성능 검증

## 완료 기준

- RTX5070 호스트에서 사용할 구체적인 Ollama 서빙 경로가 존재한다.
- 시작, 중지, 헬스 체크 절차가 문서화되어 있다.
- GPU를 다른 작업에 써야 할 때 모델 서빙을 어떻게 중단하는지 분명하다.
- 현재 세션에서 Docker가 없어도 스크립트가 실패 원인과 다음 단계 힌트를 재현 가능하게 반환한다.

## 선행 조건

- 실제 GPU 컨테이너 검증은 `TKT-007` 기준의 Docker/GPU 런타임 준비가 필요하다.
- `docker`, 네트워크 연결이 없는 세션에서는 운영 스크립트와 실패 표현 검증까지만 진행한다.

## 질문/결정 기록

- 결정: 기본 플랫폼 compose 에는 Ollama 를 포함하지 않는다.
- 결정: Ollama 는 `infra/docker-compose.gpu.yml` + `infra/rtx5070-host/ollama-runtime.ps1` 경로를 기본 운영 절차로 둔다.
- 결정: 첫 모델 후보는 현재 수집된 약 12GB VRAM 기준 7B 급 1~2개(`qwen2.5-coder:7b`, `qwen2.5:7b`)부터 시작한다.
- 열린 질문: 실제 RTX5070 호스트에서 14B 급까지 허용할지는 Docker 설치와 실측 지연 시간 이후 후속 티켓에서 다시 본다.

## 선행 읽기

- `README.md`
- `docs/ollama-policy.md`
- `docs/agent-runtime.md`
- `docs/network.md`
- `docs/history/README.md`
- 최신 관련 히스토리

## 작업자 산출물

- Ollama 운영 스크립트
- 서빙 절차 요약
- 헬스 체크 요약
- 현재 세션 검증 결과
- 남은 운영 위험

## 서빙 절차

기본 점검:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/preflight.ps1 -AsJson
```

컨테이너 시작:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action start -AsJson
```

초기 모델 pull:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action pull-models -Models qwen2.5-coder:7b,qwen2.5:7b -AsJson
```

헬스 확인:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action health -AsJson
```

GPU 경쟁 전 중지:

```powershell
powershell -ExecutionPolicy Bypass -File infra/rtx5070-host/ollama-runtime.ps1 -Action stop -AsJson
```

## 헬스 체크 요약

- `/api/tags` 2xx 응답이면 `health.workerStatus=ok`
- timeout, 5xx, 비정상 응답이면 `health.workerStatus=degraded`
- 연결 실패, 컨테이너 미기동, URL 오류면 `health.workerStatus=unavailable`
- 추가로 아래 보조 필드를 함께 본다.
  - `composeFileExists`
  - `runtimePrerequisites.dockerAvailable`
  - `nextSteps[]`

예시:

```json
{
  "action": "health",
  "composeFileExists": true,
  "runtimePrerequisites": {
    "dockerAvailable": false
  },
  "health": {
    "workerStatus": "unavailable",
    "category": "connection_failed"
  },
  "nextSteps": [
    "Install Docker Desktop or Docker Engine before using the compose-based Ollama runtime.",
    "Confirm Docker is installed and the Ollama container is running."
  ]
}
```

## 검증

- [x] `powershell -ExecutionPolicy Bypass -File .\infra\rtx5070-host\ollama-runtime.ps1 -Action health -AsJson`
  - 현재 세션에서는 `http://localhost:11434/api/tags` 연결 실패를 `unavailable/connection_failed` 로 반환했다.
  - `runtimePrerequisites.dockerAvailable=false`
  - `nextSteps[]` 에 Docker 설치 힌트와 컨테이너 실행 힌트가 함께 들어갔다.
- [x] `powershell -ExecutionPolicy Bypass -File .\infra\rtx5070-host\ollama-runtime.ps1 -Action status -AsJson`
  - 현재 세션에서는 `docker compose ... ps ollama` 실패를 `exitCode=127` 로 반환했다.
  - `composeFileExists=true`
  - `runtimePrerequisites.dockerAvailable=false`
  - `nextSteps[]` 에 설치/기동 힌트가 함께 들어갔다.
- [ ] 실제 `docker compose -f infra/docker-compose.gpu.yml --profile gpu up -d`
- [ ] 실제 `ollama pull qwen2.5-coder:7b`
- [ ] 실제 `/api/tags` 2xx 응답

## 검토 메모

- 이번 작업은 "실제 Docker/Ollama 운영 스크립트와 문서 계약" 까지를 완료했고, 호스트 설치/모델 다운로드/성공 smoke 는 도구 부재 때문에 후속 검증이 필요하다.
- `TKT-007` 의 host preflight 와 이번 `TKT-008` 운영 스크립트를 합치면, 다음 액션은 Docker 설치 후 같은 명령을 그대로 실행해 실제 성공 증거를 수집하는 일이다.
- 오케스트레이터 판정: 실제 모델 pull 과 `/api/tags` 2xx 는 제외 범위였고, 현재 세션에서 실패 원인과 다음 단계가 재현 가능하게 남았으므로 완료 기준을 충족한 것으로 본다.

## PR 준비 메모

PR 제목 초안:

```text
[infra] TKT-008 ollama gpu serving runtime on rtx5070 host
```

PR 본문 초안:

```markdown
## Target Version

Target Version: `infra`

## Feature Theme

Feature Theme: `RTX5070 Ollama runtime baseline`

## Tickets

- `TKT-008`

## Summary

- RTX5070 호스트용 `ollama-runtime.ps1` 를 정리해 Ollama 시작/중지/재시작/모델 pull/헬스/로그 경로를 표준화했다.
- `health` 와 `status` 응답에 compose 파일 존재 여부, Docker 가용성, 다음 단계 힌트를 함께 넣었다.
- Ollama URL 기준과 첫 모델 후보, GPU 경쟁 시 중지 절차를 문서에 반영했다.

## Scope

- `infra/rtx5070-host/ollama-runtime.ps1`
- `infra/rtx5070-host/README.md`
- `docs/ollama-policy.md`

## Verification

- [x] local or CI verification is documented
- [x] unverified items and reasons are documented

## Checklist

- [x] single target version or track only
- [x] no unrelated feature mixed in
- [x] docs and history updated
```

## Notes

- 실제 Docker 설치, 모델 다운로드, `/api/tags` 2xx 검증은 호스트 도구와 네트워크가 준비된 뒤 같은 스크립트로 이어가면 된다.
