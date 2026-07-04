# TKT-027

## ë©”íƒ€ë°ì´í„°

- 제목: 오케스트레이터 `need_review` heartbeat 자동화 구현
- ìš°ì„ ìˆœìœ„: P1
- ëŒ€ìƒ ë²„ì „: `infra`
- 상태: `finished`
- 문서 상태: `작성완료`
- ì§„í–‰ íŒì •: `ì§„í–‰ ê°€ëŠ¥`
- ì†Œìœ ìž ìœ í˜•: `worker`
- ê¶Œìž¥ ë¸Œëžœì¹˜: `codex/tkt-027-orchestrator-heartbeat-automation`

## ëª©í‘œ

ë¬¸ì„œì—ë§Œ ì í˜€ ìžˆë˜ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° ê²€í†  ë£¨í”„ë¥¼ ì €ìž¥ì†Œ ì•ˆì—ì„œ ë°”ë¡œ ì‹¤í–‰ ê°€ëŠ¥í•œ heartbeat ìŠ¤í¬ë¦½íŠ¸ë¡œ ë°”ê¾¸ê³ , `docs/tickets/need_review/`, `docs/tickets/started/`, ê´€ë ¨ ë³´ë“œ/ížˆìŠ¤í† ë¦¬ë¥¼ 10ë¶„ ì£¼ê¸°ë¡œ ì ê²€í•  ìˆ˜ ìžˆê²Œ í•œë‹¤.

## ìž‘ì—… ë‚´ìš©

- í˜„ìž¬ ì €ìž¥ì†Œ ê¸°ì¤€ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° heartbeat ì‹¤í–‰ ìœ„ì¹˜ë¥¼ `workers/orchestrator-heartbeat/` ë¡œ ê³ ì •í•œë‹¤.
- `workers/orchestrator-heartbeat/heartbeat.py` ì—ì„œ ì•„ëž˜ ìž…ë ¥ì„ ì½ëŠ” ë¡œì»¬ ë£¨í”„ë¥¼ êµ¬í˜„í•œë‹¤.
  - `docs/tickets/need_review/`
  - `docs/tickets/started/`
  - `docs/tickets/board.md`
  - `docs/roadmap.md`
  - ìµœì‹  `docs/history/*.md`
- `started` í‹°ì¼“ì— ë‚¨ì•„ ìžˆëŠ” `- [ ]` ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ë¦´ë¦¬ìŠ¤ ê²Œì´íŠ¸ ë§‰íž˜ìœ¼ë¡œ ìš”ì•½í•œë‹¤.
- ê¸°ë³¸ 10ë¶„ ì£¼ê¸°ì™€ `--once` ë‹¨ë°œ ì ê²€ ëª¨ë“œë¥¼ í•¨ê»˜ ì œê³µí•œë‹¤.
- ë¬¸ì„œë¥¼ ìžë™ ìˆ˜ì •í•˜ì§€ ì•Šê³  JSON ë¦¬í¬íŠ¸ë§Œ stdout ë˜ëŠ” ì„ íƒ ë¡œê·¸ íŒŒì¼ì— ë‚¨ê¸°ë„ë¡ í•œë‹¤.
- ì‹¤í–‰ ë°©ë²•ê³¼ ìš´ì˜ ê²½ê³„ë¥¼ `workers/orchestrator-heartbeat/README.md`, `workers/README.md`, `README.md`, ê´€ë ¨ ì •ì±… ë¬¸ì„œì— ë°˜ì˜í•œë‹¤.

## ë²”ìœ„

- ì´ í‹°ì¼“ì€ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° ê²€í†  ìžë™í™”ì˜ ìµœì†Œ ì‹¤í–‰ ë£¨í”„ì™€ ë¬¸ì„œ ë°˜ì˜ì„ ë‹¤ë£¬ë‹¤.
- OS ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡, ì˜êµ¬ ì„œë¹„ìŠ¤ ì„¤ì¹˜, ìžë™ PR ìƒì„±, ìžë™ ë¬¸ì„œ ìˆ˜ì •ì€ ê¸°ë³¸ ë²”ìœ„ì— í¬í•¨í•˜ì§€ ì•ŠëŠ”ë‹¤.
- ì˜êµ¬ ë°±ê·¸ë¼ìš´ë“œ ë“±ë¡ì´ í•„ìš”í•˜ë©´ ì‚¬ìš©ìž ìŠ¹ì¸ ë’¤ í›„ì† ì¸í”„ë¼ ìž‘ì—…ìœ¼ë¡œ ë¶„ë¦¬í•œë‹¤.

