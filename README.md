# workaround.co.kr 플랫폼

작은 개인용 서비스를 모아 운영하고, 티켓 기반 자동화와 워커 실행 흐름을 붙일 수 있도록 설계한 개인 플랫폼 모노레포다.

## 목표

이 저장소의 기본 구조는 다음과 같다.

- Vue는 최종 사용자 UI를 담당한다.
- Spring Boot는 API 게이트웨이, 라우터, 티켓 발행기 역할에 집중한다.
- 실제 기능은 `services/` 아래의 독립 서브서비스가 맡는다.
- 워커는 티켓을 구독하고 작업을 수행한다.
- Ollama는 외부 RTX5070 노드에서 내려갈 수 있는 런타임으로 취급한다.

Codex는 문서 중심 프로젝트 매니저로서 구조, 정책, 릴리즈 목표, 티켓 상태를 정리하고 최신 상태로 유지한다.

## 저장소 구조

```text
personal-platform/
|- frontend/                  # Vue 최종 사용자 화면
|- gateway/                   # Spring Boot API Gateway / Router / Ticket Issuer
|- services/                  # 언어 독립 서브서비스
|  |- elevator-service/       # 후속 서비스 계약 후보
|  |- public-site/            # 공개 소개 페이지 정적 서비스
|  |- sample-python-service/  # 레거시 예시 서비스
|  `- sample-spring-service/  # 예시 서비스
|- workers/                   # 티켓 subscriber / 작업 실행자 / 오케스트레이터 보조 루프
|  |- ion2-worker/
|  `- orchestrator-heartbeat/
|- llm/
|  `- ollama/                 # 외부 RTX5070 Ollama 연결 정책
|- infra/
|  |- nginx/
|  |- public-site/
|  `- redis/
|- design/                    # UI/UX 기준선, 감사 기록, 오케스트레이터-디자이너 협업 문서
|- docs/                      # 구조, 운영 정책, 릴리즈, 티켓, 히스토리
`- README.md
```

## 핵심 흐름

```text
사용자 -> Vue 프런트엔드 -> Spring Gateway -> 각 서브서비스
Codex -> Spring Gateway Ticket API -> Redis Streams -> 워커
워커 -> 필요 시 외부 RTX5070 Ollama 호출
```

Spring은 무거운 비즈니스 로직을 쌓는 곳이 아니라, 게이트웨이와 라우팅, 티켓 조정, 헬스 집계 계층으로 유지한다.

## 현재 릴리즈 기준

- `v0.1.0`: 첫 실행 가능한 플랫폼 골격
- `v0.1.2`: `v0.1.1` 빌드 툴 정리 이후 런타임 정렬 단계
- `v0.1.3`: 샘플 서비스 정리와 후속 서비스 계약 준비
- `v0.1.4`: 샘플 Python 잔여 기본값 같은 릴리스 전 정밀 정리
- `v0.2.0`: `http://localhost:7000` 에서 볼 수 있는 통합 결과물
- `v0.2.1`: 테스트 코드 확장과 커버리지 측정
- `infra`: 워커, Docker, GPU 런타임, Ollama 서빙 기반 작업

세부 목표는 [docs/releases.md](docs/releases.md) 에 정리한다.
버전 진행 상한은 [docs/version-policy.md](docs/version-policy.md) 를 따른다.
1차 공개 웹사이트 목표는 [docs/roadmap.md](docs/roadmap.md) 에 정리한다.

## 테스트 / 커버리지

- Node/npm 기준선 점검: `powershell -ExecutionPolicy Bypass -File .\tools\check-node-toolchain.ps1`
- 프런트엔드 의존성 설치: `powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-install.ps1`
- 프런트엔드 빌드: `powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1`
- 프런트엔드 개발 서버: `powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-dev.ps1`
- 통합 프리뷰 한 번에 기동: `powershell -ExecutionPolicy Bypass -File .\tools\start-local-preview.ps1`
- 통합 프리뷰 중지: `powershell -ExecutionPolicy Bypass -File .\tools\stop-local-preview.ps1`
- 게이트웨이 테스트 + JaCoCo 리포트: `powershell -ExecutionPolicy Bypass -File .\tools\run-gateway-tests.ps1`
- GitHub Actions CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- 로컬 게이트웨이 커버리지 HTML 리포트: `gateway/target/site/jacoco/index.html`
- GitHub Actions 커버리지 산출물: `gateway-jacoco-report` artifact

## 로컬 Node / npm 기준

- 프런트엔드의 정식 로컬 기준선은 Windows x64 `Node.js 22 LTS` 와 함께 설치되는 `npm`, `npx` 가 PATH 에 잡힌 상태다.
- 표준 실행 흐름은 `frontend/` 에서 `npm install`, `npm run dev -- --host 0.0.0.0 --port 7000`, `npm run build` 순서를 따른다.
- `tools/run-frontend-dev.ps1`, `tools/run-frontend-build.ps1` 는 PATH 에 `npm` 이 있으면 위 표준 흐름을 그대로 사용한다.
- PATH 에 `npm` 이 없는 Codex 작업 세션에서는 같은 스크립트가 저장소 안 `tools/local-node/node.exe` 와 `frontend/node_modules/vite/bin/vite.js` 로 fallback 실행을 시도한다.
- 이 fallback 경로는 이미 `frontend/node_modules/` 가 준비된 세션의 임시 재현용이며, 새로운 의존성 설치나 lockfile 재생성의 대체 기준으로 쓰지 않는다.

## 문서 읽기 규칙

작업 전에는 `AGENTS.md`, 관련 `docs/*`, 관련 `docs/history/*` 를 먼저 읽는다. UI/UX 작업이라면 `design/*` 와 최신 `design/orchestrator_review/*` 도 함께 읽는다. 구현과 문서가 어긋나면 작업을 끝내기 전에 둘을 다시 맞춘다.

## 문서 공개 규칙

- `docs/` 아래 문서는 기본적으로 로컬 운영 문서다.
- `docs/releases.md`만 공개 기준 문서로 사용할 수 있다.
- 티켓 문서와 히스토리 문서는 GitHub 공개 대상으로 보지 않는다.
