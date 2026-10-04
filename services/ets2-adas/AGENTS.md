# Codex 상주 지침 — 유로트럭 기관사 (codex-7, `.100` Windows 전용 레인)

> 이 파일은 Codex 가 `services/ets2-adas/` 에서 자동으로 읽는다. 상위 규칙: 저장소 루트 `CLAUDE.md`·`docs/`(티켓·리뷰·결정). PM(Claude)·PO 와는 **파일로만** 대화한다.

## 너의 자리
- **기계**: `192.168.123.100` Windows 데스크톱 세션(게임·핸들·SDK 플러그인·Zig 빌드가 여기 있다). 맥의 codex-1/2 와는 **디렉터리로 분리** — 너는 `services/ets2-adas/**` 와 `.100` 의 실행 환경만 만진다. `frontend/**`·`services/advisor/**`·`docs/tickets/*.md`(티켓 본문의 질문/구현 내역 절은 예외) 는 수정하지 않는다.
- **입력**: `docs/inbox/codex-7-ets2.md`(저장소 안 인박스 — PM 이 쓴다) + `docs/tickets/ready/` 의 `[ETS2-WIN]` 표식 티켓.
- **출력**: 코드는 **네 브랜치 `codex/ets2-win`** 에 커밋·push 한다(원격 레인 예외, U-39). `main`·`codex/v0.8.0-live` 직접 push 금지. 티켓 `## 구현 내역`·`## 검증` 을 채우고 need_review 로 옮긴 뒤 `docs/history/YYYY-MM-DD.md` 에 `## [codex-7] …` 3줄(무엇을/왜/남은 위험). PM 이 리뷰 뒤 작업 브랜치에 병합한다.
- **검증 기준**: 실게임에서 돌려 본 것만 "확인"이라고 쓴다. 게임 없이 돌린 것은 "하네스/모사" 로 구분. 로그는 `docs/qa/env100/` 에 재연 가능하게(사전조건·명령·기대결과).

## 지켜야 할 것
- **비밀값**: R2 키·토큰·프로필 경로·Steam ID 는 `.env`·로컬 설정에만. 커밋·로그·티켓에 붙이지 않는다(`IMPORT-NOTE.md` 치환 규칙 유지).
- **안전**: 게임 제어 경로(arm 토큰·300ms 만료·F8·브레이크 중단)는 완화하지 않는다. 자동 복구(견인·수리)는 PO 가 명시 승인한 범위만.
- **PoC 제어 로직·네이티브 ABI** 는 티켓이 요구할 때만 바꾼다. 바꾸면 `tests/native-smoke.cpp`·`tests/*.cjs` 먼저.
- 모호하면 구현으로 우회하지 않는다 — 티켓 `## 질문/에스컬레이션` 에 `[구체화 질문]`/`[반박]` 을 적고 `blocked`.

## 처음 할 일
1. `git clone` 뒤 `git switch -c codex/ets2-win origin/codex/v0.8.0-live`(없으면 생성). `README.md`·`API.md`·`VALIDATION.md`·`IMPORT-NOTE.md` 읽기.
2. `INSTALL.ps1 -ProfileConfig <실제 경로>` 로 설치, `START.cmd` 로 `http://127.0.0.1:8765` 확인, `TEST.ps1` 결과를 `docs/qa/env100/` 에.
3. `docs/inbox/codex-7-ets2.md` 의 첫 티켓(TKT-167)부터.
