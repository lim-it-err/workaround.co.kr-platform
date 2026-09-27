문서 상태: 작성완료

# TKT-173 `[PM]` `main` 승격 — v0.7.0 태그 뒤, v0.8.0 전 (D-027)

- 상태: finished (2026-09-28, PM 실행 — main push 만 PO) · P1 · 담당: PM(git 작업) · 의존: v0.7.0 태그(배치 2 병합·AS-R010 통과). push 는 PO 실행.
- scope: git 브랜치·태그, `.github/workflows/deploy-github-pages.yml`(트리거 `main` 유지·`codex/v0.6.0-line` 제거), `CLAUDE.md`·`README.md`·`docs/decisions.md` D-002 개정, GitHub 기본 브랜치·Pages 환경 정책(AS-R006 ②).

## 절차
1. `git switch main && git pull --ff-only origin main`
2. `git merge -s ours --no-commit codex/v0.6.0-line && git read-tree -u --reset codex/v0.6.0-line && git commit -m "main 승격: 트렁크 v0.7.0 트리로 동기화 (D-027)"` — 트리가 트렁크와 동일한지 `git diff main codex/v0.6.0-line --stat` 로 0 확인.
3. PO: `git push origin main` → Pages 워크플로(main 트리거) 성공 → 라이브 SHA 확인.
4. GitHub 기본 브랜치 `main`, Pages 환경 정책에서 `codex/v0.6.0-line` 제거, 워크플로 트리거 정리 커밋, 문서 개정.
5. 이후 작업 브랜치 `codex/v0.8.0-…` 를 `main` 에서 생성, 인박스 브랜치 안내 갱신.

## 완료 조건
1. [ ] `git diff main codex/v0.6.0-line` 0, `main` 이 origin 에 push 되고 Pages 가 main SHA 로 배포.
2. [ ] 문서 3곳·워크플로·GitHub 설정 갱신, `codex/v0.6.0-line` 동결 표기.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
- 2026-09-28 PM: 절차 1~2·4(문서·트리거) 완료 — `main` = `e9bb529`(동기화 `3618f45` + 문서), `git diff main codex/v0.6.0-line` 0. 작업 브랜치 `codex/v0.8.0-live`(=`1fda3ee`) push·공유 워킹트리 전환. 남은 것: PO `git push origin main`, GitHub 기본 브랜치 `main`, Pages 환경 정책에서 `codex/v0.6.0-line` 제거.
