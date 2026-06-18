# 프런트엔드

개인 플랫폼의 최종 사용자 UI를 담는 Vue 애플리케이션이다.

## 방향

- 서울 지하철 환승 허브 감각의 서비스 포털을 목표로 한다.
- 메인 화면은 실제 기능을 직접 수행하는 대시보드가 아니라, 각 기능 페이지로 이동시키는 라우터형 허브를 우선 기준으로 삼는다.
- 실제 `Elevator`, `Work Manager`, `Runtime` 상세 화면은 한 단계 더 들어간 개별 페이지에서만 노출한다.
- UI 작업 전에는 `docs/frontend-ux.md` 를 먼저 읽는다.
- 세부 UI/UX 기준과 review 진행 상황은 `design/README.md` 와 관련 `design/*.md` 를 우선 기준으로 읽는다.
- 현재 더미 프로토타입의 1차 구현은 `frontend/src/App.vue` 와 `frontend/src/styles.css` 에 있다.

## 로컬 개발 기준

- Vite 개발 서버는 기본적으로 `http://localhost:7000` 을 사용한다.
- 사용자 기본 흐름 확인은 `http://localhost:7000/` 에서 본다.
- UI 검수와 빠른 확인은 `http://localhost:7000/test` 를 기본 테스트 경로로 사용한다.
- 테스트 경로에서는 스플래시를 건너뛰고 검수용 안내 패널이 먼저 보인다.
- `/test` 의 검수 더미는 `/` 기본 경로의 실제 API 연결 포털을 대체하지 않는다.
- 필요하면 `http://localhost:7000/test?view=junction`, `?view=elevator`, `?view=work`, `?view=runtime` 처럼 특정 화면으로 바로 진입한다.
- `/api` 요청은 로컬 게이트웨이 `http://localhost:8080` 으로 프록시한다.

## 정식 Node / npm 기준선

- 프런트엔드의 정식 로컬 기준선은 Windows x64 `Node.js 22 LTS` 와 함께 설치되는 `npm`, `npx` 가 PATH 에 잡힌 상태다.
- 권장 확인 명령은 아래와 같다.

```powershell
node --version
npm --version
npx --version
```

- 표준 실행 절차는 아래와 같다.

```powershell
Set-Location frontend
npm install
npm run dev -- --host 0.0.0.0 --port 7000
npm run build
```

- 저장소 루트에서는 아래 wrapper 로 같은 흐름을 호출할 수 있다.

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-install.ps1
powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-dev.ps1
powershell -ExecutionPolicy Bypass -File .\tools\run-frontend-build.ps1
powershell -ExecutionPolicy Bypass -File .\tools\start-local-preview.ps1
```

- `tools/start-local-preview.ps1` 는 `frontend:7000`, `gateway:8080`, `elevator-service:8003` 를 한 번에 띄우고 readiness 를 확인한다.
- 엘리베이터 서비스는 로컬 Python 실행을 먼저 시도하고, 필요하면 Docker fallback 으로 `8003` 을 올린다.
- 중지는 `powershell -ExecutionPolicy Bypass -File .\tools\stop-local-preview.ps1` 를 사용한다.

## fallback 메모

- 현재 Codex 작업 세션처럼 PATH 에 `node`, `npm`, `npx` 가 없을 수 있다.
- 저장소 안 `tools/local-node/node.exe` 는 임시 fallback Node 실행 파일이다.
- `tools/local-node/npm.cmd` 는 완전한 npm 배포본이 아니므로 `npm install`, `npm run build` 의 기준선으로 간주하지 않는다.
- `tools/run-frontend-dev.ps1`, `tools/run-frontend-build.ps1` 는 PATH 에 `npm` 이 있으면 정식 명령을 그대로 쓰고, 없으면 `frontend/node_modules/vite/bin/vite.js` 를 직접 실행하는 fallback 으로 내려간다.
- 이 fallback 경로는 이미 `frontend/node_modules/` 가 준비된 세션의 재현용이다. 새로운 의존성 설치, lockfile 재생성, npm 기반 표준 검증은 정식 Node/npm 설치 뒤 다시 수행한다.
- 현재 기준선은 `powershell -ExecutionPolicy Bypass -File .\tools\check-node-toolchain.ps1` 로 다시 확인할 수 있다.

## 릴리즈 기준

- `http://localhost:7000` 은 `v0.2.0` 부터 오케스트레이터가 검토하는 통합 결과물 진입점이다.
- 현재 개별 개발 포트와 `localhost:7000` 을 같은 의미로 다루지 않는다.
