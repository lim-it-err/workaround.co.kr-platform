문서 상태: 작성완료

# 에이전트 런타임 분리

## 목적

이 저장소는 일을 요청하는 시스템과 모델 추론을 수행하는 시스템을 분리한다.

즉 아래처럼 나눈다.

- Codex 같은 프로젝트 매니저가 티켓을 만든다.
- 워커가 티켓을 읽고 어떤 작업에 모델 도움이 필요한지 판단한다.
- RTX5070 노드의 Ollama는 추론 런타임만 담당한다.
- 실제 요청 흐름, 재시도, fallback 상태는 워커나 게이트웨이가 책임진다.

## 책임 경계 표

| 층 | 주체 | 하는 일 | 하지 않는 일 |
| --- | --- | --- | --- |
| orchestration | Codex / 오케스트레이터 | 티켓 생성, 문서 정리, 검토 흐름 관리 | 외부 Ollama에 저장소 제어 위임 |
| execution | gateway / worker | 라우팅, 상태 저장, 노드 타깃 판단, degraded 처리 | 모델 추론 자체를 직접 서비스 안에 박아 넣기 |
| inference | RTX5070 Ollama | LLM 응답 생성 | 티켓 상태 관리, git 쓰기, merge 판단 |

## 왜 필요한가

RTX5070 장비는 게임이나 다른 GPU 작업 때문에 언제든 내려갈 수 있다. 모델 런타임이 없더라도 플랫폼 기본 기능은 계속 살아 있어야 한다.

## 실제 규칙

코드 개발 도움 요청 흐름은 아래를 기본으로 한다.

1. 정형 티켓을 만든다.
2. 워커가 작업 경로를 결정한다.
3. LLM 추론이 필요한 경우에만 Ollama를 호출한다.
4. 실제 코드/문서 변경 행위는 모델 프로세스와 분리한다.

LLM 작업 판별은 현재 worker 기준으로 아래 신호를 우선 사용한다.

- `type` 이 `job.llm.` 로 시작
- `payload.requiresLlm=true`
- `payload.inferenceProvider=ollama`
- `payload.targetRuntime=ollama`

Ollama가 unavailable / degraded 이면 워커는 LLM 티켓을 바로 실패시키지 않고 `waiting_llm` 으로 보내고, 비LLM 티켓은 계속 처리한다.

노드 타깃 표현은 아래 값을 기본으로 한다.

- `ion2`: 로컬 제어 노드, gateway/worker/light 서비스 기본 실행 위치
- `rtx5070`: 외부 GPU 추론 노드, heavy inference 와 LLM 티켓 우선 타깃

게이트웨이는 `GET /api/runtime` 로 이 계약을 프런트엔드나 운영 화면이 읽을 수 있게 노출한다.

## 로컬 개발 툴체인 메모

- Codex 번들 런타임은 worker 가 현재 세션에서 재현과 smoke 검증을 이어가기 위한 보조 런타임이다.
- 프런트엔드의 정식 로컬 기준선은 Windows x64 `Node.js 22 LTS` 와 함께 설치되는 `npm`, `npx` 가 PATH 에 잡힌 상태다.
- 표준 프런트엔드 절차는 `frontend/` 에서 `npm install`, `npm run dev -- --host 0.0.0.0 --port 7000`, `npm run build` 순서를 따른다.
- 저장소의 `tools/run-frontend-install.ps1`, `tools/run-frontend-dev.ps1`, `tools/run-frontend-build.ps1` 는 이 정식 기준선을 우선 호출하는 wrapper 다.
- `tools/local-node/node.exe`, Codex 번들 Node, `frontend/node_modules/vite/bin/vite.js` 직접 실행 경로는 PATH 에 `npm` 이 없는 세션의 임시 fallback 일 뿐이며, 새 의존성 설치 기준선으로 취급하지 않는다.

## 기대 효과

이 구조는 아래 세 층을 분리한다.

- orchestration
- execution
- model inference

이 분리가 있어야 플랫폼을 멈추고, 다시 켜고, 확장하기 쉬워진다.

