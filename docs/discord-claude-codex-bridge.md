문서 상태: 작성완료

# Discord-Claude-Codex 브리지 설계

> **2026-07-05 방향 전환**: Discord Channel 방식은 폐기하고 **Remote Control**(claude.ai/code 웹·모바일 앱에서 로컬 Claude 세션을 직접 조종하는 공식 기능)로 대체한다. 사용자는 밖에서 Remote Control 로 로컬 Claude(오케스트레이터) 세션에 직접 지시해 티켓을 만들고, Codex heartbeat(`codex-ready-worker-watch`)가 `ready` 에서 티켓을 집어 개발한다. Discord 봇 중간 단계는 제거한다.
>
> 신규 흐름: `사용자 Remote Control 지시 -> 로컬 Claude 오케스트레이터가 backlog/ready 에 티켓 작성 -> Codex heartbeat 가 ready 에서 개발 -> need_review -> 검토 -> finished -> 사용자 merge`.
>
> 아래 Discord Channel/hook 관련 구성은 폐기된 대안으로, 기본 운영 경로가 아니다. Remote Control 참고: https://code.claude.com/docs/en/remote-control.md (급히 비동기로 요청만 밀어 넣고 싶을 때의 대안은 Channels: https://code.claude.com/docs/en/channels.md). `codex-ready-worker-watch` heartbeat 는 Discord/Remote Control 과 무관하게 그대로 유효하다.

## 목적

밖에 있을 때 Discord 한 곳에서 요구사항을 남기면 Claude가 PM/디자인/오케스트레이터 관점으로 티켓을 만들고, Codex가 로컬 저장소에서 타이머로 티켓을 확인해 개발 작업을 이어가는 반자동 운영 흐름을 만든다.

이 설계의 첫 버전은 API 비용을 최소화하기 위해 별도 OpenAI/Anthropic API 브리지를 만들지 않는다. Claude Code의 Discord Channel 기능과 Codex의 thread automation, repository hook, 파일 기반 티켓 큐를 조합한다.

## 결론

첫 구현은 아래 구조를 기본값으로 둔다.

```text
사용자 Discord 메시지
-> Claude Code Discord Channel
-> Claude가 docs/tickets/inbox/claude/ 에 티켓 초안 작성
-> Codex timer가 inbox를 검토
-> Codex가 backlog 또는 ready 로 승격
-> Codex worker가 started 로 옮겨 구현
-> need_review
-> Claude 또는 Codex 오케스트레이터 검토
-> finished
-> 사용자 merge
```

Redis는 v0에서 필수가 아니다. 파일 기반 큐와 Codex timer로 충분히 시작하고, 여러 worker가 동시에 붙거나 중복 처리, 재시도, 실시간 UI가 필요해질 때 Redis 또는 SQLite를 붙인다.

## 공식 근거

- Claude Code Channels는 Discord, Telegram, iMessage 같은 외부 이벤트를 실행 중인 Claude Code 세션으로 밀어 넣을 수 있다. Discord 플러그인은 research preview이며 Claude Code v2.1.80 이상과 Bun이 필요하다.
  - https://code.claude.com/docs/en/channels
- Claude Code Hooks는 `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop` 같은 lifecycle 지점에서 command, HTTP, prompt, agent hook을 실행할 수 있다.
  - https://code.claude.com/docs/en/hooks
- Claude Code Scheduled tasks는 `/loop` 와 cron 도구로 세션 안에서 반복 프롬프트를 실행할 수 있다. 다만 이 설계에서는 Claude가 티켓 생성 쪽이고, Codex가 티켓 소비 쪽이다.
  - https://code.claude.com/docs/en/scheduled-tasks
- Discord bot은 Developer Portal에서 application/bot을 만들고 OAuth2 bot scope와 권한을 부여해 서버에 초대한다. 메시지 본문 기반 운영에는 Message Content Intent가 필요할 수 있다.
  - https://docs.discord.com/developers/intro
  - https://docs.discord.com/developers/topics/oauth2
- Codex는 app automation과 thread automation을 지원한다. thread automation은 같은 대화 맥락을 유지한 채 정기적으로 깨어나는 heartbeat 용도에 맞는다.

## 역할

| 주체 | 역할 | 파일 쓰기 권한 |
| --- | --- | --- |
| 사용자 | 최종 승인자, Discord 명령 작성자, merge 담당 | 제한 없음 |
| Claude | PM, 디자이너, upstream 오케스트레이터, 티켓 초안 작성 | `docs/tickets/inbox/claude/`, 필요 시 `docs/history/` |
| Codex timer | inbox 검토, 티켓 정규화, board/history 정리 | `docs/`, `design/` |
| Codex worker | 실제 코드 구현, 테스트, handoff | 코드와 문서. 단, 티켓 상태 흐름 준수 |
| Discord | 사람과 Claude를 잇는 채널 | 저장소 직접 쓰기 없음 |

Claude는 기본적으로 코드 구현자가 아니다. Claude가 Discord에서 받은 요청을 바로 코드 변경으로 이어가지 않도록 hook으로 제한한다.

Codex는 저장소 로컬 상태를 기준으로 최종 파일 이동과 구현을 맡는다. Codex timer가 Claude 티켓을 무조건 실행하지 않고, 문서 상태와 티켓 스키마를 먼저 검토한다.

## 폴더 구조

```text
docs/tickets/
|- inbox/
|  |- README.md
|  `- claude/
|     |- TKT-DRAFT-YYYYMMDD-HHMM-title.md
|     `- archive/
|- backlog/
|- ready/          # 현재 저장소 정책상 착수 대기열. 없으면 도입 티켓에서 생성
|- started/
|- need_review/
`- finished/
```

`inbox` 는 티켓 수명주기 이전 단계다. worker는 `inbox` 에 있는 티켓을 직접 집지 않는다.

## Discord 구성

권장 구성은 Claude 공식 Discord Channel 플러그인을 먼저 쓰는 것이다. 별도 custom API bot은 v1 이후로 미룬다.

1. Discord Developer Portal에서 새 application을 만든다.
2. Bot 섹션에서 bot을 만들고 token을 발급한다.
3. Privileged Gateway Intents에서 Message Content Intent를 켠다.
4. OAuth2 URL Generator에서 `bot` scope를 선택한다.
5. 권한은 최소한 아래만 둔다.
   - View Channels
   - Send Messages
   - Send Messages in Threads
   - Read Message History
   - Attach Files
   - Add Reactions
6. 생성된 URL로 개인 서버에 bot을 초대한다.
7. Claude Code에서 플러그인을 설치한다.

```text
/plugin install discord@claude-plugins-official
/reload-plugins
/discord:configure <DISCORD_BOT_TOKEN>
```

8. Claude Code를 Discord channel 활성화 상태로 다시 시작한다.

```text
claude --channels plugin:discord@claude-plugins-official
```

9. Discord에서 bot에게 DM을 보내 pairing code를 받는다.
10. Claude Code에서 pairing을 완료하고 allowlist 정책을 켠다.

```text
/discord:access pair <code>
/discord:access policy allowlist
```

운영 채널 이름은 `#ai-control-room` 을 추천한다. 공개 서버가 아니라 개인 서버 또는 private channel로 둔다.

## Discord 메시지 규칙

사용자는 Discord에 아래처럼 쓴다.

```text
[ticket]
목표: Work Manager에서 worker 활동을 실시간으로 보고 싶다.
범위: 설계/티켓화까지만. 코드 구현은 Codex가 한다.
우선순위: P1
대상 버전: v0.4.0
```

Claude는 한 사용자 메시지당 한 번만 답한다. Claude와 Codex가 서로 Discord에서 계속 대화하지 않는다.

허용 prefix:

- `[ticket]`: Claude가 티켓 초안을 만든다.
- `[design]`: Claude가 디자인 검토 문서 초안을 만든다.
- `[review]`: Claude가 `need_review` 문서나 Codex handoff를 읽고 리뷰 의견을 만든다.
- `[question]`: Claude가 답변만 하고 파일을 쓰지 않는다.

금지:

- Discord 메시지만으로 `git push`, `merge`, `release tag` 를 수행하지 않는다.
- Claude는 Discord에서 받은 요청으로 코드 파일을 직접 수정하지 않는다.
- Claude와 Codex가 사용자 발화 없이 서로 다음 턴을 이어가지 않는다.