## ì™„ë£Œ ê¸°ì¤€

- ì €ìž¥ì†Œ ì•ˆì— 10ë¶„ ì£¼ê¸° ì‹¤í–‰ ê°€ëŠ¥í•œ heartbeat ìŠ¤í¬ë¦½íŠ¸ê°€ ì¡´ìž¬í•œë‹¤.
- `--once` ì™€ ê¸°ë³¸ ë£¨í”„ ì‹¤í–‰ ë°©ë²•ì´ ë¬¸ì„œí™”ë˜ì–´ ìžˆë‹¤.
- heartbeat ê°€ ì½ëŠ” ë¬¸ì„œì™€ ì¶œë ¥ ë²”ìœ„ê°€ ëª…ì‹œë˜ì–´ ìžˆë‹¤.
- ë¡œì»¬ì—ì„œ ì‹¤ì œ ì‹¤í–‰ í™•ì¸ ê²°ê³¼ê°€ ë‚¨ì•„ ìžˆë‹¤.
- `started` í‹°ì¼“ì˜ ë¯¸ì™„ë£Œ ì²´í¬ë¦¬ìŠ¤íŠ¸ê°€ ë³„ë„ blocker ëª©ë¡ìœ¼ë¡œ ë“œëŸ¬ë‚œë‹¤.

## ì„ í–‰ ì¡°ê±´

- `TKT-018` ì˜ ë¦´ë¦¬ìŠ¤ ê²Œì´íŠ¸ ë¬¸ì„œì™€ í˜„ìž¬ ë³´ë“œ ìƒíƒœë¥¼ ì½ê³  ìžë™í™” ëŒ€ìƒ ë²”ìœ„ë¥¼ ì´í•´í•´ì•¼ í•œë‹¤.
- ì˜êµ¬ ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡ì´ë‚˜ ì™¸ë¶€ ì„¤ì¹˜ëŠ” ì‚¬ìš©ìž ìŠ¹ì¸ ì „ ìˆ˜í–‰í•˜ì§€ ì•ŠëŠ”ë‹¤.

## ì§ˆë¬¸/ê²°ì • ê¸°ë¡

- ê²°ì •: ì‹¤í–‰ ìœ„ì¹˜ëŠ” `workers/orchestrator-heartbeat/` ë¡œ ë‘”ë‹¤. ê¸°ì¡´ `ion2-worker` ì™€ ì±…ìž„ì„ ë¶„ë¦¬í•´ ë¬¸ì„œ ê²€í†  ë³´ì¡° ë£¨í”„ìž„ì„ ëª…í™•ížˆ í•œë‹¤.
- ê²°ì •: ê¸°ë³¸ ë™ìž‘ ë²”ìœ„ëŠ” â€œíƒì§€/ìš”ì•½ ë¦¬í¬íŠ¸â€ ìˆ˜ì¤€ìœ¼ë¡œ ë‘”ë‹¤. ìžë™ PR ìƒì„±ì´ë‚˜ ë¬¸ì„œ ìˆ˜ì •ì€ í¬í•¨í•˜ì§€ ì•ŠëŠ”ë‹¤.
- ê²°ì •: ê¸°ë³¸ 10ë¶„ ì£¼ê¸°ëŠ” ìŠ¤í¬ë¦½íŠ¸ ë‚´ë¶€ ë£¨í”„ë¡œ ì œê³µí•˜ê³ , OS ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡ì€ í›„ì† ìŠ¹ì¸ í•­ëª©ìœ¼ë¡œ ë‚¨ê¸´ë‹¤.
- ê²°ì •: 2026-06-14 í˜„ìž¬ Codex ì•± ìŠ¤ë ˆë“œ heartbeat ìžë™í™”ë„ ë³„ë„ë¡œ í™œì„±í™”í–ˆì§€ë§Œ, ì €ìž¥ì†Œ ê¸°ì¤€ êµ¬í˜„ íŒì •ì€ ì´ í‹°ì¼“ì˜ ë¡œì»¬ ìŠ¤í¬ë¦½íŠ¸ ê¸°ì¤€ìœ¼ë¡œ ë‚¨ê¸´ë‹¤.

## ì„ í–‰ ì½ê¸°

- `README.md`
- `docs/ticket-policy.md`
- `docs/tickets/README.md`
- `docs/tickets/orchestrator.md`
- `docs/tickets/board.md`
- `docs/history/README.md`
- ìµœì‹  ê´€ë ¨ ížˆìŠ¤í† ë¦¬ í•­ëª©

