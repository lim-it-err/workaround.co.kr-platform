# 릴리스 자동화와 GitHub 사용 기준

## 결론

현재 단계에서는 별도 GitHub 서버를 이 저장소 안에 구축하지 않는다.

GitHub는 아래 역할로 사용한다.

- PR 검토와 병합 흐름
- Git tag 와 GitHub Releases 기반 릴리스 기준선
- GitHub Actions 기반 CI, 릴리스 노트 생성, 패키지 발행 자동화
- 필요할 때 GitHub Packages 또는 GitHub Container Registry 기반 이미지/패키지 저장

## GitHub Releases

GitHub Releases 는 Git tag 를 기반으로 특정 저장소 시점을 릴리스로 포장하고 릴리스 노트와 다운로드 자산을 붙이는 기능이다.

이 프로젝트에서는 공식 릴리스 기준선을 아래처럼 잡는다.

- 태그: `v0.2.0` 같은 SemVer 태그
- GitHub Release: 태그에 대응하는 공개 릴리스 페이지
- `docs/releases.md`: 운영 기록과 로컬 문서 기준

## GitHub Actions

GitHub Actions 는 저장소 안에서 CI/CD 워크플로를 실행하는 데 쓴다.

우선순위는 아래 순서다.

1. PR 검증
2. `main` 병합 후 기본 빌드/테스트
3. 태그 생성 또는 릴리스 승인 후 GitHub Release 생성
4. 필요하면 컨테이너 이미지 빌드와 배포

`v0.4.0` 부터는 아래 항목을 릴리스 완료 조건으로 본다.

- Work Manager 관련 테스트 코드가 저장소 안에 존재할 것
- GitHub Actions 가 PR 과 `main` 기준으로 테스트를 자동 실행할 것
- 테스트 커버리지를 계산하거나 요약할 수 있을 것
- 메인 `README.md` 에 현재 커버리지 노출 경로 또는 요약 수치가 보일 것
- PR 제목 또는 본문에 대상 버전이 반드시 포함될 것

## GitHub Packages

GitHub Packages 는 패키지와 컨테이너 이미지를 저장하는 선택지다.

현재 프로젝트에서는 아래 조건이 생길 때 사용한다.

- 공개 웹사이트나 서비스 배포에 컨테이너 이미지가 필요하다.
- 워커나 서비스 이미지를 버전별로 보관해야 한다.
- 외부 서버가 `ghcr.io` 같은 레지스트리에서 이미지를 pull 하는 구성이 더 단순하다.

단순한 릴리스 기록만 필요하면 GitHub Packages 를 쓰지 않아도 된다.

## 현재 기준선 워크플로

이 저장소의 현재 기준선 워크플로는 아래 두 개다.

- `.github/workflows/release.yml`
- `.github/workflows/ci.yml`

- `release.yml` 은 태그 기반 릴리스와 `VERSION` 값의 일치 여부를 먼저 검증한다.
- `release.yml` 은 태그 push 시 검증 통과 후 GitHub Release 를 자동 생성하거나 기존 태그 릴리스를 갱신한다.
- `release.yml` 은 수동 실행 시에도 동일한 검증과 체크리스트를 공유하지만, 실제 GitHub Release 생성은 태그 이벤트에서만 수행한다.
- `ci.yml` 은 PR 과 `main` 기준으로 frontend build, gateway test, gateway JaCoCo coverage report 생성을 자동 실행한다.
- `ci.yml` 은 gateway line coverage 요약을 step summary 에 남기고, HTML report 를 `gateway-jacoco-report` artifact 로 업로드한다.
- Release body 는 자동 생성 기본 문구와 `generate_release_notes` 를 사용해 채우며, 자산 업로드와 Packages 발행은 이후 확장 지점으로 남긴다.

현재 비어 있는 것:

- 릴리스 자산 업로드 workflow
- GitHub Packages 또는 GHCR 발행 workflow

현재 채운 것:

- `.github/pull_request_template.md`
- `tools/check-pr-version-metadata.ps1`
- `.github/workflows/pr-version-guard.yml`
- `pr-version-guard.yml` 은 PR 제목 prefix 와 본문의 `Target Version`, `Feature Theme`, one-version-one-feature 체크리스트를 검증한다.
- 로컬에서도 `powershell -ExecutionPolicy Bypass -File .\tools\check-pr-version-metadata.ps1 -Title "[v0.4.0] ..." -Body "<PR body>"` 형태로 같은 규칙을 재현할 수 있다.

위 세 항목은 `TKT-037` 로 보강했고, 나머지 두 항목은 `infra` 후속 보강 포인트로 남긴다.

## v0.2.0 릴리스 순서

현재 기준선 워크플로는 태그와 `VERSION` 값이 같아야 통과한다.

따라서 `v0.2.0` 릴리스 때는 아래 순서를 따른다.

1. 사용자가 `v0.2.0 배포해도 돼` 라고 명시한다.
2. 오케스트레이터가 최신 `main` 기준을 다시 확인한다.
3. `VERSION` 을 `0.2.0` 으로 올리는 릴리스 준비 변경을 만든다.
4. 해당 변경이 `main` 에 반영된 뒤 `v0.2.0` 태그를 만든다.
5. `.github/workflows/release.yml` 이 태그와 `VERSION` 일치를 검증한다.
6. 태그 push 러너가 GitHub Release 를 자동 생성 또는 갱신한다.
7. 자산 업로드, Packages 발행은 이후 확장 지점으로 진행한다.

## 오케스트레이터 규칙

- 릴리스 자동화 티켓은 `infra` 또는 `chore` 로 관리한다.
- GitHub Actions 워크플로를 추가하면 관련 문서와 히스토리를 함께 갱신한다.
- 릴리스 생성은 사용자가 배포를 승인한 뒤에만 진행한다.
- 최종 merge 권한은 계속 사용자에게 있다.
- 오케스트레이터는 "자동화로 대체할 수 없는 사용자 액션"이 있으면 숨기지 않고 먼저 알린다.
- `v0.4.0` 완료 뒤 사용자의 기본 액션은 PR 검토/merge 와 배포 승인 수준으로 줄이는 것을 목표로 한다.

## 참고한 공식 문서

- GitHub Releases: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
- GitHub Actions: https://docs.github.com/en/actions
- GitHub Packages: https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages
