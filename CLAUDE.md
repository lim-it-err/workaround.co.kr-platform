# Claude 작업 지침 (화이트채플 / bitter_sweet_testbed)

이 저장소의 협업 규약은 `AGENTS.md` → `docs/works/README.md` 가 기준이다. 이 문서는 **Claude 레인의 작업 지침**이며, 상위 통합 규칙은 `../CLAUDE.md` 다.

## 역할

이 저장소는 다른 프로젝트와 달리 **Claude도 구현자다.** 두 작업자가 레인을 나눠 갖는다.

| 작업자 | 레인 | 담당 |
|---|---|---|
| **claude** | `WC-2xx` | 기획 · UX · AI 정책 · 밸런스 · 배포. `whitechapel/ui.js`, `main.js`, `index.html`, `style.css` |
| **codex** | `WC-1xx` | 기술 고도화 · 테스트 · 성능. `sim/**`, `tests/**`, `e2e/**`, 빌드 |

- 티켓은 `docs/works/tickets/WC-###-슬러그.md`, 현황판은 `docs/works/BOARD.md`.
- 새 작업 거리는 티켓으로 만든다 (번호는 마지막+1, 레인 번호대 준수).
- **상대 레인의 티켓을 대신 구현하지 않는다.** 필요하면 티켓을 발행해 넘긴다.

## 반드시 지킬 것 (docs/works/README.md 운영 룰)

1. 작업 전 항상 `git pull --rebase origin claude/whitechapel-game-dev-4b46sk`. **두 작업자가 같은 브랜치를 쓴다.**
2. 티켓을 잡으면 `status: IN_PROGRESS` 로 바꾸는 커밋을 **먼저 푸시**한다 — 이게 동시 착수 방지 락이다. 이미 `IN_PROGRESS` 인 티켓은 잡지 않는다.
3. 티켓의 `scope` 밖 파일은 건드리지 않는다.
4. 커밋 메시지는 `WC-###: 요약`.
5. 완료 시 AC 전부 확인 → `status: REVIEW` → 작업 로그에 결과 요약 → 푸시. **`DONE` 전환은 상대 작업자가 한다** (교차 리뷰).
6. `npm test` 통과 없이 푸시 금지. **force push 금지** — 충돌은 rebase로, scope 밖 충돌은 상대 변경 우선(theirs).
7. 상태를 바꾸면 `docs/works/BOARD.md` 도 같은 커밋에 포함한다.

## 검증

```bash
npm test          # node --test tests/*.test.js
npm run sim       # 밸런스 시뮬레이션 (200판 매트릭스 + 리포트)
npm run bench     # AI 결정 시간 벤치마크
npm run e2e       # Playwright
npm run build     # 단일 파일 번들
```

`whitechapel/js/board.js`·`game.js`·`ai.js` 는 DOM 의존이 없어 Node로 직접 import 해 헤드리스 시뮬레이션이 가능하다 — **밸런스 주장은 시뮬레이션 수치로 뒷받침한다.**

## 히스토리

`docs/history/YYYY-MM-DD.md` 에 기록한다 (통합 규칙 `../CLAUDE.md` §5). 형식: `## [claude|codex] HH:MM 제목` + 무엇을/왜/남은 위험. 시뮬레이션·밸런스 산출물은 `docs/works/reports/` 에 둔다.

## 통합 계획

이 저장소는 `workaround.co.kr-platform` 에 서브서비스로 편입될 예정이다. 편입은 폴더 이동이 아니라 모선의 서비스 계약(자체 README·Dockerfile·`/health`·환경변수 문서)을 만족시키는 작업이다. **현재 GitHub Pages 정적 배포 구조라, 편입 시 배포 경로가 바뀐다** — 설계 결정은 모선의 `docs/decisions.md` 에 남긴다.

## PO 질문

PO 결정이 필요한 것은 이 저장소에 쌓지 말고 `../ASK.md` 에 `Q-###` 로 올린다.
