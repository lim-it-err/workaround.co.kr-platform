# TKT-007

## 메타데이터

- 제목: RTX5070 호스트의 Docker 및 GPU 런타임 준비
- 우선순위: P1
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-007-docker-gpu-runtime`

## 목표

RTX5070 장비에서 컨테이너 기반 GPU 작업을 안정적으로 실행할 수 있도록, 호스트 preflight 절차와 GPU 런타임 기준선을 재현 가능한 형태로 정리한다.

## 작업 내용

- `infra/rtx5070-host/README.md` 로 Windows/WSL2 중심 운영 경로, Linux 대안 경로, 오케스트레이터 검토 증거 기준을 정리했다.
- `infra/rtx5070-host/preflight.ps1` 를 추가해 아래 항목을 JSON 또는 PowerShell 객체로 점검하도록 했다.
  - `nvidia-smi`
  - `wsl --status`
  - `docker version`
  - `docker compose version`
  - `com.docker.service`
  - 선택적 `docker run --gpus all ... nvidia-smi` smoke
- `infra/docker-compose.gpu.yml` 에 `restart: unless-stopped` 와 `ollama list` 기반 healthcheck 를 넣어 GPU Ollama 컨테이너의 기본 운영값을 보강했다.
- `docs/ollama-policy.md` 와 현재 호스트 스크립트 경로를 대조해, `TKT-008` 이 바로 이어서 쓸 수 있는 기준선인지 다시 확인했다.

## 범위

- 포함: RTX5070 호스트 preflight, Docker/GPU 체크리스트, compose 기본값, 운영 문서
- 제외: 실제 Docker 설치, 재부팅 후 자동 시작 확인, 실제 `docker run --gpus all` 성공 증거, 실제 Ollama 모델 서빙 완료

## 완료 기준

- RTX5070 호스트 준비 상태를 재현 가능한 명령으로 점검할 수 있다.
- Docker/GPU/Ollama 운영 전 확인해야 하는 수동 단계와 증거가 문서에 있다.
- 실제 설치를 못 하더라도 현재 세션 기준 host evidence 가 남아 있다.
- 다음 티켓인 `TKT-008` 이 같은 기준선을 이어서 사용할 수 있다.

## 선행 조건

- RTX5070 호스트에 접근할 수 있어야 실제 설치 검증을 닫을 수 있다.
- 접근 권한이 없으면 설치 체크리스트와 검증 절차 문서화까지만 진행한다.

## 질문/결정 기록

- 결정: RTX5070 호스트는 게임 등 다른 GPU 작업 때문에 언제든 내려갈 수 있다.
- 결정: GPU 런타임 작업은 기능 릴리스와 분리된 `infra` 트랙이다.
- 결정: 현재 세션에서는 Docker 설치를 강행하지 않고, host preflight 와 증거 수집 경로를 먼저 기준선으로 남긴다.
- 열린 질문: 실제 Docker 설치 주체가 Docker Desktop 인지, 별도 Linux host 인지는 운영 대상이 정해질 때 다시 확정한다.

## 선행 읽기

- `README.md`
- `docs/architecture.md`
- `docs/network.md`
- `docs/ollama-policy.md`
- `docs/history/README.md`
- 최신 관련 히스토리

## 작업자 산출물

- 호스트 preflight 스크립트
- GPU compose 기준선
- 운영 README
- 현재 세션 검증 결과
- 남은 수동 단계와 위험

## 호스트 설정 요약

- 권장 Windows 경로는 `Docker Desktop + WSL2 GPU 연동 + NVIDIA 드라이버` 다.
- Linux 호스트라면 `Docker Engine + NVIDIA Container Toolkit` 조합을 사용한다.
- host preflight 는 `infra/rtx5070-host/preflight.ps1` 로 수행한다.
- 실제 GPU smoke 기준 명령은 아래와 같다.

```powershell
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

## 검증

- [x] `powershell -ExecutionPolicy Bypass -File .\infra\rtx5070-host\preflight.ps1 -AsJson`
  - `nvidia-smi` 성공
  - `wsl --status` 성공
  - `docker`, `docker compose` 없음
  - `com.docker.service` 없음
  - `docker-gpu-smoke` 는 미실행(`skipped`)
- [x] `powershell -ExecutionPolicy Bypass -File .\infra\rtx5070-host\preflight.ps1`
  - PowerShell 객체 출력 경로 확인
- [ ] 실제 Docker 설치
- [ ] 재부팅 후 자동 시작 확인
- [ ] `docker run --gpus all ... nvidia-smi`
- [ ] `docker compose -f infra/docker-compose.gpu.yml --profile gpu up -d`

## 검토 메모

- 현재 작업은 실제 설치를 끝낸 상태가 아니라 "준비 체크리스트 + preflight 도구 + 현재 호스트 증거"를 마련한 상태다.
- 이번 세션에서 확인한 host evidence 는 아래와 같다.
  - `nvidia-smi`: `NVIDIA GeForce RTX 5070, 595.97, 12227 MiB`
  - `wsl --status`: 실행 성공
  - `docker`: 명령 미설치
  - `docker compose`: 명령 미설치
  - `com.docker.service`: 서비스 미발견
- 따라서 다음 액션은 실제 Docker 설치, 자동 시작 설정, `docker run --gpus all` smoke, GPU compose 기동 검증이다.
- 오케스트레이터 판정: 이 티켓의 범위는 실제 설치 완료가 아니라 host preflight 기준선, compose 기본값, 현재 호스트 증거 정리까지이므로 완료 기준을 충족한 것으로 본다.

## PR 준비 메모

PR 제목 초안:

```text
[infra] TKT-007 rtx5070 host docker gpu preflight baseline
```

PR 본문 초안:

```markdown
## Target Version

Target Version: `infra`

## Feature Theme

Feature Theme: `RTX5070 host preflight baseline`

## Tickets

- `TKT-007`

## Summary

- RTX5070 호스트용 Docker/GPU preflight 스크립트와 체크리스트를 추가했다.
- `infra/docker-compose.gpu.yml` 에 restart/healthcheck 기본값을 넣었다.
- 현재 세션 host evidence 로 `nvidia-smi ok`, `wsl ok`, `docker missing` 상태를 남겼다.

## Scope

- `infra/rtx5070-host/preflight.ps1`
- `infra/rtx5070-host/README.md`
- `infra/docker-compose.gpu.yml`

## Verification

- [x] local or CI verification is documented
- [x] unverified items and reasons are documented

## Checklist

- [x] single target version or track only
- [x] no unrelated feature mixed in
- [x] docs and history updated
```

## Notes

- Docker 설치와 GPU smoke 실행은 사용자 승인 또는 실제 호스트 운영 권한이 있을 때 이어서 수행한다.
- `TKT-008` 은 이 preflight 결과를 기반으로 Ollama 컨테이너 실기동 검증을 이어가면 된다.