## Claude 시작 프롬프트

Claude Code 세션을 Discord channel과 함께 켤 때 아래 프롬프트를 첫 지시로 둔다.

```text
너는 workaround.co.kr-platform의 PM, 디자이너, upstream 오케스트레이터다.

반드시 먼저 AGENTS.md, README.md, docs/architecture.md, docs/ticket-policy.md,
docs/tickets/README.md, docs/tickets/board.md, docs/history/README.md,
최신 docs/history/YYYY-MM-DD.md 를 읽는다.

Discord에서 들어온 요청은 코드 구현으로 바로 실행하지 않는다.
기본 산출물은 docs/tickets/inbox/claude/ 아래의 티켓 초안이다.

티켓 초안에는 반드시 아래를 포함한다.
- 문서 상태
- 제목
- 우선순위 P1~P5
- 대상 버전 또는 infra/chore
- 목표
- 작업 내용
- 완료 기준
- 선행 조건
- 질문/결정 기록
- 선행 읽기
- 작업자 산출물

불확실한 내용은 임의 구현하지 말고 질문/결정 기록에 남긴다.
코드 파일, infra 파일, release 파일은 수정하지 않는다.
한 사용자 메시지당 한 번 응답하고 멈춘다.
```

## Claude hook 구성

Claude hook의 목적은 Discord로 들어온 요청이 곧바로 코드 변경으로 번지지 않게 막는 것이다.

권장 이벤트:

- `SessionStart`: 필수 문서 읽기와 현재 역할을 주입한다.
- `UserPromptSubmit`: Discord channel 메시지를 티켓/디자인/review/question 중 하나로 분류한다.
- `PreToolUse`: Claude가 코드나 위험 명령을 직접 실행하려 하면 차단한다.
- `Stop`: 이번 턴에서 만든 티켓 경로와 남은 질문을 요약한다.

예시 `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/session-start-context.ps1"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/guard-discord-orchestrator.ps1"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/stop-summary.ps1"
          }
        ]
      }
    ]
  }
}
```

`guard-discord-orchestrator.ps1` 의 판정 규칙:

- 허용: `docs/tickets/inbox/claude/**`
- 허용: `docs/history/**`
- 허용: `design/**` 중 디자인 검토 초안
- 차단: `frontend/**`, `gateway/**`, `services/**`, `workers/**`, `infra/**`, `.github/**`
- 차단: `git push`, `git reset`, `git checkout --`, release tag 생성
- 차단: secret/token 본문 출력

Claude hook은 오케스트레이터 안정장치다. 최종 구현 hook은 실제 도입 티켓에서 작성하고, token이나 개인 경로는 커밋하지 않는다.

## Codex hook 구성

Codex hook은 Claude hook과 성격이 다르다. Codex는 구현도 할 수 있으므로 모든 코드 변경을 막지 않고, 티켓 상태와 문서 기록을 강제하는 쪽에 둔다.

권장 이벤트:

- `SessionStart`: `AGENTS.md`, 티켓 보드, 최신 히스토리 읽기 알림.
- `PreToolUse`: destructive command, release/tag/push 같은 위험 명령 확인.
- `PostToolUse`: `docs/tickets/` 변경이 있으면 board/history 갱신 누락을 감지.
- `Stop`: 티켓 상태가 바뀌었는데 히스토리가 없으면 경고.

예시 `.codex/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .codex/hooks/session-start-docs.ps1",
            "statusMessage": "작업 기준 문서 확인"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .codex/hooks/pre-tool-policy.ps1",
            "timeout": 30,
            "statusMessage": "위험 명령 확인"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "powershell -NoProfile -ExecutionPolicy Bypass -File .codex/hooks/stop-ticket-history-check.ps1",
            "timeout": 30,
            "statusMessage": "티켓/히스토리 정합성 확인"
          }
        ]
      }
    ]
  }
}
```

Codex hook은 실제 설치 전에 Codex의 `/hooks` 또는 앱 hook review 흐름에서 사용자가 신뢰 여부를 확인해야 한다.

## Codex timer prompt