## ìž‘ì—…ìž ì‚°ì¶œë¬¼

- heartbeat êµ¬í˜„ íŒŒì¼ ëª©ë¡
- ì‹¤í–‰/ì¤‘ì§€ ëª…ë ¹
- ë¡œì»¬ ì‹¤í–‰ ê²€ì¦ ê²°ê³¼
- ë‚¨ì€ ì˜êµ¬ ìŠ¤ì¼€ì¤„ëŸ¬ ì œì•½

## ê²€í†  ë©”ëª¨

- ì¶”ê°€ íŒŒì¼:
  - `workers/orchestrator-heartbeat/heartbeat.py`
  - `workers/orchestrator-heartbeat/README.md`
  - `workers/orchestrator-heartbeat/run-heartbeat.ps1`
- ë¬¸ì„œ ê°±ì‹ :
  - `README.md`
  - `workers/README.md`
  - `docs/ticket-policy.md`
  - `docs/tickets/orchestrator.md`
  - `docs/tickets/board.md`
  - `docs/tickets/backlog/README.md`
  - `docs/tickets/need_review/README.md`
  - `docs/history/README.md`
  - `docs/history/2026-06-14.md`
  - `docs/history/2026-06-14-infra.md`
- heartbeat ëŠ” `gitStatus`, `toolchainStatus`, `needReviewTickets`, `activeBacklogUpToV030`, `startedTickets`, `startedGateBlockers`, `blockingIssues`, `nextCommands`, `latestHistory`, `nextAction` ì„ í¬í•¨í•œ JSON ë¦¬í¬íŠ¸ë¥¼ ì¶œë ¥í•œë‹¤.
- `gitStatus` ëŠ” ë¡œì»¬ ë¸Œëžœì¹˜, ì¶”ì  ë¸Œëžœì¹˜, ahead/behind, dirty ì—¬ë¶€, ë³€ê²½ ìˆ˜ ìš”ì•½ì„ í•¨ê»˜ ë“œëŸ¬ë‚´ `TKT-018` ì˜ Git branch/diff blocker ë¥¼ ì£¼ê¸° ë³´ê³ ì— í¬í•¨í•œë‹¤.
- `toolchainStatus` ëŠ” `java`, `mvn`, `docker` ê°€ìš©ì„±ê³¼ ë²„ì „/ì˜¤ë¥˜ë¥¼ í•¨ê»˜ ë“œëŸ¬ë‚´ `TKT-018` ì˜ compile / Docker blocker ì›ì¸ì„ ì£¼ê¸° ë³´ê³ ì— í¬í•¨í•œë‹¤.
- `blockingIssues` ëŠ” `startedGateBlockers` ì›ë¬¸ê³¼ ë¡œì»¬ ë„êµ¬/ìž‘ì—…íŠ¸ë¦¬ ì§„ë‹¨ì„ ë¬¶ì–´, ì‚¬ëžŒì´ ë°”ë¡œ ì½ì„ ìˆ˜ ìžˆëŠ” ë§‰íž˜ ëª©ë¡ìœ¼ë¡œ ì œê³µí•œë‹¤.
- `nextCommands` ëŠ” í˜„ìž¬ ë§‰íž˜ì„ ìž¬í™•ì¸í•˜ê±°ë‚˜ ë‹¤ìŒ ê²€ì¦ì„ ì´ì–´ê°ˆ ë•Œ ë°”ë¡œ ë³µì‚¬í•´ ì‹¤í–‰í•  ìˆ˜ ìžˆëŠ” PowerShell ëª…ë ¹ê³¼ ì‹¤í–‰ ê°€ëŠ¥ ì—¬ë¶€ë¥¼ í•¨ê»˜ ì œê³µí•œë‹¤.
- ê¸°ë³¸ ì‹¤í–‰:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1
```

- ë‹¨ë°œ ê²€ì¦:

```powershell
powershell -ExecutionPolicy Bypass -File workers/orchestrator-heartbeat/run-heartbeat.ps1 -Once
```

- ì´ ìž‘ì—… í™˜ê²½ì—ì„œëŠ” `python`, `py` ê°€ PATH ì— ì—†ì–´ ì•„ëž˜ ì ˆëŒ€ ê²½ë¡œë¡œ ê²€ì¦í–ˆë‹¤.
  - `C:\Program Files\LibreOffice\program\python.exe -m py_compile workers/orchestrator-heartbeat/heartbeat.py`
  - `C:\Program Files\LibreOffice\program\python.exe workers/orchestrator-heartbeat/heartbeat.py --once`
  - ì´í›„ ë²ˆë“¤ Python ê²½ë¡œ `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe` ë¡œë„ ê°™ì€ ê²€ì¦ì„ ë‹¤ì‹œ ìˆ˜í–‰í–ˆë‹¤.
  - ì´í›„ `run-heartbeat.ps1` ë¥¼ ì¶”ê°€í•´ ë²ˆë“¤ Python / LibreOffice Python / PATH ì˜ `python` ì„ ìˆœì„œëŒ€ë¡œ ì°¾ì•„ ë°”ë¡œ ì‹¤í–‰í•  ìˆ˜ ìžˆê²Œ í–ˆë‹¤.

## PR ì¤€ë¹„ ë©”ëª¨

PR ì œëª© ì´ˆì•ˆ:

```text
TKT-027 infra ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° need_review heartbeat ìžë™í™” êµ¬í˜„
```

PR ë³¸ë¬¸ ì´ˆì•ˆ:

```markdown
## ìš”ì•½

