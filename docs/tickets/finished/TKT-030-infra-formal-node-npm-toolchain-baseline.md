# TKT-030

## 메타데이터

- 제목: 정식 Node/npm 툴체인 설치 기준선 정리
- 우선순위: P1
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-030-formal-node-npm-baseline`

## 목표

Codex 번들 런타임과 저장소 로컬 우회 스크립트에 기대는 현재 상태를 넘어서, 이 저장소에서 `npm install`, `npm run dev`, `npm run build` 를 재현 가능한 정식 Node/npm 기준선으로 정리한다.

## 작업 내용

- 현재 작업 환경에서 `node`, `npm`, `npx` 가 PATH 에 없는 상태와 `tools/local-node/npm.cmd` 가 완전한 npm 배포본이 아니라는 점을 다시 확인한다.
- 로컬 Windows 기준 정식 Node LTS + npm 설치 기준을 정한다.
- 실제 시스템 설치 변경은 사용자 승인 후에만 수행하고, 이번 턴에서는 정확한 설치 절차와 검증 명령을 문서에 남긴다.
- `frontend` 기본 실행 절차를 `npm install`, `npm run dev`, `npm run build` 중심으로 다시 정리한다.
- 현재 우회 경로인 `tools/run-frontend-dev.ps1`, `tools/run-frontend-build.ps1`, `tools/local-node/node.exe` 의 역할을 "임시 fallback" 으로 기록한다.
- `README.md`, `frontend/README.md`, `docs/agent-runtime.md`, `docs/tickets/finished/TKT-019-v0.1.2-local-toolchain-preflight.md`, `docs/tickets/backlog/TKT-010-v0.1.2-runtime-alignment-after-build-tool-baseline.md` 에 정식 기준선을 반영한다.

## 범위

- 포함: Node/npm 설치 기준선, PATH 확인, 프런트 패키지 관리/실행 절차 문서화, fallback 경로 정리, preflight 스크립트 추가
- 제외: Java/Maven 설치, Docker 설치, gateway 빌드 툴 정리, 프런트 기능 개발, `VERSION` 변경

## 완료 기준

- `node --version`, `npm --version`, `npx --version` 의 기대 상태와 검증 방법이 현재 작업 기준에서 재현 가능하게 기록되어 있다.
- `frontend` 에서 `npm install`, `npm run build` 중 필요한 검증이 성공했거나, 막히는 정확한 이유와 후속 조치가 문서화되어 있다.
- 정식 설치 기준과 임시 우회 경로의 역할 차이가 문서에 명확히 적혀 있다.
- `TKT-010` 과 `TKT-019` 가 더 이상 "npm 부재" 때문에 해석이 흔들리지 않도록 관련 문서가 보강되어 있다.

## 선행 조건

- `docs/tickets/finished/TKT-019-v0.1.2-local-toolchain-preflight.md` 로 정리된 현재 도구 가용성 기록을 먼저 읽는다.
- 실제 시스템 설치 변경이 필요하면 사용자 승인 후 진행한다.

## 질문/결정 기록

- 결정: 이 티켓은 프런트엔드 패키지 관리 기준선을 정식 Node/npm 으로 되돌리는 인프라 정리 티켓이다.
- 결정: 저장소의 `tools/local-node/node.exe` 와 `tools/run-frontend-*.ps1` 는 fallback 이며, 장기 기준선으로 간주하지 않는다.
- 결정: 프런트엔드 정식 로컬 기준선은 Windows x64 `Node.js 22 LTS` 와 함께 설치되는 `npm`, `npx` 다.
- 결정: Codex 번들 Node `v24.14.0` 과 저장소 로컬 Node `v24.14.0` 은 smoke 검증용 보조 런타임으로만 남긴다.
- 열린 질문: 사용자 승인 후 실제 호스트 PATH 에 정식 Node.js 22 LTS 를 설치할지, 문서 기준선만 유지할지.

## 권장 검증 명령

```powershell
where.exe node
where.exe npm
where.exe npx
node --version
npm --version
npx --version
```

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\check-node-toolchain.ps1
powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-install.ps1
powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1
```

## 선행 읽기

- `README.md`
- `docs/architecture.md`
- `docs/agent-runtime.md`
- `docs/ticket-policy.md`
- `docs/tickets/backlog/TKT-010-v0.1.2-runtime-alignment-after-build-tool-baseline.md`
- `docs/tickets/finished/TKT-019-v0.1.2-local-toolchain-preflight.md`
- `docs/history/README.md`
- 최신 관련 히스토리

## 작업자 산출물

- 브랜치 이름
- 설치 또는 미설치 상태 요약
- 검증 명령과 결과
- 문서 갱신 목록
- fallback 유지/제거 판단

## 검토 메모

- `tools/check-node-toolchain.ps1` 를 추가해 PATH 의 `node`, `npm`, `npx` 와 저장소/번들 fallback 상태를 한 번에 점검할 수 있게 했다.
- `tools/run-frontend-install.ps1` 를 추가해 정식 기준선이 있는 환경에서는 `npm install` 을 바로 실행하고, 없는 환경에서는 명확한 설치 가이드를 출력하도록 했다.
- `tools/run-frontend-dev.ps1`, `tools/run-frontend-build.ps1` 는 이제 PATH 에 `npm` 이 있으면 정식 npm 흐름을 우선 사용하고, 없으면 기존 `tools/local-node/node.exe` + `vite.js` fallback 으로 내려간다.
- `README.md`, `frontend/README.md`, `docs/agent-runtime.md`, `TKT-010`, `TKT-019` 를 함께 갱신해 정식 기준선과 fallback 역할 차이를 문서에 고정했다.
- 2026-06-15 현재 검증 결과는 아래와 같다.
  - `where.exe node`, `where.exe npm`, `where.exe npx` 실패
  - `tools/local-node/node.exe --version` 성공: `v24.14.0`
  - `tools/local-node/npm.cmd --version` 실패: `npm-cli.js` / `npm-prefix.js` 부재
  - `tools/run-frontend-build.ps1` 성공: fallback 경로로 Vite production build 완료
- 실제 시스템 전역 설치는 사용자 승인 전 수행하지 않았다.
- 오케스트레이터 판정: 정식 Node/npm 설치 기준선, fallback 역할, 현재 PATH 부재 증거와 build 우회 검증이 모두 남았으므로 이 문서화 티켓은 완료 기준을 충족한 것으로 본다.

## Notes

- 다음 작업자가 실제 호스트 설치까지 이어가려면 먼저 사용자 승인 후 Windows x64 `Node.js 22 LTS` 설치를 진행하고, 그 다음 `tools/run-frontend-install.ps1` 로 `npm install` 을 재검증한다.
- 그 전까지는 `tools/check-node-toolchain.ps1` 출력에서 `officialToolchainPresent=false` 가 정상이며, 프런트 smoke 검증은 fallback 경로를 계속 사용한다.