Codex thread automation으로 아래 프롬프트를 쓴다. 이름은 `discord-ticket-import-watch` 를 추천한다.

```text
automation_id: discord-ticket-import-watch
cadence: 5 minutes
project: C:\project\workaround.co.kr-platform
mode: local project

매 실행마다 아래 순서로 수행한다.

1. AGENTS.md, README.md, docs/architecture.md, docs/ticket-policy.md,
   docs/tickets/README.md, docs/tickets/board.md, docs/history/README.md,
   최신 docs/history/YYYY-MM-DD.md 를 먼저 읽는다.
2. docs/tickets/inbox/claude/ 아래 새 티켓 초안을 확인한다.
3. 초안의 문서 상태, 우선순위, 대상 버전, 완료 기준, 선행 조건,
   질문/결정 기록이 충분한지 검토한다.
4. 부족하면 inbox에 review note를 남기고 Discord/Claude에게 물어볼 질문을 작성한다.
5. 충분하면 정식 TKT 번호를 부여하고 docs/tickets/backlog/ 로 승격한다.
6. 현재 개발 상한, 선행 조건, 진행 판정을 확인해 바로 착수 가능하면
   docs/tickets/ready/ 로 승격한다. (ready 대기열은 2026-07-05 도입 완료.)
7. board.md 와 관련 README를 갱신한다.
8. docs/history/YYYY-MM-DD.md 에 무엇을 승격했는지 기록한다.
9. docs/tickets/need_review/ 에 새 handoff가 있으면 기존 오케스트레이터 규칙대로 검토한다.
10. 새 inbox, ready, need_review 작업이 없으면 사용자에게 메시지를 보내지 말고 조용히 종료한다.

금지:
- Discord 메시지만 근거로 code edit을 시작하지 않는다.
- 사용자가 자동 개발을 명시하지 않은 티켓은 ready 승격까지만 한다.
- git push, PR 생성, release tag 생성은 별도 사용자 승인이나 기존 PR 정책 없이는 하지 않는다.
```

개발까지 자동으로 맡기고 싶으면 별도 automation을 둔다. 이름은 `codex-ready-worker-watch` 를 추천한다. 아래 프롬프트는 이번 한 번이 아니라 앞으로 계속 재사용하는 표준 worker heartbeat 지침이다. `docs/tickets/ready/` 가 도입되어 있어야 동작한다.

```text
automation_id: codex-ready-worker-watch
cadence: 10 minutes
project: C:\project\workaround.co.kr-platform
mode: local project (worktree 선호)

너는 workaround.co.kr-platform 저장소의 worker다. 10분마다 깨어나 ready 대기열의 티켓 하나를 개발한다.

## 매번 시작 시 (반드시)
1. 아래 기준 문서를 먼저 읽는다.
   - AGENTS.md
   - docs/tickets/README.md, docs/tickets/worker.md, docs/ticket-policy.md
   - docs/tickets/board.md
   - docs/roadmap.md, docs/version-policy.md, docs/releases.md
   - docs/history/README.md 와 최신 docs/history/YYYY-MM-DD.md
   - 티켓 대상이 docs/feature-definition.md 에 정의된 기능 페이지(엘리베이터/택시/Work Manager/블로그 등)면 그 문서도 읽는다.
2. docs/tickets/ready/ 를 확인한다. 착수할 티켓이 없으면 어떤 파일도 바꾸지 말고 조용히 종료한다(사용자에게 메시지 보내지 않는다).

## 티켓 하나 처리 (한 번에 하나만)
3. ready 에서 우선순위 P1 을 먼저, 없으면 그다음 순위의 티켓 하나를 고른다.
   문서 상태가 '작성완료' 가 아니거나 진행 판정이 '진행 가능' 이 아니면 건너뛰고 board 에 메모만 남긴다.
4. 티켓을 started 로 옮기고 board.md 를 갱신한다.
5. 권장 브랜치명(codex/tkt-XXX-...)으로 새 브랜치를 판다. main 에서 직접 작업하지 않는다.
6. 티켓의 '작업 내용' 순서대로 구현한다. 범위를 임의로 넓히지 않는다. 애매하면 Notes 에 질문을 남기고 최소 범위만 구현한다.
7. 검증을 실행한다.
   - 프런트: powershell -ExecutionPolicy Bypass -File tools/run-frontend-build.ps1
   - 게이트웨이: powershell -ExecutionPolicy Bypass -File tools/run-gateway-tests.ps1
   - 문서 인코딩: powershell -ExecutionPolicy Bypass -File tools/check-docs-encoding.ps1
   실행하지 못한 검증은 이유와 함께 티켓에 남긴다.
8. 티켓에 브랜치명, 구현 요약, 테스트 결과, 미검증 항목, PR 준비 메모를 적는다.
9. 티켓을 need_review 로 옮기고 board.md 를 갱신한다.
10. docs/history/YYYY-MM-DD.md 에 무엇을 했는지 기록한다.

## 금지
- PR 생성, main merge, VERSION 승격, release tag 생성 (오케스트레이터/사용자 몫).
- 한 번에 두 개 이상 티켓 처리.
- git push --force, git reset --hard, git checkout -- 로 남의 변경 되돌리기.
- secret/token 을 티켓/문서/로그 본문에 쓰기.
- 운영 문서(docs/·design/·README·AGENTS)를 ANSI 로 저장 (UTF-8 with BOM 유지).
```

## Codex timer와 hook의 차이

| 항목 | timer | hook |
| --- | --- | --- |
| 실행 시점 | 주기적으로 깨어남 | Codex lifecycle 중 특정 지점 |
| 주 용도 | inbox/ready/need_review 감시 | 위험 명령 차단, 문서/히스토리 누락 감지 |
| 실행 주체 | Codex automation | Codex runtime |
| 상태 처리 | 티켓 이동, board/history 갱신 | 허용/차단/경고 |

timer가 일을 시작하고, hook이 안전장치를 건다.

## v0 구현 단계

1. `docs/tickets/inbox/README.md` 와 `docs/tickets/inbox/claude/` 를 만든다.
2. Claude Code Discord channel을 연결한다.
3. Claude 시작 프롬프트를 고정한다.
4. Claude guard hook을 도입한다.
5. Codex `discord-ticket-import-watch` thread automation을 만든다.
6. Codex hook은 먼저 경고형으로 도입하고, 차단형은 첫 일주일 운영 로그를 본 뒤 켠다.
7. Redis 없이 파일 기반으로 운영한다.

## v1 확장

아래 조건 중 둘 이상이 생기면 Redis 또는 SQLite 브리지로 올린다.

- worker가 2개 이상 동시에 돈다.
- Discord 메시지가 하루 20건 이상 누적된다.
- 티켓 중복 생성이 반복된다.
- Work Manager UI에서 실시간 worker 활동 표시가 필요하다.
- Claude와 Codex의 상태를 외부 대시보드에서 보고 싶다.

v1 구조:

```text
Discord Bot
-> bridge-api
-> SQLite 또는 Redis
-> Claude Channel 또는 API
-> Codex automation
-> Work Manager UI
```

이때도 최종 merge는 사용자만 한다.

## 보안 규칙

- Discord bot token은 `~/.claude/channels/discord/.env` 또는 로컬 환경 변수에만 둔다.
- token, pairing code, webhook secret은 repo에 쓰지 않는다.
- Discord allowlist를 켜고 사용자 본인 ID만 허용한다.
- Claude가 권한 prompt를 Discord로 relay할 수 있더라도, 파일 삭제, push, release, credential 접근은 사용자가 직접 확인한다.
- `--dangerously-skip-permissions` 는 이 저장소의 기본 실행 옵션으로 쓰지 않는다.
- Codex automation은 가능하면 workspace-write와 승인 규칙을 유지한다.

## 운영 판단

이 구조는 "세 명이 계속 대화하는 방"이 아니라 "사용자 발화 한 번에 Claude가 티켓을 만들고 Codex가 로컬에서 가져가는 작업 라인"이다.

대화량은 낮고, 상태는 파일로 남으며, 비용은 개인 구독/제품 사용량 안에서 시작할 수 있다. 다만 Claude Channel 자체는 research preview이므로 실제 장기 운영은 첫 며칠 동안 수동 확인을 곁들인다.