- `workers/orchestrator-heartbeat/heartbeat.py` ë¡œ ì €ìž¥ì†Œ ë¡œì»¬ heartbeat ë£¨í”„ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.
- heartbeat ê°€ `need_review`, `started`, ë³´ë“œ, ë¡œë“œë§µ, ìµœì‹  ížˆìŠ¤í† ë¦¬ë¥¼ ì½ì–´ JSON ë¦¬í¬íŠ¸ë¥¼ ë‚¨ê¸°ë„ë¡ í–ˆìŠµë‹ˆë‹¤.
- `started` í‹°ì¼“ì˜ ë¯¸ì™„ë£Œ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ `startedGateBlockers` ë¡œ í•¨ê»˜ ë“œëŸ¬ë‚´ ë¦´ë¦¬ìŠ¤ ê²Œì´íŠ¸ ë§‰íž˜ì„ ë¨¼ì € ë³´ì´ë„ë¡ í–ˆìŠµë‹ˆë‹¤.
- ì‹¤í–‰ ë°©ë²•ê³¼ ìš´ì˜ ê²½ê³„ë¥¼ worker/í‹°ì¼“ ì •ì±… ë¬¸ì„œì— í•¨ê»˜ ë°˜ì˜í–ˆìŠµë‹ˆë‹¤.

## í‹°ì¼“

- TKT-027

## ê²€ì¦

- [x] `C:\Program Files\LibreOffice\program\python.exe -m py_compile workers/orchestrator-heartbeat/heartbeat.py`
- [x] `C:\Program Files\LibreOffice\program\python.exe workers/orchestrator-heartbeat/heartbeat.py --once`
- [ ] OS ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡ ë˜ëŠ” ì˜êµ¬ ì„œë¹„ìŠ¤ ì„¤ì¹˜

## ë¦´ë¦¬ìŠ¤ ë©”ëª¨

- ì´ PR ì€ `infra` íŠ¸ëž™ ìž‘ì—…ìž…ë‹ˆë‹¤.
- ì˜êµ¬ ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡ì€ ì‚¬ìš©ìž ìŠ¹ì¸ ì „ ë²”ìœ„ì— í¬í•¨í•˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤.
```

## Notes

- í˜„ìž¬ êµ¬í˜„ì€ ì €ìž¥ì†Œ ì•ˆì—ì„œ ì§ì ‘ ì‹¤í–‰í•˜ëŠ” ê²½ëŸ‰ heartbeat ì´ë‹¤.
- `run-heartbeat.ps1` ë¥¼ ì“°ë©´ í˜„ìž¬ ì„¸ì…˜ì—ì„œ `python` PATH ìœ ë¬´ë¥¼ ì‹ ê²½ ì“°ì§€ ì•Šê³  ê°™ì€ 10ë¶„ ì£¼ê¸° ë£¨í”„ë¥¼ ì‹œìž‘í•  ìˆ˜ ìžˆë‹¤.
- ì‹¤ì œ Windows ìž‘ì—… ìŠ¤ì¼€ì¤„ëŸ¬ ë“±ë¡ì´ë‚˜ ì„œë¹„ìŠ¤í™”ê°€ í•„ìš”í•˜ë©´ ì‚¬ìš©ìž ìŠ¹ì¸ í›„ í›„ì† í‹°ì¼“ìœ¼ë¡œ ì´ì–´ê°„ë‹¤.
