# TKT-015

## 메타데이터

- 제목: GitHub Releases / Actions 릴리스 자동화 기준선
- 우선순위: P2
- 대상 버전: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-015-github-release-actions`

## 목표

Git tag, GitHub Releases, GitHub Actions, 필요 시 GitHub Packages 를 이용해 릴리스와 배포 산출물을 관리할 수 있는 최소 기준선을 만든다.

## 작업 내용

- 현재 저장소에 `.github/workflows/` 가 있는지 확인했다.
- PR 검증에 필요한 최소 빌드/테스트 워크플로 후보를 제안하거나 추가했다.
- `v0.2.0` 태그 또는 릴리스 생성 시 사용할 수 있는 수동/자동 절차를 문서화했다.
- 컨테이너 이미지가 필요할 경우 `ghcr.io` 발행 기준을 정리했다.
- workflow 권한, secrets, 실패 시 재실행 절차를 남겼다.

## 범위

- PR 검증용 GitHub Actions 후보를 정리하거나 추가했다.
- 릴리스 태그 생성 이후 GitHub Release 생성 경로를 정리했다.
- 컨테이너 이미지가 필요할 경우 GitHub Packages 또는 GitHub Container Registry 사용 기준을 정리했다.
- 별도 GitHub 서버를 직접 구축하지 않는다는 현재 결정을 문서와 구현에 반영했다.
- 자동화가 실제로 추가되면 실행 조건, 권한, 실패 시 대응을 문서화했다.

## 완료 기준

- `docs/release-automation.md` 와 실제 워크플로 또는 워크플로 계획이 일치한다.
- `v0.2.0` 릴리스 때 어떤 수동 단계와 자동 단계가 있는지 알 수 있다.
- GitHub Packages 사용 여부가 명확하다.
- 릴리스 후 `main` 재동기화와 문서 갱신 절차가 보존된다.

## 선행 조건

- 없음

## 질문/결정 기록

- 결정: 현재 단계에서는 별도 GitHub 서버를 직접 구축하지 않는다.
- 결정: GitHub Releases 는 Git tag 기반 릴리스 기준선으로 사용한다.
- 결정: GitHub Packages 는 컨테이너 이미지나 패키지 저장이 필요할 때만 사용한다.
- 열린 질문: 첫 워크플로는 문서 계획까지만 둘지, 실제 `.github/workflows/` 파일까지 추가할지 작업 중 판단했다.

## 선행 읽기

- `README.md`
- `docs/releases.md`
- `docs/version-policy.md`
- `docs/release-automation.md`
- `docs/tickets/orchestrator.md`
- `docs/tickets/worker.md`
- `docs/history/README.md`
- 최신 관련 히스토리 항목

## 작업자 산출물

- 브랜치 이름
- 추가하거나 제안한 GitHub Actions 경로
- GitHub Releases / Packages 사용 판단
- 테스트 또는 dry-run 결과
- 남은 위험

## 검토 메모

- GitHub Actions 워크플로 초안과 문서 기준선을 반영했다.
- 실제 릴리스 발행 단계는 사용자 승인 이후 확장하는 쪽으로 남겼다.
- `.github/workflows/release.yml` 은 태그와 `VERSION` 값의 일치 여부를 검증한다.
- `docs/release-automation.md` 에 `v0.2.0` 릴리스 때 `VERSION` 승격 후 태그를 만드는 순서를 추가했다.

## Notes

- 릴리스 생성은 사용자가 배포를 승인한 뒤에만 진행한다.
- GitHub Packages 는 컨테이너 이미지나 패키지 저장이 필요할 때만 사용한다.
- 현재 기준선은 태그 검증과 릴리스 체크리스트까지를 포함한다.
- 이 환경에는 `git` 실행 파일이 없어 PR 생성은 진행하지 못했다.

