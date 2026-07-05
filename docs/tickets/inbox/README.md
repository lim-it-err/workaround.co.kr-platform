문서 상태: 작성완료

# 티켓 인입함

`docs/tickets/inbox/` 는 Discord, Claude, 외부 운영 도구가 만든 티켓 초안을 임시로 받는 공간이다.

이 폴더의 티켓은 아직 정식 저장소 티켓이 아니다. worker는 이 폴더에서 작업을 직접 시작하지 않는다.

## 기본 흐름

1. Claude가 Discord 요청을 읽고 `docs/tickets/inbox/claude/` 아래에 티켓 초안을 만든다.
2. Codex timer가 초안을 검토한다.
3. 형식과 선행 조건이 충분하면 Codex가 정식 TKT 번호를 부여한다.
4. Codex가 티켓을 `backlog` 로 승격한다.
5. 바로 착수 가능한 티켓은 현재 저장소 정책에 따라 `ready` 또는 다음 착수 대기 상태로 옮긴다.

## 작성 규칙

티켓 초안은 최소한 아래 정보를 포함해야 한다.

- 문서 상태
- 제목
- 우선순위 `P1`~`P5`
- 대상 버전 또는 `infra`/`chore`
- 목표
- 작업 내용
- 완료 기준
- 선행 조건
- 질문/결정 기록
- 선행 읽기
- 작업자 산출물

## 금지

- `inbox` 티켓을 worker가 바로 `started` 로 옮기지 않는다.
- Discord 메시지만으로 코드 구현을 시작하지 않는다.
- token, pairing code, webhook secret을 티켓 본문에 쓰지 않는다.

상세 설계는 `docs/discord-claude-codex-bridge.md` 를 따른다.
